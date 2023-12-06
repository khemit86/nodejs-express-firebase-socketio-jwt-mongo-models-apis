const status = require("http-status");
const { responseData } = require("../../helpers/responseData");
const w_user_service = require("../../services/admins/w_user.services");
module.exports = {
  adminUserList: async (req, res) => {
    try {
      await w_user_service.adminUserList(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  approvalUserList: async (req, res) => {
    try {
      await w_user_service.approvalUserList(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  addAdminUser: async (req, res) => {
    try {
      await w_user_service.addAdminUser(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  editAdminUser: async (req, res) => {
    try {
      await w_user_service.editAdminUser(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  deleteUser: async (req, res) => {
    try {
      await w_user_service.deleteUser(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  userChangeStatus: async (req, res) => {
    try {
      await w_user_service.userChangeStatus(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  userChangeStatusApproval: async (req, res) => {
    try {
      await w_user_service.userChangeStatusApproval(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  userChangeStatusReject: async (req, res) => {
    try {
      await w_user_service.userChangeStatusReject(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  getOneUser: async (req, res) => {
    try {
      await w_user_service.getOneUser(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  export_data: async (req, res) => {
    try {
      await w_user_service.export_data(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
};
