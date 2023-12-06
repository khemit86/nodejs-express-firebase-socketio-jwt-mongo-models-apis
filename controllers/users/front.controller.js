const { responseData } = require("../../helpers/responseData");
const front_service = require("../../services/users/front.services");
module.exports = {
  business_types: async (req, res) => {
    try {
      await front_service.business_types(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
};
