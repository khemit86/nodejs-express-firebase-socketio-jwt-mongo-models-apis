const { responseData } = require("../../helpers/responseData");
const city_service = require("../../services/admins/city.services");
module.exports = {
  add_city: async (req, res) => {
    try {
      await city_service.add_city(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  delete_city: async (req, res) => {
    try {
      await city_service.delete_city(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  list_city: async (req, res) => {
    try {
      await city_service.list_city(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  get_cities: async (req, res) => {
    try {
      await city_service.get_cities(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  edit_city: async (req, res) => {
    try {
      await city_service.edit_city(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  change_status_city: async (req, res) => {
    try {
      await city_service.change_status_city(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
};
