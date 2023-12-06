const WSBusinessType = require("../../models/ws_business_type.model");
var { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
const { addLog } = require("../../helpers/helper");
const _ = require("lodash");
const { Types } = require("mongoose");
var moment = require("moment");
var momentTz = require("moment-timezone");

module.exports = {
  add_ws_business_type: async (req, res) => {
    try {
      const { name, country_id } = req.body;
      var result = await WSBusinessType.findOne({ name, country_id });
      if (result) {
        return res.json(
          responseData(
            "Business Type with same name already exists.",
            {},
            req,
            false
          )
        );
      }
      const ws_business_type = await WSBusinessType.create({
        name,
        country_id,
      });
      addLog(
        req.user._id,
        "Wholesale Business Type Added",
        name,
        "Wholesale Business Type Added with name " + name,
        ws_business_type._id
      );
      if (!isEmpty(ws_business_type)) {
        return res.json(
          responseData("WS_BUSINESS_TYPE_ADDED", ws_business_type, req, true)
        );
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  delete_ws_business_type: async (req, res) => {
    try {
      const ws_business_type = await WSBusinessType.findOneAndRemove({
        _id: req.params.id,
      });
      if (!isEmpty(ws_business_type)) {
        return res.json(
          responseData("WS_BUSINESS_TYPE_DELETED", {}, req, true)
        );
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  list_ws_business_type: async (req, res) => {
    try {
      let {
        page,
        limit,
        status,
        sort_by,
        keyword,
        country_id,
        sort_type,
        start_date,
        end_date,
        timezone,
      } = req.query;
      keyword = _.trim(keyword);
      const sortOptions = {
        [sort_by || "created_at"]: sort_type === "asc" ? 1 : -1,
      };
      const options = {
        page: page || 1,
        limit: limit || 10,
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

      if (keyword) {
        match["$or"] = [
          { name: { $regex: keyword, $options: "i" } },
          //{ "country.name": { $regex: keyword, $options: "i" } },
        ];
      }

      const query = WSBusinessType.aggregate([
        {
          $lookup: {
            from: "countries",
            localField: "country_id",
            foreignField: "_id",
            as: "country",
          },
        },
        {
          $unwind: "$country",
        },
        {
          $match: match,
        },
        {
          $project: {
            _id: 1,
            name: 1,
            "country._id": 1,
            "country.name": 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            __v: 1,
          },
        },
        {
          $sort: sortOptions,
        },
      ]).collation({ locale: "en", strength: 1 });
      var finaldata = await WSBusinessType.aggregatePaginate(query, options);
      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  edit_ws_business_type: async (req, res) => {
    try {
      const { _id, name, country_id } = req.body;

      var result = await WSBusinessType.findOne({
        country_id: country_id,
        name: name,
        _id: { $ne: _id },
      });

      if (result) {
        return res.json(
          responseData(
            "Business Type with same name already exists.",
            {},
            req,
            false
          )
        );
      }

      const serviceValue = {};
      if (name) serviceValue.name = name;
      var ws_business_typeOld = await WSBusinessType.findOne({
        _id: { $eq: _id },
      });

      const ws_business_type = await WSBusinessType.findByIdAndUpdate(
        { _id },
        serviceValue,
        { new: true }
      );
      let logMessage = "";
      if (ws_business_type.name != ws_business_typeOld.name) {
        logMessage +=
          " </br> Name :   " +
          ws_business_typeOld.name +
          " to " +
          ws_business_type.name;
        addLog(
          req.user._id,
          "Wholesale Business Type Updated",
          ws_business_type.name,
          logMessage,
          ws_business_type._id
        );
      }

      if (!isEmpty(ws_business_type)) {
        return res.json(
          responseData("WS_BUSINESS_TYPE_UPDATED", ws_business_type, req, true)
        );
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  change_status_ws_business_type: async (req, res) => {
    try {
      const { id } = req.params;
      const ws_business_typeDetail = await WSBusinessType.findOne({ _id: id });
      let status = ws_business_typeDetail?.status == 1 ? 0 : 1;
      const ws_business_type = await WSBusinessType.findOneAndUpdate(
        { _id: id },
        { status },
        { new: true }
      );
      addLog(
        req.user._id,
        "Wholesale Business Type Updated",
        ws_business_typeDetail.name,
        status
          ? "Wholesale Business Type has been activated"
          : "Wholesale Business Type has been deactiavted",
        id
      );
      if (!isEmpty(ws_business_type)) {
        return res.json(
          responseData(
            "WS_BUSINESS_TYPE_STATUS_UPDATED",
            ws_business_type,
            req,
            true
          )
        );
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
};
