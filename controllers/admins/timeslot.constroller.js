const { responseData } = require("../../helpers/responseData");
const timeslot_service = require('../../services/admins/timeslot.service')
module.exports = {
    add_timeslot: async (req, res) => {
        try {
            await timeslot_service.create(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    update_timeslot: async (req, res) => {
        try {
            await timeslot_service.update(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    getOne_timeslot: async (req, res) => {
        try {
            await timeslot_service.getOne(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    getList_timeslot: async (req, res) => {
        try {
            await timeslot_service.getList(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
}