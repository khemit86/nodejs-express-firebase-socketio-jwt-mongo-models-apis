const Feedback = require("../../models/feedback.model");
var { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
const Country = require("../../models/countries.model");

const _ = require("lodash");
const { Types } = require("mongoose");
const Promise = require("bluebird");
const { base64Encode, base64Decode } = require("../../helpers/helper");

module.exports = {
  add_feedback: async (req, res) => {
    try {
      const { feedback, country_name } = req.body;
      var user_id = req.user._id;

      var countryData = await Country.findOne({
        name: { $regex: country_name, $options: "i" }
      });
      if(!countryData){
        return res.json(responseData("COUNTRY_NOT_FOUND", {}, req, false));
      }
      let country_id = countryData._id;
      const feedback_save = await Feedback.create({ user_id, feedback, country_id });
      if (!isEmpty(feedback_save)) {
        return res.json(responseData("FEEDBACK_ADDED", feedback_save, req, true));
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
};
