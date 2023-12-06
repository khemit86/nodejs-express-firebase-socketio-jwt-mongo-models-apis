const { responseData } = require("../../helpers/responseData");
const email_service = require('../../services/admins/emailtemplate.services')
module.exports = {
    
    add_email: async (req, res) => {
        try {
            await email_service.add_email(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    delete_email: async (req, res) => {
        try {
            await email_service.delete_email(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    list_email: async (req, res) => {
        try {
            await email_service.list_email(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    edit_email: async (req, res) => {
        try {
            await email_service.edit_email(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    change_status_email: async (req, res) => {
        try {
            await email_service.change_status_email(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    }
}