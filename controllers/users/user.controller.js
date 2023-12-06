const { responseData } = require("../../helpers/responseData");
const user_service = require("../../services/users/user.services");
module.exports = {
  signup_user: async (req, res) => {
    try {
      await user_service.signup_user(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  logout: async (req, res) => {
    try {
      await user_service.logout(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  verify_user_mobile: async (req, res) => {
    try {
      await user_service.verify_user_mobile(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  resend_otp_mobile: async (req, res) => {
    try {
      await user_service.resend_otp_mobile(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  user_login: async (req, res) => {
    try {
      await user_service.user_login(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  user_loginw: async (req, res) => {
    try {
      await user_service.user_loginw(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  user_profile: async (req, res) => {
    try {
      await user_service.user_profile(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  public_key: async (req, res) => {
    try {
      await user_service.public_key(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  create_setup_intent: async (req, res) => {
    try {
      await user_service.create_setup_intent(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  get_all_cards: async (req, res) => {
    try {
      await user_service.get_all_cards(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  make_stripe_payment: async (req, res) => {
    try {
      await user_service.make_stripe_payment(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  verify_stripe_payment: async (req, res) => {
    try {
      await user_service.verify_stripe_payment(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  delete_stripe_payment: async (req, res) => {
    try {
      await user_service.delete_stripe_payment(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  wuserProfile: async (req, res) => {
    try {
      await user_service.wuserProfile(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  user_forgot_password: async (req, res) => {
    try {
      await user_service.user_forgot_password(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  user_verify_otp: async (req, res) => {
    try {
      await user_service.user_verify_otp(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  user_reset_password: async (req, res) => {
    try {
      await user_service.user_reset_password(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  changePassword: async (req, res) => {
    try {
      await user_service.changePassword(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  edit_user: async (req, res) => {
    try {
      await user_service.edit_user(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  edit_wholesale: async (req, res) => {
    try {
      await user_service.edit_wholesale(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  home_screen: async (req, res) => {
    try {
      await user_service.home_screen(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  // socialLoginfacebook:async(req,res) => {
  //     try {
  //         await user_service.socialLoginfacebook(req, res);
  //     } catch (err) {
  //         var msg = err.message || "SOMETHING_WENT_WRONG";
  //         return res.status(422).json(responseData(msg, {}, req));
  //     }
  // },
  // socialLoginGoogle:async(req,res) => {
  //     try {
  //         await user_service.socialLoginGoogle(req, res);
  //     } catch (err) {
  //         var msg = err.message || "SOMETHING_WENT_WRONG";
  //         return res.status(422).json(responseData(msg, {}, req));
  //     }
  // },
  updateToken: async (req, res) => {
    try {
      await user_service.updateToken(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  fcm_token: async (req, res) => {
    try {
      await user_service.fcm_token(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  social_login_check: async (req, res) => {
    try {
      await user_service.social_login_check(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  addToCart: async (req, res) => {
    try {
      await user_service.addToCart(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  addToCartFresh: async (req, res) => {
    try {
      await user_service.addToCartFresh(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  mycart: async (req, res) => {
    try {
      await user_service.myCart(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  applyCoupon: async (req, res) => {
    try {
      await user_service.applyCoupon(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  redeemLoyaltyPoints: async (req, res) => {
    try {
      await user_service.redeemLoyaltyPoints(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  chooseAddress: async (req, res) => {
    try {
      await user_service.chooseAddress(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  addressChecker: async (req, res) => {
    try {
      await user_service.addressChecker(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  removeCoupon: async (req, res) => {
    try {
      await user_service.removeCoupon(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  removeItem: async (req, res) => {
    try {
      await user_service.removeItem(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  updateItem: async (req, res) => {
    try {
      await user_service.updateItem(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  reviewOrder: async (req, res) => {
    try {
      await user_service.reviewOrder(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  timeslots: async (req, res) => {
    try {
      await user_service.timeslots(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  addDeliveryDetails: async (req, res) => {
    try {
      await user_service.addDeliveryDetails(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  placeOrder: async (req, res) => {
    try {
      //console.log("placeOrder");
      await user_service.placeOrder(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  contactUs: async (req, res) => {
    try {
      await user_service.contactUs(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  userCurrency: async (req, res) => {
    try {
      await user_service.userCurrency(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  
};
