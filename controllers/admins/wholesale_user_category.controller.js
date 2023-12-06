const { responseData } = require("../../helpers/responseData");
const wholesale_user_category_service = require("../../services/admins/wholesale_user_category.services");
module.exports = {
  add_wholesale_user_category: async (req, res) => {
    try {
      await wholesale_user_category_service.add_wholesale_user_category(
        req,
        res
      );
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  delete_wholesale_user_category: async (req, res) => {
    try {
      await wholesale_user_category_service.delete_wholesale_user_category(
        req,
        res
      );
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  list_wholesale_user_category: async (req, res) => {
    try {
      await wholesale_user_category_service.list_wholesale_user_category(
        req,
        res
      );
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  edit_wholesale_user_category: async (req, res) => {
    try {
      await wholesale_user_category_service.edit_wholesale_user_category(
        req,
        res
      );
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  change_status_wholesale_user_category: async (req, res) => {
    try {
      await wholesale_user_category_service.change_status_wholesale_user_category(
        req,
        res
      );
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  change_default_wholesale_user_category: async (req, res) => {
    try {
      await wholesale_user_category_service.change_default_wholesale_user_category(
        req,
        res
      );
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
};
