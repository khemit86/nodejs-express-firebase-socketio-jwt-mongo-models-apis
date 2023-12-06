const User = require("../../models/user.model");
const Provider = require("../../models/serviceprovider.model");
const Transaction = require("../../models/transaction.model");
const Bookingbeta = require("../../models/bookingbeta.model");
const { responseData } = require("../../helpers/responseData");
const fs = require('fs');
const path = require('path');
const {ObjectId} = require('mongodb');

module.exports = {
    create: async (req,res) => {
        try {
            const {
                transaction_code,
                booking_id,
                mode_of_payment,
                payment_status,
                service_provider_id,
                to,
                amount,
                refund,
                date_of_payment,
            } = req.body;

            const user_id = req.user._id

            let CheckBookingExist = await Bookingbeta.findById(booking_id)
            if(!CheckBookingExist){
                return res.json(responseData("BOOKING_DONT_EXIST", {}, req, false));
            }

            let CheckProviderExist = await Provider.findById(service_provider_id)
            if(!CheckProviderExist){
                return res.json(responseData("PROVIDER_DONT_EXIST", {}, req, false));
            }

            const create_transaction = await Transaction.create({
                transaction_code,
                booking_id,
                mode_of_payment,
                payment_status,
                user_id,
                service_provider_id,
                to,
                amount,
                refund,
                date_of_payment:new Date(date_of_payment),
            })

            return res.json(responseData("TRANSACTION_CREATED", create_transaction, req, true));
            
        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
    list: async (req,res) => {
        try {

            let user_id  = req.user._id

            let query;
            
            // Pagination
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const total = await Transaction.countDocuments({user_id:ObjectId(user_id)});

            query = Transaction.aggregate([
                {
                    $match:{
                        user_id:ObjectId(user_id)
                    }
                },
                {
                    $sort:{ "createdAt":-1 }
                },
                {
                    $skip: startIndex
                },
                {
                    $limit:limit
                },
                {
                    $lookup:{
                        from: "serviceproviders",
                        localField: "service_provider_id",
                        foreignField: "_id",
                        as:"ServiceProviderData"
                    }
                },
                {
                    $unwind:{
                        path: '$ServiceProviderData',
                        preserveNullAndEmptyArrays: true,
                      },
                },
                {
                    $project:{
                        "_id": "$_id",
                        "transaction_code": "$transaction_code",
                        "booking_id": "$booking_id",
                        "mode_of_payment": "$mode_of_payment",
                        "payment_status": "$payment_status",
                        "user_id": "$user_id",
                        "service_provider_id": "$service_provider_id",
                        "to": "$to",
                        "amount": "$amount",
                        "refund": "$refund",
                        "date_of_payment": "$date_of_payment",
                        "createdAt": "$createdAt",
                        "updatedAt": "$updatedAt",
                        "ServiceProviderName":"$ServiceProviderData.name"
                    }
                }

            ])
            

            // Executing query
            const results = await query;

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
                data: results,
                count: results.length,
                balance: req.user.balance,
                ...paginateme,
            }



            return res.json(responseData("TRANSACTION_LIST", responseCreate, req, true));
            
        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },

    status_success: async (req,res) => {
        try {
            const {
                transaction_id,
            } = req.body;

            const user_id = req.user._id 

            let CheckTransactionExist = await Transaction.findById(transaction_id)
            if(!CheckTransactionExist){
                return res.json(responseData("TRANSACTION_DONT_EXIST", {}, req, false));
            }

            if(CheckTransactionExist.payment_status == 'refunded'){
                return res.json(responseData("TRANSACTION_CANT_SUCCESS_COZ_REFUND", {}, req, false));
            }

            if(CheckTransactionExist.payment_status == 'success'){
                return res.json(responseData("TRANSACTION_ALREADY_SUCCESS", {}, req, false));
            }


            await Transaction.findByIdAndUpdate({
                _id:ObjectId(transaction_id),
                user_id:ObjectId(user_id)
            },
            {
                $set:{
                    payment_status:"success"
                }
            })

            await User.findByIdAndUpdate({
                _id:ObjectId(user_id)
            },
            { 
                $inc : { "balance" : CheckTransactionExist.amount } 
            });
            
            const get_transaction = await Transaction.findOne({_id:ObjectId(transaction_id),user_id:ObjectId(user_id)})

            return res.json(responseData("TRANSACTION_SUCCEDED", get_transaction, req, true));
            
        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
    status_failed: async (req,res) => {
        try {
            const {
                transaction_id,
               
            } = req.body;

            const user_id = req.user._id 

            let CheckTransactionExist = await Transaction.findById(transaction_id)
            if(!CheckTransactionExist){
                return res.json(responseData("TRANSACTION_DONT_EXIST", {}, req, false));
            }


            if(CheckTransactionExist.payment_status == 'refunded'){
                return res.json(responseData("TRANSACTION_CANT_FAIL_COZ_REFUND", {}, req, false));
            }

            if(CheckTransactionExist.payment_status == 'success'){
                return res.json(responseData("TRANSACTION_IS_SUCCESS", {}, req, false));
            }


            await Transaction.findByIdAndUpdate({
                _id:ObjectId(transaction_id),
                user_id:ObjectId(user_id)
            },
            {
                $set:{
                    payment_status:"failed"
                }
            })

            
            const get_transaction = await Transaction.findOne({_id:ObjectId(transaction_id),user_id:ObjectId(user_id)})

            return res.json(responseData("TRANSACTION_STATUS_FAILED", get_transaction, req, true));
            
        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
    refund_me: async (req,res) => {
        try {
            const {
                transaction_id,
            } = req.body;

            const user_id = req.user._id 

            let CheckTransactionExist = await Transaction.findById(transaction_id)
            if(!CheckTransactionExist){
                return res.json(responseData("TRANSACTION_DONT_EXIST", {}, req, false));
            }
            
            if(CheckTransactionExist.payment_status == 'refunded'){
                return res.json(responseData("TRANSACTION_ALREADY_REFUNDED", {}, req, false));
            }

            if(CheckTransactionExist.payment_status != 'success'){
                return res.json(responseData("TRANSACTION_IS_NOT_SUCCESS", {}, req, false));
            }


            await Transaction.findByIdAndUpdate({
                _id:ObjectId(transaction_id),
                user_id:ObjectId(user_id)
            },
            {
                $set:{
                    payment_status:"refunded",
                    refund_time:new Date(),
                    refund:true
                }
            })


            await User.findByIdAndUpdate({
                _id:ObjectId(user_id)
            },
            { 
                $inc : { "balance" : -CheckTransactionExist.amount } 
            });
            
            const get_transaction = await Transaction.findOne({_id:ObjectId(transaction_id),user_id:ObjectId(user_id)})

            return res.json(responseData("TRANSACTION_HAS_REFUNDED", get_transaction, req, true));
            
        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
    
}