const { responseData } = require("../../helpers/responseData");
const brand_service = require('../../services/admins/brand.services')
module.exports = {
    
    add_brand: async (req, res) => {
        try {
            await brand_service.add_brand(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    delete_brand: async (req, res) => {
        try {
            await brand_service.delete_brand(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    list_brand: async (req, res) => {
        try {
            await brand_service.list_brand(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    edit_brand: async (req, res) => {
        try {
            await brand_service.edit_brand(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    change_status_brand: async (req, res) => {
        try {
            await brand_service.change_status_brand(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    }
}