const express = require("express");
const router = express.Router();
const vat_code = require("../../controllers/admins/vat_code.controller");
const validationRule = require("../../validations/admins/admin");
const { verifyToken } = require("../../middlewares/verifyToken");

//get admin vat_code list
router.get("/", [verifyToken], vat_code.list_vat_code);
//add admin vat_code
router.post(
  "/",
  [verifyToken],
  validationRule.validate("addVAT"),
  vat_code.add_vat_code
);
//edit admin vat_code
router.put(
  "/edit-vat-code",
  [verifyToken],
  validationRule.validate("editVAT"),
  vat_code.edit_vat_code
);
//delete admin vat_code
router.delete("/delete-vat-code/:id", [verifyToken], vat_code.delete_vat_code);
//change admin vat_code status
router.put(
  "/change-status/:id",
  [verifyToken],
  vat_code.change_status_vat_code
);

module.exports = router;
