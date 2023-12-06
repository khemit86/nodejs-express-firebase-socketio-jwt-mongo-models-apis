const status = require("http-status");
const { responseData } = require("../../helpers/responseData");
const driver_service = require("../../services/admins/driver.services");
module.exports = {
  adminUserList: async (req, res) => {
    try {
      await driver_service.adminUserList(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  addAdminUser: async (req, res) => {
    try {
      await driver_service.addAdminUser(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  editAdminUser: async (req, res) => {
    try {
      await driver_service.editAdminUser(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  deleteUser: async (req, res) => {
    try {
      await driver_service.deleteUser(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  userChangeStatus: async (req, res) => {
    try {
      await driver_service.userChangeStatus(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  getOneUser: async (req, res) => {
    try {
      await driver_service.getOneUser(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
};
