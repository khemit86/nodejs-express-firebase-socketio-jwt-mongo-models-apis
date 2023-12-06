const notification_service = require('../../services/users/notification.services')
const status = require("http-status");
const { responseData } = require("../../helpers/responseData");
module.exports = {
    list_notification: async (req, res) => {
        try {
            await notification_service.list_notification(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    notificationRead: async (req, res) => {
        try {
            //console.log('notificationRead');
            await notification_service.notificationRead(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    notificationDelete: async (req, res) => {
        try {
            //console.log('notificationDelete');
            await notification_service.notificationDelete(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },

    
}