const User = require("../../models/user.model");
const Service = require("../../models/service.model");
const SubService = require("../../models/subservice.model");
const { responseData } = require("../../helpers/responseData");
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');

module.exports = {
    list: async (req, res) => {
        try {

            let {
                pet_type_id
            } = req.query

            // Pagination
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;

            const queryResolve = await Service.aggregate([
                {
                    $match: {
                        pet_type_id:ObjectId(pet_type_id),
                        status:1
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
                                    $expr: { $eq: [ '$_id', '$$addr'] }
                                }
                            },
                            {
                                $project:{
                                    _id:1,
                                    name:1,
                                    status:1,
                                    image:{ 
                                        $cond: { 
                                            if: { "$ne": [ "$image", null ] }, 
                                            then: { $concat: [ process.env.IMAGE_LOCAL_PATH, "$image" ] },
                                            else: { $concat: [ process.env.IMAGE_LOCAL_PATH, "no_image.png" ] }, 
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'petsData'
                    }
                },
                {
                    $unwind:{
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
                                    $expr: { $eq: [ '$service_type_id', '$$addr'] }
                                }
                            },
                            {
                                $project:{
                                    _id:1,
                                    name:1
                                }
                            }
                        ],
                        as: 'subservicesData'
                    }
                },
                {
                    $project:{
                        subservicesData_count:{$size:"$subservicesData"},
                        _id:1,
                        pet_type_id:1,
                        name: 1,
                        image: 1,
                        status: 1,
                        __v: 1,
                        createdAt:1,
                        updatedAt: 1,
                        petsData:1,
                    }
                },
                {
                    $match:{
                        subservicesData_count : { $ne : 0}
                    }
                },
                { 
                    $group: {
                        _id: '$petsData._id',
                        "pet_type_id": {$first:'$pet_type_id'},
                        "pet_name":{$first:'$petsData.name'},
                        "pet_status":{$first:'$petsData.status'},
                        "pet_image":{$first:'$petsData.image'},
                        // subservicesData:1,
                        // foo_count:{$size:"$subservicesData"},
                        serviceData:{$push: {
                            name:"$name",
                            status:"$status",
                            createdAt:"$createdAt",
                            price:"$price",
                            time:"$time",
                            service_id:"$_id",
                            image:{ 
                                $cond: { 
                                    if: { "$ne": [ "$image", null ] }, 
                                    then: { $concat: [ process.env.IMAGE_LOCAL_PATH, "$image" ] },
                                    else: { $concat: [ process.env.IMAGE_LOCAL_PATH, "no_image.png" ] }, 
                                }
                            }
                        }},
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
                    $unwind:{
                        path: '$totalCount',
                        preserveNullAndEmptyArrays: true,
                        },
                },
                {
                    $project:{
                        paginatedResults:"$paginatedResults",
                        total:
                            {
                                $cond: [ { $gte: [ "$totalCount.count", 0 ] }, "$totalCount.count", 0 ]
                            }
                    }
                },
            ])


            let total = queryResolve[0].total

            let flag = 0
            
            if((total % limit)>0) {
                flag = parseInt((total / limit)) + 1;
            }else{
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
                data:queryResolve[0].paginatedResults,
                count:queryResolve[0].paginatedResults.length,
                ...paginateme,
            }



            return res.json(responseData("GET_LIST", responseCreate, req, true));

        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
    list_sub: async (req, res) => {
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
                service_type_id:ObjectId(service_type_id),
                status:1 
            });

            query = SubService.aggregate([
                {
                    $match: {
                        service_type_id:ObjectId(service_type_id),
                        status:1
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
                                    $expr: { $eq: [ '$_id', '$$addr'] }
                                }
                            },
                            {
                                $project:{
                                    _id:1,
                                    name:1,
                                    status:1,
                                    image:{ 
                                        $cond: { 
                                            if: { "$ne": [ "$image", null ] }, 
                                            then: { $concat: [ process.env.IMAGE_LOCAL_PATH, "$image" ] },
                                            else: { $concat: [ process.env.IMAGE_LOCAL_PATH, "no_image.png" ] }, 
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'serviceData'
                    }
                },
                {
                    $unwind:{
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
                                    $expr: { $eq: [ '$_id', '$$addr'] }
                                }
                            },
                            {
                                $project:{
                                    _id:1,
                                    name:1,
                                    status:1,
                                    image:{ 
                                        $cond: { 
                                            if: { "$ne": [ "$image", null ] }, 
                                            then: { $concat: [ process.env.IMAGE_LOCAL_PATH, "$image" ] },
                                            else: { $concat: [ process.env.IMAGE_LOCAL_PATH, "no_image.png" ] }, 
                                        }
                                    }
                                }
                            }
                        ],
                        as: 'serviceData.petsData'
                    }
                },
                {
                    $unwind:{
                        path: '$serviceData.petsData',
                        preserveNullAndEmptyArrays: true,
                    }
                },
                { 
                    $group: {
                        _id: '$serviceData._id',
                        "pet_type_id": {$first:'$pet_type_id'},
                        "pet_name":{$first:'$serviceData.petsData.name'},
                        "pet_status":{$first:'$serviceData.petsData.status'},
                        "pet_image":{$first:'$serviceData.petsData.image'},
                        "service_name": {$first:'$serviceData.name'},
                        "service_status": {$first:'$serviceData.status'},
                        "service_image": {$first:'$serviceData.image'},
                        "createdAt": {$first:'$createdAt'},
                        "updatedAt": {$first:'$updatedAt'},
                        subserviceData:{$push: {
                            name:"$name",
                            status:"$status",
                            createdAt:"$createdAt",
                            price:"$price",
                            time:"$time",
                            sub_service_id:"$_id"
                        }},
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
}