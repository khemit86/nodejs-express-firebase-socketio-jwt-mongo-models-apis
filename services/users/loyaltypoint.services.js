const LoyaltyPoint = require("../../models/loyaltypoint.model");
var { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
const _ = require("lodash");
const { Types } = require("mongoose");
const moment = require('moment')

module.exports = {
    list: async (req, res) => {
        try {
            let {
                page,
                limit,
                start_date,
                end_date,
            } = req.query;
            const sortOptions = {
                createdAt: -1,
            };
            const options = {
                page: page || 1,
                limit: 10000,
                sort_by: sortOptions,
            };
            console.log("====> User Id =>>>",req.user._id)
            var match = {
                user_id: Types.ObjectId(req.user._id)
            };

            if (end_date) {
                end_date = moment(end_date).endOf('day')
            }

            if (start_date && end_date) {
                match.createdAt = {
                    $gte: new Date(start_date),
                    $lte: new Date(end_date),
                };
            } else if (start_date && !end_date) {
                match.createdAt = {
                    $gte: new Date(start_date),
                    $lte: new Date(Date.now())
                };
            } else if (!start_date && end_date) {
                match.createdAt = {
                    $lte: new Date(end_date),
                };
            }


            const query = LoyaltyPoint.aggregate([
                {
                    $match: match,
                },
                {
                    $project: {
                        user_id: 1,
                        type: 1,
                        order_id: 1,
                        points: 1,
                        createdAt: 1,
                        // updatedAt: 1,
                        // __v: 1,
                    },
                },
                {
                    $sort: sortOptions,
                },
            ]).collation({ locale: "en", strength: 1 });
            var finaldata = await LoyaltyPoint.aggregatePaginate(query, options);

            var creditedPoint = 0;
            var debitedPoint = 0;
            var creditedNo = 0;
            finaldata?.docs?.forEach(function (item) {
                if (item?.type === 'credited') {
                    creditedPoint += item?.points;
                    creditedNo++;
                } else if (item?.type === 'debited') {
                    debitedPoint += item?.points;
                }
            });
            finaldata.creditedPoint = creditedPoint;
            finaldata.debitedPoint = debitedPoint;
            finaldata.creditNumber = creditedNo;
            finaldata.remainingPoint = creditedPoint - debitedPoint;

            return res.json(responseData("GET_LIST", finaldata, req, true));
        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
    add: async (req, res) => {
        try {
            const { type, user_id, order_id, points } = req.body;
            var { _id } = req.user;
            console.log("_id........",_id);
            const data = {
                type,
                user_id,
                admin_id:_id,
                points
            }
            if (order_id) data.order_id = order_id
            const loyaltypoint = await LoyaltyPoint.create(data)
            return res.json(responseData("LOYALTY_POINT_ADDED", loyaltypoint, req, true));
        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
}