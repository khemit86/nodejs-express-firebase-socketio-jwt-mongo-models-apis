const status = require("http-status");
const { responseData } = require("../../helpers/responseData");
const user_service = require('../../services/admins/user.services')
module.exports = {
    adminUserList: async (req, res) => {
        try {
            await user_service.adminUserList(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    allUserList: async (req, res) => {
        try {
            await user_service.allUserList(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    allUsers: async (req, res) => {
        try {
            await user_service.allUsers(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    topUsers: async (req, res) => {
        try {
            await user_service.topUsers(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    addAdminUser: async (req, res) => {
        try {
            await user_service.addAdminUser(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    editAdminUser: async (req, res) => {
        try {
            await user_service.editAdminUser(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    deleteUser: async (req, res) => {
        try {
            await user_service.deleteUser(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    userChangeStatus: async (req, res) => {
        try {
            await user_service.userChangeStatus(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    changeMinimumOrderAmount: async (req, res) => {
        try {
            await user_service.changeMinimumOrderAmount(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    getOneUser: async (req, res) => {
        try {
            await user_service.getOneUser(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    export_data: async (req, res) => {
        try {
            await user_service.export_data(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
}