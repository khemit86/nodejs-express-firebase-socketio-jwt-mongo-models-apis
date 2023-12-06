const express = require("express");
const router = express.Router();
const supplier = require("../../controllers/admins/supplier.controller");
const validationRule = require("../../validations/admins/admin");
const { verifyToken } = require("../../middlewares/verifyToken");

//get admin supplier list
router.get("/", [verifyToken], supplier.list_supplier);
//add admin supplier
router.post(
  "/",
  [verifyToken],
  validationRule.validate("addSupplier"),
  supplier.add_supplier
);
//edit admin supplier
router.put(
  "/edit-supplier",
  [verifyToken],
  validationRule.validate("editSupplier"),
  supplier.edit_supplier
);
//delete admin supplier
router.delete("/delete-supplier/:id", [verifyToken], supplier.delete_supplier);
//change admin supplier status
router.put(
  "/change-status/:id",
  [verifyToken],
  supplier.change_status_supplier
);

module.exports = router;
