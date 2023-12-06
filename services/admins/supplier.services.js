const Supplier = require("../../models/supplier.model");
var { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
const { addLog } = require("../../helpers/helper");
const _ = require("lodash");
const { Types } = require("mongoose");
var moment = require("moment");
var momentTz = require("moment-timezone");

module.exports = {
  add_supplier: async (req, res) => {
    try {
      const { name, country_id } = req.body;
      var result = await Supplier.findOne({ name, country_id });
      if (result) {
        return res.json(
          responseData(
            "Supplier with same name already exists.",
            {},
            req,
            false
          )
        );
      }
      const supplier = await Supplier.create({ name, country_id });
      addLog(
        req.user._id,
        "supplier Added",
        name,
        "New supplier Added with name " + name,
        supplier._id
      );
      if (!isEmpty(supplier)) {
        return res.json(responseData("SUPPLIER_ADDED", supplier, req, true));
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  delete_supplier: async (req, res) => {
    try {
      const supplier = await Supplier.findOneAndRemove({
        _id: req.params.id,
      });
      if (!isEmpty(supplier)) {
        return res.json(responseData("SUPPLIER_DELETED", {}, req, true));
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  list_supplier: async (req, res) => {
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
          // { "country.name": { $regex: keyword, $options: "i" } },
        ];
      }

      const query = Supplier.aggregate([
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
      var finaldata = await Supplier.aggregatePaginate(query, options);
      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  edit_supplier: async (req, res) => {
    try {
      const { _id, name, country_id } = req.body;

      var result = await Supplier.findOne({
        country_id: country_id,
        name: name,
        _id: { $ne: _id },
      });

      if (result) {
        return res.json(
          responseData(
            "Supplier with same name already exists.",
            {},
            req,
            false
          )
        );
      }

      const serviceValue = {};
      if (name) serviceValue.name = name;

      var supplierOld = await Supplier.findOne({
        _id: { $eq: _id },
      });
      const supplier = await Supplier.findByIdAndUpdate({ _id }, serviceValue, {
        new: true,
      });

      let logMessage = "";
      if (supplier.name != supplierOld.name) {
        logMessage +=
          " </br> Name :   " + supplierOld.name + " to " + supplier.name;
        addLog(
          req.user._id,
          "Supplier Updated",
          supplier.name,
          logMessage,
          supplier._id
        );
      }

      if (!isEmpty(supplier)) {
        return res.json(responseData("SUPPLIER_UPDATED", supplier, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  change_status_supplier: async (req, res) => {
    try {
      const { id } = req.params;
      const supplierDetail = await Supplier.findOne({ _id: id });
      let status = supplierDetail?.status == 1 ? 0 : 1;
      const supplier = await Supplier.findOneAndUpdate(
        { _id: id },
        { status },
        { new: true }
      );
      addLog(
        req.user._id,
        "Supplier Status Updated",
        supplierDetail.name,
        status
          ? "Supplier has been activated"
          : "Supplier has been deactiavted",
        id
      );
      if (!isEmpty(supplier)) {
        return res.json(
          responseData("SUPPLIER_STATUS_UPDATED", supplier, req, true)
        );
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
};
