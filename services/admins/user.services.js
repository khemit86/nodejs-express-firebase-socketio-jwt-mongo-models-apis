const User = require("../../models/user.model");
const Order = require("../../models/order.model");
var { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
const { capitalizeFirstLetter } = require("../../helpers/helper");
var bcrypt = require("bcryptjs");
const moment = require("moment");
const fs = require("fs");
const path = require("path");
var { Parser } = require("json2csv");
const Promise = require("bluebird");
const { Types } = require("mongoose");
const { base64Encode, base64Decode } = require("../../helpers/helper");
const { addLog } = require("../../helpers/helper");

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
        country_id,
        sort_type,
      } = req.query;
      const enddate = moment(end_date).endOf("day");

      const sortOptions = {
        [sort_by || "created_at"]: sort_type === "asc" ? 1 : -1,
      };
      const options = {
        page: page || 1,
        limit: limit || 10,
        sort_by: sortOptions,
        lean: true,
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
        match.country_id = Types.ObjectId(country_id);
      }

      if (start_date && end_date) {
        match.createdAt = {
          $gte: new Date(start_date),
          $lte: new Date(enddate),
        };
      } else if (start_date && !end_date) {
        match.createdAt = {
          $gte: new Date(start_date),
          $lte: new Date(Date.now()),
        };
      } else if (!start_date && end_date) {
        match.createdAt = {
          $lte: new Date(enddate),
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

      match.role_id = 1;

      const query = User.aggregate([
        {
          $match: match,
        },
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
        {
          $sort: sortOptions,
        },
        {
          $project: {
            first_name: 1,
            last_name: 1,
            password: 1,
            email: 1,
            user_type: 1,
            address: 1,
            marketing_offers: 1,
            minimum_order_amount: 1,
            country_code: 1,
            mobile: 1,
            status: 1,
            token: 1,
            is_deleted: 10,
            notification_flag: 1,
            zoom_updates: 1,
            otp: 1,
            otp_expiry: 1,
            is_mobile_verified: 1,
            profile_updated: 1,
            role_id: 1,
            image: 1,
            device_token: 1,
            company_name: 1,
            company_phone: 1,
            company_reg_no: 1,
            company_vat_no: 1,
            company_reg_date: 1,
            company_postal_code: 1,
            company_street: 1,
            company_image: 1,
            approval: 1,
            createdAt: 1,
            updatedAt: 1,
            city_id: 1,
            loyaltypoint: { $ifNull: ['$loyaltypoint', {_id: null, totalCreditPoints: 0, totalDebitPoints: 0}]},
            "country._id": { $ifNull: ["$country._id", ""] },
            "country.name": { $ifNull: ["$country.name", ""] },
          },
        },
      ]);

      var finaldata = await User.aggregatePaginate(query, options);

      await Promise.map(finaldata.docs, async (el, index) => {
        el.first_name =
          el.first_name != null && el.first_name != ""
            ? base64Decode(el.first_name)
            : "";
        el.last_name =
          el.last_name != null && el.last_name != ""
            ? base64Decode(el.last_name)
            : "";
        el.email =
          el.email != null && el.email != "" ? base64Decode(el.email) : "";
        el.mobile =
          el.mobile != null && el.mobile != "" ? base64Decode(el.mobile) : "";
      });
      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("USER_NOT_FOUND", {}, req, true));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  allUserList: async (req, res) => {
    try {
      let {
        page,
        page_size,
        keyword,
        status,
        start_date,
        end_date,
        sort_by,
        sort_type,
      } = req.query;
      const enddate = moment(end_date).endOf("day");

      var whereStatement = {};
      if (status) {
        whereStatement.status = status;
      }

      var condition = {};
      if (start_date && end_date) {
        condition = {
          createdAt: {
            $gte: new Date(start_date),
            $lte: new Date(enddate),
          },
        };
      } else if (start_date && !end_date) {
        condition = {
          createdAt: {
            $gte: new Date(start_date),
            $lte: new Date(Date.now()),
          },
        };
      } else if (!start_date && end_date) {
        condition = {
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
      condition["$or"] = [{ role_id: 1 }, { role_id: 2 }];

      const finalCodition = {
        ...whereStatement,
        ...condition,
      };

      console.log("final=>>>>>>>>>>>>>>>>", finalCodition);
      const finaldata = await User.aggregatePaginate(finalCodition, {
        page: page || 1,
        limit: page_size || 10,
        sort: {
          [sort_by || "createdAt"]: [sort_type || -1],
        },
      });
      await Promise.map(finaldata.docs, async (el, index) => {
        el.first_name = base64Decode(el.first_name);
        el.last_name = base64Decode(el.last_name);
        el.email = base64Decode(el.email);
        el.mobile = base64Decode(el.mobile);
        el.country_code = base64Decode(el.country_code);
      });
      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("USER_NOT_FOUND", {}, req, true));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  allUsers: async (req, res) => {
    try {
      var condition = {};
      condition["$or"] = [{ role_id: 1 }, { role_id: 2 }];

      const finaldata = await User.aggregate([
        {
          $match: { $or: [{ role_id: 1 }, { role_id: 2 }] },
        },
        {
          $project: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            country_code: 1,
            mobile: 1,
            email: 1,
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ]);
      await Promise.map(finaldata, async (el, index) => {
        el.first_name = base64Decode(el.first_name);
        el.last_name = base64Decode(el.last_name);
        el.email = base64Decode(el.email);
        el.mobile = base64Decode(el.mobile);
        el.country_code = base64Decode(el.country_code);
      });
      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("USER_NOT_FOUND", {}, req, true));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  topUsers: async (req, res) => {
    try {
      let {
        page,
        limit,
        keyword,
        status,
        start_date,
        end_date,
        sort_by,
        sort_type,
        country_id,
      } = req.query;
      const sortOptions = {
        [sort_by || "createdAt"]: sort_type === "asc" ? 1 : -1,
      };
      const options = {
        page: page || 1,
        limit: limit || 10,
        sort_by: sortOptions,
      };
      var condition = {};
      var whereStatement = {};

      if (country_id) {
        whereStatement["store.country._id"] = Types.ObjectId(country_id);
      }

      const enddate = moment(end_date).endOf("day");
      if (start_date && end_date) {
        condition = {
          createdAt: {
            $gte: new Date(start_date),
            $lte: new Date(enddate),
          },
        };
      } else if (start_date && !end_date) {
        condition = {
          createdAt: {
            $gte: new Date(start_date),
            $lte: new Date(Date.now()),
          },
        };
      } else if (!start_date && end_date) {
        condition = {
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
      condition["delivery_status"] = 5;

      const query = Order.aggregate([
        {
          $match: condition,
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  first_name: 1,
                  last_name: 1,
                  role_id: 1,
                  email: 1,
                  mobile: 1,
                  status: 1,
                  // is_credit_user: { $ifNull: ["$is_credit_user", 0] },
                },
              },
            ],
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $lookup: {
            from: "stores",
            localField: "store_id",
            foreignField: "_id",
            pipeline: [
              {
                $lookup: {
                  from: "countries",
                  localField: "country_id",
                  foreignField: "_id",
                  pipeline: [{ $project: { alpha_code: 1, name: 1 } }],
                  as: "country",
                },
              },
              {
                $unwind: { path: "$country", preserveNullAndEmptyArrays: true },
              },
              {
                $lookup: {
                  from: "cities",
                  localField: "city_id",
                  foreignField: "_id",
                  pipeline: [{ $project: { name: 1 } }],
                  as: "city",
                },
              },
              { $unwind: { path: "$city", preserveNullAndEmptyArrays: true } },
              { $project: { name: 1, country: 1, city: 1 } },
            ],
            as: "store",
          },
        },
        {
          $unwind: "$store",
        },
        {
          $match: whereStatement,
        },
        {
          $project: {
            _id: 1,
            user: 1,
            address: { $ifNull: ["$address.full_address", ""] },
            country: { $ifNull: ["$store.country", {}] },
            city: { $ifNull: ["$store.city", {}] },
          },
        },
        {
          $group: {
            _id: "$user._id",
            totalOrder: { $sum: 1 },
            first_name: { $first: "$user.first_name" },
            last_name: { $first: "$user.last_name" },
            email: { $first: "$user.email" },
            mobile: { $first: "$user.mobile" },
            status: { $first: "$user.status" },
            role_id: { $first: "$user.role_id" },
            country_name: { $first: "$country.name" },
            city_name: { $first: "$city.name" },
            address: { $first: "$address" },
          },
        },
        {
          $sort: sortOptions,
        },
      ]).collation({ locale: "en", strength: 1 });
      var finaldata = await Order.aggregatePaginate(query, options);
      await Promise.map(finaldata.docs, async (el, index) => {
        if (el?.first_name) el.first_name = base64Decode(el.first_name);
        if (el?.last_name) el.last_name = base64Decode(el.last_name);
        if (el?.email) el.email = base64Decode(el.email);
        if (el?.mobile) el.mobile = base64Decode(el.mobile);
        if (el?.country_code) el.country_code = base64Decode(el.country_code);
        if (el?.address) el.address = base64Decode(el.address);
      });
      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("USER_NOT_FOUND", {}, req, true));
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
        email,
        country_code,
        country_id,
        mobile,
        user_type,
        address,
      } = req.body;
      first_name = base64Encode(first_name);
      last_name = base64Encode(last_name);
      email = base64Encode(email);
      mobile = base64Encode(mobile);
      country_code = base64Encode(country_code);
      
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
        country_id,
        mobile,
        address,
      };

      user.status = true;
      user.role_id = 1;
      user.user_type = user_type;
      user.marketing_offers = 1;
      user.is_mobile_verified = true;
      user.country_id = country_id;
      const resp = await User.create(user);
      const name =
        base64Decode(resp.first_name) + " " + base64Decode(resp.last_name);
      addLog(
        req.user._id,
        "Customer User Type Added",
        name,
        "Customer User Type Added with name " + name,
        resp._id
      );
      if (resp) {
        const newres = resp.toJSON();
        newres.first_name = base64Decode(newres.first_name);
        newres.last_name = base64Decode(newres.last_name);
        newres.email = base64Decode(newres.email);
        newres.mobile = base64Decode(newres.mobile);
        newres.country_code = base64Decode(newres.country_code);
        return res.json(responseData("USER_ADD_SUCCESS", newres, req, true));
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
        password,
        email,
        country_code,
        mobile,
        address,
      } = req.body;
      first_name = base64Encode(first_name);
      last_name = base64Encode(last_name);
      email = base64Encode(email);
      mobile = base64Encode(mobile);
      country_code = base64Encode(country_code);
      

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

      const user = {
        first_name,
        last_name,
        email,
        country_code,
        mobile,
        address,
      };
      if (req.body?.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

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
      if (oldData.address != resp.address) {
        logMessage +=
          " </br> Address :   " + oldData.address + " to " + resp.address;
      }
      if (oldData.mobile != resp.mobile) {
        logMessage +=
          " </br> Mobile :   " +
          base64Decode(oldData.mobile) +
          " to " +
          base64Decode(resp.mobile);
      }
      addLog(
        req.user._id,
        "Customer User Type Updated",
        base64Decode(resp.first_name) + " " + base64Decode(resp.last_name),
        logMessage,
        resp._id
      );
      if (resp) {
        return res.json(responseData("USER_UPDATE_SUCCESS", {}, req, true));
      } else {
        return res.json(responseData("USER_NOT_FOUND", {}, req, false));
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
        return res.json(responseData("USER_NOT_FOUND", {}, req, false));
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
        "Customer User Type Updated",
        base64Decode(resp.first_name) + " " + base64Decode(resp.last_name),
        status
          ? "Customer User Type has been activated"
          : "Customer User Type has been deactivated",
        resp._id
      );
      if (resp._id) {
        return res.json(responseData("USER_STATUS_UPDATE", {}, req, true));
      } else {
        return res.json(responseData("USER_NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  changeMinimumOrderAmount: async (req, res) => {
    try {
      const { minimum_order_amount } = req.body;
      const resp = await User.updateOne(
        { _id: req.params.id },
        { $set: { minimum_order_amount } }
      );
      if (resp.modifiedCount) {
        return res.json(
          responseData("USER_MINIMUM_ORDER_AMOUNT", {}, req, true)
        );
      } else {
        return res.json(responseData("USER_NOT_FOUND", {}, req, false));
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
        return res.json(responseData("STATUS_UPDATE", {}, req, true));
      } else {
        return res.json(responseData("USER_NOT_FOUND", {}, req, false));
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
        return res.json(responseData("USER_NOT_FOUND", {}, req, false));
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
            role_id: 1,
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

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(allCustomerUser);
      fs.writeFile("./public/csv/all_customer_list.csv", csv, function (err) {
        if (err) throw err;
        console.log("file saved");
        const path1 = `${process.env.API_URL}/csvFile/all_customer_list.csv`;
        return res.json(responseData("GET_CSV", { path: path1 }, req, true));
      });
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
};
