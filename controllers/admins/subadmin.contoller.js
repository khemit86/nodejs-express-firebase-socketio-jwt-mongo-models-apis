const status = require("http-status");
const { responseData } = require("../../helpers/responseData");
const subadmin_service = require('../../services/admins/subadmin.services')
module.exports = {
    subadminList: async (req, res) => {
        try {
            await subadmin_service.subadminList(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    add_subadmin: async (req, res) => {
        try {
            await subadmin_service.add_subadmin(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    edit_subadmin: async (req, res) => {
        try {
            await subadmin_service.edit_subadmin(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    delete_subadmin: async (req, res) => {
        try {
            await subadmin_service.delete_subadmin(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    subadminChangeStatus: async (req, res) => {
        try {
            await subadmin_service.subadminChangeStatus(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    permission: async (req, res) => {
        try {
            await subadmin_service.permission(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    logs_list: async (req, res) => {
        try {
            await subadmin_service.logs_list(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    change_password: async (req, res) => {
        try {
            await subadmin_service.change_password(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    }
}