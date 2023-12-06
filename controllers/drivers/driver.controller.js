const { responseData } = require("../../helpers/responseData");
const driver_service = require("../../services/drivers/driver.services");
const order_service = require("../../services/users/order.services");

module.exports = {
  driver_login: async (req, res) => {
    try {
      await driver_service.driver_login(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  driver_forgot_password: async (req, res) => {
    try {
      await driver_service.driver_forgot_password(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  change_password: async (req, res) => {
    try {
      await driver_service.change_password(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  get_profile: async (req, res) => {
    try {
      await driver_service.get_profile(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  get_notifications: async (req, res) => {
    try {
      await driver_service.get_notifications(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  update_profile: async (req, res) => {
    try {
      await driver_service.update_profile(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  update_notification: async (req, res) => {
    try {
      await driver_service.update_notification(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  update_availability: async (req, res) => {
    try {
      await driver_service.update_availability(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  change_order_status: async (req, res) => {
    try {
      await order_service.change_order_status(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
};
