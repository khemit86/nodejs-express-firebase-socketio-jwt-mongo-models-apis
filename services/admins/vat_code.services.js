const VATCode = require("../../models/vat_code.model");
var { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
const { addLog } = require("../../helpers/helper");
const _ = require("lodash");
const { Types } = require("mongoose");
var moment = require("moment");
var momentTz = require("moment-timezone");

module.exports = {
  add_vat_code: async (req, res) => {
    try {
      const { name, percentage, country_id } = req.body;
      var result = await VATCode.findOne({ name, country_id });
      if (result) {
        return res.json(
          responseData("VATCode with same name already exists.", {}, req, false)
        );
      }
      const vat_code = await VATCode.create({ name, percentage, country_id });
      addLog(
        req.user._id,
        "Vat Code Added",
        name,
        "New Vat Code Added with name: " + name + ", percentage: " + percentage,
        vat_code._id
      );
      if (!isEmpty(vat_code)) {
        return res.json(responseData("VAT_CODE_ADDED", vat_code, req, true));
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  delete_vat_code: async (req, res) => {
    try {
      const vat_code = await VATCode.findOneAndRemove({
        _id: req.params.id,
      });
      if (!isEmpty(vat_code)) {
        return res.json(responseData("VAT_CODE_DELETED", {}, req, true));
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  list_vat_code: async (req, res) => {
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
          //{ percentage: { $regex: keyword, $options: "i" } },
          //{ "country.name": { $regex: keyword, $options: "i" } },
        ];
      }

      const query = VATCode.aggregate([
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
            percentage: 1,
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
      var finaldata = await VATCode.aggregatePaginate(query, options);
      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  edit_vat_code: async (req, res) => {
    try {
      const { _id, name, percentage, country_id } = req.body;

      var result = await VATCode.findOne({
        country_id: country_id,
        name: name,
        _id: { $ne: _id },
      });

      if (result) {
        return res.json(
          responseData("VATCode with same name already exists.", {}, req, false)
        );
      }

      const serviceValue = {};
      if (name) serviceValue.name = name;
      if (percentage) serviceValue.percentage = percentage;
      var vat_codeOld = await VATCode.findOne({
        _id: { $eq: _id },
      });
      const vat_code = await VATCode.findByIdAndUpdate({ _id }, serviceValue, {
        new: true,
      });
      let logMessage = "";
      if (vat_code.name != vat_codeOld.name) {
        logMessage +=
          " </br> Name :   " + vat_codeOld.name + " to " + vat_code.name;
      }
      if (vat_code.percentage != vat_codeOld.percentage) {
        logMessage +=
          " </br> Percentage :   " +
          vat_codeOld.percentage +
          " to " +
          vat_code.percentage;
      }
      if (logMessage != "") {
        addLog(
          req.user._id,
          "Vat Code Updated",
          vat_code.name,
          logMessage,
          vat_code._id
        );
      }
      if (!isEmpty(vat_code)) {
        return res.json(responseData("VAT_CODE_UPDATED", vat_code, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  change_status_vat_code: async (req, res) => {
    try {
      const { id } = req.params;
      const vat_codeDetail = await VATCode.findOne({ _id: id });
      let status = vat_codeDetail?.status == 1 ? 0 : 1;
      const vat_code = await VATCode.findOneAndUpdate(
        { _id: id },
        { status },
        { new: true }
      );
      addLog(
        req.user._id,
        "VAT Code Status Updated",
        vat_codeDetail.name,
        status
          ? "VAT Code has been activated"
          : "VAT Code has been deactiavted",
        id
      );
      if (!isEmpty(vat_code)) {
        return res.json(
          responseData("VAT_CODE_STATUS_UPDATED", vat_code, req, true)
        );
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
};
