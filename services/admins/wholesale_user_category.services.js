const WholesaleUserCategory = require("../../models/wholesale_user_category.model");
var { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
const { addLog } = require("../../helpers/helper");
var moment = require("moment");
var momentTz = require("moment-timezone");
const _ = require("lodash");
const { Types } = require("mongoose");

module.exports = {
  add_wholesale_user_category: async (req, res) => {
    try {
      const { name, country_id } = req.body;
      var result = await WholesaleUserCategory.findOne({
        name: { $regex: name, $options: "i" },
        country_id,
      });
      if (result) {
        return res.json(
          responseData(
            "WholeSale Category with same name already exists.",
            {},
            req,
            false
          )
        );
      }
      var defaultValue= false
      const already_wholesale_user_category = await WholesaleUserCategory.findOne({ country_id: country_id })
      if(!already_wholesale_user_category) defaultValue = true
      const wholesale_user_category = await WholesaleUserCategory.create({
        name,
        country_id,
        default: defaultValue
      });
      addLog(
        req.user._id,
        "Wholesale Category Added",
        name,
        "New Wholesale Category Added with name " + name,
        wholesale_user_category._id
      );
      if (!isEmpty(wholesale_user_category)) {
        return res.json(
          responseData(
            "WHOLESALE_USER_CATEGORY_ADDED",
            wholesale_user_category,
            req,
            true
          )
        );
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  delete_wholesale_user_category: async (req, res) => {
    try {
      const wholesale_user_category =
        await WholesaleUserCategory.findOneAndRemove({
          _id: req.params.id,
        });
      if (!isEmpty(wholesale_user_category)) {
        return res.json(
          responseData("WHOLESALE_USER_CATEGORY_DELETED", {}, req, true)
        );
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  list_wholesale_user_category: async (req, res) => {
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

      if (country_id) {
        match.country_id = Types.ObjectId(country_id);
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
      

      if (keyword) {
        match["$or"] = [
          { name: { $regex: keyword, $options: "i" } },
          // { "country.name": { $regex: keyword, $options: "i" } },
        ];
      }

      const query = WholesaleUserCategory.aggregate([
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
            default: 1,
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
      var finaldata = await WholesaleUserCategory.aggregatePaginate(
        query,
        options
      );
      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  edit_wholesale_user_category: async (req, res) => {
    try {
      const { _id, name, country_id } = req.body;

      var result = await WholesaleUserCategory.findOne({
        country_id: country_id,
        name: name,
        _id: { $ne: _id },
      });

      if (result) {
        return res.json(
          responseData(
            "WholeSale Category with same name already exists.",
            {},
            req,
            false
          )
        );
      }

      const serviceValue = {};
      if (name) serviceValue.name = name;
      var wholesale_user_categoryOld = await WholesaleUserCategory.findOne({
        _id: { $eq: _id },
      });
      const wholesale_user_category =
        await WholesaleUserCategory.findByIdAndUpdate({ _id }, serviceValue, {
          new: true,
        });
      let logMessage = "";
      if (wholesale_user_category.name != wholesale_user_categoryOld.name) {
        logMessage +=
          " </br> Name :   " +
          wholesale_user_categoryOld.name +
          " to " +
          wholesale_user_category.name;
        addLog(
          req.user._id,
          "Wholesale Category Updated",
          wholesale_user_category.name,
          logMessage,
          wholesale_user_category._id
        );
      }
      if (!isEmpty(wholesale_user_category)) {
        return res.json(
          responseData(
            "WHOLESALE_USER_CATEGORY_UPDATED",
            wholesale_user_category,
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
  change_status_wholesale_user_category: async (req, res) => {
    try {
      const { id } = req.params;
      const wholesale_user_categoryDetail = await WholesaleUserCategory.findOne(
        { _id: id }
      );
      let status = wholesale_user_categoryDetail?.status == 1 ? 0 : 1;
      const wholesale_user_category =
        await WholesaleUserCategory.findOneAndUpdate(
          { _id: id },
          { status },
          { new: true }
        );
      addLog(
        req.user._id,
        "Wholesale Category Status Updated",
        wholesale_user_categoryDetail.name,
        status
          ? "Wholesale Category has been activated"
          : "Wholesale Category has been deactiavted",
        id
      );
      if (!isEmpty(wholesale_user_category)) {
        return res.json(
          responseData(
            "WHOLESALE_USER_CATEGORY_STATUS_UPDATED",
            wholesale_user_category,
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
  change_default_wholesale_user_category: async (req, res) => {
    try {
      const { id } = req.params;
      const { country_id }= req.body;
      const wholesale_user_categoryDetail = await WholesaleUserCategory.findOne(
        { _id: id }
      );
      await WholesaleUserCategory.updateMany({country_id: Types.ObjectId(country_id)}, { default: false });
      const wholesale_user_category =
        await WholesaleUserCategory.findOneAndUpdate(
          { _id: id },
          { default: true },
          { new: true }
        );
      addLog(
        req.user._id,
        "Wholesale Category Default Updated",
        wholesale_user_categoryDetail.name,
        "Wholesale Category is set to default",
        id
      );
      if (!isEmpty(wholesale_user_category)) {
        return res.json(
          responseData(
            "WHOLESALE_USER_CATEGORY_STATUS_UPDATED",
            wholesale_user_category,
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
