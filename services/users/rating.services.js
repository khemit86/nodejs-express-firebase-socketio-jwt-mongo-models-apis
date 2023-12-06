const Rating = require("../../models/rating.model");
const Product = require("../../models/product.model");
const Brand = require("../../models/brand.model");

const Store = require("../../models/store.model");
var { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
const { addLog } = require("../../helpers/helper");
const _ = require("lodash");
const { Types } = require("mongoose");
const { saveFile, saveThumbFile } = require("../../helpers/helper");
var moment = require("moment");
var momentTz = require("moment-timezone");
const Promise = require("bluebird");
const { base64Encode, base64Decode } = require("../../helpers/helper");

module.exports = {
  add_rating: async (req, res) => {
    try {
      var user_id = req.user._id;
      const { product_id,product_rating,store_id,review} = req.body;

      const rating = await Rating.create({ product_id,user_id,product_rating,store_id,review });
      
      if (!isEmpty(rating)) {
        return res.json(responseData("RATING_ADDED", rating, req, true));
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  delete_rating: async (req, res) => {
    try {
      const rating = await Rating.findOneAndRemove({
        _id: req.params.id,
      });
      if (!isEmpty(rating)) {
        return res.json(responseData("RATING_DELETED", {}, req, true));
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  list_rating: async (req, res) => {
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
        product_id,
        store_id,
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


      //if (country_id) {
       //match.user_id = Types.ObjectId(user_id);
        // match.product_id = Types.ObjectId(product_id);
        // match.store_id = Types.ObjectId(store_id);
      //}

      // if (keyword) {
      //   match["$or"] = [
      //     { name: { $regex: keyword, $options: "i" } },
      //     { "country.name": { $regex: keyword, $options: "i" } },
      //   ];
      // }

      const query = Rating.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
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
          $match: {product_id:Types.ObjectId(product_id),store_id:Types.ObjectId(store_id)},
        },
        {
          $lookup: {
            from: "products",
            localField: "product_id",
            foreignField: "_id",
            as: "product",
          },
        },
        {
          $unwind: {
            path: "$product",
            preserveNullAndEmptyArrays: true,
          },
        },
        
        {
          $project: {
            _id: 1,
            product_id: 1,
            product_rating: 1,
            review: 1,
            store_id: 1,
            user_id: 1,
            "product._id": { $ifNull: ["$product._id", ""] },
            "product.name": { $ifNull: ["$product.name", ""] },
            "product.price": { $ifNull: ["$product.price", ""] },
            "product.bar_code": { $ifNull: ["$product.bar_code", ""] },
            "product.sku": { $ifNull: ["$product.sku", ""] },
            "product.images": { $ifNull: ["$product.images", ""] },
            "user._id": { $ifNull: ["$user._id", ""] },
            "user.first_name": { $ifNull: ["$user.first_name", ""] },
            "user.last_name": { $ifNull: ["$user.last_name", ""] },
            "user.mobile": { $ifNull: ["$user.mobile", ""] },
            "user.email": { $ifNull: ["$user.email", ""] },
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
      
      var finaldata = await Rating.aggregatePaginate(query, options);
      await Promise.map(finaldata.docs, async (el, index) => {
        el.user.first_name = base64Decode(el.user.first_name);
        el.user.last_name = base64Decode(el.user.last_name);
        el.user.email = base64Decode(el.user.email);
        el.user.mobile = base64Decode(el.user.mobile);
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
  productRating: async (req, res) => {
    try {
      let {
        id,
        store_id,
        page,
        limit,
        sort_type,
        sort_by,
      } = req.query;

      const sortOptions = {
        [sort_by || "created_at"]: sort_type === "asc" ? 1 : -1,
      };

      const options = {
        page: page || 1,
        // limit: process.env.ADMIN_LIST_PAGING_LIMIT || 20,
        limit: limit || 10,
        sort_by: sortOptions,
      };
      
      var match = {};
      if (id) {
        match.product_id = Types.ObjectId(id);
      }
      console.log('->>>>>>>>>>>>>>>>',id);
      const query = Rating.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
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
          $match: {product_id:Types.ObjectId(id),store_id:Types.ObjectId(store_id)},
        },
        {
          $project: {
            _id: 1,
            product_id: 1,
            store_id: 1,
            user_id: 1,
            product_rating:1,
            review:1,
            "user._id": { $ifNull: ["$user._id", ""] },
            "user.first_name": { $ifNull: ["$user.first_name", ""] },
            "user.last_name": { $ifNull: ["$user.last_name", ""] },
            "user.mobile": { $ifNull: ["$user.mobile", ""] },
            "user.email": { $ifNull: ["$user.email", ""] },
            "user.image": { $ifNull: ["$user.image", ""] },
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
      
      var finaldata = await Rating.aggregatePaginate(query, options);
      await Promise.map(finaldata.docs, async (el, index) => {
        el.user.first_name = base64Decode(el.user.first_name);
        el.user.last_name = base64Decode(el.user.last_name);
        el.user.email = base64Decode(el.user.email);
        el.user.mobile = base64Decode(el.user.mobile);
        
        if (el.user.image) {
          el.user.image = process.env.IMAGE_LOCAL_PATH+"user/" + el.user.image;
        } else {
          el.user.image = ""
        }
      });
      console.log('->>>>>>>>>>>>>>>>',finaldata);
      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  editRating: async (req, res) => {
    try {
      const { id,product_rating,review } = req.body;

      const resp = await Rating.updateOne({ _id: id }, { product_rating,review });
      if (resp.modifiedCount) {
        return res.json(responseData("RATING_UPDATED", resp, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }

    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
};
