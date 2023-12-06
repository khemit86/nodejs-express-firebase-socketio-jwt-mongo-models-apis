const { responseData } = require("../../helpers/responseData");
const supplier_service = require('../../services/admins/supplier.services')
module.exports = {
    
    add_supplier: async (req, res) => {
        try {
            await supplier_service.add_supplier(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    delete_supplier: async (req, res) => {
        try {
            await supplier_service.delete_supplier(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    list_supplier: async (req, res) => {
        try {
            await supplier_service.list_supplier(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    edit_supplier: async (req, res) => {
        try {
            await supplier_service.edit_supplier(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    change_status_supplier: async (req, res) => {
        try {
            await supplier_service.change_status_supplier(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    }
}