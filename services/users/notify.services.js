const Notify = require("../../models/notify.model");
var { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
const { addLog } = require("../../helpers/helper");
const _ = require("lodash");
const { Types } = require("mongoose");
const Promise = require("bluebird");

module.exports = {
  addNotify: async (req, res) => {
    try {
      var user_id = req.user._id;
      var role_id = req.user.role_id;
      const { product_id,store_id} = req.body;

      const notify = await Notify.create({product_id,store_id,user_id,user_type:role_id});
      
      if (!isEmpty(notify)) {
        return res.json(responseData("NOTIFY_ADDED", notify, req, true));
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
};
