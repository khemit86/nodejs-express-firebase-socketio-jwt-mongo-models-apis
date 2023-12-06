const express = require("express");
const router = express.Router();
const validationRule = require("../../validations/drivers/index");
const { verifyTokenFront } = require("../../middlewares/verifyToken");
const driverController = require("../../controllers/drivers/driver.controller");

router.post(
  "/login",
  validationRule.validate("driver-login"),
  driverController.driver_login
);
router.post(
  "/forgot-password",
  validationRule.validate("forgot-password"),
  driverController.driver_forgot_password
);
router.post(
  "/change-password",
  [verifyTokenFront],
  validationRule.validate("change-password"),
  driverController.change_password
);
router.get("/get-profile", [verifyTokenFront], driverController.get_profile);
router.get(
  "/get-notifications",
  [verifyTokenFront],
  driverController.get_notifications
);

router.post(
  "/update-profile",
  [verifyTokenFront],
  validationRule.validate("update-profile"),
  driverController.update_profile
);
router.post(
  "/update-notification",
  [verifyTokenFront],
  validationRule.validate("update-notification"),
  driverController.update_notification
);
router.post(
  "/update-availability",
  [verifyTokenFront],
  validationRule.validate("update-notification"),
  driverController.update_availability
);
router.post(
  "/change-order-status",
  [verifyTokenFront],
  validationRule.validate("change-order-status"),
  driverController.change_order_status
);
module.exports = router;
