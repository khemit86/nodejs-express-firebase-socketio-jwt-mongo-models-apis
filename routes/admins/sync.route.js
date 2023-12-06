const express = require("express");
const router = express.Router();
const syncController = require("../../controllers/admins/sync.controller");

router.get("/importBrands", syncController.importBrands);
router.get("/importSuppliers", syncController.importSuppliers);
router.get("/importSizeCode", syncController.importSizeCode);
router.get("/importCategories", syncController.importCategories);
router.get("/importBusinessTypes", syncController.importBusinessTypes);
router.get(
  "/importWholeSaleCategories",
  syncController.importWholeSaleCategories
);
router.get("/importProducts", syncController.importProducts);
router.get("/importImages", syncController.importImages);

router.get("/importCustomers", syncController.importCustomers);
router.get("/importOrders", syncController.importOrders);
router.get("/importAddresses", syncController.importAddresses);
router.get("/assignStore", syncController.assignStore);

module.exports = router;
