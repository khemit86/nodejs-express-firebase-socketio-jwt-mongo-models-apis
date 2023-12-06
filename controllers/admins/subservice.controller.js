const { responseData } = require("../../helpers/responseData");
const subservice = require('../../services/admins/subservice.services')
module.exports = {
    add_subservice: async (req, res) => {
        try {
            await subservice.add_subservice(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    delete_subservice: async (req, res) => {
        try {
            await subservice.delete_subservice(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    list_subservice: async (req, res) => {
        try {
            await subservice.list_subservice(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    edit_subservice: async (req, res) => {
        try {
            await subservice.edit_subservice(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    change_status_subservice: async (req, res) => {
        try {
            await subservice.change_status_subservice(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    }
}