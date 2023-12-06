const express = require("express");
const router = express.Router();
const ws_business_type = require("../../controllers/admins/ws_business_type.controller");
const validationRule = require("../../validations/admins/admin");
const { verifyToken } = require("../../middlewares/verifyToken");

//get admin ws_business_type list
router.get("/",ws_business_type.list_ws_business_type);
//add admin ws_business_type
router.post(
  "/",
  [verifyToken],
  validationRule.validate("addBS"),
  ws_business_type.add_ws_business_type
);
//edit admin ws_business_type
router.put(
  "/edit-ws-business-type",
  [verifyToken],
  validationRule.validate("editBS"),
  ws_business_type.edit_ws_business_type
);
//delete admin ws_business_type
router.delete(
  "/delete-ws-business-type/:id",
  [verifyToken],
  ws_business_type.delete_ws_business_type
);
//change admin ws_business_type status
router.put(
  "/change-status/:id",
  [verifyToken],
  ws_business_type.change_status_ws_business_type
);

module.exports = router;
