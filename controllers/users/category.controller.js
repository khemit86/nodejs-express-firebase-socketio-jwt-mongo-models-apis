const { responseData } = require("../../helpers/responseData");
const category_service = require("../../services/users/category.services");
module.exports = {
  list_sub_category: async (req, res) => {
    try {
      await category_service.list_sub_category(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  list_category: async (req, res) => {
    try {
      await category_service.list_category(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  home_category: async (req, res) => {
    try {
      await category_service.home_category(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  searchCategory: async (req, res) => {
    try {
      //console.log(">>>>>searchCategory");
      await category_service.searchCategory(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
};
