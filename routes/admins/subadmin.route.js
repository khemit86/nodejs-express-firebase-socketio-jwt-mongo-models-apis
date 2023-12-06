const express = require("express");
const router = express.Router();
const subadmin = require("../../controllers/admins/subadmin.contoller");
const validationRule = require("../../validations/admins/auth");
const { verifyToken } = require("../../middlewares/verifyToken");

//get admin users list
router.get("/", [verifyToken], subadmin.subadminList);
//add admin user
router.post(
  "/add-subadmin",
  [verifyToken],
  validationRule.validate("addsubadmin"),
  subadmin.add_subadmin
);
//edit admin user
router.put(
  "/edit-subadmin/:id",
  [verifyToken],
  validationRule.validate("editsubadmin"),
  subadmin.edit_subadmin
);
//delete admin user
router.delete("/delete-subadmin/:id", [verifyToken], subadmin.delete_subadmin);
//change admin user status
router.put(
  "/change-status-subadmin/:id",
  [verifyToken],
  subadmin.subadminChangeStatus
);
//permission
router.put(
  "/permission/:id",
  [verifyToken],
  validationRule.validate("permission"),
  subadmin.permission
);

router.get("/logs/list", [verifyToken], subadmin.logs_list);

router.put("/change-password", [verifyToken], subadmin.change_password);

module.exports = router;
