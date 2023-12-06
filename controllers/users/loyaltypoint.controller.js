const loyaltypoint_service = require('../../services/users/loyaltypoint.services')
const status = require("http-status");
const { responseData } = require("../../helpers/responseData");
module.exports = {
    list: async (req, res) => {
        try {
            await loyaltypoint_service.list(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    add: async (req, res) => {
        try {
            await loyaltypoint_service.add(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },    
}