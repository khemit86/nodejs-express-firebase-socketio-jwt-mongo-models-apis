const { responseData } = require("../../helpers/responseData");
const favorite_service = require('../../services/users/favorite.services')
module.exports = {
    
    list_favorite: async (req, res) => {
        try {
            await favorite_service.list_favorite(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    add_favorite: async (req, res) => {
        try {
            await favorite_service.add_favorite(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    delete_favorite: async (req, res) => {
        try {
            await favorite_service.delete_favorite(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },

    
}