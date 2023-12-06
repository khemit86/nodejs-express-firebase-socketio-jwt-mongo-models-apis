const { responseData } = require("../../helpers/responseData");
const earning_service = require('../../services/admins/earning.services')

module.exports = {
    add_earning: async (req, res) => {
        try {
            await earning_service.add_earning(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    list_earning: async (req, res) => {
        try {
            await earning_service.list(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    detail_earning: async (req, res) => {
        try {
            await earning_service.detail(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    to_csv: async (req, res) => {
        try {
            await earning_service.earning_to_csv(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
}