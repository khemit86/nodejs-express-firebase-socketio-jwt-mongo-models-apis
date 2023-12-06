var dashboard_service = require("../../services/admins/dashboard.services");
const { responseData } = require("../../helpers/responseData");

module.exports = {
  dashboard: async (req, res) => {
    try {
      await dashboard_service.dashboard(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req, true));
    }
  }
}