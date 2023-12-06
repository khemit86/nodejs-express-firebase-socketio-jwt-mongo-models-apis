const { responseData } = require("../../helpers/responseData");
const rating_service = require('../../services/users/rating.services')
module.exports = {
    
    list_rating: async (req, res) => {
        try {
            await rating_service.list_rating(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    add_rating: async (req, res) => {
        try {
            await rating_service.add_rating(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    delete_rating: async (req, res) => {
        try {
            await rating_service.delete_rating(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    productRating: async (req, res) => {
        try {
            await rating_service.productRating(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    editRating: async (req, res) => {
        try {
            await rating_service.editRating(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    }

    
}