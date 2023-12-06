const { responseData } = require("../../helpers/responseData");
const country_service = require('../../services/admins/country.services')
module.exports = {
    
    add_country: async (req, res) => {
        try {
            await country_service.add_country(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    delete_country: async (req, res) => {
        try {
            await country_service.delete_country(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    list_country: async (req, res) => {
        try {
            await country_service.list_country(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    edit_country: async (req, res) => {
        try {
            await country_service.edit_country(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    change_status_country: async (req, res) => {
        try {
            await country_service.change_status_country(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    csv_of_country: async (req, res) => {
        try {
            await country_service.add_country_csv(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
}