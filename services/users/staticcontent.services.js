const Faq = require("../../models/faq.model");
const StaticContent = require('../../models/staticcontent.model');
// const StaticContent = require('../../models/');
const { responseData } = require("../../helpers/responseData");
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');
var nodeBase64 = require('nodejs-base64-converter');

module.exports = {
    getFaqList: async (req, res) => {
        try {

            let query;
            
            // Pagination
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const total = await Faq.countDocuments({status:"active"});

            query = Faq.aggregate([
                {
                    $match:{
                        status:"active"
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
                ...paginateme,
            }



            return res.json(responseData("GET_LIST", responseCreate, req, true));


        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
    getStaticContentDetail:async(req,res) => {
        try{
            const {
                slug
            } = req.query

            let query = await StaticContent.findOne({
                slug:slug,
                status:'active',
            })
            query.content = nodeBase64.decode(query.content)

            return res.json(responseData("GET_DETAIL", query, req, true));

        }catch(error){
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    }
}