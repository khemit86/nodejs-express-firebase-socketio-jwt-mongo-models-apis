const Admin = require("../../models/admin.model");
const Country = require("../../models/countries.model");
const User = require("../../models/user.model");
const BulkNotification = require("../../models/bulknotification.model");
const Dial = require("../../models/dial.model");

const { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
var bcrypt = require("bcryptjs");
const { v4 } = require("uuid");
const {
  generateAuthToken,
  generateOTP,
  sendEmail,
  sliceIntoChunks,
} = require("../../helpers/helper");
const email_service = require("./emailtemplate.services");
const { base64Encode, base64Decode } = require("../../helpers/helper");

const _ = require("lodash");
module.exports = {
  // add_admin: async (req, res) => {
  //     try {
  //         const { name, email, username, password } = req.body;
  //         bcrypt.genSalt(10, function (err, salt) {
  //             bcrypt.hash(password, salt, async function (err, hash) {
  //                 if (err || !hash) {
  //                     return res.json(responseData("ERROR_OCCUR", {}, req, false));
  //                 } else {
  //                     const admin = {
  //                         name,
  //                         email,
  //                         role: 0,
  //                         username,
  //                         password: hash,

  //                     }
  //                     await Admin.create(admin);

  //                     return res.json(responseData("ADMIN_ADDED", {}, req, true));
  //                 }
  //             });
  //         });
  //     } catch (error) {
  //         return res.json(responseData("ERROR_OCCUR", error.message, req, false));
  //     }
  // },
  admin_login: async (req, res) => {
    try {
      var { email, password } = req.body;
      email = base64Encode(email);
      let admin = await Admin.findOne({ email, status: true });

      if (!isEmpty(admin)) {
        bcrypt.compare(password, admin.password, async (err, response) => {
          if (err)
            return res.json(responseData("INVALID_LOGIN", {}, req, false));
          if (!response)
            return res.json(responseData("INVALID_LOGIN", {}, req, false));
          const adminData = admin.toJSON();
          adminData.first_name = base64Decode(adminData.first_name);
          adminData.last_name = base64Decode(adminData.last_name);
          adminData.email = base64Decode(adminData.email);
          adminData.mobile = base64Decode(adminData.mobile);
          let array = [], array2 = [];
          adminData.permission.map(item=>{
            if(item?.viewOrder) {
              item.viewOrder = Number(item.viewOrder)
              array.push(item)
            } else {
              array2.push(item)
            }
          })
          array = array.sort((a,b)=> a.viewOrder - b.viewOrder)
          adminData.permission = [...array, ...array2]
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
        return res.json(responseData("ADMIN_NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  admin_profile: async (req, res) => {
    try {
      const { _id } = req.user;
      const admin = await Admin.findOne({ _id }).select({ password: 0 });
      if (!isEmpty(admin)) {
        return res.json(responseData("PROFILE_DETAILS", admin, req, true));
      } else {
        return res.json(responseData("PROFILE_DETAILS", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  // send_notification: async (req, res) => {
  //   try {
  //     const { message } = req.body;

  //     const allUsers = await User.find()
  //       .sort({ first_name: 1 })
  //       .select("first_name _id");
  //     const allChunks = await sliceIntoChunks(allUsers, 2);
  //     var dataToInsert = [];
  //     if (allChunks.length > 0) {
  //       for (let $i = 0; $i < allChunks.length; $i++) {
  //         dataToInsert.push({ description: message, users: allChunks[$i] });
  //       }
  //       await BulkNotification.insertMany(dataToInsert);
  //     }
  //     //return false;
  //     return res.json(
  //       responseData("PROFILE_DETAILS", dataToInsert, req, false)
  //     );
  //   } catch (error) {
  //     return res.json(responseData("ERROR_OCCUR", error.message, req, false));
  //   }
  // },
  admin_forgot_password: async (req, res) => {
    try {
      var { email } = req.body;
      email = base64Encode(email);

      const admin = await Admin.findOne({ email });

      if (!isEmpty(admin)) {
        let { description, subject } =
          await email_service.getEmailTemplateBySlugAndCountry(
            "forgot-password-admin",
            admin.country_id
          );

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

        const link = `${process.env.UI_LINK}/reset-password?token=${resetToken}`;

        description = _.replace(description, "[RESET_PASSWORD_LINK]", link);
        description = _.replace(description, "[RESET_PASSWORD_LINK]", link);
        await Admin.updateOne({ email }, { token: resetToken });
        sendEmail(base64Decode(admin.email), subject, description);

        return res.json(responseData("EMAIL_SENT", {}, req, true));
      } else {
        return res.json(responseData("USER_NOT_FOUND", {}, req, false));
      }
    } catch (err) {
      return res.status(422).json(responseData(err.message, {}, req));
    }
  },
  admin_reset_password: async (req, res) => {
    try {
      const { password } = req.body;
      const token = req.params.token;
      const resettoken = await Admin.findOne({ token });
      if (!isEmpty(resettoken)) {
        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash(password, salt, async function (err, hash) {
            if (err || !hash) {
              return res.json(responseData("ERROR", {}, req, false));
            } else {
              console.log(resettoken);
              await Admin.findOneAndUpdate(
                { _id: resettoken._id },
                { password: hash, token: null }
              );
              return res.json(responseData("PASSWORD_CHANGED", {}, req, true));
            }
          });
        });
      } else {
        return res.json(responseData("LINK_INVALID", {}, req, false));
      }
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
  changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const { _id } = req.user;
      const admin = await Admin.findOne({ _id });
      const match = await bcrypt.compare(oldPassword, admin.password);
      if (match) {
        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash(newPassword, salt, async function (err, hash) {
            if (err || !hash) {
              return res.json(responseData("ERROR_OCCUR", {}, req, false));
            } else {
              await Admin.findOneAndUpdate({ _id }, { password: hash });
              return res.json(responseData("PASSWORD_CHANGED", {}, req, true));
            }
          });
        });
      } else {
        return res.json(responseData("INVALID_OLD_PASSWORD", {}, req, false));
      }
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
  edit_admin: async (req, res) => {
    try {
      const { first_name, email, last_name, country_code, mobile } = req.body;
      const { _id } = req.user;
      const updateValues = {};
      if (req.file) {
        updateValues.profile_pic = req.file.filename;
      }
      if (email) updateValues.email = base64Encode(email);
      if (first_name) updateValues.first_name = base64Encode(first_name);
      if (last_name) updateValues.last_name = base64Encode(last_name);
      if (mobile) updateValues.mobile = base64Encode(mobile);
      if (country_code) updateValues.country_code = country_code;
      const adminUpdate = await Admin.findOneAndUpdate(
        { _id },
        { $set: updateValues },
        { new: true }
      );
      if (adminUpdate) {
        var adminData = adminUpdate.toJSON();
        adminData.email = base64Decode(adminData.email);
        adminData.first_name = base64Decode(adminData.first_name);
        adminData.last_name = base64Decode(adminData.last_name);
        adminData.mobile = base64Decode(adminData.mobile);
        let deviceTokens = generateAuthToken(adminData);
        // return res.json(responseData("ADMIN_UPDATE_SUCCESS", { ...adminData, ...deviceTokens }, req, true));
        return res.json(
          responseData(
            "ADMIN_UPDATE_SUCCESS",
            { ...adminData, ...deviceTokens },
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
  country_list: async (req, res) => {
    try {
      const country = await Country.find().sort({ dial_code: 1 });
      let newArray = [];
      let uniqueObject = {};
      for (let i in country) {
        objTitle = country[i]["dial_code"];
        uniqueObject[objTitle] = country[i];
      }
      for (i in uniqueObject) {
        newArray.push(uniqueObject[i]);
      }
      if (country) {
        return res.json(responseData("GET_LIST", newArray, req, true));
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
  dials: async (req, res) => {
    try {
      //const dials = await Dial.find().sort({ dial_code: 1 });
      const dials = await Dial.aggregate([
        {
          $group: {
            _id: "$dial_code",count: { $sum: 1 },
            name: { $first: "$name" },
            dial_code: { $first: "$dial_code" },
            code: { $first: "$code" },
          },
        },{
          $sort: {
            dial_code: 1,
          },
        }
      ]);

      if (dials) {
        return res.json(responseData("GET_LIST", dials, req, true));
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
};
