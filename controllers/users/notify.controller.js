const { responseData } = require("../../helpers/responseData");
const rating_service = require('../../services/users/notify.services')
module.exports = {
    
    addNotify: async (req, res) => {
        try {
            await rating_service.addNotify(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    }
}