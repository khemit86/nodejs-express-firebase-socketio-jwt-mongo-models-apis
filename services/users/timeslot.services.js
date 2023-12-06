const Timeslot = require("../../models/timeslot.model");
var { isEmpty } = require("lodash")
const { responseData } = require("../../helpers/responseData");
const mongoose = require('mongoose')
const { ObjectId } = require('mongodb');

module.exports = {
    getOne: async (req, res) => {
        try {

            const { id } = req.params

            const Query = await Timeslot.findById({
                _id:ObjectId(id)
            })
            

            return res.json(responseData("FIND_SUCCESSFULLY", Query, req, true));
            
        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
    getList: async (req, res) => {
        try {

            const Query = await Timeslot.find({}).sort({hour:1,minute:1})
            

            return res.json(responseData("GET_LIST", Query, req, true));
            
        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
}