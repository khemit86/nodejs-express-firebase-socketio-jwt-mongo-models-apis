const { responseData } = require("../../helpers/responseData");
const category_service = require('../../services/admins/category.services')
module.exports = {
    
    add_category: async (req, res) => {
        try {
            await category_service.add_category(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    delete_category: async (req, res) => {
        try {
            await category_service.delete_category(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    list_category: async (req, res) => {
        try {
            await category_service.list_category(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    home_list_category: async (req, res) => {
        try {
            await category_service.home_list_category(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    search_list_category: async (req, res) => {
        try {
            await category_service.search_list_category(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    edit_category: async (req, res) => {
        try {
            await category_service.edit_category(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    edit_order_category: async (req, res) => {
        try {
            await category_service.edit_order_category(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    change_status_category: async (req, res) => {
        try {
            await category_service.change_status_category(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    }
}