const User = require("../../models/user.model");
const Notification = require("../../models/notification.model");
const { Types } = require("mongoose");
var moment = require("moment");

const { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
var bcrypt = require("bcryptjs");
const { v4 } = require("uuid");
const {
  generateAuthToken,
  sendEmail,
  saveFile,
  saveThumbFile,
  addLog,
} = require("../../helpers/helper");
const { base64Encode, base64Decode } = require("../../helpers/helper");
const email_service = require("../admins/emailtemplate.services");
const {
  USER_FOLDER,
  USER_THUMB_WIDTH,
  USER_THUMB_HEIGHT,
} = require("../../helpers/config");

const _ = require("lodash");
module.exports = {
  driver_login: async (req, res) => {
    try {
      var { email, password, device_type, device_token } = req.body;
      email = base64Encode(email);
      //console.log(email);
      let user = await User.findOne({ email, status: true, role_id: 3 });
      if (!isEmpty(user)) {
        bcrypt.compare(password, user.password, async (err, response) => {
          if (err)
            return res
              .status(422)
              .json(responseData("INVALID_LOGIN", {}, req, false));
          if (!response)
            return res
              .status(422)
              .json(responseData("INVALID_LOGIN", {}, req, false));
          const userData = user.toJSON();
          userData.first_name = base64Decode(userData.first_name);
          userData.last_name = base64Decode(userData.last_name);
          userData.email = base64Decode(userData.email);
          userData.mobile = base64Decode(userData.mobile);

          let deviceTokens = generateAuthToken(userData);
          delete userData["password"];

          // device_token
          await User.updateOne(
            { email },
            { device_type: device_type, device_token: device_token }
          );

          return res.json(
            responseData(
              "ACCOUNT_LOGIN",
              { ...userData, ...deviceTokens },
              req,
              true
            )
          );
        });
      } else {
        return res
          .status(422)
          .json(responseData("INVALID_LOGIN", {}, req, false));
      }
    } catch (error) {
      return res
        .status(422)
        .json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  driver_forgot_password: async (req, res) => {
    try {
      var { email, role_id } = req.body;
      email = base64Encode(email);

      const user = await User.findOne({ email, role_id });

      if (!isEmpty(user)) {
        let { description, subject } =
          await email_service.getEmailTemplateBySlugAndCountry(
            "forgot-password-user-front",
            user.country_id
          );

        description = _.replace(
          description,
          "[FIRST_NAME]",
          base64Decode(user.first_name)
        );

        description = _.replace(
          description,
          "[LAST_NAME]",
          base64Decode(user.last_name)
        );

        const resetToken = v4().toString().replace(/-/g, "");

        const link = `${process.env.UI_LINK_FRONT}/auth/reset-password/${resetToken}`;

        description = _.replace(description, "[RESET_PASSWORD_LINK]", link);
        description = _.replace(description, "[RESET_PASSWORD_LINK]", link);
        await User.updateOne({ email, role_id }, { token: resetToken });

        sendEmail(base64Decode(user.email), subject, description);

        return res.json(
          responseData(
            "EMAIL_HAS_BEEN_SENT_TO_YOUR_EMAIL_ADDRESS_WITH_RESET_PASSWORD_LINK",
            {},
            req,
            true
          )
        );
      } else {
        return res
          .status(422)
          .json(responseData("USER_NOT_FOUND", {}, req, false));
      }
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req));
    }
  },
  change_password: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const { _id } = req.user;
      const user = await User.findOne({ _id });
      const match = await bcrypt.compare(oldPassword, user.password);
      if (match) {
        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash(newPassword, salt, async function (err, hash) {
            if (err || !hash) {
              return res
                .status(422)
                .json(responseData("ERROR_OCCUR", {}, req, false));
            } else {
              let userDetails = {};
              userDetails.password = hash;
              if(user?.role_id === 3) userDetails.org_password = newPassword;
              await User.findOneAndUpdate({ _id }, { password: hash });
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
  get_profile: async (req, res) => {
    // console.log(moment().unix());
    //console.log(moment.utc().toISOString());

    try {
      const { _id } = req.user;
      const user = await User.findOne({ _id });
      if (user) {
        const userData = user.toJSON();
        const resp = {};
        resp.first_name = base64Decode(userData.first_name);
        resp.last_name = base64Decode(userData.last_name);
        resp.email = base64Decode(userData.email);
        resp.mobile = base64Decode(userData.mobile);
        resp.country_code = base64Decode(userData.country_code);
        resp.notification_flag = userData.notification_flag;
        resp.d_availability_flag = userData.d_availability_flag;
        resp.vehicle_number = userData.vehicle_number;
        resp.image = userData.image;

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
          resp.unreadNotificationCount = 0;
        } else {
          resp.unreadNotificationCount = notificationCount[0].count;
        }
        return res.json(responseData("PROFILE_DETAILS", resp, req, true));
      } else {
        return res
          .status(422)
          .json(responseData("USER_NOT_FOUND", {}, req, false));
      }
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
  get_notifications: async (req, res) => {
    try {
      let { page, limit, sort_by, sort_type } = req.query;
      const { _id } = req.user;
      const sortOptions = {
        [sort_by || "created_at"]: sort_type === "asc" ? 1 : -1,
      };
      const options = {
        page: page || 1,
        limit: limit || 10,
        sort_by: sortOptions,
      };

      var match = { user_id: Types.ObjectId(_id) };

      const query = Notification.aggregate([
        {
          $match: match,
        },
        {
          $sort: sortOptions,
        },
      ]);
      var finalData = await Notification.aggregatePaginate(query, options);
      if (!isEmpty(finalData)) {
        return res.json(responseData("GET_LIST", finalData, req, true));
      } else {
        return res.status(422).json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res
        .status(422)
        .json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  update_profile: async (req, res) => {
    try {
      const {
        first_name,
        email,
        last_name,
        country_code,
        mobile,
        vehicle_number,
      } = req.body;
      const { _id } = req.user;
      const updateValues = {};

      if (email) updateValues.email = base64Encode(email);
      if (first_name) updateValues.first_name = base64Encode(first_name);
      if (last_name) updateValues.last_name = base64Encode(last_name);
      if (mobile) updateValues.mobile = base64Encode(mobile);
      if (country_code) updateValues.country_code = base64Encode(country_code);
      if (vehicle_number) updateValues.vehicle_number = vehicle_number;

      var result = await User.findOne({
        mobile: updateValues.mobile,
        country_code: updateValues.country_code,
        _id: { $ne: _id },
      });

      if (result) {
        return res
          .status(422)
          .json(
            responseData("MOBILE_EXIST", {}, req, false)
          );
      }

      var result = await User.findOne({
        email: updateValues.email,
        _id: { $ne: _id },
      });

      if (result) {
        return res
          .status(422)
          .json(responseData("EMAIL_ALREADY_REGISTERED", {}, req, false));
      }

      // uploadImageStart

      let docs = await User.aggregate([
        { $match: { _id: Types.ObjectId(_id) } },
      ]);

      var image = "";
      const files = req.files;
      if (files && files.image) {
        const data = files.image;
        if (data.name) {
          if (files && files.image.name != undefined) {
            image = await saveFile(files.image, USER_FOLDER, docs[0]?.image);
            await saveThumbFile(
              files.image,
              USER_FOLDER,
              docs[0]?.image,
              image,
              USER_THUMB_WIDTH,
              USER_THUMB_WIDTH,
              `public/${USER_FOLDER}/thumb`
            );
          }
        }
      }
      // uploadImageEnd
      if (image) updateValues.image = image;
      const userUpdate = await User.findOneAndUpdate(
        { _id },
        { $set: updateValues },
        { new: true }
      );
      if (userUpdate) {
        var userData = userUpdate.toJSON();
        userData.email = base64Decode(userUpdate.email);
        userData.first_name = base64Decode(userUpdate.first_name);
        userData.last_name = base64Decode(userUpdate.last_name);
        userData.mobile = base64Decode(userUpdate.mobile);
        userData.country_code = base64Decode(userUpdate.country_code);
        return res.json(
          responseData(
            "DRIVER_UPDATED_SUCCESSFULLY",
            { ...userData },
            req,
            true
          )
        );
      } else {
        return res
          .status(422)
          .json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
  update_notification: async (req, res) => {
    try {
      const { status } = req.body;
      const { _id } = req.user;
      const updateValues = {};

      updateValues.notification_flag = status;

      const userUpdate = await User.findOneAndUpdate(
        { _id },
        { $set: updateValues },
        { new: true }
      );
      if (userUpdate) {
        return res.json(
          responseData(
            "NOTIFICATION_SETTING_UPDATED_SUCCESSFULLY",
            {},
            req,
            true
          )
        );
      } else {
        return res
          .status(422)
          .json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
  update_availability: async (req, res) => {
    try {
      const { status } = req.body;
      const { _id } = req.user;
      const updateValues = {};

      updateValues.d_availability_flag = status;
      console.log(_id);
      console.log(_id);
      console.log(_id);
      const userUpdate = await User.findOneAndUpdate(
        { _id },
        { $set: updateValues },
        { new: true }
      );
      if (userUpdate) {
        return res.json(
          responseData(
            "DRIVER_AVAILABILITY_UPDATED_SUCCESSFULLY",
            {},
            req,
            true
          )
        );
      } else {
        return res
          .status(422)
          .json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
};
