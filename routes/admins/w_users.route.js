const express = require("express");
const router = express.Router();
const user = require("../../controllers/admins/w_user.controller");
const validationRule = require("../../validations/admins/auth");
const { verifyToken } = require("../../middlewares/verifyToken");

//get admin users list
router.get("/", [verifyToken], user.adminUserList);
//get users list for approval 
router.get("/approval-user-list", [verifyToken], user.approvalUserList);
//add admin user
router.post(
  "/add-user",
  [verifyToken],
  validationRule.validate("addwuser"),
  user.addAdminUser
);
//edit admin user
router.put(
  "/edit-user/:id",
  [verifyToken],
  validationRule.validate("editwuser"),
  user.editAdminUser
);
//delete admin user
router.delete("/delete-user/:id", [verifyToken], user.deleteUser);
//change admin user status
router.put("/change-status/:id", [verifyToken], user.userChangeStatus);
router.put(
  "/change-status-approval/:id",
  [verifyToken],
  user.userChangeStatusApproval
);
router.put(
  "/change-status-reject/:id",
  [verifyToken],
  user.userChangeStatusReject
);
router.get("/get-user", [verifyToken], user.getOneUser);
// Export api
router.get("/export-data", [verifyToken], user.export_data);

module.exports = router;
