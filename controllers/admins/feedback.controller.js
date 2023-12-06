const { responseData } = require("../../helpers/responseData");
const feedbackService = require('../../services/admins/feedback.services')
module.exports = {
    
    add_feedback: async (req, res) => {
        try {
            await feedbackService.add_feedback(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    list_feedback: async (req, res) => {
        try {
            await feedbackService.list_feedback(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    }
}