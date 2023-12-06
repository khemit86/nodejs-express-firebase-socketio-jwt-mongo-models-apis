const { responseData } = require("../../helpers/responseData");
const sync_service = require("../../services/admins/sync.services");

module.exports = {
  importCustomers: async (req, res) => {
    try {
      await sync_service.importCustomers(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  importOrders: async (req, res) => {
    try {
      await sync_service.importOrders(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  importAddresses: async (req, res) => {
    try {
      await sync_service.importAddresses(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  assignStore: async (req, res) => {
    try {
      await sync_service.assignStore(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  importProducts: async (req, res) => {
    try {
      await sync_service.importProducts(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  importImages: async (req, res) => {
    try {
      await sync_service.importImages(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  importSuppliers: async (req, res) => {
    try {
      await sync_service.importSuppliers(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  importBrands: async (req, res) => {
    try {
      await sync_service.importBrands(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  importCategories: async (req, res) => {
    try {
      await sync_service.importCategories(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  importBusinessTypes: async (req, res) => {
    try {
      await sync_service.importBusinessTypes(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  importWholeSaleCategories: async (req, res) => {
    try {
      await sync_service.importWholeSaleCategories(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  importSizeCode: async (req, res) => {
    try {
      await sync_service.importSizeCode(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
};
