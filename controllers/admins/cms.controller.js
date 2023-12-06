const { responseData } = require("../../helpers/responseData");
const cms_service = require('../../services/admins/cms.services')
module.exports = {
    
    add_cms: async (req, res) => {
        try {
            await cms_service.add_cms(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    delete_cms: async (req, res) => {
        try {
            await cms_service.delete_cms(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    list_cms: async (req, res) => {
        try {
            await cms_service.list_cms(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    edit_cms: async (req, res) => {
        try {
            await cms_service.edit_cms(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    change_status_cms: async (req, res) => {
        try {
            await cms_service.change_status_cms(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    }
}