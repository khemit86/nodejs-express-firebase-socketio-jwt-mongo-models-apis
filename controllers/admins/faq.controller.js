const { responseData } = require("../../helpers/responseData");
const faq_service = require('../../services/admins/faq.services')
module.exports = {
    
    add_faq: async (req, res) => {
        try {
            await faq_service.add_faq(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    delete_faq: async (req, res) => {
        try {
            await faq_service.delete_faq(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    list_faq: async (req, res) => {
        try {
            await faq_service.list_faq(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    edit_faq: async (req, res) => {
        try {
            await faq_service.edit_faq(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    change_status_faq: async (req, res) => {
        try {
            await faq_service.change_status_faq(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    }
}