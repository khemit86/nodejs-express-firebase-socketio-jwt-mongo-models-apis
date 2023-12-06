const WSBusinessType = require("../../models/ws_business_type.model");
const { responseData } = require("../../helpers/responseData");
const _ = require("lodash");

module.exports = {
  business_types: async (req, res) => {
    try {
      var newres = await WSBusinessType.find({ status: true }).select({
        _id: 1,
        name: 1,
      });
      return res.json(
        responseData("DATA_RECEIVED_SUCCESSFULLY", newres, req, true)
      );
    } catch (error) {
      return res
        .status(422)
        .json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
};
