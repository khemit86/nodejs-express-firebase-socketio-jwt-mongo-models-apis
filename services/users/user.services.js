const User = require("../../models/user.model");
const Notification = require("../../models/notification.model");
const Product = require("../../models/product.model");
const Setting = require("../../models/setting.model");
const Country = require("../../models/countries.model");
const ProductInventory = require("../../models/productinventory.model");
const City = require("../../models/city.model");
const SizeCode = require("../../models/sizecode.model");
const Order = require("../../models/order.model");
const Offer = require("../../models/offers.model");
const Store = require("../../models/store.model");
const Address = require("../../models/address.model");
const LoyaltyPoint = require("../../models/loyaltypoint.model");
const WholesaleUserCategory = require("../../models/wholesale_user_category.model");
const Promise = require("bluebird");
const setting_service = require("../admins/setting.services");
const { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
var bcrypt = require("bcryptjs");
const { v4 } = require("uuid");
var moment = require("moment");
const email_service = require("../admins/emailtemplate.services");
const _ = require("lodash");
const { Types } = require("mongoose");
var moment = require("moment");
var momentTz = require("moment-timezone");
var axios = require("axios");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2020-08-27",
});

const {
  USER_FOLDER,
  USER_THUMB_WIDTH,
  USER_THUMB_HEIGHT,
} = require("../../helpers/config");
const { COMPANY_FOLDER } = require("../../helpers/config");
const {
  base64Encode,
  base64Decode,
  saveFile,
  saveThumbFile,
  getCountryIdFromCode,
  sendEmail,
  sendNotification,
  sendOTP,
  generateAuthToken,
  generateOTP,
  getAdminDetails,
  upsert,
  checkIsSpacialQuantity,
  upsertUpdate,
  upsertItem,
  randomString,
  sendNotificationOrderStatusChange,
  syncInventory,
  addLog,
  syncInventoryOrder,
  sendOrderConfirmationEmail,
} = require("../../helpers/helper");
module.exports = {
  signup_user: async (req, res) => {
    try {
      var {
        first_name,
        last_name,
        password,
        email,
        country_code,
        mobile,
        company_name,
        company_phone,
        company_reg_no,
        company_vat_no,
        company_reg_date,
        company_type_id,
        zoom_updates,
        marketing_offers,
        city_id,
        country_id,
        referral_code,
        device_token,
        device_type,
      } = req.body;

      first_name = base64Encode(first_name);
      last_name = base64Encode(last_name);
      email = base64Encode(email);
      mobile = base64Encode(mobile);
      country_code = base64Encode(country_code);
      company_name = base64Encode(company_name);
      company_phone = base64Encode(company_phone);
      company_reg_no = base64Encode(company_reg_no);
      company_vat_no = base64Encode(company_vat_no);
      company_reg_date = base64Encode(company_reg_date);

      const findRecord = await User.findOne({ email });
      if (!isEmpty(findRecord)) {
        return res
          .status(422)
          .json(responseData("EMAIL_ALREADY_REGISTERED", {}, req, false));
      }
      const findRecordM = await User.findOne({ country_code, mobile });
      if (!isEmpty(findRecordM)) {
        return res
          .status(422)
          .json(responseData("MOBILE_ALREADY_REGISTERED", {}, req, false));
      }

      const usedReferralUserDetail = await User.findOne({
        referral_code: referral_code,
      });
      // if (isEmpty(usedReferralUserDetail)) {
      //   return res
      //     .status(422)
      //     .json(responseData("MOBILE_ALREADY_REGISTERED", {}, req, false));
      // }

      const user = {
        first_name,
        last_name,
        email,
        country_code,
        mobile,
        company_name,
        company_phone,
        company_reg_no,
        company_vat_no,
        company_reg_date,
        company_type_id,
        zoom_updates,
        marketing_offers,
        city_id,
        country_id,
        device_token,
        device_type,
      };
      const salt = await bcrypt.genSalt(10);
      user.org_password = password;
      user.password = await bcrypt.hash(password, salt);
      user.status = true;
      user.role_id = 2;
      user.is_mobile_verified = true;

      // uploadImageStart
      var company_image = "";
      const files = req.files;
      if (files && files?.company_image) {
        const data = files.company_image;
        if (data.name) {
          if (files && files.company_image.name != undefined) {
            company_image = await saveFile(
              files.company_image,
              COMPANY_FOLDER,
              null
            );
          }
        }
      }
      user.company_image = company_image;
      // uploadImageEnd

      // uploadreg_certificate
      var reg_certificate = "";
      if (files && files.reg_certificate) {
        const data = files.reg_certificate;
        if (data.name) {
          if (files && files.reg_certificate.name != undefined) {
            reg_certificate = await saveFile(
              files.reg_certificate,
              COMPANY_FOLDER,
              null
            );
          }
        }
      }
      user.reg_certificate = reg_certificate;
      // uploadreg_certificateEnd
      user.country_code = base64Encode(country_code);
      const wholesale_cat = await WholesaleUserCategory.findOne({
        country_id: Types.ObjectId(country_id),
        default: true,
      });
      user.wholesaleusercategory_id = Types.ObjectId(wholesale_cat._id);
      user.referral_code = randomString(10);
      if (referral_code) user.refer_id = usedReferralUserDetail?._id;
      if (!referral_code) user.referral_status = 1;

      const resp = await User.create(user);
      if (resp) {
        const newres = resp.toJSON();
        delete newres["password"];
        newres.first_name = base64Decode(newres.first_name);
        newres.last_name = base64Decode(newres.last_name);
        newres.email = base64Decode(newres.email);
        newres.mobile = base64Decode(newres.mobile);
        newres.company_name = base64Decode(newres.company_name);
        newres.company_phone = base64Decode(newres.company_phone);
        newres.company_reg_no = base64Decode(newres.company_reg_no);
        newres.company_vat_no = base64Decode(newres.company_vat_no);
        newres.company_reg_date = base64Decode(newres.company_reg_date);
        newres.company_postal_code = base64Decode(newres.company_postal_code);
        newres.company_street = base64Decode(newres.company_street);
        newres.country_code = base64Decode(newres.country_code);
        newres.wholesaleusercategory_id = wholesale_cat._id;
        newres.city_id = city_id;
        newres.country_id = country_id;

        let { description, subject } =
          await email_service.getEmailTemplateBySlugAndCountry(
            "wholesale-account-registered",
            country_id
          );
        var {
          _id: admin_id,
          token: device_token,
          email: email,
          first_name: admin_first_name,
          last_name: admin_last_name,
        } = await getAdminDetails();

        description = _.replace(
          description,
          "[FIRST_NAME]",
          base64Decode(admin_first_name)
        );

        description = _.replace(
          description,
          "[LAST_NAME]",
          base64Decode(admin_last_name)
        );
        description = _.replace(
          description,
          "[COMPANY_NAME]",
          newres.company_name
        );
        description = _.replace(
          description,
          "[FIRST_NAME_COMPANY]",
          newres.first_name
        );
        description = _.replace(
          description,
          "[LAST_NAME_COMPANY]",
          newres.last_name
        );

        // sending email to admin for wholesaler approval
        sendEmail("dharmendra.sharma@octalsoftware.com", subject, description);
        sendEmail(
          req.body.email,
          "Account Approval",
          "Your account is successfully created and will be approved shortly"
        );
        sendNotification({
          deviceToken: device_token,
          type: "Auto",
          title: "ZOOM Notification",
          body:
            "New Wholesale Account Request Received : First Name : " +
            newres.first_name +
            ", Last Name : " +
            newres.last_name +
            ", Company Name :" +
            newres.company_name,
          _id: admin_id,
        });

        return res.json(responseData("USER_ADD_SUCCESS", newres, req, true));
      } else {
        return res
          .status(422)
          .json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res
        .status(422)
        .json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  verify_user_mobile: async (req, res) => {
    try {
      var { country_code, mobile, otp } = req.body;

      country_code = base64Encode(country_code);
      mobile = base64Encode(mobile);

      const userDetails = await User.findOne({
        country_code,
        mobile,
      });
      if (isEmpty(userDetails)) {
        return res
          .status(422)
          .json(responseData("USER_NOT_FOUND", {}, req, false));
      }

      if (userDetails.otp != otp) {
        return res
          .status(422)
          .json(responseData("INVALID_OTP", {}, req, false));
      } else if (userDetails.otp_expiry < moment().unix()) {
        return res
          .status(422)
          .json(responseData("OTP_EXPIRED", {}, req, false));
      }
      var userDetails2 = await User.findOne({
        country_code,
        mobile,
      });
      var userDetails2 = userDetails2.toJSON();
      userDetails2.first_name = base64Decode(userDetails2.first_name);
      userDetails2.last_name = base64Decode(userDetails2.last_name);
      userDetails2.email = base64Decode(userDetails2.email);
      userDetails2.mobile = base64Decode(userDetails2.mobile);
      userDetails2.country_code = base64Decode(userDetails2.country_code);

      const deviceToken = generateAuthToken(userDetails2);
      const p = await User.findOneAndUpdate(
        { country_code, mobile },
        { is_mobile_verified: 1 },
        { new: true }
      );

      return res.json(
        responseData(
          "SIGNUP_VERIFY_SUCCESS",
          { ...userDetails2, ...deviceToken },
          req,
          true
        )
      );
    } catch (error) {
      return res
        .status(422)
        .json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  resend_otp_mobile: async (req, res) => {
    try {
      var { country_code, mobile } = req.body;
      var country_code_o = country_code;
      var mobile_o = mobile;
      country_code = base64Encode(country_code);
      mobile = base64Encode(mobile);
      var userExists = await User.findOne({
        country_code: country_code,
        mobile: mobile,
      });

      var userDetails = {};
      userDetails.otp = generateOTP();
      userDetails.otp_expiry = moment().unix() + 60;
      const userData = await User.findByIdAndUpdate(
        { _id: userExists._id },
        userDetails,
        {
          new: true,
        }
      );
      sendOTP(country_code_o, mobile_o, userDetails.otp);

      return res.json(
        responseData(
          "OTP_SENT",
          {
            otp: userDetails.otp,
          },
          req,
          true
        )
      );
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  user_login: async (req, res) => {
    try {
      var {
        country_code,
        mobile,
        referral_code,
        device_token,
        device_type,
        marketing_offers,
      } = req.body;
      const country_code_o = country_code;
      const mobile_o = mobile;
      country_code = base64Encode(country_code);
      mobile = base64Encode(mobile);
      var userExists = await User.findOne({
        country_code: country_code,
        mobile: mobile,
      });
      if (userExists == null) {
        var usedReferralUserDetail = await User.findOne({
          referral_code: referral_code,
        });
        // if (isEmpty(usedReferralUserDetail)) {
        //   return res
        //     .status(422)
        //     .json(responseData("MOBILE_ALREADY_REGISTERED", {}, req, false));
        // }
        var data = {};
        if (referral_code) data.refer_id = usedReferralUserDetail?._id;
        if (!referral_code) data.referral_status = 1;
        data.referral_code = randomString(10);
        await User.create({
          country_code,
          mobile,
          marketing_offers,
          ...data,
          device_token,
          device_type,
          status: true,
        });
      }
      var userExists = await User.findOne({
        country_code: country_code,
        mobile: mobile,
      });

      if (userExists.status == false) {
        return res
          .status(422)
          .json(
            responseData(
              "ACCOUNT_IS_DEACTIVATED_CONTACT_TO_ADMIN",
              {},
              req,
              false
            )
          );
      }

      if (userExists.role_id == 2) {
        return res
          .status(422)
          .json(responseData("Please login with Wholesaller", {}, req, false));
      }
      console.log("fsdfsd22222", userExists);

      var userDetails = {};
      userDetails.marketing_offers = marketing_offers;
      userDetails.otp = generateOTP();
      userDetails.otp_expiry = moment().unix() + 120;
      userDetails.device_token = device_token;
      // userDetails.device_type = device_type;
      const userData = await User.findByIdAndUpdate(
        { _id: userExists._id },
        userDetails,
        {
          new: true,
        }
      );
      sendOTP(country_code_o, mobile_o, userDetails.otp);
      return res.json(
        responseData(
          "OTP_SENT",
          {
            user_verified: false,
            otp: userDetails.otp,
          },
          req,
          true
        )
      );
    } catch (error) {
      return res
        .status(422)
        .json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  user_loginw: async (req, res) => {
    try {
      var { email, password, device_type, device_token } = req.body;
      email = base64Encode(email);

      let admin = await User.findOne({ email });

      if (!isEmpty(admin)) {
        await User.updateOne({ email }, { device_token });
        bcrypt.compare(password, admin.password, async (err, response) => {
          if (err)
            return res.json(responseData("INVALID_LOGIN", {}, req, false));
          if (!response)
            return res.json(responseData("INVALID_LOGIN", {}, req, false));
          const adminData = admin.toJSON();

          if (adminData.approval == 0)
            return res.json(responseData("USER_NOT_APPROVE", {}, req, false));

          adminData.first_name = base64Decode(adminData.first_name);
          adminData.last_name = base64Decode(adminData.last_name);
          adminData.email = base64Decode(adminData.email);
          adminData.mobile = base64Decode(adminData.mobile);
          adminData.company_name = base64Decode(adminData.company_name);
          adminData.company_phone = base64Decode(adminData.company_phone);
          adminData.company_reg_no = base64Decode(adminData.company_reg_no);
          adminData.company_vat_no = base64Decode(adminData.company_vat_no);
          adminData.company_reg_date = base64Decode(adminData.company_reg_date);
          adminData.company_postal_code = base64Decode(
            adminData.company_postal_code
          );
          adminData.company_street = base64Decode(adminData.company_street);
          let deviceTokens = generateAuthToken(adminData);
          delete adminData["password"];
          return res.json(
            responseData(
              "ACCOUNT_LOGIN",
              { ...adminData, ...deviceTokens },
              req,
              true
            )
          );
        });
      } else {
        return res
          .status(422)
          .json(responseData("ADMIN_NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res
        .status(422)
        .json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  user_profile: async (req, res) => {
    try {
      const { _id } = req.user;
      let user = await User.findOne({ _id }).select({
        password: 0,
        is_mobile_verified: 0,
        status: 0,
        is_deleted: 0,
      });
      user = user.toJSON();
      user.first_name = base64Decode(user.first_name);
      user.last_name = base64Decode(user.last_name);
      user.email = base64Decode(user.email);
      user.mobile = base64Decode(user.mobile);
      user.country_code = base64Decode(user.country_code);
      if (!user.country_id) {
        user = JSON.parse(JSON.stringify(user));
        user.country_id = "";
      }

      user.unreadNotificationCount = 0;
      const notificationCount = await Notification.aggregate([
        {
          $match: { user_id: Types.ObjectId(_id), seen: false },
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]);
      if (notificationCount.length == 0) {
      } else {
        user.unreadNotificationCount = notificationCount[0].count;
      }

      if (!isEmpty(user)) {
        return res.json(responseData("PROFILE_DETAILS", user, req, true));
      } else {
        return res.json(responseData("PROFILE_DETAILS", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  public_key: async (req, res) => {
    try {
      /* sendNotification({
        deviceToken:
          "c0YVJVm0SJS9RcDN_0nvVs:APA91bG_B2CH4krfP5MvMjhxwvndSZb7LXoXYAu6VSVFZ4YNKZSYHfXljBcP7YEqIqNR7HtRnHBXbnQnrD4d5To7e-MIgXr_6CgRKD_qnohrrz_G_hajXrplIaA4gK01V5nmv3kjuseU",
        type: "Auto",
        title: "ZOOM Delivery Order Status Update",
        body: "This is test notification",
        user_id: "646b5581bc73baaa2cd29304",
        ref_id: "646b5581bc73baaa2cd29304",
        model: "Order",
      });*/

      //await sendOrderConfirmationEmail("646c5ac9c09322d556ed26ec", false);
      // await syncInventoryOrder("646b08de2cc539d55e5b03ed");
      // await syncInventory(
      //   Types.ObjectId("6409840bf32334179b662faa"),
      //   Types.ObjectId("6409aa6c7a171c4b1812de25")
      // );

      return res.json(
        responseData(
          "PUBLIC_KEY_IS_SENT",
          { STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY },
          req,
          true
        )
      );
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  create_setup_intent: async (req, res) => {
    try {
      const { _id } = req.user;
      var stripe_customer_id = "";
      var user = await User.findOne({ _id }).lean();
      var email = base64Decode(user.email);
      if (
        user.stripe_customer_id == "" ||
        user.stripe_customer_id == undefined
      ) {
        const customer = await stripe.customers.create({
          email: email,
        });
        await User.updateOne({ _id }, { stripe_customer_id: customer.id });
        stripe_customer_id = customer.id;
      } else {
        stripe_customer_id = user.stripe_customer_id;
      }
      const setupIntent = await stripe.setupIntents.create({
        customer: stripe_customer_id,
      });
      return res.json(
        responseData("setupIntent", { setupIntent: setupIntent }, req, true)
      );
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  get_all_cards: async (req, res) => {
    try {
      // return res.json(responseData("ERROR_OCCUR", error.message, req, false));
      const { _id } = req.user;
      var stripe_customer_id = "";
      var user = await User.findOne({ _id }).lean();
      var email = base64Decode(user.email);
      if (
        user.stripe_customer_id == "" ||
        user.stripe_customer_id == undefined
      ) {
        const customer = await stripe.customers.create({
          email: email,
        });
        await User.updateOne({ _id }, { stripe_customer_id: customer.id });
        stripe_customer_id = customer.id;
      } else {
        stripe_customer_id = user.stripe_customer_id;
      }
      const paymentMethods = await stripe.customers.listPaymentMethods(
        stripe_customer_id,
        { type: "card" }
      );
      return res.json(
        responseData(
          "paymentMethods",
          { paymentMethods: paymentMethods, stripe_customer_id },
          req,
          true
        )
      );
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  make_stripe_payment: async (req, res) => {
    try {
      const { _id } = req.user;
      var { amount, currency, pm_id } = req.body;
      var user = await User.findOne({ _id }).lean();
      //user.stripe_customer_id = "cus_Nu486aLi0vBKVh";
      //console.log(user);
      //return false;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseFloat((amount * 100).toFixed(2)),
        currency: currency,
        customer: user.stripe_customer_id,
        payment_method: pm_id,
        payment_method_types: ["card"],
        off_session: true,
        confirm: true,
        confirmation_method: "automatic",
      });

      return res.json(
        responseData(
          "PAYMENT_COMPLETED_SUCCESSFULLY",
          {
            authenticationRequired: false,
            transaction_id: paymentIntent?.charges?.data[0].id,
          },
          req,
          true
        )
      );
    } catch (err) {
      //console.log(err["payment_intent"]["status"]);
      if (
        err["payment_intent"] &&
        err["payment_intent"]["last_payment_error"] != "" &&
        err["payment_intent"]["status"] &&
        err["payment_intent"]["status"] == "requires_payment_method" &&
        err["payment_intent"]["last_payment_error"]["code"] &&
        err["payment_intent"]["last_payment_error"]["code"] ==
          "authentication_required"
      ) {
        //console.log(err.payment_intent);
        // return false;
        const paymentIntentD = await stripe.paymentIntents.retrieve(
          err.payment_intent.id
        );
        return res.json(
          responseData(
            "paymentMethods",
            {
              authenticationRequired: true,
              clientSecret: paymentIntentD.client_secret,
              pm_id: paymentIntentD.last_payment_error.payment_method.id,
              message: "PLEASE_VERIFY_CARD_DETAILS",
            },
            req,
            true
          )
        );
      }
      return res.json(
        responseData(
          "paymentMethods",
          {
            transaction_id: "",
            authenticationRequired: false,
            message: err.message,
          },
          req,
          false
        )
      );
    }
  },
  verify_stripe_payment: async (req, res) => {
    try {
      var { pi } = req.body;
      const paymentIntent = await stripe.paymentIntents.retrieve(pi);

      return res.json(
        responseData(
          "PAYMENT_COMPLETED_SUCCESSFULLY",
          {
            transaction_id: paymentIntent?.charges?.data[0].id,
          },
          req,
          true
        )
      );
    } catch (err) {
      return res.json(
        responseData(
          "transactionStatus",
          {
            transaction_id: "",
            message: "PAYMENT_FAILED",
          },
          req,
          false
        )
      );
    }
  },
  delete_stripe_payment: async (req, res) => {
    try {
      var { pm_id } = req.body;
      const paymentMethod = await stripe.paymentMethods.detach(pm_id);
      return res.json(
        responseData(
          "CARD_DELETED",
          {
            message: "CARD_DELETED",
          },
          req,
          true
        )
      );
    } catch (err) {
      return res.json(
        responseData(
          "CARD_DELETION_FAILED",
          {
            message: "CARD_DELETION_FAILED",
          },
          req,
          false
        )
      );
    }
  },
  logout: async (req, res) => {
    try {
      const { _id } = req.user;
      var user = await User.findOneAndUpdate(
        { _id: _id },
        { $set: { device_token: "", device_type: "" } }
      );

      if (!isEmpty(user)) {
        return res.json(responseData("USER_LOGOUT", {}, req, true));
      } else {
        return res.json(responseData("USER_NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  wuserProfile: async (req, res) => {
    try {
      const { _id } = req.user;
      const user = await User.findOne({ _id }).select({
        password: 0,
        is_mobile_verified: 0,
        status: 0,
        is_deleted: 0,
      });

      const user_data = user.toJSON();

      user_data.first_name = base64Decode(user_data.first_name);
      user_data.last_name = base64Decode(user_data.last_name);
      user_data.email = base64Decode(user_data.email);
      user_data.mobile = base64Decode(user_data.mobile);
      user_data.country_code = base64Decode(user_data.country_code);

      user_data.company_name = base64Decode(user_data.company_name);
      user_data.company_phone = base64Decode(user_data.company_phone);
      user_data.company_reg_no = base64Decode(user_data.company_reg_no);
      user_data.company_vat_no = base64Decode(user_data.company_vat_no);
      user_data.company_reg_date = base64Decode(user_data.company_reg_date);
      user_data.company_postal_code = base64Decode(
        user_data.company_postal_code
      );
      user_data.company_street = base64Decode(user_data.company_street);

      let deviceTokens = generateAuthToken(user_data);

      if (!isEmpty(user_data)) {
        return res.json(
          responseData(
            "PROFILE_DETAILS",
            { ...user_data, ...deviceTokens },
            req,
            true
          )
        );
      } else {
        return res.json(responseData("PROFILE_DETAILS", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  user_forgot_password: async (req, res) => {
    try {
      var { email } = req.body;
      email = base64Encode(email);
      console.log(email);
      const admin = await User.findOne({ email });

      if (!isEmpty(admin)) {
        console.log("country_id", admin.country_id);
        //country_id = await getCountryIdFromCode(admin.country_id);
        let { description, subject } =
          await email_service.getEmailTemplateBySlugAndCountry(
            "forgot-password-user-front",
            admin.country_id
          );
        // console.log("description", admin.country_id);
        // console.log("description", description);
        description = _.replace(
          description,
          "[FIRST_NAME]",
          base64Decode(admin.first_name)
        );

        description = _.replace(
          description,
          "[LAST_NAME]",
          base64Decode(admin.last_name)
        );

        const resetToken = v4().toString().replace(/-/g, "");

        // const link = `${process.env.UI_RESET_LINK}/reset-password/${resetToken}`;
        const link = `https://zoom-web-saakashlh-gmailcom.vercel.app/auth/reset-password/${resetToken}`;

        description = _.replace(description, "[RESET_PASSWORD_LINK]", link);
        description = _.replace(description, "[RESET_PASSWORD_LINK]", link);
        await User.updateOne({ email }, { token: resetToken });
        console.log("description", description);
        sendEmail(base64Decode(admin.email), subject, description);
        const token = { resetToken };
        return res.json(responseData("EMAIL_SENT", token, req, true));
      } else {
        return res.json(responseData("USER_NOT_FOUND", {}, req, false));
      }
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req));
    }
  },
  user_verify_otp: async (req, res) => {
    const { otp, email, mobile, type } = req.body;

    if (!otp) {
      return res.json(responseData("OTP_IS_REQUIRED", {}, req, false));
    }

    let resetotpfound = {};

    if (type == "mobile") {
      resetotpfound = await Otp.findOne({ mobile: mobile, otp: otp });
    } else if (type == "email") {
      resetotpfound = await Otp.findOne({ email: email, otp: otp });
    } else {
      return res.json(
        responseData("FORGOT_PASSWORD_TYPE_USER", {}, req, false)
      );
    }

    if (resetotpfound) {
      return res.json(
        responseData("OTP_IS_VERIFIED", resetotpfound, req, true)
      );
    } else {
      return res.json(
        responseData("OTP_NOT_VERIFIED", resetotpfound, req, false)
      );
    }
  },
  updateToken: async (req, res) => {
    try {
      const user_id = req.user._id;

      const { device_type, device_token } = req.body;
      await User.findOneAndUpdate(
        { _id: user_id },
        { $set: { device_token, device_type } }
      );

      // const p = await User.findOneAndUpdate(
      //   { _id: user_id  },
      //   { device_token, device_type },
      //   { new: true }
      // );

      // var userDetails = {};
      // userDetails.device_type = device_type;
      // userDetails.device_token = device_token;

      // const userData = await User.findByIdAndUpdate(
      //   { _id: user_id },
      //   userDetails,
      // );

      //console.log('req.user.........',userDetails);

      return res.json(responseData("GET_LIST", {}, req, true));
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
  fcm_token: async (req, res) => {
    try {
      const user_id = req.user._id;
      const { fcm_token, device_id, device_type } = req.body;
      await Fcm_token.findOneAndUpdate(
        { user_id, device_id },
        { $set: { user_id, fcm_token, device_id, device_type } },
        { upsert: true }
      );
      return res.json(responseData("GET_LIST", {}, req, true));
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
  user_reset_password: async (req, res) => {
    try {
      const { password } = req.body;
      const token = req.params.token;
      const resettoken = await User.findOne({ token });
      //return res.json(responseData("PASSWORD_CHANGED", resettoken, req, true));
      if (!isEmpty(resettoken)) {
        console.log(resettoken);
        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash(password, salt, async function (err, hash) {
            if (err || !hash) {
              return res.json(responseData("ERROR", {}, req, false));
            } else {
              console.log(resettoken);
              let userDetails = {};
              userDetails.password = hash;
              userDetails.token = null;
              if(resettoken?.role_id === 2 || resettoken?.role_id === 3) userDetails.org_password = password;
              await User.findOneAndUpdate(
                { _id: resettoken._id },
                userDetails
              );
              return res.json(responseData("PASSWORD_CHANGED", {}, req, true));
            }
          });
        });
      } else {
        return res
          .status(422)
          .json(responseData("LINK_INVALID", {}, req, false));
      }
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
  changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const { _id } = req.user;

      const user = await User.findOne({ _id });

      const match = await bcrypt.compare(oldPassword, user.password);
      if (match) {
        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash(newPassword, salt, async function (err, hash) {
            if (err || !hash) {
              return res.json(responseData("ERROR_OCCUR", {}, req, false));
            } else {
              let userDetails = {};
              userDetails.password = hash;
              if(user?.role_id === 2 || user?.role_id === 3) userDetails.org_password = newPassword;
              await User.findOneAndUpdate({ _id }, userDetails);
              return res.json(responseData("PASSWORD_CHANGED", {}, req, true));
            }
          });
        });
      } else {
        return res
          .status(422)
          .json(responseData("INVALID_OLD_PASSWORD", {}, req, false));
      }
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
  edit_user: async (req, res) => {
    try {
      var {
        first_name,
        last_name,
        email,
        mobile,
        country_code,
        country_id,
        zoom_updates,
        notification_flag,
        marketing_offers,
        delete_image,
      } = req.body;
      const { _id } = req.user;

      first_name = base64Encode(first_name);
      last_name = base64Encode(last_name);
      email = base64Encode(email);
      mobile = base64Encode(mobile);
      country_code = base64Encode(country_code);

      const findRecord = await User.findOne({
        email: email,
        _id: { $ne: _id },
      });
      if (!isEmpty(findRecord)) {
        return res
          .status(422)
          .json(responseData("EMAIL_ALREADY_REGISTERED", {}, req, false));
      }
      const findRecordM = await User.findOne({
        country_code,
        mobile,
        _id: { $ne: _id },
      });
      if (!isEmpty(findRecordM)) {
        return res
          .status(422)
          .json(responseData("MOBILE_ALREADY_REGISTERED", {}, req, false));
      }

      const updateValues = {};

      // uploadImageStart
      var image = "";
      const files = req.files;
      if (files && files.image) {
        const data = files.image;
        if (data.name) {
          if (files && files.image.name != undefined) {
            image = await saveFile(files.image, USER_FOLDER, null);
            await saveThumbFile(
              files.image,
              USER_FOLDER,
              null,
              image,
              USER_THUMB_WIDTH,
              USER_THUMB_HEIGHT,
              `public/${USER_FOLDER}/thumb`
            );
          }
        }
      }
      // uploadImageEnd

      if (first_name) updateValues.first_name = first_name;
      if (last_name) updateValues.last_name = last_name;
      if (email) updateValues.email = email;
      if (mobile) updateValues.mobile = mobile;
      if (country_code) updateValues.country_code = country_code;
      if (image) updateValues.image = image;
      if (delete_image == 1) {
        updateValues.image = "";
      }
      if (marketing_offers) updateValues.marketing_offers = marketing_offers;
      if (country_id) updateValues.country_id = country_id;
      updateValues.profile_updated = 1;
      updateValues.zoom_updates = zoom_updates;
      updateValues.notification_flag = notification_flag;
      const userUpdate = await User.findOneAndUpdate(
        { _id },
        { $set: updateValues },
        { new: true }
      );
      if (userUpdate) {
        const userData = userUpdate.toJSON();
        userData.first_name = base64Decode(userData.first_name);
        userData.last_name = base64Decode(userData.last_name);
        userData.email = base64Decode(userData.email);
        userData.mobile = base64Decode(userData.mobile);
        userData.country_code = base64Decode(userData.country_code);
        let deviceTokens = generateAuthToken(userData);
        return res.json(
          responseData(
            "USER_UPDATE_SUCCESS",
            { ...userData, ...deviceTokens },
            req,
            true
          )
        );
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
  edit_wholesale: async (req, res) => {
    try {
      var {
        first_name,
        last_name,
        mobile,
        country_code,
        company_name,
        company_vat_no,
        company_type_id,
        marketing_offers,
        country_id,
        delete_image,
        notification_flag,
      } = req.body;
      const { _id } = req.user;

      first_name = base64Encode(first_name);
      last_name = base64Encode(last_name);
      mobile = base64Encode(mobile);
      country_code = base64Encode(country_code);
      company_name = base64Encode(company_name);
      company_vat_no = base64Encode(company_vat_no);

      // const findRecord = await User.findOne({
      //   email: email,
      //   _id: { $ne: _id },
      // });
      // if (!isEmpty(findRecord)) {
      //   return res
      //     .status(422)
      //     .json(responseData("EMAIL_ALREADY_REGISTERED", {}, req, false));
      // }
      const findRecordM = await User.findOne({
        country_code,
        mobile,
        _id: { $ne: _id },
      });
      if (!isEmpty(findRecordM)) {
        return res
          .status(422)
          .json(responseData("MOBILE_ALREADY_REGISTERED", {}, req, false));
      }

      const updateValues = {};

      // uploadImageStart
      var company_image = "";
      const files = req.files;
      if (files && files.company_image) {
        const data = files.company_image;
        if (data.name) {
          if (files && files.company_image.name != undefined) {
            company_image = await saveFile(
              files.company_image,
              COMPANY_FOLDER,
              null
            );
            await saveThumbFile(
              files.company_image,
              COMPANY_FOLDER,
              null,
              company_image,
              USER_THUMB_WIDTH,
              USER_THUMB_HEIGHT,
              `public/${COMPANY_FOLDER}/thumb`
            );
          }
        }
      }
      // uploadImageEnd

      // uploadImageStart
      // var reg_certificate = "";
      // if (files && files.reg_certificate) {
      //   const data = files.reg_certificate;
      //   if (data.name) {
      //     if (files && files.reg_certificate.name != undefined) {
      //       reg_certificate = await saveFile(
      //         files.reg_certificate,
      //         COMPANY_FOLDER,
      //         null
      //       );
      //       await saveThumbFile(
      //         files.reg_certificate,
      //         COMPANY_FOLDER,
      //         null,
      //         reg_certificate,
      //         USER_THUMB_WIDTH,
      //         USER_THUMB_HEIGHT,
      //         `public/${COMPANY_FOLDER}/thumb`
      //       );
      //     }
      //   }
      // }
      // uploadImageEnd

      if (first_name) updateValues.first_name = first_name;
      if (last_name) updateValues.last_name = last_name;
      if (mobile) updateValues.mobile = mobile;
      if (country_code) updateValues.country_code = country_code;
      if (company_image) updateValues.company_image = company_image;
      if (delete_image == 1) {
        updateValues.company_image = "";
      }
      //if (reg_certificate) updateValues.reg_certificate = reg_certificate;
      if (company_name) updateValues.company_name = company_name;
      if (company_vat_no) updateValues.company_vat_no = company_vat_no;
      if (company_type_id) updateValues.company_type_id = company_type_id;
      if (country_id) updateValues.country_id = country_id;
      if (marketing_offers) updateValues.marketing_offers = marketing_offers;
      if (notification_flag) updateValues.notification_flag = notification_flag;
      updateValues.profile_updated = 1;
      //updateValues.zoom_updates = zoom_updates;
      //updateValues.notification_flag = notification_flag;
      const userUpdate = await User.findOneAndUpdate(
        { _id },
        { $set: updateValues },
        { new: true }
      );
      if (userUpdate) {
        const userData = userUpdate.toJSON();
        userData.first_name = base64Decode(userData.first_name);
        userData.last_name = base64Decode(userData.last_name);
        userData.email = base64Decode(userData.email);
        userData.mobile = base64Decode(userData.mobile);
        userData.country_code = base64Decode(userData.country_code);
        userData.company_name = base64Decode(userData.company_name);
        userData.company_phone = base64Decode(userData.company_phone);
        userData.company_vat_no = base64Decode(userData.company_vat_no);
        userData.company_type_id = userData.company_type_id;
        userData.company_reg_date = base64Decode(userData.company_reg_date);
        userData.city_id = userData.city_id;
        userData.country_id = userData.country_id;

        let deviceTokens = generateAuthToken(userData);
        return res.json(
          responseData(
            "USER_UPDATE_SUCCESS",
            { ...userData, ...deviceTokens },
            req,
            true
          )
        );
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
  home_screen: async (req, res) => {
    try {
      const services = await Service.find({ status: 1 });
      const pets = await Pet.find({ status: 1 });
      if (!isEmpty(services)) {
        return res.json(
          responseData("GET_LIST", { services, pets }, req, true)
        );
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
  fcm_token: async (req, res) => {
    try {
      const user_id = req.user._id;
      const { fcm_token, device_id, device_type } = req.body;
      await Fcm_token.findOneAndUpdate(
        { user_id, device_id },
        { $set: { user_id, fcm_token, device_id, device_type } },
        { upsert: true }
      );
      return res.json(responseData("GET_LIST", {}, req, true));
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
  social_login_check: async (req, res) => {
    try {
      const { social_id, social_type } = req.body;
      const check = await User.findOne({ social_type, social_id });
      if (isEmpty(check)) {
        return res.json(responseData("SOCIAL_NOT_REGISTERED", {}, req, false));
      } else {
        delete check._doc["password"];
        delete check._doc["__v"];
        let deviceTokens = generateAuthToken(check);
        return res.json(
          responseData(
            "ACCOUNT_LOGIN",
            { ...check._doc, ...deviceTokens },
            req,
            true
          )
        );
      }
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
  addToCart: async (req, res) => {
    try {
      var { item_id, quantity, store_id } = req.body;
      item_id = Types.ObjectId(item_id);
      store_id = Types.ObjectId(store_id);
      const { _id, country_id } = req.user;

      var orderDetails = await Order.findOne({ user_id: _id, status: 1 });
      if (orderDetails == null) {
        var check_quantity = await checkIsSpacialQuantity(
          item_id,
          country_id,
          quantity
        );
        if (check_quantity?.flag == 0) {
          return res.json(
            responseData(
              `This is special product you can't purchase more than ${check_quantity.special_quantity} quantity.`,
              {},
              req,
              false
            )
          );
        }
        orderDetails = await Order.create({
          user_id: _id,
          status: 1,
          store_id: store_id,
          items: [{ quantity: quantity, id: item_id }],
        });
      } else {
        if (orderDetails.store_id.toString() == store_id.toString()) {
          upsert(orderDetails.items, {
            id: item_id,
            quantity: quantity,
          });

          //console.log('orderDetails.itemsorderDetails.itemsorderDetails.items',orderDetails?.items?.[0]?.quantity);
          var check_quantity = await checkIsSpacialQuantity(
            item_id,
            country_id,
            quantity
          );
          if (check_quantity?.flag == 0) {
            return res.json(
              responseData(
                `This is special product you can't purchase more than ${check_quantity?.special_quantity} quantity.`,
                {},
                req,
                false
              )
            );
          }
          await Order.updateOne(
            { _id: orderDetails._id },
            { items: orderDetails.items }
          );
        } else {
          return res
            .status(200)
            .json(
              responseData(
                "PRODUCT_FROM_OTHER_STORE",
                { show_alert: true },
                req,
                false
              )
            );
        }
      }
      var order_Items = await Order.findOne({ user_id: _id, status: 1 });
      return res.json(
        responseData(
          "CART_UPDATED",
          { product_count: order_Items.items.length },
          req,
          true
        )
      );
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
  addToCartFresh: async (req, res) => {
    try {
      var { item_id, quantity, store_id } = req.body;
      item_id = Types.ObjectId(item_id);
      store_id = Types.ObjectId(store_id);
      const { _id } = req.user;

      var orderDetails = await Order.findOne({ user_id: _id, status: 1 });
      await Order.deleteOne({ _id: orderDetails._id });
      orderDetails = await Order.create({
        user_id: _id,
        status: 1,
        store_id: store_id,
        items: [{ quantity: quantity, id: item_id }],
      });
      return res.json(responseData("CART_UPDATED", {}, req, true));
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
  removeItem: async (req, res) => {
    try {
      var { _id } = req.user;
      var { item_id } = req.body;
      console.log(item_id);
      //return false;
      var orderDetails = await Order.findOne(
        {
          user_id: Types.ObjectId(_id),
          status: 1,
        },
        {
          items: 1,
        },
        { lean: true }
      );
      if (orderDetails == null) {
        return res.json(responseData("REMOVE_ITEM", {}, req, true));
      }
      if (orderDetails.items.length) {
        var indexOfObject = orderDetails.items.findIndex((object) => {
          return object.id.toString() === item_id.toString();
        });
        if (indexOfObject >= 0) {
          orderDetails.items.splice(indexOfObject, 1);
        }
      }
      if (orderDetails.items.length == 0) {
        await Order.deleteOne({ _id: orderDetails._id });
      } else {
        await Order.updateOne({ _id: orderDetails._id }, orderDetails);
      }
      return res.json(responseData("REMOVE_ITEM", orderDetails, req, true));
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
  updateItem: async (req, res) => {
    try {
      var { _id, country_id } = req.user;

      var { item_id, quantity } = req.body;

      var check_quantity = await checkIsSpacialQuantity(
        item_id,
        country_id,
        quantity
      );
      console.log("check_quantity",check_quantity);
      if (check_quantity?.flag == 0) {
        return res.json(
          responseData(
            `This is special product you can't purchase more than ${check_quantity.special_quantity} quantity.`,
            {},
            req,
            false
          )
        );
      }
      // var product_data = await Product.findOne({ _id: Types.ObjectId(item_id)});
      // var setting_data = await Setting.findOne({ country_id: Types.ObjectId(country_id)});

      // console.log("quantity",quantity);
      // console.log("setting_data.special_max",setting_data.special_max);
      // if(product_data.is_special==true && setting_data.special_max <= quantity){
      //   return res.json(responseData("Can't add above Special Product Max Order Qty", {}, req, false));
      // }

      var orderDetails = await Order.findOne(
        {
          user_id: Types.ObjectId(_id),
          status: 1,
        },
        {
          items: 1,
        },
        { lean: true }
      );
      if (orderDetails == null) {
        return res.json(responseData("UPDATED_ITEM", {}, req, true));
      }
      upsertUpdate(orderDetails.items, {
        id: item_id,
        quantity: quantity,
      });
      await Order.updateOne({ _id: orderDetails._id }, orderDetails);
      return res.json(responseData("UPDATED_ITEM", {}, req, true));
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
  timeslots: async (req, res) => {
    try {
      var { current_date, order_id } = req.body;
      var old_current_date = current_date;
      current_date = current_date.split("-");

      console.log("order_id----", order_id);

      var { _id } = req.user;
      if (order_id) {
        var orderDetails = await Order.findOne(
          {
            _id: Types.ObjectId(order_id),
          },
          {
            address_id: 1,
            store_id: 1,
            subtotal: 1,
            items: 1,
            address: 1,
          },
          { lean: true }
        );
      } else {
        var orderDetails = await Order.findOne(
          {
            user_id: Types.ObjectId(_id),
            status: 1,
          },
          {
            address_id: 1,
            store_id: 1,
            subtotal: 1,
            items: 1,
            address: 1,
          },
          { lean: true }
        );
      }

      console.log("orderDetails----", orderDetails);
      var delivery_distance = 0;
      if (orderDetails) {
        const storeDetails = await Store.findOne(
          { _id: Types.ObjectId(orderDetails.store_id) },
          {
            latitude: 1,
            longitude: 1,
          },
          { lean: true }
        );
        // console.log('dddstoreDetails',storeDetails);
        // console.log("storeDetails.latitude",storeDetails.latitude);
        // console.log("storeDetails.longitude",storeDetails.longitude);
        // console.log("orderDetails.address.latitude",orderDetails.address.latitude);
        // console.log("orderDetails.address.longitude",orderDetails.address.longitude);

        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${storeDetails.latitude},${storeDetails.longitude}&destinations=${orderDetails.address.latitude},${orderDetails.address.longitude}&key=AIzaSyAADBNwV_uF59PgLNESo8aSPDGr9dr40vs&mode=driving`;
        const data = JSON.stringify({});
        const method = "post";
        const header = {
          "Content-Type": "application/json",
          Authorization: ``,
        };
        let response_distance = await axiosCalling(url, "", method, header);
        console.log("response_distanceresponse_distance", url);
        console.log(
          "response_distanceresponse_distance",
          response_distance.data.rows[0].elements
        );
        var distance_km =
          response_distance.data.rows[0].elements[0].distance["text"];
        var distance = distance_km.split(" ");
        delivery_distance = distance[0];
      }
      console.log("vvvvvvvvvvvv....", orderDetails?.items);
      var country_id = Types.ObjectId(orderDetails?.items[0]?.country_id);
      var settingsDetail = await setting_service.getSettingsRow(country_id);
      var delivery_days = settingsDetail.delivery_days;
      var delivery_slots_duration = parseInt(
        settingsDetail.delivery_slots_duration
      );

      var start_time = moment(
        old_current_date + " " + settingsDetail.delivery_start_time + ":00"
      ).unix();

      var end_time = moment(
        old_current_date + " " + settingsDetail.delivery_end_time + ":00"
      ).unix();
      var start_timeI = 0;
      var timeslots = [];
      while (start_time < end_time) {
        start_timeI = start_time;
        start_time = start_time + 3600 * delivery_slots_duration;
        if (start_time <= end_time) {
          timeslots.push(
            moment.unix(start_timeI).format("hh:mm A") +
              " " +
              moment.unix(start_time).format("hh:mm A")
          );
        }
      }

      //console.log("data", date);
      //return false;

      allDeliveryDays = [];
      for (let i = 0; i < delivery_days; i++) {
        var date = moment([
          current_date[0],
          current_date[1] - 1,
          current_date[2],
        ])
          .add(i, "days")
          .format("YYYY-MM-DD");
        var day = moment([
          current_date[0],
          current_date[1] - 1,
          current_date[2],
        ])
          .add(i, "days")
          .format("ddd");
        if (settingsDetail.block_day) {
          if (settingsDetail.block_day == day) {
            allDeliveryDays.push({ date: date, status: false });
          } else {
            allDeliveryDays.push({ date: date, status: true });
          }
        } else {
          allDeliveryDays.push({ date: date, status: true });
        }
      }

      var resp = {};
      resp.allDeliveryDays = allDeliveryDays;
      resp.block_day = settingsDetail.block_day;
      resp.timeslots = timeslots;
      resp.express_enabled = settingsDetail.express_enabled;
      resp.ex_delivery_start_time = settingsDetail.ex_delivery_start_time;
      resp.ex_delivery_end_time = settingsDetail.ex_delivery_end_time;
      resp.express_enabled = settingsDetail.express_enabled;

      if (settingsDetail.delivery_type == 1) {
        resp.express_charge = 0;
        resp.normal_charge = 0;
      } else if (settingsDetail.delivery_type == 2) {
        resp.express_charge = settingsDetail.express;
        resp.normal_charge = settingsDetail.normal;
      } else if (settingsDetail.delivery_type == 3) {
        resp.express_charge = 0;
        resp.normal_charge = 0;
        settingsDetail.tiers.filter(function (e) {
          if (
            e.min <= Number(delivery_distance) &&
            e.max >= Number(delivery_distance)
          ) {
            resp.express_charge = e.express;
            resp.normal_charge = e.normal;
          }
        });
      } else if (settingsDetail.delivery_type == 4) {
        resp.express_charge = 0;
        resp.normal_charge = 0;
        settingsDetail.tiers_price.filter(function (e) {
          if (
            e.min <= orderDetails.subtotal &&
            e.max >= orderDetails.subtotal
          ) {
            resp.express_charge = e.express;
            resp.normal_charge = e.normal;
          }
        });
      }

      resp.online_payment = settingsDetail.online_payment;
      resp.cash_on_delivery = settingsDetail.cash_on_delivery;
      resp.card_on_delivery = settingsDetail.card_on_delivery;

      return res.json(
        responseData("Schedule has been generated", resp, req, true)
      );
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
  addDeliveryDetails: async (req, res) => {
    try {
      var { _id, role_id, country_code } = req.user;
      var {
        delivery_time,
        delivery_date,
        delivery_price,
        gift_card_price,
        delivery_message,
        gift_card_message,
        delivery_type,
        payment_mode,
        timezone,
      } = req.body;

      var orderDetails = await Order.findOne(
        {
          user_id: Types.ObjectId(_id),
          status: 1,
        },
        {
          items: 1,
        },
        { lean: true }
      );
      if (orderDetails == null) {
        return res
          .status(422)
          .json(responseData("EMPTY_CART_DELIVERY", {}, req, false));
      }
      if (delivery_type == 2) {
        var delivery_date1 = moment.utc().toISOString();
        var delivery_time1 = moment().add(60, "minutes").utc().toISOString();
      } else {
        var delivery_time_slot = delivery_time.split(" ");

        if (delivery_time_slot[1] == "PM") {
          let arr2 = delivery_time_slot[0].split(":");
          if (Number(arr2[0]) < 12) {
            arr2[0] = Number(arr2[0]) + 12;
            delivery_time_slot[0] = arr2.join(":");
          }
        }

        if (delivery_time_slot[3] == "PM") {
          let arr2 = delivery_time_slot[2].split(":");
          if (Number(arr2[0]) < 12) {
            arr2[0] = Number(arr2[0]) + 12;
            delivery_time_slot[2] = arr2.join(":");
          }
        }
        var delivery_date1 = new Date(
          momentTz
            .tz(delivery_date + " " + delivery_time_slot[0] + "", timezone)
            .utc()
            .toISOString()
        );

        var delivery_time1 = new Date(
          momentTz
            .tz(delivery_date + " " + delivery_time_slot[2] + "", timezone)
            .utc()
            .toISOString()
        );

        console.log("..ddd", delivery_time_slot[2]);
        console.log("..cccc", delivery_time_slot[0]);
      }
      console.log("ddddd...", orderDetails);
      var settingsDetail = await setting_service.getSettingsRow(
        orderDetails?.items[0].country_id
      );
      var setting_night_start_date = new Date(
        momentTz
          .tz(
            delivery_date +
              " " +
              settingsDetail?.night_delivery_start_time +
              "",
            timezone
          )
          .utc()
          .toISOString()
      );

      var setting_night_end_date = new Date(
        momentTz
          .tz(
            delivery_date + " " + settingsDetail?.night_delivery_end_time + "",
            timezone
          )
          .utc()
          .toISOString()
      );

      orderDetails.delivery_date = delivery_date1;
      orderDetails.delivery_time = delivery_time1;

      orderDetails.delivery_price = delivery_price;
      if(gift_card_price){
        orderDetails.gift_card_price = gift_card_price;
      }else{
        orderDetails.gift_card_price = 0;
      }
      
      orderDetails.delivery_message = delivery_message;
      orderDetails.gift_card_message = gift_card_message;
      if (
        delivery_date1 >= setting_night_start_date &&
        delivery_time1 <= setting_night_end_date
      ) {
        orderDetails.delivery_night_charges = settingsDetail?.night_charges;
      } else {
        orderDetails.delivery_night_charges = 0;
      }

      orderDetails.delivery_type = delivery_type;
      orderDetails.payment_mode = payment_mode;

      const resp = await Order.updateOne(
        { _id: orderDetails._id },
        orderDetails
      );

      return res.json(responseData("DELIVERY_ADDED", orderDetails, req, true));
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
  myCart: async (req, res) => {
    try {
      var { _id, role_id, company_w_id, country_code } = req.user;

      // var timezone= "";
      // var start_date = new Date(
      //   momentTz
      //     .tz(start_date + " 00:00:00", timezone)
      //     .utc()
      //     .toISOString()
      // );

      //console.log("Date.now()",moment().unix()); return false;
      // console.log(start_date); return false;
      // var { coupon_code } = req.body;

      //country_id = await getCountryIdFromCode(country_code);
      console.log(_id);

      var wholesaleCatId = "";
      var loyalty_points = "";
      if (_id) {
        var user_data = await User.findOne({ _id });
        wholesaleCatId = user_data.wholesaleusercategory_id;

        const query = LoyaltyPoint.aggregate([
          {
            $match: { user_id: Types.ObjectId(_id) },
          },
          {
            $project: {
              user_id: 1,
              type: 1,
              order_id: 1,
              points: 1,
              createdAt: 1,
            },
          },
        ]).collation({ locale: "en", strength: 1 });
        var finaldata = await LoyaltyPoint.aggregatePaginate(query);

        var creditedPoint = 0;
        var debitedPoint = 0;
        var creditedNo = 0;
        finaldata?.docs?.forEach(function (item) {
          if (item?.type === "credited") {
            creditedPoint += item?.points;
            creditedNo++;
          } else if (item?.type === "debited") {
            debitedPoint += item?.points;
          }
        });
        finaldata.creditedPoint = creditedPoint;
        finaldata.debitedPoint = debitedPoint;
        finaldata.creditNumber = creditedNo;
        loyalty_points = creditedPoint - debitedPoint;
      }

      company_w_id = wholesaleCatId;
      var orderDetails = await Order.findOne(
        { user_id: _id, status: 1 },
        { items: 1, store_id: 1, offer: 1 },
        { lean: true }
      );
      if (orderDetails == null) {
        return res.json(responseData("CART_ITEM_LIST", {}, req, true));
      }

      var allItems = [];
      if (orderDetails) {
        if (orderDetails.items.length) {
          for (let i = 0; i < orderDetails.items.length; i++) {
            allItems.push(orderDetails.items[i].id);
          }
        }
      }
      console.log(moment().unix());

      var match = {};
      match._id = {
        $in: allItems,
      };
      if (role_id == 1) {
        var pipeline = [
          { $match: match },
          {
            $lookup: {
              from: "brands",
              localField: "brand_id",
              foreignField: "_id",
              as: "brand",
            },
          },
          {
            $unwind: {
              path: "$brand",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "storeproducts",
              let: { id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: [
                            "$store_id",
                            Types.ObjectId(orderDetails.store_id),
                          ],
                        },
                        { $eq: ["$product_id", "$$id"] },
                      ],
                    },
                  },
                },
              ],
              as: "storeproduct",
            },
          },
          {
            $unwind: {
              path: "$storeproduct",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "sizecodes",
              let: { id: "$size_code_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$$id", "$_id"] },
                  },
                },
              ],
              as: "sizecode",
            },
          },
          {
            $unwind: {
              path: "$sizecode",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "vatcodes",
              localField: "vat_code_id",
              foreignField: "_id",
              as: "vatcode",
            },
          },
          {
            $unwind: {
              path: "$vatcode",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "categories",
              foreignField: "_id",
              as: "categoriesz",
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              description: 1,
              country_id: 1,
              brand_id: 1,
              supplier_id: 1,
              vat_code_id: 1,
              size_code_id: 1,
              size: 1,
              price: 1,
              offer_price: 1,
              storeproduct: 1,
              main_price: {
                $cond: {
                  if: { $ne: ["$offer_price", null] },
                  then: {
                    $cond: {
                      if: {
                        $and: [
                          { $eq: ["$offer_start_at", null] },
                          { $eq: ["$offer_start_end", null] },
                        ],
                      },
                      then: "$price",
                      else: {
                        $cond: {
                          if: {
                            $and: [
                              { $ne: ["$offer_start_at", null] },
                              { $ne: ["$offer_start_end", null] },
                              { $gte: [moment().unix(), "$offer_start_at"] },
                              { $lte: [moment().unix(), "$offer_start_end"] },
                            ],
                          },
                          then: "$offer_price",
                          else: {
                            $cond: {
                              if: {
                                $and: [
                                  { $ne: ["$offer_start_at", null] },
                                  { $eq: ["$offer_start_end", null] },
                                  {
                                    $gte: [moment().unix(), "$offer_start_at"],
                                  },
                                ],
                              },
                              then: "$offer_price",
                              else: {
                                $cond: {
                                  if: {
                                    $and: [
                                      { $ne: ["$offer_start_end", null] },
                                      { $eq: ["$offer_start_at", null] },
                                      {
                                        $lte: [
                                          moment().unix(),
                                          "$offer_start_end",
                                        ],
                                      },
                                    ],
                                  },
                                  then: "$offer_price",
                                  else: "$price",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  else: "$price",
                },
              },
              offer_flag: {
                $cond: {
                  if: { $ne: ["$offer_price", null] },
                  then: {
                    $cond: {
                      if: {
                        $and: [
                          { $eq: ["$offer_start_at", null] },
                          { $eq: ["$offer_start_end", null] },
                        ],
                      },
                      then: 0,
                      else: {
                        $cond: {
                          if: {
                            $and: [
                              { $ne: ["$offer_start_at", null] },
                              { $ne: ["$offer_start_end", null] },
                              { $gte: [moment().unix(), "$offer_start_at"] },
                              { $lte: [moment().unix(), "$offer_start_end"] },
                            ],
                          },
                          then: 1,
                          else: {
                            $cond: {
                              if: {
                                $and: [
                                  { $ne: ["$offer_start_at", null] },
                                  { $eq: ["$offer_start_end", null] },
                                  {
                                    $gte: [moment().unix(), "$offer_start_at"],
                                  },
                                ],
                              },
                              then: 1,
                              else: {
                                $cond: {
                                  if: {
                                    $and: [
                                      { $ne: ["$offer_start_end", null] },
                                      { $eq: ["$offer_start_at", null] },
                                      {
                                        $lte: [
                                          moment().unix(),
                                          "$offer_start_end",
                                        ],
                                      },
                                    ],
                                  },
                                  then: 1,
                                  else: 0,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  else: 0,
                },
              },
              buy_price: 1,
              sku: 1,
              status: 1,
              createdAt: 1,
              updatedAt: 1,
              w_prices: 1,
              images: 1,
              categories: 1,
              categoriesz: 1,
              offer_price: 1,
              offer_start_at: 1,
              offer_start_end: 1,
              w_discount_per: 1,
              w_offer_start_at: 1,
              w_offer_start_end: 1,
              minimum_quantity_for_wholesaler: 1,
              min_qty_stock: 1,
              bar_code: 1,
              is_special: 1,
              min_qty_stock: 1,
              admin_limit: 1,
              product_unit: { $ifNull: ["$sizecode.name", ""] },
              "vatcode.name": { $ifNull: ["$vatcode.name", ""] },
              "brand._id": { $ifNull: ["$brand._id", ""] },
              "brand.name": { $ifNull: ["$brand.name", ""] },
              "vatcode._id": { $ifNull: ["$vatcode._id", ""] },
              "vatcode.name": { $ifNull: ["$vatcode.name", ""] },
              "vatcode.percentage": { $ifNull: ["$vatcode.percentage", ""] },
            },
          },
        ];
      } else {
        console.log("....................dd222", match);
        var pipeline = [
          { $match: match },
          {
            $lookup: {
              from: "brands",
              localField: "brand_id",
              foreignField: "_id",
              as: "brand",
            },
          },
          {
            $unwind: {
              path: "$brand",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "storeproducts",
              let: { id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: [
                            "$store_id",
                            Types.ObjectId(orderDetails.store_id),
                          ],
                        },
                        { $eq: ["$product_id", "$$id"] },
                      ],
                    },
                  },
                },
              ],
              as: "storeproduct",
            },
          },
          {
            $unwind: {
              path: "$storeproduct",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $unwind: {
              path: "$sizecode",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "vatcodes",
              localField: "vat_code_id",
              foreignField: "_id",
              as: "vatcode",
            },
          },
          {
            $lookup: {
              from: "vatcodes",
              localField: "vat_code_id",
              foreignField: "_id",
              as: "vatcode",
            },
          },
          {
            $unwind: {
              path: "$vatcode",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "categories",
              localField: "categories",
              foreignField: "_id",
              as: "categoriesz",
            },
          },
          {
            $addFields: {
              prices: {
                $filter: {
                  input: "$w_prices",
                  as: "us",
                  cond: {
                    $eq: ["$$us.c_id", Types.ObjectId(company_w_id)],
                  },
                },
              },
              discount: {
                $cond: {
                  if: { $ne: ["$w_discount_per", null] },
                  then: {
                    $cond: {
                      if: {
                        $and: [
                          { $eq: ["$w_offer_start_at", null] },
                          { $eq: ["$w_offer_start_end", null] },
                        ],
                      },
                      then: "$w_discount_per",
                      else: {
                        $cond: {
                          if: {
                            $and: [
                              { $ne: ["$w_offer_start_at", null] },
                              { $ne: ["$w_offer_start_end", null] },
                              { $gte: [moment().unix(), "$w_offer_start_at"] },
                              { $lte: [moment().unix(), "$w_offer_start_end"] },
                            ],
                          },
                          then: "$w_discount_per",
                          else: {
                            $cond: {
                              if: {
                                $and: [
                                  { $ne: ["$w_offer_start_at", null] },
                                  { $eq: ["$w_offer_start_end", null] },
                                  {
                                    $gte: [
                                      moment().unix(),
                                      "$w_offer_start_at",
                                    ],
                                  },
                                ],
                              },
                              then: "$w_discount_per",
                              else: {
                                $cond: {
                                  if: {
                                    $and: [
                                      { $ne: ["$w_offer_start_end", null] },
                                      { $eq: ["$w_offer_start_at", null] },
                                      {
                                        $lte: [
                                          moment().unix(),
                                          "w_offer_start_end",
                                        ],
                                      },
                                    ],
                                  },
                                  then: "$w_discount_per",
                                  else: 0,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  else: 0,
                },
              },
            },
          },
          {
            $unwind: {
              path: "$prices",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              pricew: {
                $cond: {
                  if: { $gt: ["$discount", 0] },
                  then: {
                    $subtract: [
                      "$prices.price",
                      {
                        $multiply: [
                          { $divide: ["$discount", 100] },
                          "$prices.price",
                        ],
                      },
                    ],
                  },
                  else: "$prices.price",
                },
              },
              main_price1: {
                $cond: {
                  if: { $ne: ["$offer_price", null] },
                  then: {
                    $cond: {
                      if: {
                        $and: [
                          { $eq: ["$offer_start_at", null] },
                          { $eq: ["$offer_start_end", null] },
                        ],
                      },
                      then: "$price",
                      else: {
                        $cond: {
                          if: {
                            $and: [
                              { $ne: ["$offer_start_at", null] },
                              { $ne: ["$offer_start_end", null] },
                              { $gte: [moment().unix(), "$offer_start_at"] },
                              { $lte: [moment().unix(), "$offer_start_end"] },
                            ],
                          },
                          then: "$offer_price",
                          else: {
                            $cond: {
                              if: {
                                $and: [
                                  { $ne: ["$offer_start_at", null] },
                                  { $eq: ["$offer_start_end", null] },
                                  {
                                    $gte: [moment().unix(), "$offer_start_at"],
                                  },
                                ],
                              },
                              then: "$offer_price",
                              else: {
                                $cond: {
                                  if: {
                                    $and: [
                                      { $ne: ["$offer_start_end", null] },
                                      { $eq: ["$offer_start_at", null] },
                                      {
                                        $lte: [
                                          moment().unix(),
                                          "$offer_start_end",
                                        ],
                                      },
                                    ],
                                  },
                                  then: "$offer_price",
                                  else: "$price",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  else: "$price",
                },
              },
              offer_flag: {
                $cond: {
                  if: { $ne: ["$offer_price", null] },
                  then: {
                    $cond: {
                      if: {
                        $and: [
                          { $eq: ["$offer_start_at", null] },
                          { $eq: ["$offer_start_end", null] },
                        ],
                      },
                      then: 0,
                      else: {
                        $cond: {
                          if: {
                            $and: [
                              { $ne: ["$offer_start_at", null] },
                              { $ne: ["$offer_start_end", null] },
                              { $gte: [moment().unix(), "$offer_start_at"] },
                              { $lte: [moment().unix(), "$offer_start_end"] },
                            ],
                          },
                          then: 1,
                          else: {
                            $cond: {
                              if: {
                                $and: [
                                  { $ne: ["$offer_start_at", null] },
                                  { $eq: ["$offer_start_end", null] },
                                  {
                                    $gte: [moment().unix(), "$offer_start_at"],
                                  },
                                ],
                              },
                              then: 1,
                              else: {
                                $cond: {
                                  if: {
                                    $and: [
                                      { $ne: ["$offer_start_end", null] },
                                      { $eq: ["$offer_start_at", null] },
                                      {
                                        $lte: [
                                          moment().unix(),
                                          "$offer_start_end",
                                        ],
                                      },
                                    ],
                                  },
                                  then: 1,
                                  else: 0,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  else: "$price",
                },
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              pricew: 1,
              description: 1,
              country_id: 1,
              brand_id: 1,
              storeproduct: 1,
              supplier_id: 1,
              vat_code_id: 1,
              size_code_id: 1,
              size: 1,
              buy_price: 1,
              sku: 1,
              status: 1,
              createdAt: 1,
              updatedAt: 1,
              w_prices: 1,
              images: 1,
              categories: 1,
              categoriesz: 1,
              offer_price: 1,
              offer_start_at: 1,
              offer_start_end: 1,
              w_discount_per: 1,
              min_qty_stock: 1,
              minimum_quantity_for_wholesaler: 1,
              w_offer_start_at: 1,
              w_offer_start_end: 1,
              bar_code: 1,
              is_special: 1,
              min_qty_stock: 1,
              admin_limit: 1,
              discount: 1,
              offer_flag: 1,
              price: {
                $cond: {
                  if: { $gt: ["$pricew", 0] },
                  then: "$pricew",
                  else: "$price",
                },
              },
              main_price: {
                $cond: {
                  if: { $gt: ["$pricew", 0] },
                  then: "$pricew",
                  else: "$main_price1",
                },
              },
              product_unit: { $ifNull: ["$sizecode.name", ""] },
              "brand._id": { $ifNull: ["$brand._id", ""] },
              "brand.name": { $ifNull: ["$brand.name", ""] },
              "vatcode._id": { $ifNull: ["$vatcode._id", ""] },
              "vatcode.name": { $ifNull: ["$vatcode.name", ""] },
              "vatcode.percentage": { $ifNull: ["$vatcode.percentage", ""] },
            },
          },
        ];
      }
      //console.log(allProductDetails);
      var allProductDetails = await Product.aggregate(pipeline);
      console.log("..........allProductDetails", allProductDetails);

      if (allProductDetails.length > 0) {
        for (let j = 0; j < allProductDetails.length; j++) {
          upsertItem(
            orderDetails.items,
            {
              id: allProductDetails[j]._id,
              data: allProductDetails[j],
            },
            role_id
          );
        }
      }
      let quantity = 0;
      let subtotal = 0;
      let total_taxable = 0;
      let total_margin = 0;

      /*let vat = 0;
      let vat_inclusive = false;
      if (role_id == 1) {
        vat_inclusive = true;
      } else {
        vat_inclusive = false;
      }
      */
      if (orderDetails.items.length) {
        orderDetails.items.forEach((element) => {
          if (Object.keys(element).length == 2) {
            var indexOfObject = orderDetails.items.findIndex((object) => {
              return object.id == element.id;
            });
            if (indexOfObject) {
              orderDetails.items.splice(indexOfObject, 1);
            }
          } else {
            quantity = quantity + element.quantity;
            subtotal = subtotal + element.priceAmount;
            total_margin =
              total_margin + element.margin_price * element.quantity;
            //total_tax_amount = total_tax_amount + parseFloat(element.vatAmount);
            //vat = vat + element.vatAmount;
          }
        });

        orderDetails.quantity = quantity;
        orderDetails.subtotal = subtotal;
        orderDetails.total_taxable = total_taxable;
        orderDetails.total_margin = total_margin;

        var minimum_order_value_c = 0;
        var minimum_order_value_w = 0;
        if (orderDetails?.items[0].country_id) {
          const settingDetail = await Setting.findOne({
            country_id: orderDetails.items[0].country_id,
          });
          orderDetails.gift_card_price = settingDetail.gift_cart_charges;
          minimum_order_value_c = settingDetail.minimum_order_value_c;
          minimum_order_value_w = settingDetail.minimum_order_value_w;
        } else {
          orderDetails.gift_card_price = 0;
        }

        //console.log('orderDetails.taxable..........',taxable);
        /*orderDetails.vat_inclusive = vat_inclusive;
        orderDetails.vat = vat;
        orderDetails.vat_inclusive = vat_inclusive;
        if (vat_inclusive) {
          orderDetails.total = orderDetails.subtotal;
        } else {
          orderDetails.total = orderDetails.subtotal + orderDetails.vat;
        }*/
      }

      orderDetails.offer = {};
      orderDetails.discount = 0;
      orderDetails.loyalty_points = 0;

      await Order.updateOne({ _id: orderDetails._id }, orderDetails);

      //console.log(".........11details",orderDetails);

      orderDetails = JSON.parse(JSON.stringify(orderDetails));
      orderDetails.loyalty_points = loyalty_points;
      orderDetails.total_product = orderDetails.items.length;

      if (minimum_order_value_c) {
        orderDetails.minimum_order_value_c = minimum_order_value_c;
        orderDetails.minimum_order_value_w = minimum_order_value_w;
      }

      return res.json(responseData("CART_ITEM_LIST", orderDetails, req, true));
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
  addressChecker: async (req, res) => {
    try {
      var { _id } = req.user;
      var { lat, lng } = req.body;

      var orderDetails = await Order.findOne(
        {
          user_id: Types.ObjectId(_id),
          status: 1,
        },
        {
          store_id: 1,
        },
        { lean: true }
      );
      if (orderDetails == null) {
        return res
          .status(422)
          .json(responseData("Cart is empty.", {}, req, false));
      }

      //
      var match = {};
      match._id = orderDetails.store_id;
      const allStores = await Store.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [lng, lat],
            },
            distanceField: "distance",
          },
        },
        { $match: { $expr: { $lte: ["$distance", "$store_radius"] } } },
        { $match: match },
      ]);
      //
      console.log(allStores.length);
      if (allStores.length == 0) {
        return res
          .status(201)
          .json(responseData("OTHER_LOCATION", {}, req, false));
      } else {
        return res.json(responseData("RIGHT_LOCATION", {}, req, true));
      }
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
  applyCoupon: async (req, res) => {
    try {
      var { _id, role_id, country_code } = req.user;

      var orderDetails = await Order.findOne(
        {
          user_id: Types.ObjectId(_id),
          status: 1,
        },
        {
          items: 1,
          quantity: 1,
          subtotal: 1,
          total: 1,
          // offer: 1,
          // discount: 1,
          vat_inclusive: 1,
          vat: 1,
        },
        { lean: true }
      );
      if (orderDetails == null) {
        return res.status(422).json(responseData("EMPTY_CART", {}, req, false));
      }
      //country_id = await getCountryIdFromCode(country_code);
      var { coupon_code } = req.body;

      offerDetails = await Offer.findOne({
        code: { $regex: _.trim(coupon_code), $options: "i" },
        status: 1,
        //expiry_date: { $gt: new Date() },
      });
      if (offerDetails == null) {
        return res
          .status(422)
          .json(responseData("INVALID_COUPON", {}, req, false));
      }
      offerDetails = await Offer.findOne({
        code: { $regex: _.trim(coupon_code), $options: "i" },
        status: 1,
        expiry_date: { $gt: new Date() },
      });
      if (offerDetails == null) {
        return res
          .status(422)
          .json(responseData("COUPON_CODE_EXPIRED", {}, req, false));
      }
      if (offerDetails) {
        if (offerDetails.min_order_value > orderDetails.subtotal) {
          return res
            .status(422)
            .json(
              responseData(
                `This cpupon will apply on more then ${offerDetails.min_order_value} order value`,
                {},
                req,
                false
              )
            );
        }
      }

      // console.log(orderDetails);
      const totalUsed = await Order.aggregate([
        {
          $match: {
            "offer.code": { $regex: _.trim(coupon_code), $options: "i" },
            _id: { $ne: orderDetails._id },
          },
        },
        {
          $count: "total",
        },
      ]);

      if (offerDetails.user_id) {
        if (offerDetails.user_id != _id) {
          return res
            .status(422)
            .json(responseData("COUPON_NOT_APPLY", {}, req, false));
        }
      }

      if (totalUsed.length && totalUsed[0]?.total) {
        if (offerDetails.max_use <= totalUsed[0]?.total) {
          return res
            .status(422)
            .json(responseData("COUPON_CODE_MAX_REACH", {}, req, false));
        }
      }

      const totalUses = await Order.aggregate([
        {
          $match: {
            "offer.code": { $regex: _.trim(coupon_code), $options: "i" },
            user_id: Types.ObjectId(_id),
            _id: { $ne: orderDetails._id },
          },
        },
        {
          $count: "total",
        },
      ]);

      console.log("..........totalUses", totalUses[0]?.total);

      if (totalUses.length && totalUses[0]?.total) {
        if (offerDetails.user_id == _id) {
          if (totalUses[0]?.total >= offerDetails.max_use) {
            return res
              .status(422)
              .json(responseData("COUPON_CODE_MAX_REACH", {}, req, false));
          }
        } else {
          return res
            .status(422)
            .json(responseData("USED_COUPON", {}, req, false));
        }
      }

      if (offerDetails) {
        orderDetails.offer = offerDetails;
        if (offerDetails.offer_type == 1) {
          orderDetails.discount = offerDetails.discount;
        } else {
          orderDetails.discount = parseFloat(
            (offerDetails.discount / 100) * orderDetails.subtotal
          ).toFixed(2);
        }
      }

      console.log(".........discountdiscount", orderDetails.discount);
      var apply_coupon = await Order.updateOne(
        { _id: orderDetails._id },
        orderDetails
      );

      return res.json(responseData("COUPON_APPLIED", orderDetails, req, true));
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
  redeemLoyaltyPoints: async (req, res) => {
    try {
      var { _id, role_id, country_code } = req.user;
      var orderDetails = await Order.findOne(
        {
          user_id: Types.ObjectId(_id),
          status: 1,
        },
        {
          items: 1,
        },
        { lean: true }
      );
      if (orderDetails == null) {
        return res.status(422).json(responseData("EMPTY_CART", {}, req, false));
      }

      var { loyalty_points } = req.body;
      orderDetails.loyalty_points = loyalty_points;
      const update_loyalty_points = await Order.updateOne(
        { _id: orderDetails._id },
        orderDetails
      );

      if (update_loyalty_points.modifiedCount) {
        if (loyalty_points) {
          return res.json(responseData("POINTS_REDEEM", {}, req, true));
        } else {
          return res.json(responseData("REMOVE_REDEEM", {}, req, true));
        }
      } else {
        return res.json(responseData("POINTS_REDEEM_NOT", {}, req, false));
      }

      return res.json(responseData("COUPON_APPLIED", orderDetails, req, true));
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
  chooseAddress: async (req, res) => {
    try {
      var { _id } = req.user;
      var orderDetails = await Order.findOne(
        {
          user_id: Types.ObjectId(_id),
          status: 1,
        },
        {
          store_id: 1,
          address_id: 1,
          address: 1,
        },
        { lean: true }
      );

      console.log("user_id............", Types.ObjectId(_id));

      if (orderDetails == null) {
        return res
          .status(422)
          .json(responseData("ADDRESS_EMPTY_CART", {}, req, false));
      }
      //country_id = await getCountryIdFromCode(country_code);
      var { address_id } = req.body;
      var addressDetails = await Address.findOne({
        _id: Types.ObjectId(address_id),
      });

      console.log("addressDetails.....", address_id);

      console.log("orderDetails.....", orderDetails);

      var match = {};
      match._id = orderDetails.store_id;
      const allStores = await Store.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [addressDetails.longitude, addressDetails.latitude],
            },
            distanceField: "distance",
          },
        },
        {
          $match: {
            $expr: { $lte: ["$distance", 20000] },
            _id: orderDetails.store_id,
          },
        },
      ]);
      //
      console.log("order.....", orderDetails);

      console.log("allStores.....", allStores);

      if (allStores.length == 0) {
        return res
          .status(201)
          .json(responseData("OTHER_LOCATION", {}, req, false));
      }

      addressDetails = JSON.parse(JSON.stringify(addressDetails));
      if (addressDetails.country_id) {
        let country_details = await Country.findOne({
          _id: Types.ObjectId(addressDetails.country_id),
        });
        addressDetails.country_name = country_details.name;
      }

      orderDetails.address_id = Types.ObjectId(address_id);
      orderDetails.address = addressDetails;
      await Order.updateOne({ _id: orderDetails._id }, orderDetails);

      //addressDetails.floor = base64Decode(addressDetails.floor);
      addressDetails.full_address = base64Decode(addressDetails.full_address);
      addressDetails.delivery_landmark = base64Decode(
        addressDetails.delivery_landmark
      );

      return res.json(
        responseData("ORDER_ITEM_LISTED", orderDetails, req, true)
      );
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
  removeCoupon: async (req, res) => {
    try {
      var { _id, role_id, country_code } = req.user;
      //console.log(_id)

      var orderDetails = await Order.findOne(
        {
          user_id: Types.ObjectId(_id),
          status: 1,
        },
        {
          items: 1,
          quantity: 1,
          subtotal: 1,
          total: 1,
          offer: 1,
          discount: 1,
          vat_inclusive: 1,
          vat: 1,
        },
        { lean: true }
      );
      orderDetails.offer = {};
      orderDetails.discount = 0;

      await Order.updateOne({ _id: orderDetails._id }, orderDetails);

      return res.json(
        responseData("Order Items have been listed.", orderDetails, req, true)
      );
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
  reviewOrder: async (req, res) => {
    try {
      var { _id, role_id } = req.user;

      var orderDetails = await Order.findOne(
        { user_id: _id, status: 1 },
        {
          items: 1,
          quantity: 1,
          subtotal: 1,
          store_id: 1,
          total: 1,
          offer: 1,
          delivery_price: 1,
          gift_card_price: 1,
          discount: 1,
          vat_inclusive: 1,
          delivery_night_charges: 1,
          vat: 1,
          address: 1,
          loyalty_points: 1,
          delivery_date: 1,
          delivery_time: 1,
          address_id: 1,
        },
        { lean: true }
      );
      if (orderDetails == null) {
        return res
          .status(422)
          .json(responseData("Cart is empty.", {}, req, false));
      }
      let quantity = 0;
      let subtotal = 0;
      let vat = 0;

      if (orderDetails.items.length) {
        orderDetails.items.forEach((element) => {
          if (Object.keys(element).length == 2) {
            var indexOfObject = orderDetails.items.findIndex((object) => {
              return object.id == element.id;
            });
            if (indexOfObject) {
              orderDetails.items.splice(indexOfObject, 1);
            }
          } else {
            quantity = quantity + element.quantity;
            subtotal = subtotal + element.priceAmount;
            vat = vat + element.vatAmount;
          }
        });
        let vat_inclusive = false;
        if (role_id == 2) {
          vat_inclusive = false;
        } else {
          vat_inclusive = true;
        }
        orderDetails.quantity = quantity;
        //orderDetails.status = 0;
        orderDetails.subtotal = subtotal;
        orderDetails.vat_inclusive = vat_inclusive;
        orderDetails.vat = parseFloat(vat.toFixed(2));
        orderDetails.discount = parseFloat(orderDetails.discount.toFixed(2));

        const is_referral = await User.findOne(
          { _id: _id },
          { refer_id: 1, referral_code: 1, referral_status: 1 }
        );
        if (is_referral?.referral_status != 1) {
          orderDetails.referral_amount = parseFloat(
            ((10 / 100) * orderDetails.subtotal).toFixed(2)
          );
          orderDetails.referral_value = 10;
        } else {
          orderDetails.referral_amount = 0;
          orderDetails.referral_value = 0;
        }

        if (vat_inclusive) {
          orderDetails.total_taxable = parseFloat((subtotal - vat).toFixed(2));
          orderDetails.total =
            orderDetails.subtotal -
            orderDetails.discount -
            orderDetails.loyalty_points +
            orderDetails.delivery_price +
            orderDetails.gift_card_price -
            orderDetails.referral_amount +
            orderDetails.delivery_night_charges;
        } else {
          orderDetails.total =
            orderDetails.subtotal -
            orderDetails.discount -
            orderDetails.loyalty_points +
            orderDetails.vat +
            orderDetails.delivery_price +
            orderDetails.gift_card_price -
            orderDetails.referral_amount +
            orderDetails.delivery_night_charges;
          orderDetails.total_taxable = parseFloat(subtotal.toFixed(2));
        }
      }

      // Order.updateOne({ _id: orderDetails._id }, orderDetails);
      const updateorder = await Order.updateOne(
        { _id: orderDetails._id },
        orderDetails
      );
      orderDetails.address.name = base64Decode(orderDetails.address.name);
      orderDetails.address.address = base64Decode(orderDetails.address.address);
      orderDetails.address.full_address = base64Decode(
        orderDetails.address.full_address
      );
      orderDetails.address.zip_code = base64Decode(
        orderDetails.address.zip_code
      );

      orderDetails.address.delivery_contact = base64Decode(
        orderDetails.address.delivery_contact
      );
      orderDetails.address.delivery_landmark = base64Decode(
        orderDetails.address.delivery_landmark
      );
      orderDetails.address.street = base64Decode(orderDetails.address.street);

      orderDetails.address.building = base64Decode(
        orderDetails.address.building
      );
      orderDetails.address.office_no = base64Decode(
        orderDetails.address.office_no
      );
      orderDetails.address.apartment_no = base64Decode(
        orderDetails.address.apartment_no
      );

      orderDetails.address.house_no = base64Decode(
        orderDetails.address.house_no
      );
      orderDetails.address.city = base64Decode(orderDetails.address.city);

      return res.json(responseData("CART_ITEM_LIST", orderDetails, req, true));
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
  placeOrder: async (req, res) => {
    try {
      var { _id, role_id } = req.user;
      var { user_timezone, payment_mode, transaction_id } = req.body;
      var orderDetails = await Order.findOne(
        { user_id: _id, status: 1 },
        {
          user_id: 1,
          store_id: 1,
          items: 1,
          country_id: 1,
          referral_value: 1,
          loyalty_points: 1,
        },
        { lean: true }
      );

      const sortOrder = await Order.find({ order_id: { $nin: ["", null] } })
        .sort({ order_id: -1 })
        .limit(1);
      let orderNo = 1;
      if (sortOrder) {
        orderNo = sortOrder[0]?.order_id + 1;
      }

      orderDetails.status = 0;
      orderDetails.role_id = role_id;
      orderDetails.delivery_status = 1;
      orderDetails.driver_id = null;
      orderDetails.user_timezone = user_timezone;
      orderDetails.payment_mode = payment_mode;
      orderDetails.transaction_id = transaction_id;
      orderDetails.placedAt = moment.utc().toISOString();
      //orderDetails.order_id = "#"+Math.floor(100 + Math.random() * 900);
      orderDetails.order_id = orderNo;

      const orderPlaced = await Order.updateOne(
        { _id: orderDetails._id },
        orderDetails
      );

      if (orderPlaced.modifiedCount) {
        addLog(
          req.user._id,
          "Order Placed",
          "#" + orderDetails.order_id,
          "Order Status Changed for order id #" +
            orderDetails.order_id +
            " Order Placed By Customer",
          Types.ObjectId(orderDetails._id)
        );

        if (orderDetails?.referral_value > 0) {
          await User.updateOne(
            { _id: Types.ObjectId(orderDetails?.user_id) },
            { $set: { referral_status: 1 } }
          );

          var userDetail = await User.findOne(
            { _id: Types.ObjectId(orderDetails?.user_id) },
            { refer_id: 1, referral_code: 1, referral_status: 1 }
          );
          if (userDetail?.refer_id) {
            const data = {
              type: "credited",
              user_id: userDetail?.refer_id,
              order_id: orderDetails?._id,
              points: 100,
            };
            const loyaltypoint = await LoyaltyPoint.create(data);
          }
        }
        // console.log('...........userDetai000',Types.ObjectId(orderDetails?.user_id))
        // console.log('...........userDetail111')
        // console.log('...........userDetail',userDetail)
        const items = orderDetails.items;
        // await Promise.map(items, async (el, index) => {
        //   var obj = {};
        //   if (role_id == 1) obj.quantity_c = -el.quantity;
        //   if (role_id == 2) obj.quantity_w = -el.quantity;
        //   var inventoryCreate = await ProductInventory.create({
        //     user_id: Types.ObjectId(orderDetails?.user_id),
        //     country_id: Types.ObjectId(el?.country_id),
        //     city_id: Types.ObjectId(el?.country_id),
        //     store_id: Types.ObjectId(orderDetails?.store_id),
        //     order_id: Types.ObjectId(orderDetails?._id),
        //     order_no: orderDetails?.order_id,
        //     product_id: Types.ObjectId(el?.id),
        //     type: 1,
        //     ...obj,
        //   });
        //   // await syncInventory(
        //   //   Types.ObjectId(orderDetails?.store_id),
        //   //   Types.ObjectId(items[index].id)
        //   // );

        // });

        if (orderDetails?.loyalty_points > 0) {
          const data = {
            type: "debited",
            user_id: Types.ObjectId(orderDetails?.user_id),
            order_id: Types.ObjectId(orderDetails?._id),
            points: orderDetails?.loyalty_points,
          };
          const loyaltypoint = await LoyaltyPoint.create(data);
        }

        sendNotificationOrderStatusChange(orderDetails._id);
        syncInventoryOrder(orderDetails?._id);
        sendOrderConfirmationEmail(orderDetails?._id);
      }

      return res.json(
        responseData("YOUR_ORDER_PLACED", orderDetails, req, true)
      );
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
  contactUs: async (req, res) => {
    try {
      const { name, email, country_code, mobile, message } = req.body;
      // console.log("contactDetails", name, email, mobile, message)
      var description = `Name: &nbsp;${name}<br>Email: &nbsp;${email}<br>Country code: &nbsp;${country_code}<br>Mobile: &nbsp;${mobile}<br>Message: &nbsp;${message}<br>`;
      sendEmail(
        "lucky.kumawat@octalsoftware.com",
        "Zoom Deliver App",
        description
      );
      return res.json(responseData("EMAIL_SENT", {}, req, true));
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
  userCurrency: async (req, res) => {
    try {
      let { name } = req.query;
      var countryData = await Country.findOne({
        name: { $regex: _.trim(name), $options: "i" },
      });

      return res.json(responseData("DATA_RECEIVED", countryData, req, true));
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req, false));
    }
  },
};

async function axiosCalling(url, data, method, headers) {
  var config = {
    method: method,
    url: url,
    headers: headers,
    data: data,
  };
  return await axios(config);
}
