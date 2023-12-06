const { responseData } = require("../../helpers/responseData");
const ws_business_type_service = require('../../services/admins/ws_business_type.services')
module.exports = {
    
    add_ws_business_type: async (req, res) => {
        try {
            await ws_business_type_service.add_ws_business_type(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    delete_ws_business_type: async (req, res) => {
        try {
            await ws_business_type_service.delete_ws_business_type(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    list_ws_business_type: async (req, res) => {
        try {
            await ws_business_type_service.list_ws_business_type(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    edit_ws_business_type: async (req, res) => {
        try {
            await ws_business_type_service.edit_ws_business_type(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    change_status_ws_business_type: async (req, res) => {
        try {
            await ws_business_type_service.change_status_ws_business_type(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    }
}