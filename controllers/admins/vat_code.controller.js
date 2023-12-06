const { responseData } = require("../../helpers/responseData");
const vat_code_service = require('../../services/admins/vat_code.services')
module.exports = {
    
    add_vat_code: async (req, res) => {
        try {
            await vat_code_service.add_vat_code(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    delete_vat_code: async (req, res) => {
        try {
            await vat_code_service.delete_vat_code(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    list_vat_code: async (req, res) => {
        try {
            await vat_code_service.list_vat_code(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    edit_vat_code: async (req, res) => {
        try {
            await vat_code_service.edit_vat_code(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    change_status_vat_code: async (req, res) => {
        try {
            await vat_code_service.change_status_vat_code(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    }
}