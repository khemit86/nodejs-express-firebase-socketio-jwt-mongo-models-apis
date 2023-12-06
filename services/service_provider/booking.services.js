const Bookingbeta = require('../../models/bookingbeta.model');
const CancelBooking = require('../../models/cancelbooking.model');
const Rating = require('../../models/rating.model');
const Service = require('../../models/service.model');
const SubService = require('../../models/subservice.model');
const AddonToAdd = require('../../models/addontoadd.model');
const User = require("../../models/user.model");
const Provider = require("../../models/serviceprovider.model");
const Userpet = require("../../models/userpet.model");
const Notification = require("../../models/notification.model");
const { ObjectId } = require('mongodb');
const { responseData } = require("../../helpers/responseData");
const moment = require('moment')
const ShortUniqueId = require('short-unique-id');
const firebase_admin = require('../../helpers/fcm_notification');
const UserDevice = require('../../models/userdevices.model');
const TrackSocket = require('../../models/tracksocket.model');
const TimeSlot = require("../../models/timeslot.model");
const async = require("async")

module.exports = {

    update_booking_status: async (req, res) => {
        try {
            // (Completed, Cancelled/No Show, Ongoing, and Upcoming)

            const {
                booking_id,
                booking_status,
                // service_provider_id,//req.user._id
                user_id,
                reason
            } = req.body

            let service_provider_id = req.user._id

            let userExist = await User.findById({ _id: ObjectId(user_id) })
            if (!userExist) {
                return res.json(responseData("USER_DONT_EXIST", {}, req, false));
            }

            let bookingExist = await Bookingbeta.findOne({
                _id: ObjectId(booking_id),
                user_id: ObjectId(user_id),
                service_provider_id: ObjectId(service_provider_id)
            })

            if (!bookingExist) {
                return res.json(responseData("BOOKING_DONT_EXIST", {}, req, false));
            }

            let message = null;

            // #check_me_pending
            // enum:['upcoming','task_started','ongoing','completed', 'cancelled', "failed"],

            if (booking_status == 'completed') {

                if (bookingExist.booking_status == 'cancelled') {
                    return res.json(responseData("BOOKING_CANT_COMPLETE", {}, req, false));
                }

                if (bookingExist.booking_status == 'completed') {
                    return res.json(responseData("BOOKING_CANT_COMPLETE", {}, req, false));
                }

                var arr = []
                const pet_after_image = req.files.map((i) => arr.push(i.filename))

                await Bookingbeta.findByIdAndUpdate({
                    _id: ObjectId(booking_id)
                }, {
                    $set: {
                        booking_status,
                        booking_completed_date: new Date(),
                        pet_after_image: arr
                    }
                })

                if(bookingExist.payment_method == 'cash'){

                    let queryFcmList = await UserDevice.find({
                        user_id: ObjectId(bookingExist.user_id)
                    })
    
                    let registrationToken = queryFcmList.map(i => {
                        return i.fcm_token
                    })
    
                    let notifyCreate = await Notification.create({
                        user_id: bookingExist.user_id,
                        service_provider_id: null,
                        user_flag: true,
                        type: 'cash_payment',
                        title: 'Cash payment',
                        message: `User ${userExist.name} cash payment Done`,
                        seen: false,
                        item_id: booking_id,
                        item_type: 'booking',
                        sender_id: service_provider_id,
                        sender_type: 'provider'
                    })
                    await Notification.create({
                        user_id: bookingExist.user_id,
                        service_provider_id: null,
                        user_flag: true,
                        type: 'cash_payment',
                        title: 'Cash payment',
                        message: `User ${userExist.name} cash payment Done`,
                        seen: false,
                        item_id: booking_id,
                        item_type: 'booking',
                        sender_id: service_provider_id,
                        sender_type: 'provider',
                        is_admin:true
                    })
    
                    //#check_me_fcm|fcm|cash_payment
                    if (registrationToken.length > 0) {
    
                        const messages = {
                            data: {
                                title: 'Cash payment',
                                body: `User ${userExist.name} cash payment Done`,
                                booking_id: booking_id.toString(),
                                sender_id: service_provider_id.toString(),
                                sender_type: "provider",
                                notification_id: notifyCreate._id.toString()
                            },
                            tokens: registrationToken
                        };
    
                        await firebase_admin.sendMulticast(messages);
                    }
                }

                message = 'BOOKING_COMPLETED'

            } else if (booking_status == 'ongoing') {

                if (bookingExist.booking_status == 'cancelled') {
                    return res.json(responseData("BOOKING_CANT_ONGOING", {}, req, false));
                }

                if (bookingExist.booking_status == 'completed') {
                    return res.json(responseData("BOOKING_CANT_ONGOING", {}, req, false));
                }

                if (bookingExist.booking_status == 'ongoing') {
                    return res.json(responseData("BOOKING_ALREADY_ONGOING", {}, req, false));
                }


                var arr = []
                const pet_before_image = req.files.map((i) => arr.push(i.filename))

                await Bookingbeta.findByIdAndUpdate({
                    _id: ObjectId(booking_id)
                }, {
                    $set: {
                        booking_status,
                        pet_before_image: arr
                    }
                })

                //#check_me_fcm|fcm|booking_ongoing

                let queryFcmList = await UserDevice.find({
                    user_id: ObjectId(user_id)
                })

                let registrationToken = queryFcmList.map(i => {
                    return i.fcm_token
                })

                let notifyCreate = await Notification.create({
                    user_id: user_id,
                    service_provider_id: null,
                    user_flag: true,
                    type: 'booking_ongoing',
                    title: 'Booking status ongoing',
                    message: `Provider ${req.user.name} has updated booking status to ongoing`,
                    seen: false,
                    item_id: booking_id,
                    item_type: 'booking',
                    sender_id: service_provider_id,
                    sender_type: 'provider'
                })
                
                await Notification.create({
                    user_id: user_id,
                    service_provider_id: null,
                    user_flag: true,
                    type: 'booking_ongoing',
                    title: 'Booking status ongoing',
                    message: `Provider ${req.user.name} has updated booking status to ongoing`,
                    seen: false,
                    item_id: booking_id,
                    item_type: 'booking',
                    sender_id: service_provider_id,
                    sender_type: 'provider',
                    is_admin:true
                })

                if (registrationToken.length > 0) {

                    const messages = {
                        data: {
                            title: 'Booking status ongoing',
                            body: `Provider ${req.user.name} has updated booking status to ongoing`,
                            booking_id: booking_id.toString(),
                            sender_id: service_provider_id.toString(),
                            sender_type: "provider",
                            notification_id: notifyCreate._id.toString()
                        },
                        tokens: registrationToken
                    };

                    await firebase_admin.sendMulticast(messages);
                }

                message = 'BOOKING_IS_ONGOING'

            } else if (booking_status == 'upcoming') {

                // #check_me
                // await Bookingbeta.findByIdAndUpdate({
                //     _id:ObjectId(booking_id)
                // },{
                //     $set:{
                //         booking_status
                //     }
                // })

                message = 'BOOKING_IS_UPCOMING'

            } else if (booking_status == 'cancelled') {

                message = 'BOOKING_IS_CANCELLED_REQUEST'

                if (bookingExist.booking_status == 'cancelled') {
                    return res.json(responseData("BOOKING_CANT_BE_CANCELED", {}, req, false));
                }

                if (bookingExist.booking_status == 'completed') {
                    return res.json(responseData("BOOKING_CANT_BE_CANCELED", {}, req, false));
                }

                if (!reason) {
                    return res.json(responseData("PROVIDE_REASON_PROVIDER_CANCEL", {}, req, false));
                }

                let cancelRequest = await CancelBooking.findOne({
                    booking_id: ObjectId(booking_id),
                    user_id: ObjectId(user_id),
                    service_provider_id: ObjectId(service_provider_id)
                })

                if (cancelRequest) {
                    return res.json(responseData("CANCEL_BOOKING_REQUEST_EXIST", {}, req, false));
                }


                await CancelBooking.create({
                    booking_id: ObjectId(booking_id),
                    user_id: ObjectId(user_id),
                    service_provider_id: ObjectId(service_provider_id),
                    reason,
                    is_cancelled: false,
                    is_rejected: false
                })
                // await Bookingbeta.findOneAndUpdate({_id:ObjectId(booking_id)},{booking_status:'cancelled',is_cancel:true,cancel_appointment_time:Date.now()})

            }

            return res.json(responseData(message, {}, req, true));

        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },

    list: async (req, res) => {
        try {

            let service_provider_id = req.user._id

            let {
                booking_status,
                // service_provider_id,
                keyword,
                from_date,
                to_date,
                date,
                sub_service_type_id,
                service_type_id,
                pet_type_id,
                payment_method,
                longitude,
                latitude,
                is_home_screen
            } = req.query

            let matchFilter = {}

            if (service_provider_id) {
                matchFilter.service_provider_id = ObjectId(service_provider_id)
            }

            if (!service_provider_id) {
                return res.json(responseData("ERROR_OCCUR", {}, req, false));
            }

            if (booking_status) {
                matchFilter.booking_status = booking_status
            }

            if (payment_method) {
                matchFilter.payment_method = payment_method
            }

            let homeScreenFilter = {}

            if (keyword) {
                if (parseInt(keyword)) {
                    matchFilter.booking_code = parseInt(keyword)
                    homeScreenFilter = {
                        $or: [
                            { 'userData.name': { $regex: keyword, $options: 'i' } },
                            { 'booking_code': parseInt(keyword) },
                            { 'booking_status': { $regex: keyword, $options: 'i' } }
                        ]
                    }
                } else {
                    homeScreenFilter = {
                        $or: [
                            { 'userData.name': { $regex: keyword, $options: 'i' } },
                            { 'booking_status': { $regex: keyword, $options: 'i' } }
                        ]
                    }
                }

            }

            let dateFilter = {}

            is_home_screen = parseInt(is_home_screen) ? true : false

            if (is_home_screen && !date) {
                const fromDate = moment(new Date()).utc().startOf('day')
                const endDate = moment(new Date()).utc().endOf("day")
                dateFilter = {
                    "$gte": new Date(fromDate),
                    "$lte": new Date(endDate),
                }
                matchFilter = {
                    ...matchFilter,
                    "date_of_appointment": dateFilter,
                }
            }

            if (is_home_screen && date) {
                const fromDate = moment(new Date(date)).utc().startOf('day')
                const endDate = moment(new Date(date)).utc().endOf("day")
                dateFilter = {
                    "$gte": new Date(fromDate),
                    "$lte": new Date(endDate),
                }
                matchFilter = {
                    ...matchFilter,
                    "date_of_appointment": dateFilter,
                }
            }

            if (!is_home_screen) {
                if (from_date) {
                    const fromDate = moment(new Date(from_date)).utc().startOf('day')
                    dateFilter = {
                        ...dateFilter,
                        "$gte": new Date(fromDate),
                    }
                }

                if (to_date) {
                    const endDate = moment(new Date(to_date)).utc().endOf("day")//#check_me
                    dateFilter = {
                        ...dateFilter,
                        "$lte": new Date(endDate),
                    }
                }


                if (to_date || from_date) {
                    matchFilter = {
                        ...matchFilter,
                        "date_of_appointment": dateFilter,
                    }
                }
            }

            let linkMatch = []
            let linkMatchAnd = {}

            if (sub_service_type_id) {
                linkMatch.push({ 'serviceData.ServiceBookingData.sub_service_type_id': ObjectId(sub_service_type_id) })
            }

            if (service_type_id) {
                linkMatch.push({ 'serviceData.ServiceBookingData.service_type_id': ObjectId(service_type_id) })
            }

            if (pet_type_id) {
                linkMatch.push({ 'serviceData.ServiceBookingData.pet_type_id': ObjectId(pet_type_id) })
            }

            if (linkMatch.length > 0) {
                linkMatchAnd = { $and: linkMatch }
            }


            let regexFilter = {}

            if (keyword && !is_home_screen) {
                regexFilter = {
                    $or: [
                        { 'userData.name': { $regex: keyword, $options: 'i' } },
                        { 'address': { $regex: keyword, $options: 'i' } },
                        { 'city': { $regex: keyword, $options: 'i' } },
                        { 'state': { $regex: keyword, $options: 'i' } },
                        { 'zipcode': { $regex: keyword, $options: 'i' } },
                        { 'booking_code': { $regex: keyword, $options: 'i' } },
                    ]
                }
                homeScreenFilter = {}
            }

            console.log(homeScreenFilter);

            // Pagination
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;


            let geo_filter = {}
            if (longitude && latitude) {
                longitude = parseFloat(longitude)
                latitude = parseFloat(latitude)
                geo_filter = {
                    $geoNear: {
                        near: { type: "Point", coordinates: [longitude, latitude] },
                        distanceField: "farFromMe",
                        // maxDistance: 2,//#CHECK_ME_DISCTANCE TO BE ADDED
                        includeLocs: "location",
                        spherical: true
                    },
                }
            } else {
                geo_filter = {
                    $match: {}
                }
            }

            let queryResolve = await Bookingbeta.aggregate([
                geo_filter,
                {
                    $match: matchFilter
                },
                {
                    $sort: { "createdAt": -1 }
                },
                {
                    $lookup: {
                        from: 'servicelinkbookings',
                        let: {
                            addr: '$_id'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$booking_id', '$$addr'] }
                                }

                            },
                            {
                                $project: {
                                    "_id": 1,
                                    "user_pet_name": 1,
                                    "pet_type_id": 1,
                                    "pet_type_name": 1,
                                    "breed_name": 1,
                                    "user_pet_id": 1,
                                    "sub_service_type_id": 1,
                                    "sub_service_name": 1,
                                    "service_type_id": 1,
                                    "service_name": 1,
                                    "price": 1,
                                    "time": 1,
                                    "booking_id": 1,
                                    "is_addon": 1,
                                    "is_paid": 1,
                                    "payment_status": 1,
                                    "createdAt": 1,
                                    "updatedAt": 1
                                }
                            },
                            {
                                $group: {
                                    _id: '$user_pet_id',
                                    user_pet_name: { $first: '$user_pet_name' },
                                    pet_type_name: { $first: "$pet_type_name" },
                                    ServiceBookingData: { $push: '$$ROOT' },
                                }
                            },
                        ],
                        as: 'serviceData'
                    }
                },
                {
                    $match: linkMatchAnd
                },
                {
                    $project: {
                        _id: 1,
                        user_id: 1,
                        service_provider_id: 1,
                        address_id: 1,
                        address: 1,
                        city: 1,
                        state: 1,
                        zipcode: 1,
                        location: 1,
                        booking_code: 1,
                        special_note: 1,
                        person_name: 1,
                        promo_code: 1,
                        is_sheduled_appointment: 1,
                        date_of_appointment: 1,
                        time_start_appointment: 1,
                        time_end_appointment: 1,
                        booking_completed_date: 1,
                        service_amount: 1,
                        add_on_service_amount: 1,
                        total_amount: 1,
                        payment_method: 1,
                        payment_status: 1,
                        booking_status: 1,
                        is_addon_paid: 1,
                        is_addon_payment_status: 1,
                        invoice: 1,
                        pet_before_image: 1,
                        pet_after_image: 1,
                        cancel_appointment_time: 1,
                        refund_threshold_time: 1,
                        cancel_till: 1,
                        refund: 1,
                        is_cancel: 1,
                        is_paid: 1,
                        is_refund: 1,
                        is_addon_paid: 1,
                        is_addon_payment_status: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        farFromMe: 1,
                        serviceData: 1
                    }
                },
                {
                    $lookup: {
                        from: 'serviceproviders',
                        let: {
                            addr: '$service_provider_id'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$_id', '$$addr'] }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    profile_pic: {
                                        $cond: {
                                            if: { "$ne": ["$profile_pic", null] },
                                            then: { $concat: [process.env.IMAGE_LOCAL_PATH, "$profile_pic"] },
                                            else: { $concat: [process.env.IMAGE_LOCAL_PATH, "no_image.png"] },
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'serviceprovidersData'
                    }
                },
                {
                    $unwind: {
                        path: '$serviceprovidersData',
                        preserveNullAndEmptyArrays: true,
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        let: {
                            addr: '$user_id'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$_id', '$$addr'] }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    mobile: 1,
                                    profile_pic: {
                                        $cond: {
                                            if: { "$ne": ["$profile_pic", null] },
                                            then: { $concat: [process.env.IMAGE_LOCAL_PATH, "$profile_pic"] },
                                            else: { $concat: [process.env.IMAGE_LOCAL_PATH, "no_image.png"] },
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'userData'
                    }
                },
                {
                    $unwind: {
                        path: '$userData',
                        preserveNullAndEmptyArrays: true,
                    }
                },
                {
                    $match: homeScreenFilter
                },
                {
                    $match: regexFilter
                },
                {
                    $facet: {
                        paginatedResults: [{ $skip: startIndex }, { $limit: limit }],
                        totalCount: [
                            {
                                $count: 'count'
                            }
                        ]
                    }
                },
                {
                    $unwind: {
                        path: '$totalCount',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        paginatedResults: "$paginatedResults",
                        total:
                        {
                            $cond: [{ $gte: ["$totalCount.count", 0] }, "$totalCount.count", 0]
                        }
                    }
                },
            ])


            let total = queryResolve[0].total

            let flag = 0

            if ((total % limit) > 0) {
                flag = parseInt((total / limit)) + 1;
            } else {
                flag = (total / limit)
            }

            // Pagination result

            let paginateme = {
                "totalDocs": total,
                "limit": limit,
                "page": page,
                "totalPages": flag,
                "pagingCounter": page,
                "hasPrevPage": false,
                "hasNextPage": false,
                "prevPage": 0,
                "nextPage": 0
            }

            if (endIndex < total) {
                paginateme.hasNextPage = true
                paginateme.nextPage = page + 1
            }

            if (startIndex > 0) {
                paginateme.hasPrevPage = true
                paginateme.prevPage = page - 1
            }

            let responseCreate = {
                data: queryResolve[0].paginatedResults,
                count: queryResolve[0].paginatedResults.length,
                ...paginateme,
            }



            return res.json(responseData("GET_LIST", responseCreate, req, true));

        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },

    detail: async (req, res) => {
        try {

            let service_provider_id = req.user._id
            let {
                booking_id,
                // service_provider_id,
            } = req.query

            let matchFilter = {}

            if (service_provider_id) {
                matchFilter.service_provider_id = ObjectId(service_provider_id)
            }

            if (!service_provider_id) {
                return res.json(responseData("ERROR_OCCUR", {}, req, false));
            }

            if (booking_id) {
                let bookingCheck = await Bookingbeta.findById({ _id: ObjectId(booking_id) })
                if (!bookingCheck) {
                    return res.json(responseData("BOOKING_DONT_EXIST", {}, req, false));
                }
                matchFilter._id = ObjectId(booking_id)
            } else {
                return res.json(responseData("BOOKING_ID_EMPTY", {}, req, false));
            }

            let query = await Bookingbeta.aggregate([
                {
                    $match: matchFilter
                },
                {
                    $lookup: {
                        from: 'servicelinkbookings',
                        let: {
                            addr: '$_id'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $and: [//check_me_test|is_addon:false|is_paid:true
                                        { $expr: { $eq: ['$booking_id', '$$addr'] } },
                                        { $expr: { $eq: ['$is_paid', true] } },
                                        { $expr: { $eq: ['$is_addon', false] } },
                                    ]
                                }

                            },
                            {
                                $project: {
                                    "_id": 1,
                                    "user_pet_name": 1,
                                    "pet_type_id": 1,
                                    "pet_type_name": 1,
                                    "breed_name": 1,
                                    "user_pet_id": 1,
                                    "sub_service_type_id": 1,
                                    "sub_service_name": 1,
                                    "service_type_id": 1,
                                    "service_name": 1,
                                    "price": 1,
                                    "time": 1,
                                    "booking_id": 1,
                                    "is_addon": 1,
                                    "is_paid": 1,
                                    "payment_status": 1,
                                    "createdAt": 1,
                                    "updatedAt": 1
                                }
                            },
                            {
                                $group: {
                                    "_id": {
                                        "user_pet_id": "$user_pet_id",
                                        "service_type_id": "$service_type_id"
                                    },
                                    user_pet_name: { $first: '$user_pet_name' },
                                    pet_type_name: { $first: '$pet_type_name' },
                                    service_name: { $first: '$service_name' },
                                    subServiceData: { $push: '$$ROOT' }
                                }
                            },
                            {
                                $project: {
                                    user_pet_id: "$_id.user_pet_id",
                                    service_type_id: "$_id.service_type_id",
                                    _id: 0,
                                    user_pet_name: 1,
                                    pet_type_name: 1,
                                    service_name: 1,
                                    subServiceData: 1
                                }
                            },
                            {
                                $group: {
                                    _id: '$user_pet_id',
                                    user_pet_name: { $first: '$user_pet_name' },
                                    services: { $push: "$$ROOT" }
                                }
                            }
                        ],
                        as: 'serviceData'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        user_id: 1,
                        service_provider_id: 1,
                        address_id: 1,
                        address: 1,
                        city: 1,
                        state: 1,
                        zipcode: 1,
                        location: 1,
                        booking_code: 1,
                        special_note: 1,
                        person_name: 1,
                        person_contact: 1,
                        promo_code: 1,
                        is_sheduled_appointment: 1,
                        date_of_appointment: 1,
                        time_start_appointment: 1,
                        time_end_appointment: 1,
                        booking_completed_date: 1,
                        service_amount: 1,
                        add_on_service_amount: 1,
                        total_amount: 1,
                        payment_method: 1,
                        payment_status: 1,
                        booking_status: 1,
                        is_addon_paid: 1,
                        is_addon_payment_status: 1,
                        invoice: 1,
                        pet_before_image: 1,
                        pet_after_image: 1,
                        cancel_appointment_time: 1,
                        refund_threshold_time: 1,
                        cancel_till: 1,
                        refund: 1,
                        is_cancel: 1,
                        is_paid: 1,
                        is_refund: 1,
                        is_addon_paid: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        farFromMe: 1,
                        serviceData: 1
                    }
                },
                {
                    $unwind: {
                        path: '$serviceData',
                        preserveNullAndEmptyArrays: true,
                    }
                },
                {
                    $lookup: {
                        from: 'userpets',
                        let: {
                            addr: '$serviceData._id'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$_id', '$$addr'] }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    "user_id": 1,
                                    "pet_type_id": 1,
                                    "breed_name": 1,
                                    "image": {
                                        $cond: {
                                            if: { "$ne": ["$profile_pic", null] },
                                            then: { $concat: [process.env.IMAGE_LOCAL_PATH, "$image"] },
                                            else: { $concat: [process.env.IMAGE_LOCAL_PATH, "no_image.png"] },
                                        }
                                    },
                                    "gender": 1,
                                    "name": 1,
                                    "weight": 1,
                                    "size": 1,
                                }
                            }
                        ],
                        as: 'serviceData.userPetsData'
                    }
                },
                {
                    $unwind: {
                        path: '$serviceData.userPetsData',
                        preserveNullAndEmptyArrays: true,
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        let: {
                            addr: '$user_id'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$_id', '$$addr'] }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    mobile: 1,
                                    profile_pic: {
                                        $cond: {
                                            if: { "$ne": ["$profile_pic", null] },
                                            then: { $concat: [process.env.IMAGE_LOCAL_PATH, "$profile_pic"] },
                                            else: { $concat: [process.env.IMAGE_LOCAL_PATH, "no_image.png"] },
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'userData'
                    }
                },
                {
                    $unwind: {
                        path: '$userData',
                        preserveNullAndEmptyArrays: true,
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        user_id: { $first: '$user_id' },
                        service_provider_id: { $first: '$service_provider_id' },
                        address: { $first: '$address' },
                        city: { $first: '$city' },
                        state: { $first: '$state' },
                        zipcode: { $first: '$zipcode' },
                        location: { $first: '$location' },
                        booking_code: { $first: '$booking_code' },
                        special_note: { $first: '$special_note' },
                        person_name: { $first: '$person_name' },
                        promo_code: { $first: '$promo_code' },
                        is_sheduled_appointment: { $first: '$is_sheduled_appointment' },
                        date_of_appointment: { $first: '$date_of_appointment' },
                        booking_completed_date: { $first: '$booking_completed_date' },
                        service_amount: { $first: '$service_amount' },
                        add_on_service_amount: { $first: '$add_on_service_amount' },
                        total_amount: { $first: '$total_amount' },
                        payment_method: { $first: '$payment_method' },
                        payment_status: { $first: '$payment_status' },
                        booking_status: { $first: '$booking_status' },
                        is_addon_paid: { $first: '$is_addon_paid' },
                        is_addon_payment_status: { $first: '$is_addon_payment_status' },
                        invoice: { $first: '$invoice' },
                        pet_before_image: { $first: '$pet_before_image' },
                        pet_after_image: { $first: '$pet_after_image' },
                        cancel_appointment_time: { $first: '$cancel_appointment_time' },
                        refund_threshold_time: { $first: '$refund_threshold_time' },
                        cancel_till: { $first: '$cancel_till' },
                        refund: { $first: '$refund' },
                        is_cancel: { $first: '$is_cancel' },
                        is_paid: { $first: '$is_paid' },
                        is_refund: { $first: '$is_refund' },
                        is_rating_by_user: { $first: '$is_rating_by_user' },
                        is_rating_by_provider: { $first: '$is_rating_by_provider' },
                        createdAt: { $first: '$createdAt' },
                        updatedAt: { $first: '$updatedAt' },
                        userData: { $first: '$userData' },
                        time_end_appointment: { $first: '$time_end_appointment' },
                        time_start_appointment: { $first: '$time_start_appointment' },
                        time_it_take: { $first: '$time_it_take' },
                        // serviceprovidersData:{$first:'$serviceprovidersData'},
                        serviceData: { $push: '$serviceData' }
                    }
                },
            ])


            let responseCreate = {
                data: query[0],
            }



            return res.json(responseData("GET_DETAIL", responseCreate, req, true));

        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },

    rating_to_user: async (req, res) => {
        try {

            let {
                user_id,
                booking_id,
                review,
                rating
            } = req.body

            let service_provider_id = req.user._id

            let bookingExist = await Bookingbeta.findOne({
                _id: ObjectId(booking_id),
                service_provider_id: ObjectId(service_provider_id),
                user_id: ObjectId(user_id)
            })

            if (!bookingExist) {
                return res.json(responseData("BOOKING_DONT_EXIST", {}, req, false));
            }

            if (bookingExist.is_rating_by_provider) {
                return res.json(responseData("RATING_ALREADY_GIVEN", {}, req, false));
            }

            let query = await Rating.create({
                user_id,
                service_provider_id,
                booking_id,
                review,
                rating,
                to: 'user'
            })

            await Bookingbeta.findByIdAndUpdate({
                _id: ObjectId(booking_id)
            }, {
                $set: {
                    is_rating_by_provider: true
                }
            })

            return res.json(responseData("RATING_SUCCESSFULLY_GIVEN", query, req, true));

        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },

    rating_to_user_edit: async (req, res) => {
        try {

            let {
                rating_id,
                booking_id,
                review,
                rating
            } = req.body

            let service_provider_id = req.user._id

            let bookingExist = await Bookingbeta.findOne({
                _id: ObjectId(booking_id),
                service_provider_id: ObjectId(service_provider_id),
                is_rating_by_provider: true
            })

            if (!bookingExist) {
                return res.json(responseData("BOOKING_DONT_EXIST", {}, req, false));
            }

            let query = await Rating.findOneAndUpdate({
                _id: ObjectId(rating_id),
                booking_id: ObjectId(booking_id),
            }, {
                $set: {
                    review,
                    rating,
                    updatedAt: new Date()
                },
            }, { returnOriginal: false })

            return res.json(responseData("RATING_SUCCESSFULLY_EDIT", query, req, true));

        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },

    job_status: async (req, res) => {
        try {

            let service_provider_id = req.user._id;

            let {
                job_status,
                booking_id,
                // service_provider_id
            } = req.body

            let bookingExist = await Bookingbeta.findOne({
                _id: ObjectId(booking_id),
                is_cancel: false,
                is_paid: true,
                service_provider_id: ObjectId(service_provider_id)
            })

            if (!bookingExist) {
                return res.json(responseData("BOOKING_NOT_EXIST", {}, req, false));
            }

            let userExist = await User.findById({ _id: ObjectId(bookingExist.user_id) })
            if (!userExist) {
                return res.json(responseData("USER_DONT_EXIST", {}, req, false));
            }

            let message = ""

            if (job_status == 'provider_on_way') {

                if (
                    bookingExist.booking_status == 'task_started' ||
                    bookingExist.booking_status == 'ongoing' ||
                    bookingExist.booking_status == 'completed' ||
                    bookingExist.booking_status == 'cancelled' ||
                    bookingExist.booking_status == "failed"
                ) {
                    return res.json(responseData("BOOKING_STATUS_DONT_ALLOW_ON_WAY", {}, req, false));
                }

                await Bookingbeta.findOneAndUpdate({
                    _id: ObjectId(booking_id)
                },
                    {
                        $set: {
                            job_status: 'provider_on_way',
                            booking_status:"ongoing"
                        }
                    })

                //#check_me_fcm|fcm|provider_on_way
                let queryFcmList = await UserDevice.find({
                    user_id: ObjectId(bookingExist.user_id)
                })

                let registrationToken = queryFcmList.map(i => {
                    return i.fcm_token
                })

                let notifyCreate = await Notification.create({
                    user_id: bookingExist.user_id,
                    service_provider_id: null,
                    user_flag: true,
                    type: 'provider_on_way',
                    title: 'Provider is on the way',
                    message: `Provider ${req.user.name} is on the way`,
                    seen: false,
                    item_id: booking_id,
                    item_type: 'booking',
                    sender_id: service_provider_id,
                    sender_type: 'provider'
                })

                await Notification.create({
                    user_id: bookingExist.user_id,
                    service_provider_id: null,
                    user_flag: true,
                    type: 'provider_on_way',
                    title: 'Provider is on the way',
                    message: `Provider ${req.user.name} is on the way`,
                    seen: false,
                    item_id: booking_id,
                    item_type: 'booking',
                    sender_id: service_provider_id,
                    sender_type: 'provider',
                    is_admin:true
                })

                if (registrationToken.length > 0) {

                    const messages = {
                        data: {
                            title: 'Provider is on the way',
                            body: `Provider ${req.user.name} is on the way`,
                            booking_id: booking_id.toString(),
                            sender_id: service_provider_id.toString(),
                            sender_type: "provider",
                            notification_id: notifyCreate._id.toString()
                        },
                        tokens: registrationToken
                    };

                    await firebase_admin.sendMulticast(messages);
                }

                message = "PROVIDER_ON_WAY"

            } else if (job_status == 'reached') {

                if (
                    bookingExist.booking_status == 'task_started' ||
                    bookingExist.booking_status == 'ongoing' ||
                    bookingExist.booking_status == 'completed' ||
                    bookingExist.booking_status == 'cancelled' ||
                    bookingExist.booking_status == "failed"
                ) {
                    return res.json(responseData("BOOKING_STATUS_DONT_ALLOW_ON_WAY", {}, req, false));
                }

                if (
                    bookingExist.job_status == 'task_started' ||
                    bookingExist.job_status == 'task_completed' ||
                    bookingExist.job_status == 'cancel'
                ) {
                    return res.json(responseData("STATUS_NOT_ALLOWED", {}, req, false));
                }

                await Bookingbeta.findOneAndUpdate({
                    _id: ObjectId(booking_id)
                },
                    {
                        $set: {
                            job_status: 'reached',
                            booking_status: 'ongoing'
                        }
                    })

                //#check_me_fcm|fcm|provider_reached
                let queryFcmList = await UserDevice.find({
                    user_id: ObjectId(bookingExist.user_id)
                })

                let registrationToken = queryFcmList.map(i => {
                    return i.fcm_token
                })

                let notifyCreate = await Notification.create({
                    user_id: bookingExist.user_id,
                    service_provider_id: null,
                    user_flag: true,
                    type: 'provider_reached',
                    title: 'Provider reached',
                    message: `Provider ${req.user.name} reached to location`,
                    seen: false,
                    item_id: booking_id,
                    item_type: 'booking',
                    sender_id: service_provider_id,
                    sender_type: 'provider'
                })

                await Notification.create({
                    user_id: bookingExist.user_id,
                    service_provider_id: null,
                    user_flag: true,
                    type: 'provider_reached',
                    title: 'Provider reached',
                    message: `Provider ${req.user.name} reached to location`,
                    seen: false,
                    item_id: booking_id,
                    item_type: 'booking',
                    sender_id: service_provider_id,
                    sender_type: 'provider',
                    is_admin:true
                })

                if (registrationToken.length > 0) {

                    const messages = {
                        data: {
                            title: 'Provider reached',
                            body: `Provider ${req.user.name} reached to location`,
                            booking_id: booking_id.toString(),
                            sender_id: service_provider_id.toString(),
                            sender_type: "provider",
                            notification_id: notifyCreate._id.toString()
                        },
                        tokens: registrationToken
                    };

                    await firebase_admin.sendMulticast(messages);
                }

                message = "PROVIDER_REACHED"

            } else if (job_status == 'no_show_user') {
                if (
                    bookingExist.booking_status == 'task_started' ||
                    bookingExist.booking_status == 'ongoing' ||
                    bookingExist.booking_status == 'completed' ||
                    bookingExist.booking_status == 'cancelled' ||
                    bookingExist.booking_status == "failed"
                ) {
                    return res.json(responseData("BOOKING_STATUS_DONT_ALLOW_ON_WAY", {}, req, false));
                }

                if (
                    bookingExist.job_status == 'task_started' ||
                    bookingExist.job_status == 'task_completed' ||
                    bookingExist.job_status == 'cancel'
                ) {
                    return res.json(responseData("STATUS_NOT_ALLOWED", {}, req, false));
                }

                await Bookingbeta.findOneAndUpdate({
                    _id: ObjectId(booking_id)
                },
                    {
                        $set: {
                            job_status: 'no_show_user',
                            booking_status: 'no-show'
                        }
                    })

                //#check_me_fcm|fcm|user_not_here
                let queryFcmList = await UserDevice.find({
                    user_id: ObjectId(bookingExist.user_id)
                })

                let registrationToken = queryFcmList.map(i => {
                    return i.fcm_token
                })


                let notifyCreate = await Notification.create({
                    user_id: bookingExist.user_id,
                    service_provider_id: null,
                    user_flag: true,
                    type: 'user_not_here',
                    title: 'Customer Not Here',
                    message: `Customer is not there ${userExist.name}`,
                    seen: false,
                    item_id: booking_id,
                    item_type: 'booking',
                    sender_id: service_provider_id,
                    sender_type: 'provider'
                })

                await Notification.create({
                    user_id: bookingExist.user_id,
                    service_provider_id: null,
                    user_flag: true,
                    type: 'user_not_here',
                    title: 'Customer Not Here',
                    message: `Customer is not there ${userExist.name}`,
                    seen: false,
                    item_id: booking_id,
                    item_type: 'booking',
                    sender_id: service_provider_id,
                    sender_type: 'provider',
                    is_admin:true
                })

                if (registrationToken.length > 0) {

                    const messages = {
                        data: {
                            title: 'Customer Not Here',
                            body: `Customer is not there ${userExist.name}`,
                            booking_id: booking_id.toString(),
                            sender_id: service_provider_id.toString(),
                            sender_type: "provider",
                            notification_id: notifyCreate._id.toString()
                        },
                        tokens: registrationToken
                    };

                    await firebase_admin.sendMulticast(messages);
                }

                message = "PROVIDER_CANT_FIND_USER"

            } else if (job_status == 'task_started') {
                if (
                    bookingExist.booking_status == 'task_started' ||
                    bookingExist.booking_status == 'ongoing' ||
                    bookingExist.booking_status == 'completed' ||
                    bookingExist.booking_status == 'cancelled' ||
                    bookingExist.booking_status == "failed"
                ) {
                    return res.json(responseData("BOOKING_STATUS_DONT_ALLOW_ON_WAY", {}, req, false));
                }

                if (
                    bookingExist.job_status == 'task_completed' ||
                    bookingExist.job_status == 'cancel'
                ) {
                    return res.json(responseData("STATUS_NOT_ALLOWED", {}, req, false));
                }

                await Bookingbeta.findOneAndUpdate({
                    _id: ObjectId(booking_id)
                },
                    {
                        $set: {
                            job_status: 'task_started',
                            booking_status:'ongoing' 
                        }
                    })

                //#check_me_fcm|fcm|started_task
                let queryFcmList = await UserDevice.find({
                    user_id: ObjectId(bookingExist.user_id)
                })

                let registrationToken = queryFcmList.map(i => {
                    return i.fcm_token
                })


                let notifyCreate = await Notification.create({
                    user_id: bookingExist.user_id,
                    service_provider_id: null,
                    user_flag: true,
                    type: 'started_task',
                    title: 'Provider started the task',
                    message: `Provider ${req.user.name} started the task`,
                    seen: false,
                    item_id: booking_id,
                    item_type: 'booking',
                    sender_id: service_provider_id,
                    sender_type: 'provider'
                })

                await Notification.create({
                    user_id: bookingExist.user_id,
                    service_provider_id: null,
                    user_flag: true,
                    type: 'started_task',
                    title: 'Provider started the task',
                    message: `Provider ${req.user.name} started the task`,
                    seen: false,
                    item_id: booking_id,
                    item_type: 'booking',
                    sender_id: service_provider_id,
                    sender_type: 'provider',
                    is_admin:true
                })

                if (registrationToken.length > 0) {

                    const messages = {
                        data: {
                            title: 'Provider started the task',
                            body: `Provider ${req.user.name} started the task`,
                            booking_id: booking_id.toString(),
                            sender_id: service_provider_id.toString(),
                            sender_type: "provider",
                            notification_id: notifyCreate._id.toString()
                        },
                        tokens: registrationToken
                    };

                    await firebase_admin.sendMulticast(messages);
                }

                message = "PROVIDER_STARTED_THE_TASK"
            } else if (job_status == 'task_completed') {
                if (
                    bookingExist.booking_status == 'task_started' ||
                    bookingExist.booking_status == 'ongoing' ||
                    bookingExist.booking_status == 'completed' ||
                    bookingExist.booking_status == 'cancelled' ||
                    bookingExist.booking_status == "failed"
                ) {
                    return res.json(responseData("BOOKING_STATUS_DONT_ALLOW_ON_WAY", {}, req, false));
                }

                if (
                    bookingExist.job_status == 'cancel' ||
                    bookingExist.job_status == 'no_show_user'
                ) {
                    return res.json(responseData("STATUS_NOT_ALLOWED", {}, req, false));
                }

                await Bookingbeta.findOneAndUpdate({
                    _id: ObjectId(booking_id)
                },
                    {
                        $set: {
                            job_status: 'task_completed',
                            booking_status: 'completed'
                        }
                    })

                //#check_me_fcm|fcm|completed_task
                let queryFcmList = await UserDevice.find({
                    user_id: ObjectId(bookingExist.user_id)
                })

                let registrationToken = queryFcmList.map(i => {
                    return i.fcm_token
                })

                let notifyCreate = await Notification.create({
                    user_id: bookingExist.user_id,
                    service_provider_id: null,
                    user_flag: true,
                    type: 'completed_task',
                    title: 'Provider completed the task',
                    message: `Provider ${req.user.name} completed the task`,
                    seen: false,
                    item_id: booking_id,
                    item_type: 'booking',
                    sender_id: service_provider_id,
                    sender_type: 'provider'
                })

                await Notification.create({
                    user_id: bookingExist.user_id,
                    service_provider_id: null,
                    user_flag: true,
                    type: 'completed_task',
                    title: 'Provider completed the task',
                    message: `Provider ${req.user.name} completed the task`,
                    seen: false,
                    item_id: booking_id,
                    item_type: 'booking',
                    sender_id: service_provider_id,
                    sender_type: 'provider',
                    is_admin:true
                })

                if (registrationToken.length > 0) {

                    const messages = {
                        data: {
                            title: 'Provider completed the task',
                            body: `Provider ${req.user.name} completed the task`,
                            booking_id: booking_id.toString(),
                            sender_id: service_provider_id.toString(),
                            sender_type: "provider",
                            notification_id: notifyCreate._id.toString()
                        },
                        tokens: registrationToken
                    };

                    await firebase_admin.sendMulticast(messages);
                }

                message = "PROVIDER_COMPLETED_THE_TASK"
            } else {
                message = "STATUS_NOT_VALID"
            }


            return res.json(responseData(message, {}, req, true));

        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },

    list_service_addon: async (req, res) => {
        try {

            let {
                pet_type_id,
            } = req.query

            // Pagination
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            const queryResolve = await Service.aggregate([
                {
                    $match: {
                        pet_type_id: ObjectId(pet_type_id),
                        status: 1
                    }
                },
                {
                    $sort: { "createdAt": -1 }
                },
                {
                    $lookup: {
                        from: 'pets',
                        let: {
                            addr: '$pet_type_id'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$_id', '$$addr'] }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    status: 1,
                                    image: {
                                        $cond: {
                                            if: { "$ne": ["$image", null] },
                                            then: { $concat: [process.env.IMAGE_LOCAL_PATH, "$image"] },
                                            else: { $concat: [process.env.IMAGE_LOCAL_PATH, "no_image.png"] },
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'petsData'
                    }
                },
                {
                    $unwind: {
                        path: '$petsData',
                        preserveNullAndEmptyArrays: true,
                    }
                },
                {
                    $lookup: {
                        from: 'subservices',
                        let: {
                            addr: '$_id'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$service_type_id', '$$addr'] }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    name: 1
                                }
                            }
                        ],
                        as: 'subservicesData'
                    }
                },
                {
                    $project: {
                        subservicesData_count: { $size: "$subservicesData" },
                        _id: 1,
                        pet_type_id: 1,
                        name: 1,
                        image: 1,
                        status: 1,
                        __v: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        petsData: 1,
                    }
                },
                {
                    $match: {
                        subservicesData_count: { $ne: 0 }
                    }
                },
                {
                    $group: {
                        _id: '$petsData._id',
                        "pet_type_id": { $first: '$pet_type_id' },
                        "pet_name": { $first: '$petsData.name' },
                        "pet_status": { $first: '$petsData.status' },
                        "pet_image": { $first: '$petsData.image' },
                        // subservicesData:1,
                        // foo_count:{$size:"$subservicesData"},
                        serviceData: {
                            $push: {
                                name: "$name",
                                status: "$status",
                                createdAt: "$createdAt",
                                price: "$price",
                                time: "$time",
                                service_id: "$_id",
                                image: {
                                    $cond: {
                                        if: { "$ne": ["$image", null] },
                                        then: { $concat: [process.env.IMAGE_LOCAL_PATH, "$image"] },
                                        else: { $concat: [process.env.IMAGE_LOCAL_PATH, "no_image.png"] },
                                    }
                                }
                            }
                        },
                    }
                },
                {
                    $facet: {
                        paginatedResults: [{ $skip: startIndex }, { $limit: limit }],
                        totalCount: [
                            {
                                $count: 'count'
                            }
                        ]
                    }
                },
                {
                    $unwind: {
                        path: '$totalCount',
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        paginatedResults: "$paginatedResults",
                        total:
                        {
                            $cond: [{ $gte: ["$totalCount.count", 0] }, "$totalCount.count", 0]
                        }
                    }
                },
            ])


            let total = queryResolve[0].total

            let flag = 0

            if ((total % limit) > 0) {
                flag = parseInt((total / limit)) + 1;
            } else {
                flag = (total / limit)
            }

            // Pagination result

            let paginateme = {
                "totalDocs": total,
                "limit": limit,
                "page": page,
                "totalPages": flag,
                "pagingCounter": page,
                "hasPrevPage": false,
                "hasNextPage": false,
                "prevPage": 0,
                "nextPage": 0
            }

            if (endIndex < total) {
                paginateme.hasNextPage = true
                paginateme.nextPage = page + 1
            }

            if (startIndex > 0) {
                paginateme.hasPrevPage = true
                paginateme.prevPage = page - 1
            }

            let responseCreate = {
                data: queryResolve[0].paginatedResults,
                count: queryResolve[0].paginatedResults.length,
                ...paginateme,
            }


            return res.json(responseData("GET_LIST", responseCreate, req, true));

        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },

    list_sub_service_addon: async (req, res) => {
        try {

            let {
                service_type_id
            } = req.query

            let query;

            // Pagination
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const total = await SubService.countDocuments({
                service_type_id: ObjectId(service_type_id),
                status: 1
            });

            query = SubService.aggregate([
                {
                    $match: {
                        service_type_id: ObjectId(service_type_id),
                        status: 1
                    }
                },
                {
                    $sort: { "createdAt": -1 }
                },
                {
                    $skip: startIndex
                },
                {
                    $limit: limit
                },
                {
                    $lookup: {
                        from: 'services',
                        let: {
                            addr: '$service_type_id'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$_id', '$$addr'] }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    status: 1,
                                    image: {
                                        $cond: {
                                            if: { "$ne": ["$image", null] },
                                            then: { $concat: [process.env.IMAGE_LOCAL_PATH, "$image"] },
                                            else: { $concat: [process.env.IMAGE_LOCAL_PATH, "no_image.png"] },
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'serviceData'
                    }
                },
                {
                    $unwind: {
                        path: '$serviceData',
                        preserveNullAndEmptyArrays: true,
                    }
                },
                {
                    $lookup: {
                        from: 'pets',
                        let: {
                            addr: '$pet_type_id'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$_id', '$$addr'] }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    status: 1,
                                    image: {
                                        $cond: {
                                            if: { "$ne": ["$image", null] },
                                            then: { $concat: [process.env.IMAGE_LOCAL_PATH, "$image"] },
                                            else: { $concat: [process.env.IMAGE_LOCAL_PATH, "no_image.png"] },
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'serviceData.petsData'
                    }
                },
                {
                    $unwind: {
                        path: '$serviceData.petsData',
                        preserveNullAndEmptyArrays: true,
                    }
                },
                {
                    $group: {
                        _id: '$serviceData._id',
                        "pet_type_id": { $first: '$pet_type_id' },
                        "pet_name": { $first: '$serviceData.petsData.name' },
                        "pet_status": { $first: '$serviceData.petsData.status' },
                        "pet_image": { $first: '$serviceData.petsData.image' },
                        "service_name": { $first: '$serviceData.name' },
                        "service_status": { $first: '$serviceData.status' },
                        "service_image": { $first: '$serviceData.image' },
                        "createdAt": { $first: '$createdAt' },
                        "updatedAt": { $first: '$updatedAt' },
                        subserviceData: {
                            $push: {
                                name: "$name",
                                status: "$status",
                                createdAt: "$createdAt",
                                price: "$price",
                                time: "$time",
                                sub_service_id: "$_id",
                            }
                        },
                    }
                },
            ])


            // Executing query
            const results = await query;

            let flag = 0

            if ((total % limit) > 0) {
                flag = parseInt((total / limit)) + 1;
            } else {
                flag = (total / limit)
            }

            // Pagination result

            let paginateme = {
                "totalDocs": total,
                "limit": limit,
                "page": page,
                "totalPages": flag,
                "pagingCounter": page,
                "hasPrevPage": false,
                "hasNextPage": false,
                "prevPage": 0,
                "nextPage": 0
            }

            if (endIndex < total) {
                paginateme.hasNextPage = true
                paginateme.nextPage = page + 1
            }

            if (startIndex > 0) {
                paginateme.hasPrevPage = true
                paginateme.prevPage = page - 1
            }


            let responseCreate = {
                data: results,
                count: results.length,
                ...paginateme,
            }

            return res.json(responseData("GET_LIST", responseCreate, req, true));

        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },

    calculate_and_send: async (req, res) => {
        try {

            let {
                booking_id,
                add_on_service_link,
                user_id,
                // service_provider_id
            } = req.body

            let service_provider_id = req.user._id

            let bookingExist = await Bookingbeta.findOne({
                _id: ObjectId(booking_id),
                user_id: ObjectId(user_id),
                service_provider_id: ObjectId(service_provider_id),
                booking_status: 'ongoing'
                //check_me_more_filter
            })

            if (!bookingExist) {
                return res.json(responseData("BOOKING_NOT_EXIST", {}, req, false));
            }

            let array_me = []

            add_on_service_link.forEach(user_pet_index => {
                user_pet_index.services.forEach(service_index => {
                    service_index.sub_service.forEach(sub_index => {
                        array_me.push({
                            "user_pet_id": user_pet_index.user_pet_id,
                            "service_type_id": service_index.service_id,
                            "sub_service_type_id": sub_index.sub_service_id
                        })
                    })
                })
            })

            let time_start_appointment = bookingExist.time_end_appointment
            let date_of_appointment = bookingExist.date_of_appointment

            let data_array = [];
            let admin_amount = 0;
            let time_it_take = 0;
            let price = 0;
            let message = "";

            async.eachSeries(array_me, (item, callbackone) => {
                let objData = {}
                async.parallel({
                    UserPetData: function (callback) {
                        Userpet
                            .findById({ _id: ObjectId(item.user_pet_id) })
                            .populate({
                                path: 'pet_type_id',
                                select: 'name',
                            })
                            .then(userPetData => {

                                callback(null, userPetData)
                            })
                            .catch(err => {
                                callback(err)
                            })
                    },
                    ServiceData: function (callback) {

                        Service.findById({ _id: ObjectId(item.service_type_id) })
                            .then(serviceData => {
                                callback(null, serviceData)
                            })
                            .catch(err => {
                                callback(err)
                            })
                    },
                    SubServiceData: function (callback) {
                        SubService.findById({ _id: ObjectId(item.sub_service_type_id) })
                            .then(subServiceData => {
                                callback(null, subServiceData)
                            })
                            .catch(err => {
                                callback(err)
                            })
                    }
                }, function (err, results) {

                    if (err) {
                        return res.json(responseData("ERROR_OCCUR", err, req, false));
                    }

                    // results now equals to: { task1: 1, task2: 2 }

                    //Our number.
                    let subserviceprice = results.SubServiceData.price;
                    let percentToGet = results.SubServiceData.admin_commission;
                    let percent_amount = (percentToGet / 100) * subserviceprice;

                    // admin_amount = admin_amount + percent_amount
                    time_it_take = time_it_take + results.SubServiceData.time
                    // price = price + results.SubServiceData.price

                    objData = {
                        user_pet_id: results.UserPetData._id,
                        user_pet_name: results.UserPetData.name,
                        breed_name: results.UserPetData.name,
                        pet_type_id: results.UserPetData.pet_type_id._id,
                        pet_type_name: results.UserPetData.pet_type_id.name,
                        service_type_id: results.ServiceData._id,
                        service_name: results.ServiceData.name,
                        sub_service_type_id: results.SubServiceData._id,
                        sub_service_name: results.SubServiceData.name,
                        price: results.SubServiceData.price,
                        time: results.SubServiceData.time,
                        admin_amount: percent_amount,
                        admin_percentage: results.SubServiceData.admin_commission
                    }

                    data_array.push(objData)

                    callbackone(null)
                });

            }, async (error) => {

                if (error) {
                    return res.json(responseData("ERROR_OCCUR", error.message, req, false));
                }

                if (!time_it_take) {
                    return res.json(responseData("TIME_TAKEN_EMPTY", {}, req, false));
                }

                let time_end_appointment = new Date(new Date(time_start_appointment).getTime() + time_it_take * 60000)//#check_me time_it_take

                if (array_me.length <= 0) {
                    return res.json(responseData("PLEASE_ADD_SERVICES", {}, req, false));
                }

                const fromDate = new Date(moment(new Date(date_of_appointment)).utc().startOf('day'))
                const endDate = new Date(moment(new Date(date_of_appointment)).utc().endOf("day"))
                const day_me = moment(time_start_appointment).format('dddd').toLowerCase()

                let appoint_start = moment(time_start_appointment).utc().format("HH:mm:ss")
                let appoint_end = moment(time_end_appointment).utc().format("HH:mm:ss")

                let ProviderExist = await Provider.aggregate([
                    {
                        $match: {
                            _id: ObjectId(service_provider_id),
                            is_mobile_verified: 0,//#check_me_change will be 1
                            status: "active",
                            is_deleted: 0,
                            time_slots: {
                                $elemMatch: {
                                    "day": day_me,
                                    "start_time": {
                                        "$lte": `${appoint_start}`
                                    },
                                    "end_time": {
                                        "$gte": `${appoint_start}`
                                    },
                                    "end_time": {
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
                                        $and: [
                                            { $expr: { $eq: ['$service_provider_id', '$$addr'] } },
                                            { $expr: { $eq: [true, '$is_paid'] } },
                                            {
                                                $or: [
                                                    { $expr: { $eq: ['upcoming', '$booking_status'] } },
                                                    { $expr: { $eq: ['ongoing', '$booking_status'] } }
                                                ]
                                            },
                                            {
                                                $and: [
                                                    { $expr: { $lte: [fromDate, "$date_of_appointment"] }, },
                                                    { $expr: { $gte: [endDate, "$date_of_appointment"] } },
                                                ]
                                            },
                                            { $expr: { $eq: [false, '$is_cancel'] }, },
                                            {
                                                $or: [
                                                    {
                                                        $and: [
                                                            { $expr: { $gt: [time_start_appointment, "$time_start_appointment"] }, },//start
                                                            { $expr: { $lt: [time_start_appointment, "$time_end_appointment"] } },//start
                                                        ]
                                                    },
                                                    {
                                                        $and: [
                                                            { $expr: { $lt: [time_end_appointment, "$time_end_appointment"] } },
                                                            { $expr: { $gt: [time_end_appointment, "$time_start_appointment"] } },
                                                        ]
                                                    },
                                                    {
                                                        $and: [
                                                            { $expr: { $lt: [time_start_appointment, "$time_start_appointment"] } },//start
                                                            { $expr: { $gt: [time_end_appointment, "$time_end_appointment"] } },
                                                        ]
                                                    }
                                                ]
                                            }
                                        ],
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        booking_code: 1,
                                        date_of_appointment: 1,
                                        time_start_appointment: 1,
                                        time_end_appointment: 1,
                                        service_provider_id: 1
                                    }
                                }
                            ],
                            as: 'bookingbetasData'
                        }
                    },
                    {
                        $project: {
                            "_id": 1,
                            "name": 1,
                            "location": 1,
                            "farFromMe": 1,
                            "bookingbetasData": 1,
                            "bookingCount": { $size: "$bookingbetasData" },
                        }
                    },
                    {
                        $match: {
                            "bookingCount": 0
                        }
                    },
                ])

                if (!ProviderExist[0]) {
                    return res.json(responseData("PROVIDER_IS_NOT_FREE", {}, req, false));
                }

                // time_it_take = time_it_take + bookingExist.time_it_take
                time_it_take = time_it_take + bookingExist.time_it_take

                let total_amount = price + bookingExist.total_amount

                await Bookingbeta.findByIdAndUpdate({
                    _id: ObjectId(booking_id)
                },
                    {
                        $set: {
                            is_addon_has: true
                        }
                    })

                let objectLink = data_array.map(i => {
                    return {
                        user_pet_id: i.user_pet_id,
                        user_pet_name: i.user_pet_name,
                        pet_type_id: i.pet_type_id,
                        pet_type_name: i.pet_type_name,
                        breed_name: i.breed_name,
                        service_type_id: i.service_type_id,
                        service_name: i.service_name,
                        sub_service_type_id: i.sub_service_type_id,
                        sub_service_name: i.sub_service_name,
                        price: i.price,
                        time: i.time,
                        booking_id: ObjectId(booking_id),
                        is_addon: true,
                        admin_commission: i.admin_amount,
                        admin_percentage: i.admin_percentage,
                        is_accepted: false,
                        is_reject: false
                    }
                })

                await AddonToAdd.insertMany(objectLink)

                //#check_me_fcm|fcm|addon_info

                let queryFcmList = await UserDevice.find({
                    user_id: ObjectId(user_id)
                })

                let registrationToken = queryFcmList.map(i => {
                    return i.fcm_token
                })


                let notifyCreate = await Notification.create({
                    user_id: user_id,
                    service_provider_id: null,
                    user_flag: true,
                    type: 'addon_info',
                    title: 'Add-on service info',
                    message: `Provider ${req.user.name} has suggested addon`,
                    seen: false,
                    item_id: booking_id,
                    item_type: 'booking',
                    sender_id: service_provider_id,
                    sender_type: 'provider'
                })

                await Notification.create({
                    user_id: user_id,
                    service_provider_id: null,
                    user_flag: true,
                    type: 'addon_info',
                    title: 'Add-on service info',
                    message: `Provider ${req.user.name} has suggested addon`,
                    seen: false,
                    item_id: booking_id,
                    item_type: 'booking',
                    sender_id: service_provider_id,
                    sender_type: 'provider',
                    is_admin:true
                })

                if (registrationToken.length > 0) {

                    const messages = {
                        data: {
                            title: 'Add-on service info',
                            body: `Provider ${req.user.name} has suggested addon`,
                            booking_id: booking_id.toString(),
                            sender_id: service_provider_id.toString(),
                            sender_type: "provider",
                            notification_id: notifyCreate._id.toString()
                        },
                        tokens: registrationToken
                    };

                    await firebase_admin.sendMulticast(messages);
                }

                message = "ADDON_SUCCESSFULLY_SENT"

                return res.json(responseData(message, {}, req, true));
            })
        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },

    getRoomId: async (req, res) => {
        try {

            let service_provider_id = req.user._id;

            let {
                booking_id,
                // service_provider_id
            } = req.body

            let room_track = await TrackSocket.findOne({
                booking_id: ObjectId(booking_id),
                service_provider_id: ObjectId(service_provider_id)
            })

            return res.json(responseData("GET_DETAIL", room_track, req, true));

        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },

    accept_waiting_appointment: async (req, res) => {
        try {

            let service_provider_id = req.user._id;
            // let service_provider_id = req.body.service_provider_id;

            let { booking_id, time_slots_id } = req.body

            let bookingExist = await Bookingbeta.findOne({
                _id: ObjectId(booking_id),
                service_provider_id: null,
                is_paid: true,
                is_cancel: false,
                is_sheduled_appointment: false
            })

            if (!bookingExist) {
                return res.json(responseData("BOOKING_NOT_FOUND", {}, req, true));
            }

            let timeSlotQuery = await TimeSlot.findById(time_slots_id)

            if (!timeSlotQuery) {
                return res.json(responseData("TIME_SLOT_NOT_PICK", {}, req, true));
            }

            let h = timeSlotQuery.hour
            let m = timeSlotQuery.minute

            let time_it_take = bookingExist.time_it_take;

            let today = new Date().toISOString().split('T')[0]

            let date_of_appointment = new Date(`${today} ${h}:${m}:00 GMT+0000 (UTC)`);
            let time_start_appointment = date_of_appointment;
            let time_end_appointment = new Date(new Date(time_start_appointment).getTime() + time_it_take * 60000);//#check_me time_it_take

            const fromDate = new Date(moment(new Date(date_of_appointment)).utc().startOf('day'))
            const endDate = new Date(moment(new Date(date_of_appointment)).utc().endOf("day"))
            const day_me = moment(time_start_appointment).format('dddd').toLowerCase()

            let appoint_start = moment(time_start_appointment).utc().format("HH:mm:ss")
            let appoint_end = moment(time_end_appointment).utc().format("HH:mm:ss")

            let ProviderExist = await Provider.aggregate([
                {
                    $match: {
                        _id: ObjectId(service_provider_id),
                        is_mobile_verified: 0,//#check_me_change will be 1
                        status: "active",
                        is_deleted: 0,
                        time_slots: {
                            $elemMatch: {
                                "day": day_me,
                                "start_time": {
                                    "$lte": `${appoint_start}`
                                },
                                "end_time": {
                                    "$gte": `${appoint_start}`
                                },
                                "end_time": {
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
                                    $and: [
                                        { $expr: { $eq: ['$service_provider_id', '$$addr'] } },
                                        { $expr: { $eq: [true, '$is_paid'] } },
                                        {
                                            $or: [
                                                { $expr: { $eq: ['upcoming', '$booking_status'] } },
                                                { $expr: { $eq: ['ongoing', '$booking_status'] } }
                                            ]
                                        },
                                        {
                                            $and: [
                                                { $expr: { $lte: [fromDate, "$date_of_appointment"] }, },
                                                { $expr: { $gte: [endDate, "$date_of_appointment"] } },
                                            ]
                                        },
                                        { $expr: { $eq: [false, '$is_cancel'] }, },
                                        {
                                            $or: [
                                                {
                                                    $and: [
                                                        { $expr: { $gt: [time_start_appointment, "$time_start_appointment"] }, },//start
                                                        { $expr: { $lt: [time_start_appointment, "$time_end_appointment"] } },//start
                                                    ]
                                                },
                                                {
                                                    $and: [
                                                        { $expr: { $lt: [time_end_appointment, "$time_end_appointment"] } },
                                                        { $expr: { $gt: [time_end_appointment, "$time_start_appointment"] } },
                                                    ]
                                                },
                                                {
                                                    $and: [
                                                        { $expr: { $lt: [time_start_appointment, "$time_start_appointment"] } },//start
                                                        { $expr: { $gt: [time_end_appointment, "$time_end_appointment"] } },
                                                    ]
                                                }
                                            ]
                                        }
                                    ],
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    booking_code: 1,
                                    date_of_appointment: 1,
                                    time_start_appointment: 1,
                                    time_end_appointment: 1,
                                    service_provider_id: 1
                                }
                            }
                        ],
                        as: 'bookingbetasData'
                    }
                },
                {
                    $project: {
                        "_id": 1,
                        "name": 1,
                        "location": 1,
                        "farFromMe": 1,
                        "bookingbetasData": 1,
                        "bookingCount": { $size: "$bookingbetasData" },
                    }
                },
                {
                    $match: {
                        "bookingCount": 0
                    }
                },
            ])

            if (!ProviderExist[0]) {
                return res.json(responseData("PROVIDER_IS_NOT_FREE", {}, req, true));
            }

            await Bookingbeta.findOneAndUpdate({
                _id: ObjectId(booking_id),
                service_provider_id: null,
                is_paid: true,
                is_cancel: false,
                is_sheduled_appointment: false
            },
                {
                    $set: {
                        service_provider_id: ObjectId(ProviderExist[0]._id),
                        booking_status: 'upcoming',
                        date_of_appointment,
                        time_start_appointment,
                        time_end_appointment,
                        is_sheduled_appointment: true
                    }
                })

            //#check_me_fcm|fcm|waiting_appointment_accepted
            let queryFcmList = await UserDevice.find({
                user_id: ObjectId(bookingExist.user_id)
            })

            let registrationToken = queryFcmList.map(i => {
                return i.fcm_token
            })

            let notifyCreate = await Notification.create({
                user_id: bookingExist.user_id,
                service_provider_id: null,
                user_flag: true,
                type: 'waiting_appointment_accepted',
                title: 'Provider accepted appointment',
                message: `Provider ${ProviderExist[0].name} has accepted the appointment`,
                seen: false,
                item_id: booking_id,
                item_type: 'booking',
                sender_id: ProviderExist[0]._id,
                sender_type: 'provider'
            })

            await Notification.create({
                user_id: bookingExist.user_id,
                service_provider_id: null,
                user_flag: true,
                type: 'waiting_appointment_accepted',
                title: 'Provider accepted appointment',
                message: `Provider ${ProviderExist[0].name} has accepted the appointment`,
                seen: false,
                item_id: booking_id,
                item_type: 'booking',
                sender_id: ProviderExist[0]._id,
                sender_type: 'provider',
                is_admin:true
            })

            if (registrationToken.length > 0) {

                const messages = {
                    data: {
                        title: 'Provider accepted appointment',
                        body: `Provider ${ProviderExist[0].name} has accepted the appointment`,
                        booking_id: booking_id.toString(),
                        sender_id: ProviderExist[0]._id.toString(),
                        sender_type: "provider",
                        notification_id: notifyCreate._id.toString()
                    },
                    tokens: registrationToken
                };

                await firebase_admin.sendMulticast(messages);
            }

            return res.json(responseData("WAITING_APPOINTMENT_ACCEPTED", {}, req, true));

        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },

    list_sent_addon_status: async (req, res) => {
        try {

            let service_provider_id = req.user._id
            let {
                booking_id,
                // service_provider_id,
            } = req.body

            let matchFilter = {}

            if (!service_provider_id) {
                return res.json(responseData("ERROR_OCCUR", {}, req, false));
            }
            if (service_provider_id) {
                matchFilter.service_provider_id = ObjectId(service_provider_id)
            }

            if (booking_id) {
                let bookingCheck = await Bookingbeta.findById({ _id: ObjectId(booking_id) })
                if (!bookingCheck) {
                    return res.json(responseData("BOOKING_DONT_EXIST", {}, req, false));
                }
                matchFilter._id = ObjectId(booking_id)
            } else {
                return res.json(responseData("BOOKING_ID_EMPTY", {}, req, false));
            }

            let query = await Bookingbeta.aggregate([
                {
                    $match: matchFilter
                },
                {
                    $lookup: {
                        from: 'addontoadds',
                        let: {
                            addr: '$_id'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $and: [//check_me_test|is_addon:false|is_paid:true
                                        { $expr: { $eq: ['$booking_id', '$$addr'] } },
                                        { $expr: { $eq: ['$is_addon', true] } },
                                    ]
                                }

                            },
                            {
                                $project: {
                                    "_id": 1,
                                    "user_pet_name": 1,
                                    "pet_type_id": 1,
                                    "pet_type_name": 1,
                                    "breed_name": 1,
                                    "user_pet_id": 1,
                                    "sub_service_type_id": 1,
                                    "sub_service_name": 1,
                                    "service_type_id": 1,
                                    "service_name": 1,
                                    "price": 1,
                                    "time": 1,
                                    "booking_id": 1,
                                    "is_addon": 1,
                                    "is_accepted": 1,
                                    "is_reject": 1,
                                    "status_of_addon": {
                                        $switch: {
                                            branches: [
                                                {
                                                    case: { $and: [{ $eq: ['$is_accepted', true] }, { $eq: ['$is_reject', false] }] },
                                                    then: "Accepted"
                                                },
                                                {
                                                    case: { $and: [{ $eq: ['$is_accepted', false] }, { $eq: ['$is_reject', true] }] },
                                                    then: "Rejected"
                                                },
                                                {
                                                    case: { $and: [{ $eq: ['$is_accepted', false] }, { $eq: ['$is_reject', false] }] },
                                                    then: "Waiting"
                                                }
                                            ],
                                            default: "Contact admin"
                                        }
                                    },
                                    "payment_status": 1,
                                    "createdAt": 1,
                                    "updatedAt": 1
                                }
                            },
                            {
                                $group: {
                                    "_id": {
                                        "user_pet_id": "$user_pet_id",
                                        "service_type_id": "$service_type_id"
                                    },
                                    user_pet_name: { $first: '$user_pet_name' },
                                    pet_type_name: { $first: '$pet_type_name' },
                                    service_name: { $first: '$service_name' },
                                    subServiceData: { $push: '$$ROOT' }
                                }
                            },
                            {
                                $project: {
                                    user_pet_id: "$_id.user_pet_id",
                                    service_type_id: "$_id.service_type_id",
                                    _id: 0,
                                    user_pet_name: 1,
                                    pet_type_name: 1,
                                    service_name: 1,
                                    subServiceData: 1
                                }
                            },
                            {
                                $group: {
                                    _id: '$user_pet_id',
                                    user_pet_name: { $first: '$user_pet_name' },
                                    services: { $push: "$$ROOT" }
                                }
                            }
                        ],
                        as: 'serviceData'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        user_id: 1,
                        service_provider_id: 1,
                        address_id: 1,
                        address: 1,
                        city: 1,
                        state: 1,
                        zipcode: 1,
                        location: 1,
                        booking_code: 1,
                        special_note: 1,
                        person_name: 1,
                        person_contact: 1,
                        promo_code: 1,
                        is_sheduled_appointment: 1,
                        date_of_appointment: 1,
                        time_start_appointment: 1,
                        time_end_appointment: 1,
                        booking_completed_date: 1,
                        service_amount: 1,
                        add_on_service_amount: 1,
                        total_amount: 1,
                        payment_method: 1,
                        payment_status: 1,
                        booking_status: 1,
                        is_addon_paid: 1,
                        is_addon_payment_status: 1,
                        invoice: 1,
                        pet_before_image: 1,
                        pet_after_image: 1,
                        cancel_appointment_time: 1,
                        refund_threshold_time: 1,
                        cancel_till: 1,
                        refund: 1,
                        is_cancel: 1,
                        is_paid: 1,
                        is_refund: 1,
                        is_addon_paid: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        farFromMe: 1,
                        serviceData: 1
                    }
                },
                {
                    $unwind: {
                        path: '$serviceData',
                        preserveNullAndEmptyArrays: true,
                    }
                },
                {
                    $lookup: {
                        from: 'userpets',
                        let: {
                            addr: '$serviceData._id'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$_id', '$$addr'] }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    "user_id": 1,
                                    "pet_type_id": 1,
                                    "breed_name": 1,
                                    "image": {
                                        $cond: {
                                            if: { "$ne": ["$profile_pic", null] },
                                            then: { $concat: [process.env.IMAGE_LOCAL_PATH, "$image"] },
                                            else: { $concat: [process.env.IMAGE_LOCAL_PATH, "no_image.png"] },
                                        }
                                    },
                                    "gender": 1,
                                    "name": 1,
                                    "weight": 1,
                                    "size": 1,
                                }
                            }
                        ],
                        as: 'serviceData.userPetsData'
                    }
                },
                {
                    $unwind: {
                        path: '$serviceData.userPetsData',
                        preserveNullAndEmptyArrays: true,
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        let: {
                            addr: '$user_id'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: { $eq: ['$_id', '$$addr'] }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    mobile: 1,
                                    profile_pic: {
                                        $cond: {
                                            if: { "$ne": ["$profile_pic", null] },
                                            then: { $concat: [process.env.IMAGE_LOCAL_PATH, "$profile_pic"] },
                                            else: { $concat: [process.env.IMAGE_LOCAL_PATH, "no_image.png"] },
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'userData'
                    }
                },
                {
                    $unwind: {
                        path: '$userData',
                        preserveNullAndEmptyArrays: true,
                    }
                },
                {
                    $group: {
                        _id: '$_id',
                        // user_id: { $first: '$user_id' },
                        // service_provider_id: { $first: '$service_provider_id' },
                        // address: { $first: '$address' },
                        // city: { $first: '$city' },
                        // state: { $first: '$state' },
                        // zipcode: { $first: '$zipcode' },
                        // location: { $first: '$location' },
                        // booking_code: { $first: '$booking_code' },
                        // special_note: { $first: '$special_note' },
                        // person_name: { $first: '$person_name' },
                        // promo_code: { $first: '$promo_code' },
                        // is_sheduled_appointment: { $first: '$is_sheduled_appointment' },
                        // date_of_appointment: { $first: '$date_of_appointment' },
                        // booking_completed_date: { $first: '$booking_completed_date' },
                        // service_amount: { $first: '$service_amount' },
                        // add_on_service_amount: { $first: '$add_on_service_amount' },
                        // total_amount: { $first: '$total_amount' },
                        // payment_method: { $first: '$payment_method' },
                        // payment_status: { $first: '$payment_status' },
                        // booking_status: { $first: '$booking_status' },
                        // is_addon_paid: { $first: '$is_addon_paid' },
                        // is_addon_payment_status: { $first: '$is_addon_payment_status' },
                        // invoice: { $first: '$invoice' },
                        // pet_before_image: { $first: '$pet_before_image' },
                        // pet_after_image: { $first: '$pet_after_image' },
                        // cancel_appointment_time: { $first: '$cancel_appointment_time' },
                        // refund_threshold_time: { $first: '$refund_threshold_time' },
                        // cancel_till: { $first: '$cancel_till' },
                        // refund: { $first: '$refund' },
                        // is_cancel: { $first: '$is_cancel' },
                        // is_paid: { $first: '$is_paid' },
                        // is_refund: { $first: '$is_refund' },
                        // is_rating_by_user: { $first: '$is_rating_by_user' },
                        // is_rating_by_provider: { $first: '$is_rating_by_provider' },
                        // createdAt: { $first: '$createdAt' },
                        // updatedAt: { $first: '$updatedAt' },
                        // userData: { $first: '$userData' },
                        // time_end_appointment: { $first: '$time_end_appointment' },
                        // time_start_appointment: { $first: '$time_start_appointment' },
                        // time_it_take: { $first: '$time_it_take' },
                        // serviceprovidersData:{$first:'$serviceprovidersData'},
                        serviceData: { $push: '$serviceData' }
                    }
                },
            ])


            let responseCreate = {
                data: query[0],
            }



            return res.json(responseData("GET_DETAIL", responseCreate, req, true));

        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
}