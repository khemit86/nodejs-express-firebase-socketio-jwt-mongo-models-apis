const Log = require("../../models/log.model");
const Admin = require("../../models/admin.model");
const User = require("../../models/user.model");
const { isEmpty, trim } = require("lodash");
const { responseData } = require("../../helpers/responseData");
var bcrypt = require("bcryptjs");
const status = require("http-status");
var moment = require("moment");
const { ObjectId } = require("mongodb");
var momentTz = require("moment-timezone");
const { base64Encode, base64Decode } = require("../../helpers/helper");
const Promise = require("bluebird");
const { Types } = require("mongoose");
const { addLog } = require("../../helpers/helper");
module.exports = {
  subadminList: async (req, res) => {
    try {
      let {
        page,
        limit,
        status,
        sort_by,
        keyword,
        country_id,
        sort_type,
        role_id,
        start_date,
        end_date,
        timezone,
        city_id,
        store_id
      } = req.query;
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
      //match.role_id = { $ne: 1 };
      match.role_id = { $eq: parseInt(role_id) };
      if (status) {
        if (status == 1) {
          match.status = true;
        } else if (status == 0) {
          match.status = false;
        }
      }

      if (start_date) {
        start_date = new Date(
          momentTz
            .tz(start_date + " 00:00:00", timezone)
            .utc()
            .toISOString()
        );
      }
      if (end_date) {
        end_date = new Date(
          momentTz
            .tz(end_date + " 23:59:59", timezone)
            .utc()
            .toISOString()
        );
      }

      if (start_date && end_date) {
        match.createdAt = {
          $gte: start_date,
          $lte: end_date,
        };
      } else if (start_date && !end_date) {
        match.createdAt = {
          $gte: start_date,
        };
      } else if (!start_date && end_date) {
        match.createdAt = {
          $lte: end_date,
        };
      }

      if (country_id) {
        match.country_id = Types.ObjectId(country_id);
      }

      if (city_id) {
        match.city_id = Types.ObjectId(city_id);
      }

      if (store_id) {
        match.store_id = Types.ObjectId(store_id);
      }

      if (keyword) {
        let key2 = keyword;
        keyword = base64Encode(keyword);
        match["$or"] = [
          { first_name: { $regex: keyword, $options: "i" } },
          { last_name: { $regex: keyword, $options: "i" } },
          { email: { $regex: keyword, $options: "i" } },
          { mobile: { $regex: keyword, $options: "i" } },
          { "country.name": { $regex: key2, $options: "i" } },
        ];
      }
      const query = Admin.aggregate([
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
          $lookup: {
            from: "stores",
            localField: "store_id",
            foreignField: "_id",
            as: "store",
          },
        },
        {
          $unwind: {
            path: "$store",
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
            mobile: 1,
            address: 1,
            country_code: 1,
            permission: 1,
            "country._id": { $ifNull: ["$country._id", ""] },
            "country.name": { $ifNull: ["$country.name", ""] },
            "city._id": { $ifNull: ["$city._id", ""] },
            "city.name": { $ifNull: ["$city.name", ""] },
            "store._id": { $ifNull: ["$store._id", ""] },
            "store.name": { $ifNull: ["$store.name", ""] },
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            __v: 1,
          },
        },
        {
          $sort: sortOptions,
        },
      ]);

      var finaldata = await Admin.aggregatePaginate(query, options);

      await Promise.map(finaldata.docs, async (el, index) => {
        el.first_name = base64Decode(el.first_name);
        el.last_name = base64Decode(el.last_name);
        el.email = base64Decode(el.email);
        el.mobile = base64Decode(el.mobile);
        let array = [], array2 = [];
          el.permission.map(item=>{
            if(item?.viewOrder) {
              item.viewOrder = Number(item.viewOrder)
              array.push(item)
            } else {
              array2.push(item)
            }
          })
          array = array.sort((a,b)=> a.viewOrder - b.viewOrder)
          el.permission = [...array, ...array2]
      });

      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  add_subadmin: async (req, res) => {
    try {
      var {
        first_name,
        last_name,
        email,
        mobile,
        password,
        country_id,
        city_id,
        store_id,
        role_id,
        country_code,
        address,
      } = req.body;
      first_name = base64Encode(first_name);
      last_name = base64Encode(last_name);
      email = base64Encode(email);
      mobile = base64Encode(mobile);
      const findRecord = await Admin.findOne({ email, role: role_id });
      if (!isEmpty(findRecord)) {
        return res.json(
          responseData("EMAIL_ALREADY_REGISTERED", {}, req, false)
        );
      }
      const findRecordM = await Admin.findOne({ country_id, mobile });
      if (!isEmpty(findRecordM)) {
        return res.json(
          responseData("MOBILE_ALREADY_REGISTERED", {}, req, false)
        );
      }

      const salt = await bcrypt.genSalt(10);
      let subadmin = {
        first_name,
        last_name,
        email,
        mobile,
        country_id,
        city_id,
        store_id,
        role_id,
        country_code,
        address,
      };
      if (req.body.permission) {
        subadmin.permission = req.body.permission;
      }
      subadmin.password = await bcrypt.hash(password, salt);
      const resp = await Admin.create(subadmin);
      const name =
        base64Decode(resp.first_name) + " " + base64Decode(resp.last_name);
      addLog(
        req.user._id,
        role_id === 2
          ? "Country User Type Added"
          : role_id === 3
            ? "City User Type Added"
            : role_id === 4
              ? "Store User Type Added"
              : "",
        name,
        role_id === 2
          ? "Country User Type Added with name " + name
          : role_id === 3
            ? "City User Type Added with name " + name
            : role_id === 4
              ? "Store User Type Added with name " + name
              : "",
        resp._id
      );
      if (resp) {
        const newres = resp.toJSON();
        newres.first_name = base64Decode(newres.first_name);
        newres.last_name = base64Decode(newres.last_name);
        newres.email = base64Decode(newres.email);
        newres.mobile = base64Decode(newres.mobile);

        delete newres["password"];

        let alert_msg_sub = "SUBADMIN_ADD_SUCCESS";
        if (subadmin.role_id == 2) {
          alert_msg_sub = "COUNTRY_ADD_SUCCESS";
        } else if (subadmin.role_id == 3) {
          alert_msg_sub = "CITY_ADD_SUCCESS";
        } else if (subadmin.role_id == 4) {
          alert_msg_sub = "STORE_ADD_SUCCESS";
        }

        return res.json(responseData(alert_msg_sub, newres, req, true));
      } else {
        return res.json(responseData("ERROR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  edit_subadmin: async (req, res) => {
    try {
      var subadmin = req.body;

      subadmin.first_name = base64Encode(subadmin.first_name);
      subadmin.last_name = base64Encode(subadmin.last_name);
      subadmin.email = base64Encode(subadmin.email);
      subadmin.mobile = base64Encode(subadmin.mobile);
      subadmin.address = subadmin.address;
      if (req.body?.email) {
        let email = req.body?.email;
        const findRecord = await Admin.findOne({
          email,
          role_id: subadmin.role_id,
          _id: { $ne: req.params.id },
        });
        if (!isEmpty(findRecord)) {
          return res.json(
            responseData("EMAIL_ALREADY_REGISTERED", {}, req, false)
          );
        }
      }
      if (req.body?.password) {
        const salt = await bcrypt.genSalt(10);
        subadmin.password = await bcrypt.hash(req.body.password, salt);
      }
      var oldData = await Admin.findOne({
        _id: req.params.id,
      });
      const resp = await Admin.findByIdAndUpdate(
        { _id: req.params.id },
        { $set: subadmin },
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
        subadmin.role_id === 2
          ? "Country User Type Updated"
          : subadmin.role_id === 3
            ? "City User Type Updated"
            : subadmin.role_id === 4
              ? "Store User Type Updated"
              : "",
        base64Decode(resp.first_name) + " " + base64Decode(resp.last_name),
        logMessage,
        resp._id
      );
      if (resp) {
        let alert_msg_sub = "SUBADMIN_UPDATE_SUCCESS";
        if (subadmin.role_id == 2) {
          alert_msg_sub = "COUNTRY_UPDATE_SUCCESS";
        } else if (subadmin.role_id == 3) {
          alert_msg_sub = "CITY_UPDATE_SUCCESS";
        } else if (subadmin.role_id == 4) {
          alert_msg_sub = "STORE_UPDATE_SUCCESS";
        }
        return res.json(responseData(alert_msg_sub, {}, req, true));
      } else {
        return res.json(responseData("SUBADMIN_NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  delete_subadmin: async (req, res) => {
    try {
      const resp = await Admin.deleteOne({ _id: req.params.id, role: 2 });
      if (resp.deletedCount) {
        return res.json(responseData("SUBADMIN_DELETE", {}, req, true));
      } else {
        return res.json(responseData("SUBADMIN_NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  subadminChangeStatus: async (req, res) => {
    try {
      const { status } = req.body;

      const resp = await Admin.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { status } },
        { new: true }
      );
      let statusMsg = "";
      if (resp.role_id == 2) {
        statusMsg = "Country User Type";
      } else if (resp.role_id == 3) {
        statusMsg = "City User Type";
      } else if (resp.role_id == 4) {
        statusMsg = "Store User Type";
      }
      addLog(
        req.user._id,
        statusMsg + " Updated",
        base64Decode(resp.first_name) + " " + base64Decode(resp.last_name),
        status
          ? statusMsg + " has been activated"
          : statusMsg + " has been deactivated",
        resp._id
      );
      if (resp._id) {
        let alert_msg_sub = "SUBADMIN_STATUS_UPDATE";
        if (resp.role_id == 2) {
          alert_msg_sub = "COUNTRY_STATUS_UPDATE";
        } else if (resp.role_id == 3) {
          alert_msg_sub = "CITY_STATUS_UPDATE";
        } else if (resp.role_id == 4) {
          alert_msg_sub = "STORE_STATUS_UPDATE";
        }
        return res.json(responseData(alert_msg_sub, {}, req, true));
      } else {
        let alert_msg_sub = "SUBADMIN_NOT_FOUND";
        if (resp.role_id == 2) {
          alert_msg_sub = "COUNTRY_NOT_FOUND";
        } else if (resp.role_id == 3) {
          alert_msg_sub = "CITY_NOT_FOUND";
        } else if (resp.role_id == 4) {
          alert_msg_sub = "STORE_NOT_FOUND";
        }
        return res.json(responseData(alert_msg_sub, {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  permission: async (req, res) => {
    try {
      if (req.user.role_id === 1) {
        let { permission } = req.body;

        //permission = JSON.parse(permission);
        const data = await Admin.findOneAndUpdate(
          { _id: req.params.id },
          { permission },
          { new: true }
        );
        if (data) {
          return res.json(responseData("PERMISSION_ADDED", data, req, true));
        } else {
          return res.json(responseData("ERROR_OCCUR", {}, req, false));
        }
      } else {
        return res.json(responseData("NOT_AUTHORIZED", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  logs_list: async (req, res) => {
    try {
      let { page, limit, sort_by, sort_type, keyword, country_id, start_date, end_date } = req.query;
      keyword = trim(keyword)
      const sortOptions = {
        [sort_by || "createdAt"]: sort_type === "asc" ? 1 : -1,
      };
      const options = {
        page: page || 1,
        limit: limit || 10,
        lean: true,
        sort_by: sortOptions,
      };

      var match = {};
      if (country_id) {
        match["country._id"] = ObjectId(country_id);
      }

      if (end_date) {
        end_date = moment(end_date).endOf("day");
      }

      if (start_date && end_date) {
        match.createdAt = {
          $gte: new Date(start_date),
          $lte: new Date(end_date),
        };
      } else if (start_date && !end_date) {
        match.createdAt = {
          $gte: new Date(start_date),
          $lte: new Date(Date.now()),
        };
      } else if (!start_date && end_date) {
        match.createdAt = {
          $lte: new Date(end_date),
        };
      }

      if (keyword) {
        keyword = base64Encode(keyword);
        match["$or"] =  [
          { "userData.first_name": { $regex: keyword, $options: "i" } },
          { "userData.last_name": { $regex: keyword, $options: "i" } },
        ]
      }

      const query = Log.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            pipeline: [
              {
                $lookup: {
                  from: "countries",
                  localField: "country_id",
                  foreignField: "_id",
                  pipeline: [
                    { $project: { alpha_code: 1, name: 1 } }
                  ],
                  as: "country",
                },
              },
              {
                $unwind: "$country",
              },
              { $project: { _id: 1, first_name: 1, last_name: 1, country: 1 } }
              // { $project: { first_name: 1, last_name: 1 } }],
            ],
            as: "user",
          },
        },
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "admins",
            localField: "user_id",
            foreignField: "_id",
            pipeline: [ 
              {
              $lookup: {
                from: "countries",
                localField: "country_id",
                foreignField: "_id",
                pipeline: [
                  { $project: { alpha_code: 1, name: 1 } }
                ],
                as: "country",
              },
            },
            {
              $unwind: "$country",
            },
            { $project: { _id: 1, first_name: 1, last_name: 1, country: 1 } }],
            as: "admin",
          },
        },
        {
          $unwind: {
            path: "$admin",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            type: 1,
            header: 1,
            message: 1,
            entity_id: 1,
            userData: { $ifNull: ["$admin", "$user"] },
            country: { $ifNull: ["$admin.country", "$user.country"] },
            createdAt: 1,
            updatedAt: 1,
            __v: 1,
          },
        },
        {
          $match: match,
        },
        {
          $sort: sortOptions,
        },
      ]);

      var finaldata = await Log.aggregatePaginate(query, options);

      await Promise.map(finaldata.docs, async (el, index) => {
        if(el?.userData?.first_name) el.userData.first_name = base64Decode(el.userData.first_name);
        if(el?.userData?.last_name) el.userData.last_name = base64Decode(el.userData.last_name);
      });

      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  change_password: async (req, res) => {
    try {
      let { type, password, _id } = req.body;
      if(req.user.role_id === 1) {
        const salt = await bcrypt.genSalt(10);
        let pass = '';
        if(type === 'country_user' || type === 'city_user' || type === 'store_user') {
          pass = await bcrypt.hash(password, salt);
          await Admin.updateOne({ _id: Types.ObjectId(_id) }, { $set: { password: pass }}, { new: true });
          return res.json(responseData("PASSWORD_CHANGED", {}, req, true));
        } else if(type === 'driver' || type === 'customer' || type === 'wholeseller') {
          let userDetail = {};
          if(type === 'driver' || type === 'wholeseller') userDetail.org_password = password;
          userDetail.password = await bcrypt.hash(password, salt);
          await User.updateOne({ _id: Types.ObjectId(_id) }, { $set: userDetail}, { new: true });
          return res.json(responseData("PASSWORD_CHANGED", {}, req, true));
        } else {
          return res.json(responseData("TYPE_USER_INVALID_WAY", {}, req, false));
        }
      } else {
        return res.json(responseData("ONLY_ADMIN_CAN_CHANGE_PASSWORD", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
};
