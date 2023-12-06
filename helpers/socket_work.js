const Provider = require('../models/serviceprovider.model');
const User = require('../models/user.model');
const Bookingbeta = require('../models/bookingbeta.model');
const TrackSocket = require('../models/tracksocket.model');
const Notification = require('../models/notification.model');
const UserDevice = require('../models/userdevices.model');
const { ObjectId } = require('mongodb');
const ShortUniqueId = require('short-unique-id');
const firebase_admin = require('./fcm_notification');

exports = module.exports = async (io) => {
    io.sockets.on('connection', async (socket) => {

        // #check_me_test[app]
        console.log('connected');

        //saving current location of provider
        socket.on("updateProviderLocation", async (args) => {

            let {service_provider_id,longitude,latitude,booking_status,room_id} = args

            let objsave = {
                current_location: {
                    type: 'Point',
                    coordinates: [longitude,latitude], // [longitude, latitude]
                },
            }
            if(booking_status == 'ongoing'){
                objsave.track_status='track'
            }else if(booking_status == 'complete'){
                objsave.track_status='ended'
            }else{
                objsave.track_status='ended'
            }

            let queryFind = await TrackSocket.findOne(
                { room_id:room_id,service_provider_id:ObjectId(service_provider_id) }
            )

            if(queryFind.track_status == 'track'){

                await TrackSocket.findOneAndUpdate(
                    { room_id:room_id,track_status:'track' },
                    { $set:objsave },
                    { returnOriginal: false }
                )

                socket.to(room_id).emit("sentLocationOfProvider", {service_provider_id,longitude, latitude,is_ended:false});

                await Provider.findByIdAndUpdate({//#check_me|can_be_removed
                    _id:ObjectId(service_provider_id)
                },{
                    $set:{
                        current_location:{
                            type: 'Point',
                            coordinates: [longitude, latitude],
                        }
                    }
                })

                if(queryFind.is_notified == false){
                    send_abont_to_reach(queryFind.user_id,queryFind._id,queryFind.destination,queryFind.current_location)
                }


            }else if(queryFind.track_status == 'ended'){
                socket.to(room_id).emit("sentLocationOfProvider", {
                    service_provider_id,
                    longitude:queryFind.current_location.coordinates[0],
                    latitude:queryFind.current_location.coordinates[1],
                    is_ended:true
                });
            }
        });

        //creating room
        socket.on("createRoom", async (args) => {

            let { service_provider_id,booking_id,user_id,booking_status,room_id,longitude,latitude } = args

            if(booking_status == 'ongoing' || booking_status == 'complete'){

                if(room_id){
                    let trackExist = await TrackSocket.findOne({
                        service_provider_id:ObjectId(service_provider_id),
                        booking_id:ObjectId(booking_id),
                        user_id:ObjectId(user_id),
                        room_id:room_id
                    })
                    if(trackExist){

                        if(trackExist.track_status == 'track'){
                            
                            await TrackSocket.findOneAndUpdate(
                                {room_id:room_id},
                                {$set:{
                                    current_location: {
                                        type: 'Point',
                                        coordinates: [longitude,latitude], // [longitude, latitude]
                                    },
                                    track_status:booking_status=='ongoing'?'track':'ended',
                                    // booking_status:booking_status
                                }}
                            )
                            await Provider.findByIdAndUpdate({//#check_me|can_be_removed
                                _id:ObjectId(service_provider_id)
                            },{
                                $set:{
                                    current_location:{
                                        type: 'Point',
                                        coordinates: [longitude, latitude],
                                    }
                                }
                            })
                            socket.join(trackExist.room_id);
                            socket.to(trackExist.room_id).emit("sentLocationOfProvider", {service_provider_id,longitude, latitude,is_ended:false});

                            if(trackExist.is_notified == false){
                                send_abont_to_reach(trackExist.user_id,trackExist._id,trackExist.destination,trackExist.current_location)
                            }

                        }else if(trackExist.track_status == 'ended'){
                            socket.join(trackExist.room_id);
                            socket.to(trackExist.room_id).emit("sentLocationOfProvider", {
                                service_provider_id,
                                longitude:trackExist.current_location.coordinates[0],
                                latitude:trackExist.current_location.coordinates[1],
                                is_ended:true
                            });

                        }
                    }else{
    
                        room_id_create =await createTrack(service_provider_id,booking_id,user_id,booking_status,longitude,latitude)
                        if(room_id_create){
                            socket.join(room_id_create);
                            socket.to(trackExist.room_id).emit("sentLocationOfProvider", {service_provider_id,longitude, latitude});
                        }
                    }
                }else{
    
                    room_id_create =await createTrack(service_provider_id,booking_id,user_id,booking_status,longitude,latitude)
                    if(room_id_create){
                        socket.join(room_id_create);
                        socket.to(room_id_create).emit("sentLocationOfProvider", {service_provider_id,longitude, latitude});
                    }
                }

            }else{
                //nothing will happen
            }
        });

    });
}


async function createTrack(service_provider_id,booking_id,user_id,booking_status,longitude,latitude){
    let userExist = await User.findById(user_id)
    let providerExist = await Provider.findById(service_provider_id)
    let bookingExist = await Bookingbeta.findOne({
        _id:ObjectId(booking_id),
        user_id:ObjectId(user_id),
        service_provider_id:ObjectId(service_provider_id),
        booking_status:{$nin:['cancelled',"failed","waiting"]}
    })

    if(!userExist || !providerExist || !bookingExist){
        //fail
        return
    }

    let trackExist = await TrackSocket.findOne({
        service_provider_id:ObjectId(service_provider_id),
        booking_id:ObjectId(booking_id),
        user_id:ObjectId(user_id)
    })

    if(trackExist){

        if(trackExist.track_status == 'track'){
            await TrackSocket.findOneAndUpdate(
                {room_id:trackExist.room_id},
                {$set:{
                    current_location: {
                        type: 'Point',
                        coordinates: [longitude,latitude], // [longitude, latitude]
                    },
                    track_status:booking_status=='ongoing'?'track':'ended',
                    // booking_status:booking_status
                }}
            )
            await Provider.findByIdAndUpdate({//#check_me|can_be_removed
                _id:ObjectId(service_provider_id)
            },{
                $set:{
                    current_location:{
                        type: 'Point',
                        coordinates: [longitude, latitude],
                    }
                }
            })

            if(trackExist.is_notified == false){
                send_abont_to_reach(trackExist.user_id,trackExist._id,trackExist.destination,trackExist.current_location)
            }

            return trackExist.room_id
        }else{

            if(trackExist.is_notified == false){
                send_abont_to_reach(trackExist.user_id,trackExist._id,trackExist.destination,trackExist.current_location)
            }

            return trackExist.room_id
        }
        // return trackExist.room_id

    }else{

        const uid = new ShortUniqueId({ length: 18 });
        const uidWithTimestamp = uid.stamp(18);
        const room_id_create=uidWithTimestamp;
    
        let trackCreate = await TrackSocket.create({
            service_provider_id,
            booking_id,
            user_id,
            track_status:booking_status=='ongoing'?'track':'ended',
            room_id:room_id_create,
            current_location: {
                type: 'Point',
                coordinates: [longitude,latitude], // [longitude, latitude]
            },
            destination:bookingExist.location,
            is_notified:false
        })
    
        if(trackCreate.is_notified == false){
            send_abont_to_reach(trackCreate.user_id,trackCreate._id,trackCreate.destination,trackCreate.current_location)
        }
    
        return room_id_create
    }
}

async function send_abont_to_reach(user_id,track_id,destination,current_location){

    let trackExist = await TrackSocket.findById(track_id)
    let distance = calcCrow(destination.coordinates[0],destination.coordinates[1],current_location.coordinates[0],current_location.coordinates[1])
    if(distance<200 && trackExist.is_notified == false){
        let queryFcmList = await UserDevice.find({
            user_id: ObjectId(user_id)
        })

        let registrationToken = queryFcmList.map(i => {
            return i.fcm_token
        })

        await TrackSocket.findByIdAndUpdate(track_id,{
            $set:{
                is_notified:true
            }
        })

        let notifyCreate = await Notification.create({
            user_id: ObjectId(user_id),
            service_provider_id: null,
            user_flag: true,
            type: 'about_to_reach',
            title: 'About To Reach',
            message: `Provider is about to reach`,
            seen: false,
            item_id: trackExist.booking_id,
            item_type: 'booking',
            sender_id: ObjectId(trackExist.service_provider_id),
            sender_type: 'provider'
        })

        await Notification.create({
            user_id: ObjectId(user_id),
            service_provider_id: null,
            user_flag: true,
            type: 'about_to_reach',
            title: 'About To Reach',
            message: `Provider is about to reach`,
            seen: false,
            item_id: trackExist.booking_id,
            item_type: 'booking',
            sender_id: ObjectId(trackExist.service_provider_id),
            sender_type: 'provider',
            is_admin:false
        })

        if (registrationToken.length > 0) {

            const messages = {
                data: {
                    title: 'About To Reach',
                    body: `Provider is about to reach`,
                    booking_id: trackExist.booking_id.toString(),
                    sender_id: trackExist.service_provider_id.toString(),
                    sender_type: "user",
                    notification_id: notifyCreate._id.toString()
                },
                tokens: registrationToken
            };

            await firebase_admin.sendMulticast(messages);
        }
    }
}

function calcCrow(lat1, lon1, lat2, lon2) {
    var R = 6371; // km
    var dLat = toRad(lat2-lat1);
    var dLon = toRad(lon2-lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c;
    return d;
}

// Converts numeric degrees to radians
function toRad(Value) {
    return Value * Math.PI / 180;
}