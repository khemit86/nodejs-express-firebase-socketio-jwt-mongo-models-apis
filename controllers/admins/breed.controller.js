const { responseData } = require("../../helpers/responseData");
const breed_service = require('../../services/admins/breed.services')
module.exports = {
    add_breed: async (req, res) => {
        try {
            await breed_service.add_breed(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    delete_breed: async (req, res) => {
        try {
            await breed_service.delete_breed(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    list_breed: async (req, res) => {
        try {
            await breed_service.list_breed(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    edit_breed: async (req, res) => {
        try {
            await breed_service.edit_breed(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    change_status_breed: async (req, res) => {
        try {
            await breed_service.change_status_breed(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
}