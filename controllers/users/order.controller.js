const { responseData } = require("../../helpers/responseData");
const order_service = require("../../services/users/order.services");
module.exports = {
 
  delete_order: async (req, res) => {
    try {
      await order_service.delete_order(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  list: async (req, res) => {
    try {
      await order_service.list(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  orderDetails: async (req, res) => {
    try {
      await order_service.orderDetails(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  change_status_order: async (req, res) => {
    try {
      await order_service.change_status_order(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },cancelOrder: async (req, res) => {
    try {
      await order_service.cancelOrder(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },complatedOrder: async (req, res) => {
    try {
      await order_service.complatedOrder(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },rescheduleOrder: async (req, res) => {
    try {
      await order_service.rescheduleOrder(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },reOrder: async (req, res) => {
    try {
      await order_service.reOrder(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },generate_pdf: async (req, res) => {
    try {
      await order_service.generate_pdf(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },transactionList: async (req, res) => {
    try {
      await order_service.transactionList(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },

  
};
