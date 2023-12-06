const User = require("../../models/user.model");
var { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
const { capitalizeFirstLetter } = require("../../helpers/helper");
var bcrypt = require("bcryptjs");
const moment = require("moment");
const path = require("path");
const fs = require("fs");
var { Parser } = require("json2csv");
const Promise = require("bluebird");
const { COMPANY_FOLDER } = require("../../helpers/config");
const {
  base64Encode,
  base64Decode,
  saveFile,
  getCountryIdFromCode,
  sendEmail,
  sendNotification,
} = require("../../helpers/helper");

const email_service = require("./emailtemplate.services");
const _ = require("lodash");
const { addLog } = require("../../helpers/helper");
const { Types } = require("mongoose");

module.exports = {
  adminUserList: async (req, res) => {
    try {
      let {
        page,
        limit,
        page_size,
        keyword,
        status,
        start_date,
        end_date,
        sort_by,
        sort_type,
        country_id,
      } = req.query;
      const enddate = moment(end_date).endOf("day");
      const sortOptions = {
        [sort_by || "created_at"]: sort_type === "asc" ? 1 : -1,
      };
      const options = {
        page: page || 1,
        limit: limit || 10,
        lean: true,
        sort_by: sortOptions,
      };

      var match = {};
      if (status) {
        if (status == 1) {
          match.status = true;
        } else if (status == 0) {
          match.status = false;
        }
      }

      if (country_id) {
        match["country_id"] = Types.ObjectId(country_id);
      }

      if (start_date && end_date) {
        match = {
          createdAt: {
            $gte: new Date(start_date),
            $lte: new Date(enddate),
          },
        };
      } else if (start_date && !end_date) {
        match = {
          createdAt: {
            $gte: new Date(start_date),
            $lte: new Date(Date.now()),
          },
        };
      } else if (!start_date && end_date) {
        match = {
          createdAt: {
            $lte: new Date(enddate),
          },
        };
      }
      if (keyword) {
        match["$or"] = [
          { first_name: { $regex: base64Encode(keyword), $options: "i" } },
          { last_name: { $regex: base64Encode(keyword), $options: "i" } },
          { email: { $regex: base64Encode(keyword), $options: "i" } },
          { mobile: { $regex: base64Encode(keyword), $options: "i" } },
        ];
      }

      match.role_id = 2;
      match.approval = 1;

      console.log(match);
      const query = User.aggregate([
        {
          $lookup: {
            from: "countries",
            localField: "country_id",
            foreignField: "_id",
            as: "country",
          },
        },
        {
          $unwind: {
            path: "$country",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "wsbusinesstypes",
            localField: "company_type_id",
            foreignField: "_id",
            as: "Wsbusinesstype",
          },
        },
        {
          $unwind: {
            path: "$Wsbusinesstype",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "cities",
            localField: "city_id",
            foreignField: "_id",
            as: "city",
          },
        },
        {
          $unwind: {
            path: "$city",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "loyaltypoints",
            let: { id: '$_id' },
            pipeline: [
              { 
                $match: { $expr: { $eq: ['$user_id', '$$id']}}
              },
              {
                $group: {
                  _id: null,
                  totalCreditPoints: {  $sum: { $cond: [{$eq: ['$type', 'credited']}, '$points', 0]}},
                  totalDebitPoints: {  $sum: { $cond: [{$eq: ['$type', 'debited']}, '$points', 0]}}
                }
              }
            ], 
            as: "loyaltypoint",
          },
        },
        {
          $unwind: {
            path: "$loyaltypoint",
            preserveNullAndEmptyArrays: true,
          },
        },
        // {
        //   $lookup: {
        //     from: "wholesaleusercategories",
        //     localField: "wholesaleusercategory_id",
        //     foreignField: "_id",
        //     as: "wholesaleusercategory",
        //   },
        // },
        // {$unwind: '$wholesaleusercategory'},
        {
          $match: match,
        },
        {
          $project: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            email: 1,
            country_code: 1,
            mobile: 1,
            status: 1,
            token: 1,
            is_deleted: 1,
            notification_flag: 1,
            zoom_updates: 1,
            otp: 1,
            otp_expiry: 1,
            is_mobile_verified: 1,
            profile_updated: 1,
            role_id: 1,
            image: 1,
            user_type: 1,
            marketing_offers: 1,
            device_token: 1,
            company_name: 1,
            company_phone: 1,
            company_reg_no: 1,
            company_vat_no: 1,
            company_reg_date: 1,
            company_image: 1,
            reg_certificate: 1,
            company_postal_code: 1,
            company_address1: 1,
            company_address2: 1,
            approval: 1,
            createdAt: 1,
            updatedAt: 1,
            wholesaleusercategory_id: 1,
            is_credit_user: 1,
            loyaltypoint: { $ifNull: ['$loyaltypoint', {_id: null, totalCreditPoints: 0, totalDebitPoints: 0}]},
            "wholesaleusercategory.name": {
              $ifNull: ["$wholesaleusercategory.name", ""],
            },
            store_id: 1,
            "country._id": { $ifNull: ["$country._id", ""] },
            "country.name": { $ifNull: ["$country.name", ""] },
            "Wsbusinesstype.name": { $ifNull: ["$Wsbusinesstype.name", ""] },
            "Wsbusinesstype._id": { $ifNull: ["$Wsbusinesstype._id", ""] },
            "city.id": { $ifNull: ["$city._id", ""] },
            "city.name": { $ifNull: ["$city.name", ""] },
            __v: 1,
          },
        },
        {
          $sort: sortOptions,
        },
      ]);

      // console.log("final=>>>>>>>>>>>>>>>>", query);
      const finaldata = await User.aggregatePaginate(query, options);
      await Promise.map(finaldata.docs, async (el, index) => {
        el.first_name = base64Decode(el.first_name);
        el.last_name = base64Decode(el.last_name);
        el.email = base64Decode(el.email);
        el.mobile = base64Decode(el.mobile);
        el.country_code = base64Decode(el.country_code);
        el.company_name = base64Decode(el.company_name);
        el.company_phone = base64Decode(el.company_phone);
        el.company_reg_no = base64Decode(el.company_reg_no);
        el.company_vat_no = base64Decode(el.company_vat_no);
        el.company_reg_date = base64Decode(el.company_reg_date);
      });
      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("WUSER_NOT_FOUND", {}, req, true));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  addAdminUser: async (req, res) => {
    try {
      var {
        first_name,
        last_name,
        password,
        country_id,
        city_id,
        email,
        country_code,
        mobile,
        company_name,
        company_phone,
        company_reg_no,
        company_vat_no,
        company_reg_date,
        company_type_id,
        wholesaleusercategory_id,
        is_credit_user,
        company_postal_code,
        company_address1,
        company_address2,
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
        return res.json(
          responseData("EMAIL_ALREADY_REGISTERED", {}, req, false)
        );
      }
      const findRecordM = await User.findOne({ country_code, mobile });
      if (!isEmpty(findRecordM)) {
        return res.json(
          responseData("MOBILE_ALREADY_REGISTERED", {}, req, false)
        );
      }

      const salt = await bcrypt.genSalt(10);
      //let full_name = capitalizeFirstLetter(name);
      const user = {
        first_name,
        last_name,
        email,
        country_code,
        city_id,
        country_id,
        mobile,
        company_name,
        company_phone,
        company_reg_no,
        company_vat_no,
        company_reg_date,
        company_type_id,
        wholesaleusercategory_id,
        is_credit_user,
      };
      user.org_password = password;
      user.password = await bcrypt.hash(password, salt);
      user.status = true;
      user.role_id = 2;
      user.user_type = 1;
      user.approval = 1;
      user.is_mobile_verified = true;

      // uploadImageStart
      var company_image = "";

      const files = req.files;
      if (files && files?.image) {
        const data = files.image;
        if (data.name) {
          if (files && files.image.name != undefined) {
            company_image = await saveFile(files.image, COMPANY_FOLDER, null);
          }
        }
      }
      user.company_image = company_image;
      // uploadImageEnd

      // uploadreg_certificate
      let reg_certificate = "";

      if (files && files?.reg_certificate) {
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

      if (company_postal_code) user.company_postal_code = company_postal_code;
      if (company_address1) user.company_address1 = company_address1;
      if (company_address2) user.company_address2 = company_address2;

      // uploadreg_certificateEnd

      const resp = await User.create(user);
      const name =
        base64Decode(resp.first_name) + " " + base64Decode(resp.last_name);
      addLog(
        req.user._id,
        "WS Customer User Type Added",
        name,
        "WS Customer User Type Added with name " + name,
        resp._id
      );

      console.log(">>>>>>>>>>>>>>>>>> w-add resp:", resp);
      if (resp) {
        const newres = resp.toJSON();
        delete newres["password"];
        newres.first_name = base64Decode(newres.first_name);
        newres.last_name = base64Decode(newres.last_name);
        newres.email = base64Decode(newres.email);
        newres.mobile = base64Decode(newres.mobile);
        newres.country_code = base64Decode(newres.country_code);
        newres.company_name = base64Decode(newres.company_name);
        newres.company_phone = base64Decode(newres.company_phone);
        newres.company_reg_no = base64Decode(newres.company_reg_no);
        newres.company_vat_no = base64Decode(newres.company_vat_no);
        newres.company_reg_date = base64Decode(newres.company_reg_date);
        return res.json(responseData("WUSER_ADD_SUCCESS", newres, req, true));
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  editAdminUser: async (req, res) => {
    try {
      var {
        first_name,
        last_name,
        email,
        country_code,
        mobile,
        country_id,
        company_name,
        company_phone,
        company_reg_no,
        company_vat_no,
        company_reg_date,
        company_type_id,
        wholesaleusercategory_id,
        is_credit_user,
        company_postal_code,
        company_address1,
        company_address2,
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
      if (email) {
        const findRecord = await User.findOne({
          email,
          _id: { $ne: req.params.id },
        });
        if (!isEmpty(findRecord)) {
          return res.json(
            responseData("EMAIL_ALREADY_REGISTERED", {}, req, false)
          );
        }
      }

      if (mobile) {
        const findRecordM = await User.findOne({
          country_code,
          mobile,
          _id: { $ne: req.params.id },
        });
        if (!isEmpty(findRecordM)) {
          return res.json(
            responseData("MOBILE_ALREADY_REGISTERED", {}, req, false)
          );
        }
      }
      // uploadImageStart
      var company_image = "";
      const files = req.files;
      if (files && files.image) {
        const data = files.image;
        if (data.name) {
          if (files && files.image.name != undefined) {
            company_image = await saveFile(files.image, COMPANY_FOLDER, null);
          }
        }
      } // uploadImageEnd

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
      // uploadreg_certificateEnd

      const user = {
        first_name,
        country_id,
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
        wholesaleusercategory_id,
        is_credit_user,
      };
      if (company_image) {
        user.company_image = company_image;
      }
      if (reg_certificate) {
        user.reg_certificate = reg_certificate;
      }

      if (company_postal_code) user.company_postal_code = company_postal_code;
      if (company_address1) user.company_address1 = company_address1;
      if (company_address2) user.company_address2 = company_address2;
      // if (req.body?.password) {
      //   const salt = await bcrypt.genSalt(10);
      //   user.password = await bcrypt.hash(req.body.password, salt);
      // }

      const oldData = await User.findOne({ _id: req.params.id });
      const resp = await User.findByIdAndUpdate(
        { _id: req.params.id },
        { $set: user },
        { new: true }
      );

      let logMessage = "";
      if (oldData.first_name != resp.first_name) {
        logMessage +=
          " </br> First Name :   " +
          base64Decode(oldData.first_name) +
          " to " +
          base64Decode(resp.first_name);
      }
      if (oldData.last_name != resp.last_name) {
        logMessage +=
          " </br> Last Name :   " +
          base64Decode(oldData.last_name) +
          " to " +
          base64Decode(resp.last_name);
      }
      if (oldData.mobile != resp.mobile) {
        logMessage +=
          " </br> Mobile :   " +
          base64Decode(oldData.mobile) +
          " to " +
          base64Decode(resp.mobile);
      }
      if (oldData.email != resp.email) {
        logMessage +=
          " </br> Email :   " +
          base64Decode(oldData.email) +
          " to " +
          base64Decode(resp.email);
      }
      if (oldData.company_name != resp.company_name) {
        logMessage +=
          " </br> Company Name :   " +
          oldData.company_name +
          " to " +
          resp.company_name;
      }
      if (oldData.company_phone != resp.company_phone) {
        logMessage +=
          " </br> Company Phone :   " +
          base64Decode(oldData.company_phone) +
          " to " +
          base64Decode(resp.company_phone);
      }
      if (oldData.company_reg_no != resp.company_reg_no) {
        logMessage +=
          " </br> Company Regno. :   " +
          oldData.company_reg_no +
          " to " +
          resp.company_reg_no;
      }
      if (oldData.company_vat_no != resp.company_vat_no) {
        logMessage +=
          " </br> Company Vatno. :   " +
          oldData.company_vat_no +
          " to " +
          resp.company_vat_no;
      }
      if (oldData.company_reg_date != resp.company_reg_date) {
        logMessage +=
          " </br> Company Regdate :   " +
          oldData.company_reg_date +
          " to " +
          resp.company_reg_date;
      }
      if (oldData.company_postal_code != resp.company_postal_code) {
        logMessage +=
          " </br> Company Postal Code :   " +
          oldData.company_postal_code +
          " to " +
          resp.company_postal_code;
      }
      if (oldData.company_address1 != resp.company_address1) {
        logMessage +=
          " </br> Company Address1 :   " +
          oldData.company_address1 +
          " to " +
          resp.company_address1;
      }
      if (oldData.company_address2 != resp.company_address2) {
        logMessage +=
          " </br> Company Address1 :   " +
          oldData.company_address2 +
          " to " +
          resp.company_address2;
      }

      addLog(
        req.user._id,
        "WS Customer User Type Updated",
        base64Decode(resp.first_name) + " " + base64Decode(resp.last_name),
        logMessage,
        resp._id
      );

      if (resp._id) {
        return res.json(responseData("WUSER_UPDATE_SUCCESS", {}, req, true));
      } else {
        return res.json(responseData("WUSER_NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  deleteUser: async (req, res) => {
    try {
      const resp = await User.deleteOne({ _id: req.params.id });
      if (resp.deletedCount) {
        return res.json(responseData("USER_DELETE", {}, req, true));
      } else {
        return res.json(responseData("WUSER_NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  userChangeStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const resp = await User.findByIdAndUpdate(
        { _id: req.params.id },
        { $set: { status } },
        { new: true }
      );
      addLog(
        req.user._id,
        "WS Customer User Type Updated",
        base64Decode(resp.first_name) + " " + base64Decode(resp.last_name),
        status
          ? "WS Customer User Type has been activated"
          : "WS Customer User Type has been deactivated",
        resp._id
      );
      if (resp._id) {
        return res.json(responseData("WUSER_STATUS_UPDATE", {}, req, true));
      } else {
        return res.json(responseData("WUSER_NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  approvalUserList: async (req, res) => {
    try {
      let {
        page,
        limit,
        page_size,
        keyword,
        status,
        start_date,
        end_date,
        sort_by,
        sort_type,
      } = req.query;
      const enddate = moment(end_date).endOf("day");

      const sortOptions = {
        [sort_by || "created_at"]: sort_type === "asc" ? 1 : -1,
      };
      const options = {
        page: page || 1,
        limit: limit || 10,
        lean: true,
        sort_by: sortOptions,
      };

      var match = {};
      if (status) {
        match.status = status;
      }

      if (start_date && end_date) {
        match = {
          createdAt: {
            $gte: new Date(start_date),
            $lte: new Date(enddate),
          },
        };
      } else if (start_date && !end_date) {
        match = {
          createdAt: {
            $gte: new Date(start_date),
            $lte: new Date(Date.now()),
          },
        };
      } else if (!start_date && end_date) {
        match = {
          createdAt: {
            $lte: new Date(enddate),
          },
        };
      }
      if (keyword) {
        whereStatement["$or"] = [
          { name: { $regex: keyword, $options: "i" } },
          { email: { $regex: keyword, $options: "i" } },
        ];
      }

      //match.approval = 0;
      // match.approval = 2;
      //match={ $or: [{approval: 0 },{ approval: 2}] };
      match = {
        $and: [{ $or: [{ approval: 0 }, { approval: 2 }] }, { role_id: 2 }],
      };

      const query = User.aggregate([
        {
          $lookup: {
            from: "countries",
            localField: "country_id",
            foreignField: "_id",
            as: "country",
          },
        },
        {
          $unwind: {
            path: "$country",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "cities",
            localField: "city_id",
            foreignField: "_id",
            as: "city",
          },
        },
        {
          $unwind: {
            path: "$city",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: match,
        },
        {
          $project: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            email: 1,
            country_code: 1,
            mobile: 1,
            status: 1,
            token: 1,
            is_deleted: 1,
            notification_flag: 1,
            zoom_updates: 1,
            otp: 1,
            otp_expiry: 1,
            is_mobile_verified: 1,
            profile_updated: 1,
            role_id: 1,
            image: 1,
            user_type: 1,
            marketing_offers: 1,
            device_token: 1,
            company_name: 1,
            company_phone: 1,
            company_reg_no: 1,
            company_vat_no: 1,
            company_reg_date: 1,
            company_image: 1,
            approval: 1,
            createdAt: 1,
            updatedAt: 1,
            store_id: 1,
            "country._id": { $ifNull: ["$country._id", ""] },
            "country.name": { $ifNull: ["$country.name", ""] },
            "city.id": { $ifNull: ["$city._id", ""] },
            "city.name": { $ifNull: ["$city.name", ""] },
            __v: 1,
          },
        },
        {
          $sort: sortOptions,
        },
      ]);

      console.log("final=>>>>>>>>>>>>>>>>", query);
      const finaldata = await User.aggregatePaginate(query, options);
      await Promise.map(finaldata.docs, async (el, index) => {
        el.first_name = base64Decode(el.first_name);
        el.last_name = base64Decode(el.last_name);
        el.email = base64Decode(el.email);
        el.mobile = base64Decode(el.mobile);
        el.country_code = base64Decode(el.country_code);
        el.company_name = base64Decode(el.company_name);
        el.company_phone = base64Decode(el.company_phone);
        el.company_reg_no = base64Decode(el.company_reg_no);
        el.company_vat_no = base64Decode(el.company_vat_no);
        el.company_reg_date = base64Decode(el.company_reg_date);
      });
      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("WUSER_NOT_FOUND", {}, req, true));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  userChangeStatusApproval: async (req, res) => {
    try {
      const { status } = req.body;
      const resp = await User.updateOne(
        { _id: req.params.id },
        { $set: { approval: status } }
      );

      if (resp.modifiedCount) {
        const userDetails = await User.findOne({ _id: req.params.id });

        country_id = await getCountryIdFromCode(userDetails.country_code);

        ////

        let { description, subject } =
          await email_service.getEmailTemplateBySlugAndCountry(
            "wholesale-account-status-changed",
            country_id
          );

        description = _.replace(
          description,
          "[FIRST_NAME]",
          base64Decode(userDetails.first_name)
        );

        description = _.replace(
          description,
          "[LAST_NAME]",
          base64Decode(userDetails.last_name)
        );
        description = _.replace(
          description,
          "[COMPANY_NAME]",
          userDetails.company_name
        );
        let statustext = "";
        if (status == 1) {
          statustext = "Approved";
        } else {
          statustext = "Rejected";
        }
        description = _.replace(description, "[STATUS]", statustext);

        sendEmail(base64Decode(userDetails.email), subject, description);
        sendNotification({
          deviceToken: userDetails.token,
          type: "Auto",
          title: "ZOOM Notification",
          body: "Your wholesale account has been " + statustext,
          user_id: userDetails._id,
        });

        addLog(
          req.user._id,
          "WS Customer User Type Updated",
          base64Decode(userDetails.first_name) +
            " " +
            base64Decode(userDetails.last_name),
          status == 1
            ? "WS Customer User Type has been approved"
            : status == 2
            ? "WS Customer User Type has been rejected"
            : "",
          userDetails._id
        );

        ///
        return res.json(responseData("WUSER_STATUS_UPDATE", {}, req, true));
      } else {
        return res.json(responseData("WUSER_NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  userChangeStatusReject: async (req, res) => {
    try {
      const { status } = req.body;
      const resp = await User.updateOne(
        { _id: req.params.id },
        { $set: { approval: status } }
      );

      if (resp.modifiedCount) {
        const userDetails = await User.findOne({ _id: req.params.id });

        country_id = await getCountryIdFromCode(userDetails.country_code);

        ////

        let { description, subject } =
          await email_service.getEmailTemplateBySlugAndCountry(
            "wholesale-account-status-changed",
            country_id
          );

        description = _.replace(
          description,
          "[FIRST_NAME]",
          base64Decode(userDetails.first_name)
        );

        description = _.replace(
          description,
          "[LAST_NAME]",
          base64Decode(userDetails.last_name)
        );
        description = _.replace(
          description,
          "[COMPANY_NAME]",
          userDetails.company_name
        );
        let statustext = "";
        if (status == 1) {
          statustext = "Approved";
        } else {
          statustext = "Rejected";
        }
        description = _.replace(description, "[STATUS]", statustext);

        sendEmail(base64Decode(userDetails.email), subject, description);
        sendNotification({
          deviceToken: userDetails.token,
          type: "Auto",
          title: "ZOOM Notification",
          body: "Your wholesale account has been " + statustext,
          user_id: userDetails._id,
        });

        addLog(
          req.user._id,
          "WS Customer User Type Updated",
          base64Decode(userDetails.first_name) +
            " " +
            base64Decode(userDetails.last_name),
          status == 1
            ? "WS Customer User Type has been approved"
            : status == 2
            ? "WS Customer User Type has been rejected"
            : "",
          userDetails._id
        );

        ///
        return res.json(responseData("WUSER_STATUS_UPDATE", {}, req, true));
      } else {
        return res.json(responseData("WUSER_NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  userDetail: async (req, res) => {
    try {
      const { _id, status } = req.body;
      const resp = await User.updateOne({ _id }, { $set: { status } });
      if (resp.modifiedCount) {
        return res.json(responseData("WUSER_STATUS_UPDATE", {}, req, true));
      } else {
        return res.json(responseData("WUSER_NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  getOneUser: async (req, res) => {
    try {
      const { keyword } = req.query;

      const userExist = await User.aggregate([
        {
          $match: {
            $or: [{ email: keyword }, { mobile: keyword }],
            status: "active",
          },
        },
      ]);

      if (!userExist[0]) {
        return res.json(responseData("WUSER_NOT_FOUND", {}, req, false));
      }

      delete userExist[0]["password"];

      return res.json(responseData("GET_DETAIL", userExist[0], req, true));
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  export_data: async (req, res) => {
    try {
      const allCustomerUser = await User.aggregate([
        {
          $match: {
            role_id: 2,
          },
        },
        {
          $lookup: {
            from: "countries",
            localField: "country_id",
            foreignField: "_id",
            pipeline: [{ $project: { name: 1 } }],
            as: "country",
          },
        },
        {
          $unwind: {
            path: "$country",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            first_name: 1,
            last_name: 1,
            email: 1,
            mobile: 1,
            notification_flag: 1,
            country_name: { $ifNull: ["$country.name", ""] },
          },
        },
      ]);

      await Promise.map(allCustomerUser, async (el, index) => {
        el.first_name = base64Decode(el.first_name);
        el.last_name = base64Decode(el.last_name);
        el.email = base64Decode(el.email);
        el.mobile = base64Decode(el.mobile);
        el.country_code = base64Decode(el.country_code);
      });

      const fields = [
        {
          label: "Country",
          value: "country_name",
        },
        {
          label: "First Name",
          value: "first_name",
        },
        {
          label: "Last Name",
          value: "last_name",
        },
        {
          label: "Email",
          value: "email",
        },
        {
          label: "Mobile",
          value: "mobile",
        },
        {
          label: "Notification",
          value: "notification_flag",
        },
      ];

      const json2csv = new Parser({ fields: fields });
      const csv = json2csv.parse(allCustomerUser);
      fs.writeFile(
        "./public/csv/all_wholeseller_list.csv",
        csv,
        function (err) {
          if (err) throw err;
          console.log("file saved");
          const path1 = `${process.env.API_URL}/csvFile/all_wholeseller_list.csv`;
          return res.json(responseData("GET_CSV", { path: path1 }, req, true));
        }
      );
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
};
