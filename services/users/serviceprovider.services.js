const User = require("../../models/user.model");
const Provider = require("../../models/serviceprovider.model");
const Bookingbeta = require("../../models/bookingbeta.model");
const { responseData } = require("../../helpers/responseData");
const { ObjectId } = require('mongodb');
const moment = require("moment");

module.exports = {
    provider_list_geo:async(req,res) => {
        try {
            // #check_me_NO_USE

            let {
                date_check,
                appointment_start,
                appointment_end
            } = req.query

            const fromDate = new Date(moment(new Date(date_check)).utc().startOf('day'))
            const endDate = new Date(moment(new Date(date_check)).utc().endOf("day"))
            const day_me = moment(appointment_start).format('dddd').toLowerCase()

            let appoint_start = moment(appointment_start).utc().format("HH:mm:ss")
            let appoint_end = moment(appointment_end).utc().format("HH:mm:ss")


            console.log(moment(appointment_start).format('dddd'));
            console.log(moment(appointment_start).format("HH:mm:ss"));
            console.log(moment(appointment_end).format("HH:mm:ss"));
            console.log(fromDate);
            console.log(endDate);
            console.log(day_me);
            

            let ProviderExist = await Provider.aggregate([
                {
                    $geoNear: {
                       near: { type: "Point", coordinates: [ -73.99279 , 40.719296 ] },
                       distanceField: "farFromMe",
                        // maxDistance: 2,
                        // query: { category: "Parks" },
                       includeLocs: "location",
                       spherical: true
                    }
                },
                {
                    $match:{
                        is_mobile_verified:0,//#check_me_change will be 1
                        status: "active",
                        is_deleted: 0,
                        time_slots:{
                            $elemMatch:{
                                "day" : day_me,
                                  "start_time" :{
                                    "$lte": `${appoint_start}`            
                                    },           
                                    "end_time" : {
                                        "$gte": `${appoint_start}`             
                                    },
                                    "end_time" : {
                                        "$gte": `${appoint_end}`            
                                    }
                                }
                        },
                    }
                },
                { 
                    $lookup: {
                        from: 'bookingbetas',
                        let: {
                            addr: '$_id'
                        },
                        pipeline: [
                            { 
                                $match: { 
                                    $expr: { $eq: [ '$service_provider_id', '$$addr'] }, 
                                    $expr: { $eq: [ true, '$is_paid'] },   
                                    $expr: { $eq: [ 'upcoming', '$booking_status'] },
                                    $and:[
                                        {$expr:{$lte: [ fromDate,"$date_of_appointment"]},},
                                        {$expr:{$gte: [ endDate ,"$date_of_appointment" ] }},
                                    ],
                                    $expr: { $eq: [ false, '$is_cancel'] }, 
                                    $or:[
                                        {
                                            $and:[
                                                {$expr:{$gt: [ appoint_start,"$time_start_appointment"]},},//start
                                                {$expr:{$lt: [ appoint_start ,"$time_end_appointment" ] }},//start
                                            ]
                                        },
                                        {
                                            $and:[
                                                {$expr:{$lt: [ appoint_end ,"$time_end_appointment" ]}},
                                                {$expr:{$gt: [ appoint_end ,"$time_start_appointment" ]}},
                                            ]
                                        },
                                        {
                                            $and:[
                                                {$expr:{$lt: [ appoint_start ,"$time_start_appointment" ]}},//start
                                                {$expr:{$gt: [ appoint_end ,"$time_end_appointment" ]}},
                                            ]
                                        }
                                    ]
                                }
                            },
                            {
                                $project:{
                                    _id:1,
                                    booking_code:1,
                                    date_of_appointment:1,
                                    time_start_appointment:1,
                                    time_end_appointment:1,
                                    service_provider_id:1
                                }
                            }
                        ],
                        as: 'bookingbetasData'
                    }
                },
                {
                    $project:{
                        "_id": 1,
                        "name": 1,
                        "location": 1,
                        "farFromMe": 1,
                        "bookingCount": {$size:"$bookingbetasData"},
                    }
                },
                {
                    $match:{
                        "bookingCount":0
                    }
                },
                { $limit : 1 }
            ])

            return res.json(responseData("using this api is prohibited", ProviderExist[0], req, true));
            
        } catch (err) {
            return res.status(422).json(responseData(err, {}, req, false));
        }
    },
}