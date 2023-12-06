const express = require("express");
const router = express.Router();
const user = require("../../controllers/admins/user.controller");
const validationRule = require("../../validations/admins/auth");
const { verifyToken } = require("../../middlewares/verifyToken");

//get admin users list
router.get("/", [verifyToken], user.adminUserList);

//get all users list
router.get("/all-user-list", [verifyToken], user.allUserList);

//get all users list without pagination
router.get("/all-users", [verifyToken], user.allUsers);

//get all users list without pagination
router.get("/top-users", [verifyToken], user.topUsers);

//add admin user
router.post(
  "/add-user",
  [verifyToken],
  validationRule.validate("adduser"),
  user.addAdminUser
);
//edit admin user
router.put(
  "/edit-user/:id",
  [verifyToken],
  validationRule.validate("adduser"),
  user.editAdminUser
);
//delete admin user
router.delete("/delete-user/:id", [verifyToken], user.deleteUser);
//change admin user status
router.put("/change-status/:id", [verifyToken], user.userChangeStatus);
router.put("/change-minimum-order-amount/:id", [verifyToken], user.changeMinimumOrderAmount);
router.get("/get-user", [verifyToken], user.getOneUser);
// Export api
router.get("/export-data", [verifyToken], user.export_data);

module.exports = router;
