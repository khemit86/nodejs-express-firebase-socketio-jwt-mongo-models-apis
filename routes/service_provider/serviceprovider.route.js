const express = require("express");
const router = express.Router();

const validationRule = require("../../validations/admins/auth");
const { verifyToken } = require("../../middlewares/verifyToken");
const { user_profile } = require("../../middlewares/multerUpload");

const service_provider = require("../../controllers/service_provider/serviceprovider.controller");

// router.post("/signup", validationRule.validate("user-signup"),user.signup_user)
// router.post("/verify-mobile",validationRule.validate("verify-mobile"),user.verify_user_mobile)
// router.post("/resend-otp",validationRule.validate("resend-otp"),user.resend_otp_mobile)
router.get("/", [verifyToken], service_provider.service_provider_profile)
router.post("/login",validationRule.validate("login"), service_provider.service_provider_login)
// router.post("/forgot-password", validationRule.validate("forgot-password"), service_provider.service_provider_forgot_password)
// router.post("/reset-password/:token", validationRule.validate("reset-password"), service_provider.service_provider_reset_password)
router.post("/change-password", [verifyToken], validationRule.validate("change-password"), service_provider.changePassword)
router.post("/edit-profile", [verifyToken], user_profile.single('sp_profile_pic'), service_provider.edit_service_provider)

router.post("/forgot-password", service_provider.service_provider_forgot_password)
router.post("/provider-verify-otp", service_provider.service_provider_verify_otp)
router.post("/reset-password", service_provider.service_provider_reset_password)
router.post("/update-fcm-token",[verifyToken], service_provider.fcm_token)

module.exports = router;