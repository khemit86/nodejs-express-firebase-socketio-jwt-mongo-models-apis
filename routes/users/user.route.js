const express = require("express");
const router = express.Router();

const validationRule = require("../../validations/admins/auth");
const validationRule2 = require("../../validations/users/auth");

const { verifyTokenFront } = require("../../middlewares/verifyToken");
require("../../helpers/passport");

const user = require("../../controllers/users/user.controller");
const address = require("../../controllers/users/address.controller");

router.post("/login", validationRule.validate("login"), user.user_login);
router.post(
  "/verifyMobile",
  validationRule.validate("verify-mobile"),
  user.verify_user_mobile
);
router.post(
  "/resendOtp",
  validationRule.validate("resend-otp"),
  user.resend_otp_mobile
);
// STRIPE ROUTES //
router.get("/public_key", [verifyTokenFront], user.public_key);
router.get("/create_setup_intent", [verifyTokenFront], user.create_setup_intent);
router.get("/get_all_cards", [verifyTokenFront], user.get_all_cards);
router.post("/make_stripe_payment", [verifyTokenFront], user.make_stripe_payment);
router.post(
  "/verify_stripe_payment",
  [verifyTokenFront],
  user.verify_stripe_payment
);
router.post(
  "/delete_stripe_payment",
  [verifyTokenFront],
  user.delete_stripe_payment
);

router.get("/", [verifyTokenFront], user.user_profile);
router.get("/wuserProfile", [verifyTokenFront], user.wuserProfile);
router.put(
  "/editProfile",
  [verifyTokenFront],
  validationRule2.validate("editProfileUser"),
  user.edit_user
);
router.put("/logout", [verifyTokenFront],user.logout);
router.post("/signup", validationRule2.validate("addwuser"), user.signup_user);

router.post("/loginw", validationRule2.validate("loginw"), user.user_loginw);
router.post(
  "/changePassword",
  [verifyTokenFront],
  validationRule.validate("change-password"),
  user.changePassword
);
router.post(
  "/addToCart",
  [verifyTokenFront],
  validationRule2.validate("add-to-cart"),
  user.addToCart
);
router.post(
  "/addToCartFresh",
  [verifyTokenFront],
  validationRule2.validate("add-to-cart"),
  user.addToCartFresh
);
router.post("/addressChecker", [verifyTokenFront], user.addressChecker);
router.get("/mycart", [verifyTokenFront], user.mycart);
router.post("/applyCoupon", [verifyTokenFront], user.applyCoupon);
router.post("/redeemLoyaltyPoints", [verifyTokenFront], user.redeemLoyaltyPoints);
router.post("/chooseAddress", [verifyTokenFront], user.chooseAddress);

router.get("/removeCoupon", [verifyTokenFront], user.removeCoupon);
router.post("/removeItem", [verifyTokenFront], user.removeItem);
router.post("/updateItem", [verifyTokenFront], user.updateItem);

router.get("/reviewOrder", [verifyTokenFront], user.reviewOrder);
router.post("/timeslots", [verifyTokenFront], user.timeslots);
router.post("/addDeliveryDetails", [verifyTokenFront], user.addDeliveryDetails);
router.post("/placeOrder", [verifyTokenFront], user.placeOrder);

router.post(
  "/wEditProfile",
  [verifyTokenFront],
  validationRule2.validate("editProfileWholesale"),
  user.edit_wholesale
);
router.get("/home-screen", user.home_screen);

router.post(
  "/forgotPassword",
  validationRule2.validate("forgot-password"),
  user.user_forgot_password
);
router.post("/user-verify-otp", user.user_verify_otp);
router.post("/resetPassword/:token", user.user_reset_password);
router.post("/update-fcm-token", [verifyTokenFront], user.fcm_token);
router.post("/updateToken", [verifyTokenFront], user.updateToken);

router.post(
  "/addAddress",
  validationRule2.validate("addAddress"),
  [verifyTokenFront],
  address.add_address
);
router.get("/listAddress", [verifyTokenFront], address.list_address);
router.delete("/deleteAddress/:id", [verifyTokenFront], address.delete_address);
router.get("/setDefaultAddress/:id", [verifyTokenFront], address.set_default);

// facebook social_login
// router.get('/auth/facebook',passport.authorize('facebook', { scope : ['email'] }));
// router.get('/auth/facebook/callback',passport.authenticate('facebook'),user.socialLoginfacebook);

// // google social_login
// router.get('/auth/google',passport.authenticate('google', { scope : ['email'] }));
// router.get('/auth/google/callback',passport.authenticate('google'),user.socialLoginGoogle);

router.post(
  "/social-login-check",
  validationRule.validate("social-check"),
  user.social_login_check
);

router.post(
  "/contact-us",
  validationRule.validate("contact-us"),
  user.contactUs
);

router.get("/userCurrency",user.userCurrency);

module.exports = router;
