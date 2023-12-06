const Product = require("../../models/product.model");
const Supplier = require("../../models/supplier.model");
const Brand = require("../../models/brand.model");
const VATCode = require("../../models/vat_code.model");
const Category = require("../../models/category.model");
const SizeCode = require("../../models/sizecode.model");
const Store = require("../../models/store.model");
const StoreProduct = require("../../models/storeproduct.model");
const Notify = require("../../models/notify.model");
const ProductInventory = require("../../models/productinventory.model");
const WholesaleUserCategory = require("../../models/wholesale_user_category.model");
var moment = require("moment");
var momentTz = require("moment-timezone");
const Promise = require("bluebird");
var { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
const _ = require("lodash");
const { Types } = require("mongoose");
var { Parser } = require("json2csv");
const path = require("path");
const fs = require("fs");
const {
  saveFile,
  saveThumbFile,
  unlinkFile,
  syncInventory,
  removeNotify,
  list_to_tree,
  addLog,
  getProductPriceDetails,
} = require("../../helpers/helper");
const {
  PRODUCT_FOLDER,
  PRODUCT_THUMB_WIDTH,
  PRODUCT_THUMB_HEIGHT,
} = require("../../helpers/config");

module.exports = {
  add_product: async (req, res) => {
    try {
      var {
        name,
        description,
        country_id,
        brand_id,
        supplier_id,
        vat_code_id,
        size_code_id,
        size,
        offer_price,
        offer_start_at,
        offer_start_end,
        w_discount_per,
        w_offer_start_at,
        w_offer_start_end,
        price,
        buy_price,
        bar_code,
        sku,
        categories,
        is_special,
        min_qty_stock,
        admin_limit,
        product_info,
        minimum_quantity_for_wholesaler,
      } = req.body;
      if (offer_start_at && offer_start_at != "Invalid date") {
        offer_start_at = moment(offer_start_at).unix();
      } else {
        offer_start_at = null;
      }
      if (offer_start_end && offer_start_end != "Invalid date") {
        offer_start_end = moment(offer_start_end).unix();
      } else {
        offer_start_end = null;
      }
      if (w_offer_start_at && w_offer_start_at != "Invalid date") {
        w_offer_start_at = moment(w_offer_start_at).unix();
      } else {
        w_offer_start_at = null;
      }
      if (w_offer_start_end && w_offer_start_end != "Invalid date") {
        w_offer_start_end = moment(w_offer_start_end).unix();
      } else {
        w_offer_start_end = null;
      }

      var result = await Product.findOne({ name, country_id });
      if (result) {
        return res.json(
          responseData("Product with same name already exists.", {}, req, false)
        );
      }

      categories = categories.split(",");
      categories = categories.map(function (element) {
        return Types.ObjectId(element);
      });
      // uploadImageStart

      var image = "";
      var images = [];

      const files = req.files;
      if (files && files.image) {
        const data = files.image;
        if (data.name) {
          if (files && files.image.name != undefined) {
            image = await saveFile(files.image, PRODUCT_FOLDER, null);
            await saveThumbFile(
              files.image,
              PRODUCT_FOLDER,
              null,
              image,
              PRODUCT_THUMB_WIDTH,
              PRODUCT_THUMB_HEIGHT,
              `public/${PRODUCT_FOLDER}/thumb`
            );
            images.push({ name: image, is_default: 0 });
          }
        } else {
          var imageArray = [];
          data.forEach(function (item, index) {
            var obj = {};
            obj.index = index + 1;
            obj.image = item;
            imageArray.push(obj);
          });

          await Promise.map(imageArray, async (item) => {
            if (item.image && item.image.name != undefined) {
              image = await saveFile(item.image, PRODUCT_FOLDER, null);
              images.push({ name: image, is_default: 0 });
              await saveThumbFile(
                item.image,
                PRODUCT_FOLDER,
                null,
                image,
                PRODUCT_THUMB_WIDTH,
                PRODUCT_THUMB_HEIGHT,
                `public/${PRODUCT_FOLDER}/thumb`
              );
            }
          });
        }
      }

      // const sortOrder = await Product.find({"product_id" : {$nin: ["", null]}}).sort({order_id: -1}).limit(1);
      const sortProduct = await Product.find({})
        .sort({ product_id: -1 })
        .limit(1);
      let productNo = 1;
      if (sortProduct) {
        productNo = sortProduct[0]?.product_id + 1;
      }

      // uploadImageEnd
      const product = await Product.create({
        name,
        description,
        country_id,
        brand_id,
        supplier_id,
        vat_code_id,
        size_code_id,
        size,
        offer_price,
        offer_start_at,
        offer_start_end,
        w_discount_per,
        w_offer_start_at,
        w_offer_start_end,
        price,
        buy_price,
        bar_code,
        sku,
        images,
        categories,
        is_special,
        min_qty_stock,
        admin_limit,
        product_info,
        minimum_quantity_for_wholesaler,
        product_id: productNo,
      });
      // createLog Start
      // set first image as default image
      await Product.updateOne(
        { _id: product._id },
        { $set: { "images.0.is_default": 1 } }
      );
      var match = {};
      match._id = product._id;
      var pipeline = [
        { $match: match },
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
            from: "brands",
            localField: "brand_id",
            foreignField: "_id",
            as: "brand",
          },
        },
        {
          $unwind: {
            path: "$brand",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "suppliers",
            localField: "supplier_id",
            foreignField: "_id",
            as: "supplier",
          },
        },
        {
          $unwind: {
            path: "$supplier",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "sizecodes",
            localField: "size_code_id",
            foreignField: "_id",
            as: "sizecode",
          },
        },
        {
          $unwind: {
            path: "$sizecode",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "vatcodes",
            localField: "vat_code_id",
            foreignField: "_id",
            as: "vatcode",
          },
        },
        {
          $unwind: {
            path: "$vatcode",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "categories",
            foreignField: "_id",
            as: "categoriesz",
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            country_id: 1,
            brand_id: 1,
            supplier_id: 1,
            vat_code_id: 1,
            size_code_id: 1,
            size: 1,
            price: 1,
            buy_price: 1,
            sku: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            w_prices: 1,
            images: 1,
            categories: 1,
            categoriesz: 1,
            offer_price: 1,
            offer_start_at: 1,
            offer_start_end: 1,
            w_discount_per: 1,
            w_offer_start_at: 1,
            w_offer_start_end: 1,
            bar_code: 1,
            is_special: 1,
            min_qty_stock: 1,
            admin_limit: 1,
            product_info: 1,
            minimum_quantity_for_wholesaler: 1,
            "country._id": { $ifNull: ["$country._id", ""] },
            "country.name": { $ifNull: ["$country.name", ""] },
            "brand._id": { $ifNull: ["$brand._id", ""] },
            "brand.name": { $ifNull: ["$brand.name", ""] },
            "supplier._id": { $ifNull: ["$supplier._id", ""] },
            "supplier.name": { $ifNull: ["$supplier.name", ""] },
            "sizecode._id": { $ifNull: ["$sizecode._id", ""] },
            "sizecode.name": { $ifNull: ["$sizecode.name", ""] },
            "vatcode._id": { $ifNull: ["$vatcode._id", ""] },
            "vatcode.name": { $ifNull: ["$vatcode.name", ""] },
          },
        },
      ];
      const getNewProduct = await Product.aggregate(pipeline);
      //createLog End

      let logMessage = "Country :   " + getNewProduct[0].country.name;
      logMessage += " </br> Brand :   " + getNewProduct[0].brand.name;
      logMessage += " </br> Supplier :   " + getNewProduct[0].supplier.name;
      logMessage += " </br> SizeCode :   " + getNewProduct[0].sizecode.name;
      logMessage += " </br> VatCode :   " + getNewProduct[0].vatcode.name;
      logMessage += " </br> Name :   " + getNewProduct[0].name;
      logMessage += " </br> Description :   " + getNewProduct[0].description;
      logMessage += " </br> Offer Price :   " + getNewProduct[0].offer_price;
      logMessage +=
        " </br> Offer Start At :   " + getNewProduct[0].offer_start_at;
      logMessage +=
        " </br> Offer End At :   " + getNewProduct[0].offer_start_end;
      logMessage +=
        " </br> Wholesale Discount Per :   " + getNewProduct[0].w_discount_per;
      logMessage +=
        " </br> Wholesale Discount Start At :   " +
        getNewProduct[0].w_offer_start_at;
      logMessage +=
        " </br> Wholesale Discount End At :   " +
        getNewProduct[0].w_offer_start_end;
      logMessage += " </br> Price:   " + getNewProduct[0].price;
      logMessage += " </br> Buy Price :   " + getNewProduct[0].buy_price;
      logMessage += " </br> Bar Code :   " + getNewProduct[0].bar_code;
      logMessage += " </br> SKU :   " + getNewProduct[0].sku;
      logMessage += " </br> Is Special :   " + getNewProduct[0].is_special;
      logMessage +=
        " </br> Minimum Quantity Stock :   " + getNewProduct[0].min_qty_stock;
      logMessage += " </br> Admin Limit :   " + getNewProduct[0].admin_limit;
      logMessage +=
        " </br> Product Information :   " + getNewProduct[0].product_info;
      logMessage +=
        " </br> Minimum Quantity for Wholesaler :   " +
        getNewProduct[0].minimum_quantity_for_wholesaler;
      logMessage += " </br> Categories :   ";
      getNewProduct[0].categoriesz.map(function (element) {
        logMessage += " </br> " + element.name;
      });
      addLog(
        req.user._id,
        "Product Added",
        getNewProduct[0].name,
        logMessage,
        getNewProduct[0]._id
      );
      // console.log(logMessage);
      if (!isEmpty(product)) {
        return res.json(responseData("PRODUCT_ADDED", product, req, true));
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  delete_product: async (req, res) => {
    try {
      const product = await Product.findOneAndRemove({ _id: req.params.id });
      if (!isEmpty(product)) {
        return res.json(responseData("PRODUCT_DELETED", {}, req, true));
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  delete_product_image: async (req, res) => {
    try {
      let productExist = await Product.findById(req.params.id);
      let _id = req.params.id;
      var filteredArray = productExist.images.filter(
        (e) => e.name !== req.params.iid
      );
      var productDetails = {};

      if (filteredArray) productDetails.images = filteredArray;

      const product = await Product.findByIdAndUpdate(
        { _id },
        { $set: productDetails },
        {
          new: true,
        }
      );
      await unlinkFile(PRODUCT_FOLDER, req.params.iid);
      if (!isEmpty(product)) {
        return res.json(responseData("PRODUCT_DELETED", {}, req, true));
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  getAttributes: async (req, res) => {
    try {
      /// start
      let { country_id } = req.query;
      var match = {};
      match.country_id = Types.ObjectId(country_id);
      const allStores = await Store.aggregate([
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
        { $project: { _id: 1, name: 1, "city.name": 1 } },
        { $sort: { "city.name": 1, name: 1 } },
      ]);
      //console.log(allStores);

      const allCategories = await Category.aggregate([
        { $match: match },
        {
          $project: {
            _id: 1,
            name: 1,
            status: 1,
            parent: { $ifNull: ["$parent", ""] },
          },
        },
        { $sort: { title: 1 } },
      ]);
      //console.log(allCategories);
      //const ten='';
      const ten = await list_to_tree(allCategories);

      const allSuppliers = await Supplier.find({
        country_id: Types.ObjectId(country_id),
        status: true,
      })
        .sort({ name: 1 })
        .select("name _id");
      const allBrands = await Brand.find({
        country_id: country_id,
        status: true,
      })
        .sort({ name: 1 })
        .select("name _id");
      const allVATCodes = await VATCode.find({
        country_id: country_id,
        status: true,
      })
        .sort({ name: 1 })
        .select("name _id");
      const allsizeCodes = await SizeCode.find({})
        .sort({ name: 1 })
        .select("name _id");
      return res.json(
        responseData(
          "GET_LIST",
          {
            suppliers: allSuppliers,
            brands: allBrands,
            vats: allVATCodes,
            categories: ten,
            sizeCodes: allsizeCodes,
            allStores: allStores,
          },
          req,
          true
        )
      );
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  get_store_products: async (req, res) => {
    try {
      let { keyword } = req.query;
      var store_id = req.params.id;
      const sortOptions = {
        ["name"]: 1,
      };

      var match = {};
      var match2 = {};
      if (store_id) {
        match.store_id = Types.ObjectId(store_id);
      }

      if (keyword) {
        match2["product.name"] = { $regex: _.trim(keyword), $options: "i" };
      }

      const storeProductData = await StoreProduct.aggregate([
        {
          $match: match,
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
          $match: match2,
        },
        {
          $project: {
            _id: 1,
            name: 1,
            city_id: 1,
            quantity_c: 1,
            quantity_w: 1,
            "product._id": { $ifNull: ["$product._id", ""] },
            "product.name": { $ifNull: ["$product.name", ""] },
            "product.bar_code": { $ifNull: ["$product.bar_code", ""] },
            "product.buy_price": { $ifNull: ["$product.buy_price", ""] },
          },
        },
        {
          $sort: sortOptions,
        },
      ]).collation({ locale: "en", strength: 1 });

      if (!isEmpty(storeProductData)) {
        return res.json(responseData("GET_LIST", storeProductData, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  list_product: async (req, res) => {
    try {
      let {
        page,
        limit,
        status,
        sort_by,
        keyword,
        country_id,
        brand_id,
        supplier_id,
        vat_code_id,
        category_id,
        size_code_id,
        sort_type,
        store_id,
        timezone,
        start_date,
        end_date,
        bar_code,
      } = req.query;

      keyword = _.trim(keyword);
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
      var match2 = {};
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
        de;
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

      if (size_code_id) {
        match.size_code_id = Types.ObjectId(size_code_id);
      }
      if (country_id) {
        match.country_id = Types.ObjectId(country_id);
      }
      if (brand_id) {
        match.brand_id = Types.ObjectId(brand_id);
      }
      if (supplier_id) {
        match.supplier_id = Types.ObjectId(supplier_id);
      }
      if (vat_code_id) {
        match.vat_code_id = Types.ObjectId(vat_code_id);
      }
      if (category_id) {
        match.categories = Types.ObjectId(category_id);
      }
      if (category_id) {
        match.categories = Types.ObjectId(category_id);
      }

      //console.log(match);
      if (keyword) {
        match["$or"] = [{ name: { $regex: keyword, $options: "i" } }];
      }
      if (bar_code) {
        match["$or"] = [{ bar_code: { $regex: bar_code, $options: "i" } }];
      }
      /*
      if (keyword) {
        match2["$or"] = [
          { "country.name": { $regex: keyword, $options: "i" } },
        ];
      }
      */

      let pipeline = [];

      pipeline.push(
        { $match: match },
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
            from: "brands",
            localField: "brand_id",
            foreignField: "_id",
            as: "brand",
          },
        },
        {
          $unwind: {
            path: "$brand",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "suppliers",
            localField: "supplier_id",
            foreignField: "_id",
            as: "supplier",
          },
        },
        {
          $unwind: {
            path: "$supplier",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "sizecodes",
            localField: "size_code_id",
            foreignField: "_id",
            as: "sizecode",
          },
        },
        {
          $unwind: {
            path: "$sizecode",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "vatcodes",
            localField: "vat_code_id",
            foreignField: "_id",
            as: "vatcode",
          },
        },
        {
          $unwind: {
            path: "$vatcode",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "categories",
            foreignField: "_id",
            as: "categoriesz",
          },
        }
      );
      if (store_id) {
        pipeline.push(
          {
            $lookup: {
              from: "storeproducts",
              let: { pId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$product_id", "$$pId"] },
                    store_id: Types.ObjectId(store_id),
                  },
                },
              ],
              as: "storeproducts",
            },
          },
          {
            $unwind: {
              path: "$storeproducts",
              //preserveNullAndEmptyArrays: true,
            },
          }
        );
      }

      pipeline.push(
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            country_id: 1,
            brand_id: 1,
            supplier_id: 1,
            vat_code_id: 1,
            size_code_id: 1,
            size: 1,
            price: 1,
            buy_price: 1,
            sku: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            w_prices: 1,
            images: 1,
            bar_code: 1,
            categories: 1,
            categoriesz: 1,
            is_special: 1,
            min_qty_stock: 1,
            admin_limit: 1,
            offer_price: 1,
            offer_start_at: 1,
            offer_start_end: 1,
            w_discount_per: 1,
            w_offer_start_at: 1,
            w_offer_start_end: 1,
            product_info: 1,
            quantity_c: 1,
            quantity_w: 1,
            minimum_quantity_for_wholesaler: 1,
            "country._id": { $ifNull: ["$country._id", ""] },
            "country.name": { $ifNull: ["$country.name", ""] },
            "brand._id": { $ifNull: ["$brand._id", ""] },
            "brand.name": { $ifNull: ["$brand.name", ""] },
            "supplier._id": { $ifNull: ["$supplier._id", ""] },
            "supplier.name": { $ifNull: ["$supplier.name", ""] },
            "sizecode._id": { $ifNull: ["$sizecode._id", ""] },
            "sizecode.name": { $ifNull: ["$sizecode.name", ""] },
            "vatcode._id": { $ifNull: ["$vatcode._id", ""] },
            "vatcode.name": { $ifNull: ["$vatcode.name", ""] },
          },
        },
        { $match: match2 },
        {
          $sort: sortOptions,
        }
      );
      //console.log(pipeline);
      const query = Product.aggregate(pipeline).collation({
        locale: "en",
        strength: 1,
      });

      var finaldata = await Product.aggregatePaginate(query, options);
      if (finaldata.docs.length) {
        await Promise.map(finaldata.docs, async (el) => {
          if (el.offer_start_at) {
            el.offer_start_at = moment
              .unix(el.offer_start_at)
              .format("YYYY-MM-DD");
          }
          if (el.offer_start_end) {
            el.offer_start_end = moment
              .unix(el.offer_start_end)
              .format("YYYY-MM-DD");
          }
          if (el.w_offer_start_at) {
            el.w_offer_start_at = moment
              .unix(el.w_offer_start_at)
              .format("YYYY-MM-DD");
          }
          if (el.w_offer_start_end) {
            el.w_offer_start_end = moment
              .unix(el.w_offer_start_end)
              .format("YYYY-MM-DD");
          }
        });
      }
      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  list_inventory: async (req, res) => {
    try {
      let {
        page,
        limit,
        sort_by,
        city_id,
        store_id,
        product,
        country_id,
        sort_type,
        timezone,
        start_date,
        end_date,
        product_id,
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
      if (product) {
        match["product.name"] = { $regex: _.trim(product), $options: "i" };
      }
      if (product_id) {
        match["product._id"] = Types.ObjectId(product_id);
      }
      //console.log(match);
      let pipeline = [];

      pipeline.push(
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
          $lookup: {
            from: "products",
            let: { id: "$product_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$$id", "$_id"] },
                },
              },
              {
                $lookup: {
                  from: "suppliers",
                  let: { id: "$supplier_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ["$$id", "$_id"] },
                      },
                    },
                  ],
                  as: "supplier",
                },
              },
              {
                $unwind: {
                  path: "$supplier",
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
            as: "product",
          },
        },
        {
          $unwind: {
            path: "$product",
            preserveNullAndEmptyArrays: true,
          },
        },

        { $match: match },
        {
          $sort: sortOptions,
        }
      );

      pipeline.push({
        $project: {
          _id: 1,
          is_sold: 1,
          type: 1,
          order_id: "$order_no",
          // order_no: 1,
          quantity_c: 1,
          quantity_w: 1,
          supplier_id: 1,
          stolen_product_quantity: 1,
          damaged_product_quantity: 1,
          createdAt: 1,
          updatedAt: 1,
          "country._id": { $ifNull: ["$country._id", ""] },
          "country.name": { $ifNull: ["$country.name", ""] },
          "city._id": { $ifNull: ["$city._id", ""] },
          "city.name": { $ifNull: ["$city.name", ""] },
          "store._id": { $ifNull: ["$store._id", ""] },
          "store.name": { $ifNull: ["$store.name", ""] },
          "product._id": { $ifNull: ["$product._id", ""] },
          "product.supplier_id": { $ifNull: ["$product.supplier_id", ""] },
          "product.buy_price": { $ifNull: ["$product.buy_price", ""] },
          "product.bar_code": { $ifNull: ["$product.bar_code", ""] },
          "product.name": { $ifNull: ["$product.name", ""] },
          "product.supplier": { $ifNull: ["$product.supplier.name", ""] },
        },
      });
      //console.log(pipeline);
      const query = ProductInventory.aggregate(pipeline).collation({
        locale: "en",
        strength: 1,
      });

      var finaldata = await ProductInventory.aggregatePaginate(query, options);

      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  product_stock_list: async (req, res) => {
    try {
      let {
        page,
        limit,
        sort_by,
        city_id,
        store_id,
        keyword,
        country_id,
        sort_type,
        // timezone,
        start_date,
        end_date,
        product_id,
        status,
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

      if (status) {
        match.status = status == 1 ? true : false;
      }

      // if (start_date) {
      //   start_date = new Date(
      //     momentTz
      //       .tz(start_date + " 00:00:00", timezone)
      //       .utc()
      //       .toISOString()
      //   );
      // }
      // if (end_date) {
      //   end_date = new Date(
      //     momentTz
      //       .tz(end_date + " 23:59:59", timezone)
      //       .utc()
      //       .toISOString()
      //   );
      // }

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
        match["name"] = { $regex: _.trim(keyword), $options: "i" };
      }
      if (product_id) {
        match["_id"] = Types.ObjectId(product_id);
      }
      console.log(match);
      let pipeline = [];

      pipeline.push(
        {
          $lookup: {
            from: "countries",
            localField: "country_id",
            foreignField: "_id",
            pipeline: [{ $project: { name: 1, alpha_code: 1 } }],
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
          $addFields: {
            categories: {
              $map: { input: "$categories", in: { $toObjectId: "$$this" } },
            },
          },
        },
        {
          $lookup: {
            from: "categories",
            let: { cat: "$categories" },
            pipeline: [
              { $match: { $expr: { $in: ["$_id", "$$cat"] } } },
              {
                $project: {
                  name: 1,
                },
              },
            ],
            as: "categories",
          },
        },
        { $match: match },
        {
          $sort: sortOptions,
        }
      );

      pipeline.push({
        $project: {
          _id: 1,
          quantity_c: 1,
          quantity_w: 1,
          country: 1,
          product_id: "N/A",
          name: 1,
          description: 1,
          categories: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      });
      // console.log(pipeline);
      const query = Product.aggregate(pipeline).collation({
        locale: "en",
        strength: 1,
      });

      var finaldata = await Product.aggregatePaginate(query, options);

      await Promise.map(finaldata.docs, async (item) => {
        item.categories = item?.categories?.map((x) => x.name);
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
  product_stock_export_data: async (req, res) => {
    try {
      const allProduct = await Product.aggregate([
        {
          $lookup: {
            from: "countries",
            localField: "country_id",
            foreignField: "_id",
            pipeline: [{ $project: { name: 1, alpha_code: 1 } }],
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
          $addFields: {
            categories: {
              $map: { input: "$categories", in: { $toObjectId: "$$this" } },
            },
          },
        },
        {
          $lookup: {
            from: "categories",
            let: { cat: "$categories" },
            pipeline: [
              { $match: { $expr: { $in: ["$_id", "$$cat"] } } },
              {
                $project: {
                  name: 1,
                },
              },
            ],
            as: "categories",
          },
        },
        {
          $project: {
            _id: 1,
            quantity_c: 1,
            quantity_w: 1,
            country_name: { $ifNull: ["$country.name", ""] },
            product_id: "N/A",
            name: 1,
            description: 1,
            categories: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      const fields = [
        {
          label: "Country",
          value: "country_name",
        },
        {
          label: "Product Id",
          value: "product_id",
        },
        {
          label: "Product Name",
          value: "name",
        },

        {
          label: "Customer Quantity",
          value: "quantity_c",
        },
        {
          label: "Wholeseller Quantity",
          value: "quantity_w",
        },
        // {
        //   label: 'Categories',
        //   value: 'categories'
        // },
        // {
        //   label: 'Brands',
        //   value: 'brand'
        // },
        {
          label: "Date",
          value: "createdAt",
        },
      ];

      const json2csvParser = new Parser({ fields });
      const csv = json2csvParser.parse(allProduct);
      fs.writeFile("./public/csv/product_stock_list.csv", csv, function (err) {
        if (err) throw err;
        console.log("file saved");
        const path1 = `${process.env.API_URL}/csvFile/product_stock_list.csv`;
        return res.json(responseData("GET_CSV", { path: path1 }, req, true));
      });
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  product_drop_down: async (req, res) => {
    try {
      let {
        page,
        limit,
        status,
        sort_by,
        keyword,
        country_id,
        brand_id,
        supplier_id,
        vat_code_id,
        category_id,
        sort_type,
        timezone,
        start_date,
        end_date,
      } = req.query;
      keyword = _.trim(keyword);
      const sortOptions = {
        [sort_by || "created_at"]: sort_type === "asc" ? 1 : -1,
      };
      const store_id = req.query._id;
      var storeDetails = await Store.findOne({ _id: Types.ObjectId(store_id) });
      country_id = storeDetails.country_id;

      const options = {
        page: page || 1,
        limit: limit || 100000,
        lean: true,
        sort_by: sortOptions,
      };

      var match = {};
      var match2 = {};
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
      if (brand_id) {
        match.brand_id = Types.ObjectId(brand_id);
      }
      if (supplier_id) {
        match.supplier_id = Types.ObjectId(supplier_id);
      }
      if (vat_code_id) {
        match.vat_code_id = Types.ObjectId(vat_code_id);
      }
      if (category_id) {
        match.categories = Types.ObjectId(category_id);
      }

      console.log(match);
      if (keyword) {
        match["$or"] = [{ name: { $regex: keyword, $options: "i" } }];
      }
      /*
      if (keyword) {
        match2["$or"] = [
          { "country.name": { $regex: keyword, $options: "i" } },
        ];
      }
      */

      let pipeline = [];

      pipeline.push(
        { $match: match },
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
            from: "brands",
            localField: "brand_id",
            foreignField: "_id",
            as: "brand",
          },
        },
        {
          $unwind: {
            path: "$brand",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "suppliers",
            localField: "supplier_id",
            foreignField: "_id",
            as: "supplier",
          },
        },
        {
          $unwind: {
            path: "$supplier",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "sizecodes",
            localField: "size_code_id",
            foreignField: "_id",
            as: "sizecode",
          },
        },
        {
          $unwind: {
            path: "$sizecode",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "vatcodes",
            localField: "vat_code_id",
            foreignField: "_id",
            as: "vatcode",
          },
        },
        {
          $unwind: {
            path: "$vatcode",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "categories",
            foreignField: "_id",
            as: "categoriesz",
          },
        }
      );
      if (store_id) {
        pipeline.push(
          {
            $lookup: {
              from: "storeproducts",
              let: { pId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$product_id", "$$pId"] },
                    store_id: Types.ObjectId(store_id),
                  },
                },
              ],
              as: "storeproducts",
            },
          },
          {
            $unwind: {
              path: "$storeproducts",
              //preserveNullAndEmptyArrays: true,
            },
          }
        );
      }

      pipeline.push(
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            country_id: 1,
            brand_id: 1,
            supplier_id: 1,
            vat_code_id: 1,
            size_code_id: 1,
            size: 1,
            price: 1,
            buy_price: 1,
            sku: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            w_prices: 1,
            images: 1,
            categories: 1,
            categoriesz: 1,
            is_special: 1,
            min_qty_stock: 1,
            admin_limit: 1,
            "country._id": { $ifNull: ["$country._id", ""] },
            "country.name": { $ifNull: ["$country.name", ""] },
            "brand._id": { $ifNull: ["$brand._id", ""] },
            "brand.name": { $ifNull: ["$brand.name", ""] },
            "supplier._id": { $ifNull: ["$supplier._id", ""] },
            "supplier.name": { $ifNull: ["$supplier.name", ""] },
            "sizecode._id": { $ifNull: ["$sizecode._id", ""] },
            "sizecode.name": { $ifNull: ["$sizecode.name", ""] },
            "vatcode._id": { $ifNull: ["$vatcode._id", ""] },
            "vatcode.name": { $ifNull: ["$vatcode.name", ""] },
            "storeproducts._id": { $ifNull: ["$storeproducts._id", ""] },
          },
        },
        { $match: match2 },
        {
          $sort: sortOptions,
        }
      );
      console.log(pipeline);
      const finaldata = await Product.aggregate(pipeline).collation({
        locale: "en",
        strength: 1,
      });

      //var finaldata = await Product.aggregatePaginate(query, options);

      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  list_product_store: async (req, res) => {
    try {
      let {
        page,
        limit,
        status,
        sort_by,
        keyword,
        country_id,
        brand_id,
        supplier_id,
        vat_code_id,
        category_id,
        sort_type,
        timezone,
        start_date,
        end_date,
        isAlreadyAdded,
      } = req.query;
      keyword = _.trim(keyword);
      const sortOptions = {
        [sort_by || "created_at"]: sort_type === "asc" ? 1 : -1,
      };
      const store_id = req.query._id;
      var storeDetails = await Store.findOne({ _id: Types.ObjectId(store_id) });
      country_id = storeDetails.country_id;

      const options = {
        page: page || 1,
        limit: limit || 100,
        lean: true,
        sort_by: sortOptions,
      };

      var match = {};
      var match2 = {};
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
      if (brand_id) {
        match.brand_id = Types.ObjectId(brand_id);
      }
      if (supplier_id) {
        match.supplier_id = Types.ObjectId(supplier_id);
      }
      if (vat_code_id) {
        match.vat_code_id = Types.ObjectId(vat_code_id);
      }
      if (category_id) {
        match.categories = Types.ObjectId(category_id);
      }

      console.log(match);
      if (keyword) {
        match["$or"] = [{ name: { $regex: keyword, $options: "i" } }];
      }
      /*
      if (keyword) {
        match2["$or"] = [
          { "country.name": { $regex: keyword, $options: "i" } },
        ];
      }
      */

      if (isAlreadyAdded !== "undefined") {
        match2["storeproducts.status"] =
          isAlreadyAdded == "true" ? true : false;
      }

      let pipeline = [];

      pipeline.push(
        { $match: match },
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
            from: "brands",
            localField: "brand_id",
            foreignField: "_id",
            as: "brand",
          },
        },
        {
          $unwind: {
            path: "$brand",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "suppliers",
            localField: "supplier_id",
            foreignField: "_id",
            as: "supplier",
          },
        },
        {
          $unwind: {
            path: "$supplier",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "sizecodes",
            localField: "size_code_id",
            foreignField: "_id",
            as: "sizecode",
          },
        },
        {
          $unwind: {
            path: "$sizecode",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "vatcodes",
            localField: "vat_code_id",
            foreignField: "_id",
            as: "vatcode",
          },
        },
        {
          $unwind: {
            path: "$vatcode",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "categories",
            foreignField: "_id",
            as: "categoriesz",
          },
        }
      );
      if (store_id) {
        pipeline.push(
          {
            $lookup: {
              from: "storeproducts",
              let: { pId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$product_id", "$$pId"] },
                    store_id: Types.ObjectId(store_id),
                  },
                },
              ],
              as: "storeproducts",
            },
          },
          {
            $unwind: {
              path: "$storeproducts",
              preserveNullAndEmptyArrays: true,
            },
          }
        );
      }

      pipeline.push(
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            country_id: 1,
            brand_id: 1,
            supplier_id: 1,
            vat_code_id: 1,
            size_code_id: 1,
            size: 1,
            price: 1,
            buy_price: 1,
            sku: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            w_prices: 1,
            images: 1,
            categories: 1,
            categoriesz: 1,
            is_special: 1,
            min_qty_stock: 1,
            admin_limit: 1,
            "country._id": { $ifNull: ["$country._id", ""] },
            "country.name": { $ifNull: ["$country.name", ""] },
            "brand._id": { $ifNull: ["$brand._id", ""] },
            "brand.name": { $ifNull: ["$brand.name", ""] },
            "supplier._id": { $ifNull: ["$supplier._id", ""] },
            "supplier.name": { $ifNull: ["$supplier.name", ""] },
            "sizecode._id": { $ifNull: ["$sizecode._id", ""] },
            "sizecode.name": { $ifNull: ["$sizecode.name", ""] },
            "vatcode._id": { $ifNull: ["$vatcode._id", ""] },
            "vatcode.name": { $ifNull: ["$vatcode.name", ""] },
            "storeproducts._id": { $ifNull: ["$storeproducts._id", ""] },
            "storeproducts.status": {
              $ifNull: ["$storeproducts.status", false],
            },
            "storeproducts.quantity_c": {
              $ifNull: ["$storeproducts.quantity_c", ""],
            },
            "storeproducts.quantity_w": {
              $ifNull: ["$storeproducts.quantity_w", ""],
            },
          },
        },
        { $match: match2 },
        {
          $sort: sortOptions,
        }
      );
      console.log(pipeline);
      const query = Product.aggregate(pipeline).collation({
        locale: "en",
        strength: 1,
      });

      var finaldata = await Product.aggregatePaginate(query, options);

      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  assign_product: async (req, res) => {
    try {
      var { store_id, product_id } = req.body;
      var storeDetails = await Store.findOne({ _id: Types.ObjectId(store_id) });
      //console.log(store_id);
      //console.log(product_id);
      for (let i = 0; i < product_id.length; i++) {
        storeProductDetails = await StoreProduct.findOne({
          store_id: Types.ObjectId(store_id),
          product_id: Types.ObjectId(product_id[i]),
        });
        if (storeProductDetails == null) {
          await StoreProduct.create({
            user_id: Types.ObjectId(req.user._id),
            store_id: Types.ObjectId(store_id),
            product_id: Types.ObjectId(product_id[i]),
            country_id: Types.ObjectId(storeDetails.country_id),
            city_id: Types.ObjectId(storeDetails.city_id),
          });

          var productDetails = {};
          productDetails["$push"] = {
            top_sale: { store_id: Types.ObjectId(store_id), product_count: 0 },
          };

          let checkStore = await Product.findOne({
            _id: Types.ObjectId(product_id[i]),
            top_sale: { $elemMatch: { store_id: Types.ObjectId(store_id) } },
          });
          if (!checkStore) {
            await Product.findByIdAndUpdate(
              { _id: Types.ObjectId(product_id[i]) },
              productDetails,
              {
                new: true,
              }
            );
          }
          //await Product.findOneAndUpdate({ _id: Types.ObjectId(product_id[i]),'top_sale.store_id': Types.ObjectId(store_id) }, { $inc: { 'top_sale.product_count': 5 }}).lean({ virtuals: true })
          //await Product.findOneAndUpdate({ _id: Types.ObjectId(product_id[i]),'top_sale.store_id': Types.ObjectId(store_id) }, { $inc: { 'top_sale.$.product_count': -1 }}, { new: true }).lean({ virtuals: true })
        }
      }
      return res.json(responseData("PRODUCT_UPDATED", {}, req, true));
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  remove_product: async (req, res) => {
    try {
      var { store_id, product_id } = req.body;
      var storeDetails = await Store.findOne({ _id: Types.ObjectId(store_id) });

      var storeProductDetails = await StoreProduct.findOne({
        store_id: Types.ObjectId(store_id),
        product_id: Types.ObjectId(product_id),
      });
      if (!isEmpty(storeProductDetails)) {
        await StoreProduct.deleteOne({
          store_id: Types.ObjectId(store_id),
          product_id: Types.ObjectId(product_id),
          country_id: Types.ObjectId(storeDetails.country_id),
          city_id: Types.ObjectId(storeDetails.city_id),
        });

        let checkStore = await Product.findOne({
          _id: Types.ObjectId(product_id),
          top_sale: { $elemMatch: { store_id: Types.ObjectId(store_id) } },
        });
        if (!isEmpty(checkStore)) {
          const top_sale = checkStore.top_sale.filter(
            (item) => item.store_id.toString() !== store_id.toString()
          );
          await Product.findByIdAndUpdate(
            { _id: Types.ObjectId(product_id) },
            {
              $set: {
                top_sale: top_sale,
              },
            },
            {
              new: true,
            }
          );
        }
      }
      return res.json(responseData("PRODUCT_UPDATED", {}, req, true));
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  add_inventory: async (req, res) => {
    try {
      console.log("add_inventory");
      var {
        country_id,
        city_id,
        store_id,
        product_id,
        quantity_c,
        quantity_w,
        bar_code,
        buy_price,
        supplier_id,
        stolen_product_quantity,
        damaged_product_quantity,
      } = req.body;
      //var storeDetails = await Store.findOne({ _id: Types.ObjectId(store_id) });

      var inventoryResult = await ProductInventory.create({
        user_id: Types.ObjectId(req.user._id),
        country_id: Types.ObjectId(country_id),
        city_id: Types.ObjectId(city_id),
        store_id: Types.ObjectId(store_id),
        product_id: Types.ObjectId(product_id),
        quantity_c: quantity_c,
        quantity_w: quantity_w,
        stolen_product_quantity: stolen_product_quantity,
        damaged_product_quantity: damaged_product_quantity,
      });
      //
      //
      let pipeline = [];
      let match = {};
      match._id = Types.ObjectId(inventoryResult._id);
      pipeline.push(
        { $match: match },
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
            "store._id": { $ifNull: ["$store._id", ""] },
            "store.name": { $ifNull: ["$store.name", ""] },
            "product.name": { $ifNull: ["$product.name", ""] },
          },
        }
      );
      const productInventoryResult = await ProductInventory.aggregate(pipeline);
      addLog(
        req.user._id,
        "Inventory Added",
        "Inventory added for Store (" +
          productInventoryResult[0].store.name +
          ") and Product (" +
          productInventoryResult[0].product.name +
          ")",
        " </br> Quantity Customer: " +
          quantity_c +
          " </br> Quantity Wholesale: " +
          quantity_w +
          " </br> Stolen Product Quantity: " +
          stolen_product_quantity +
          " </br> Damaged Product Quantity: " +
          damaged_product_quantity,
        productInventoryResult[0]._id
      );
      //
      //console.log(productInventoryResult);
      await syncInventory(Types.ObjectId(store_id), Types.ObjectId(product_id));
      await removeNotify(Types.ObjectId(store_id), Types.ObjectId(product_id));
      const product_data = await Product.findOneAndUpdate(
        { _id: Types.ObjectId(product_id) },
        {
          bar_code,
          buy_price,
          supplier_id: Types.ObjectId(supplier_id),
        },
        {
          new: true,
        }
      );

      // var product_min_quantity_for_stock = await Product.findOne({
      //   _id: Types.ObjectId(product_id),
      // });

      // var store_product_quantity_in_stock = await StoreProduct.findOne({
      //   store_id: Types.ObjectId(store_id),
      //   product_id: Types.ObjectId(product_id),
      // });

      // //console.log("product_min_quantity_for_stock",product_min_quantity_for_stock.min_qty_stock);
      // //console.log("store_product_quantity_in_stock",store_product_quantity_in_stock.quantity_c);
      // if(store_product_quantity_in_stock.quantity_c>product_min_quantity_for_stock.min_qty_stock){
      //   const resp = await Notify.deleteOne({ store_id: Types.ObjectId(store_id),product_id: Types.ObjectId(product_id) });
      // }

      return res.json(responseData("INVENTORY_ADDED", {}, req, true));
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  adjust_inventory: async (req, res) => {
    try {
      var {
        country_id,
        city_id,
        store_id,
        product_id,
        quantity_c,
        quantity_w,
        quantity_c_flag,
        quantity_w_flag,
      } = req.body;
      var match = {};
      match.store_id = Types.ObjectId(store_id);
      match.product_id = Types.ObjectId(product_id);

      const storeProductData = await StoreProduct.aggregate([
        {
          $match: match,
        },
        {
          $project: {
            _id: 1,
            quantity_c: 1,
            quantity_w: 1,
          },
        },
      ]).collation({ locale: "en", strength: 1 });
      if (!storeProductData) {
        storeProductData[0].quantity_c = 0;
        storeProductData[0].quantity_w = 0;
      }
      if (quantity_c_flag && quantity_w_flag) {
        var insert = {
          user_id: Types.ObjectId(req.user._id),
          country_id: Types.ObjectId(country_id),
          city_id: Types.ObjectId(city_id),
          store_id: Types.ObjectId(store_id),
          product_id: Types.ObjectId(product_id),
          quantity_c: -(storeProductData[0].quantity_c - quantity_c),
          quantity_w: -(storeProductData[0].quantity_w - quantity_w),
        };
        console.log(insert);
        var inventoryResult = await ProductInventory.create(insert);
      } else if (quantity_c_flag) {
        var inventoryResult = await ProductInventory.create({
          user_id: Types.ObjectId(req.user._id),
          country_id: Types.ObjectId(country_id),
          city_id: Types.ObjectId(city_id),
          store_id: Types.ObjectId(store_id),
          product_id: Types.ObjectId(product_id),
          quantity_c: -(storeProductData[0].quantity_c - quantity_c),
          quantity_w: 0,
        });
      } else if (quantity_w_flag) {
        var inventoryResult = await ProductInventory.create({
          user_id: Types.ObjectId(req.user._id),
          country_id: Types.ObjectId(country_id),
          city_id: Types.ObjectId(city_id),
          store_id: Types.ObjectId(store_id),
          product_id: Types.ObjectId(product_id),
          quantity_c: 0,
          quantity_w: -(storeProductData[0].quantity_w - quantity_w),
        });
      }
      //return false;
      //
      //
      let pipeline = [];
      let match2 = {};
      match2._id = Types.ObjectId(inventoryResult._id);
      pipeline.push(
        { $match: match2 },
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
            "store._id": { $ifNull: ["$store._id", ""] },
            "store.name": { $ifNull: ["$store.name", ""] },
            "product.name": { $ifNull: ["$product.name", ""] },
          },
        }
      );
      const productInventoryResult = await ProductInventory.aggregate(pipeline);
      addLog(
        req.user._id,
        "Inventory Added",
        "Inventory added for Store (" +
          productInventoryResult[0].store.name +
          ") and Product (" +
          productInventoryResult[0].product.name +
          ")",
        " </br> Quantity Customer: " +
          productInventoryResult[0].quantity_c +
          " </br> Quantity Wholesale: " +
          productInventoryResult[0].quantity_w +
          " </br> Stolen Product Quantity: " +
          productInventoryResult[0].stolen_product_quantity +
          " </br> Damaged Product Quantity: " +
          productInventoryResult[0].damaged_product_quantity,
        productInventoryResult[0]._id
      );
      //
      //console.log(productInventoryResult);
      await syncInventory(Types.ObjectId(store_id), Types.ObjectId(product_id));
      await removeNotify(Types.ObjectId(store_id), Types.ObjectId(product_id));

      return res.json(responseData("INVENTORY_ADDED", {}, req, true));
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  transfer_inventory: async (req, res) => {
    try {
      console.log(1000);

      var { country_id, city_id, store_id, product_id, type, quantity } =
        req.body;
      var match = {};
      match.store_id = Types.ObjectId(store_id);
      match.product_id = Types.ObjectId(product_id);
      const storeProductData = await StoreProduct.aggregate([
        {
          $match: match,
        },
        {
          $project: {
            _id: 1,
            quantity_c: 1,
            quantity_w: 1,
          },
        },
      ]).collation({ locale: "en", strength: 1 });

      if (type == 1) {
        // wholesale to customer
        var insert = {
          user_id: Types.ObjectId(req.user._id),
          country_id: Types.ObjectId(country_id),
          city_id: Types.ObjectId(city_id),
          store_id: Types.ObjectId(store_id),
          product_id: Types.ObjectId(product_id),
          quantity_c: +quantity,
          quantity_w: -quantity,
        };
        // console.log(insert);
        //return false;
        var inventoryResult = await ProductInventory.create(insert);
      } else {
        // customer to wholesale
        var insert = {
          user_id: Types.ObjectId(req.user._id),
          country_id: Types.ObjectId(country_id),
          city_id: Types.ObjectId(city_id),
          store_id: Types.ObjectId(store_id),
          product_id: Types.ObjectId(product_id),
          quantity_c: -quantity,
          quantity_w: +quantity,
        };
        var inventoryResult = await ProductInventory.create(insert);
      }

      let pipeline = [];
      let match2 = {};
      match2._id = Types.ObjectId(inventoryResult._id);
      pipeline.push(
        { $match: match2 },
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
            "store._id": { $ifNull: ["$store._id", ""] },
            "store.name": { $ifNull: ["$store.name", ""] },
            "product.name": { $ifNull: ["$product.name", ""] },
          },
        }
      );
      const productInventoryResult = await ProductInventory.aggregate(pipeline);
      addLog(
        req.user._id,
        "Inventory Added",
        "Inventory added for Store (" +
          productInventoryResult[0].store.name +
          ") and Product (" +
          productInventoryResult[0].product.name +
          ")",
        " </br> Quantity Customer: " +
          productInventoryResult[0].quantity_c +
          " </br> Quantity Wholesale: " +
          productInventoryResult[0].quantity_w +
          " </br> Stolen Product Quantity: " +
          productInventoryResult[0].stolen_product_quantity +
          " </br> Damaged Product Quantity: " +
          productInventoryResult[0].damaged_product_quantity,
        productInventoryResult[0]._id
      );
      //
      //console.log(productInventoryResult);
      await syncInventory(Types.ObjectId(store_id), Types.ObjectId(product_id));
      await removeNotify(Types.ObjectId(store_id), Types.ObjectId(product_id));

      return res.json(responseData("INVENTORY_ADDED", {}, req, true));
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  edit_inventory: async (req, res) => {
    try {
      var {
        quantity_c,
        quantity_w,
        stolen_product_quantity,
        damaged_product_quantity,
      } = req.body;
      //var storeDetails = await Store.findOne({ _id: Types.ObjectId(store_id) });

      const { id } = req.params;

      let pipeline = [];
      let match = {};
      match._id = Types.ObjectId(id);
      pipeline.push(
        { $match: match },
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
            quantity_c: 1,
            quantity_w: 1,
            stolen_product_quantity: 1,
            damaged_product_quantity: 1,
            "store._id": { $ifNull: ["$store._id", ""] },
            "store.name": { $ifNull: ["$store.name", ""] },
            "product.name": { $ifNull: ["$product.name", ""] },
          },
        }
      );
      const productInventoryResultOld = await ProductInventory.aggregate(
        pipeline
      );
      const productInventory = await ProductInventory.findOneAndUpdate(
        { _id: id },
        {
          quantity_c,
          quantity_w,
          stolen_product_quantity,
          damaged_product_quantity,
        },
        { new: true }
      );
      var store_id = productInventory.store_id;
      var product_id = productInventory.product_id;
      await entory(Types.ObjectId(store_id), Types.ObjectId(product_id));
      await removeNotify(Types.ObjectId(store_id), Types.ObjectId(product_id));
      const productInventoryResultNew = await ProductInventory.aggregate(
        pipeline
      );

      let logMessage = "";
      if (
        productInventoryResultOld[0].quantity_c !=
        productInventoryResultNew[0].quantity_c
      ) {
        logMessage +=
          " </br> Quantity Customer :   " +
          productInventoryResultOld[0].quantity_c +
          " to " +
          productInventoryResultNew[0].quantity_c;
      }
      if (
        productInventoryResultOld[0].quantity_w !=
        productInventoryResultNew[0].quantity_w
      ) {
        logMessage +=
          " </br> Quantity Wholesale :   " +
          productInventoryResultOld[0].quantity_w +
          " to " +
          productInventoryResultNew[0].quantity_w;
      }

      if (
        productInventoryResultOld[0].stolen_product_quantity !=
        productInventoryResultNew[0].stolen_product_quantity
      ) {
        logMessage +=
          " </br> Stolen Product Quantity :   " +
          productInventoryResultOld[0].stolen_product_quantity +
          " to " +
          productInventoryResultNew[0].stolen_product_quantity;
      }

      if (
        productInventoryResultOld[0].damaged_product_quantity !=
        productInventoryResultNew[0].damaged_product_quantity
      ) {
        logMessage +=
          " </br> Damaged Product Quantity :   " +
          productInventoryResultOld[0].damaged_product_quantity +
          " to " +
          productInventoryResultNew[0].damaged_product_quantity;
      }

      if (logMessage != "") {
        addLog(
          req.user._id,
          "Inventory Updated",
          "Inventory updated for Store (" +
            productInventoryResultNew[0].store.name +
            ") and Product (" +
            productInventoryResultNew[0].product.name +
            ")",
          logMessage,
          productInventoryResultNew[0]._id
        );
      }
      //console.log("address", logMessage);
      return res.json(responseData("INVENTORY_UPDATED", {}, req, true));
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  edit_product: async (req, res) => {
    try {
      var {
        _id,
        name,
        description,
        country_id,
        brand_id,
        supplier_id,
        vat_code_id,
        size_code_id,
        size,
        offer_price,
        offer_start_at,
        offer_start_end,
        w_discount_per,
        w_offer_start_at,
        w_offer_start_end,
        price,
        buy_price,
        bar_code,
        sku,
        categories,
        is_special,
        min_qty_stock,
        admin_limit,
        product_info,
        minimum_quantity_for_wholesaler,
      } = req.body;

      var result = await Product.findOne({
        country_id: country_id,
        name: name,
        _id: { $ne: _id },
      });

      if (result) {
        return res.json(
          responseData("Product with same name already exists.", {}, req, false)
        );
      }
      categories = categories.split(",");
      categories = categories.map(function (element) {
        return Types.ObjectId(element);
      });
      let productExist = await Product.findById(_id);
      if (productExist == null) {
        return res.json(responseData("Product not found.", {}, req, false));
      }
      // uploadImageStart

      var image = "";
      var images = productExist.images;

      const files = req.files;
      if (files && files.image) {
        const data = files.image;
        if (data.name) {
          if (files && files.image.name != undefined) {
            image = await saveFile(files.image, PRODUCT_FOLDER, null);
            await saveThumbFile(
              files.image,
              PRODUCT_FOLDER,
              null,
              image,
              PRODUCT_THUMB_WIDTH,
              PRODUCT_THUMB_HEIGHT,
              `public/${PRODUCT_FOLDER}/thumb`
            );
            images.push({ name: image, is_default: 0 });
          }
        } else {
          var imageArray = [];
          data.forEach(function (item, index) {
            var obj = {};
            obj.index = index + 1;
            obj.image = item;
            imageArray.push(obj);
          });

          await Promise.map(imageArray, async (item) => {
            if (item.image && item.image.name != undefined) {
              image = await saveFile(item.image, PRODUCT_FOLDER, null);
              images.push({ name: image, is_default: 0 });
              await saveThumbFile(
                item.image,
                PRODUCT_FOLDER,
                null,
                image,
                PRODUCT_THUMB_WIDTH,
                PRODUCT_THUMB_HEIGHT,
                `public/${PRODUCT_FOLDER}/thumb`
              );
            }
          });
        }
      }

      // uploadImageEnd

      var productDetails = {};
      if (name) productDetails.name = name;
      if (description) productDetails.description = description;
      if (country_id) productDetails.country_id = country_id;
      if (brand_id) productDetails.brand_id = brand_id;
      if (supplier_id) productDetails.supplier_id = supplier_id;
      if (vat_code_id) productDetails.vat_code_id = vat_code_id;
      if (size_code_id) productDetails.size_code_id = size_code_id;
      if (size) productDetails.size = size;
      if (offer_price) productDetails.offer_price = offer_price;
      //if (offer_start_at) productDetails.offer_start_at = offer_start_at;
      //if (offer_start_end) productDetails.offer_start_end = offer_start_end;
      productDetails.w_discount_per = w_discount_per;
      //if (w_offer_start_at) productDetails.w_offer_start_at = w_offer_start_at;
      //if (w_offer_start_end) productDetails.size = size;
      if (price) productDetails.price = price;
      if (buy_price) productDetails.buy_price = buy_price;
      if (bar_code) productDetails.bar_code = bar_code;
      if (sku) productDetails.sku = sku;
      if (categories) productDetails.categories = categories;
      if (images) productDetails.images = images;
      if (min_qty_stock) productDetails.min_qty_stock = min_qty_stock;
      if (admin_limit) productDetails.admin_limit = admin_limit;
      if (product_info) productDetails.product_info = product_info;
      if (minimum_quantity_for_wholesaler)
        productDetails.minimum_quantity_for_wholesaler =
          minimum_quantity_for_wholesaler;
      productDetails.is_special = is_special;
      if (offer_start_at && offer_start_at != "Invalid date") {
        productDetails.offer_start_at = moment(offer_start_at).unix();
      } else {
        productDetails.offer_start_at = null;
      }
      if (offer_start_end && offer_start_end != "Invalid date") {
        productDetails.offer_start_end = moment(offer_start_end).unix();
      } else {
        productDetails.offer_start_end = null;
      }
      if (w_offer_start_at && w_offer_start_at != "Invalid date") {
        productDetails.w_offer_start_at = moment(w_offer_start_at).unix();
      } else {
        productDetails.w_offer_start_at = null;
      }
      if (w_offer_start_end && w_offer_start_end != "Invalid date") {
        productDetails.w_offer_start_end = moment(w_offer_start_end).unix();
      } else {
        productDetails.w_offer_start_end = null;
      }

      // createLog Start

      var match = {};
      match._id = Types.ObjectId(_id);
      var pipeline = [
        { $match: match },
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
            from: "brands",
            localField: "brand_id",
            foreignField: "_id",
            as: "brand",
          },
        },
        {
          $unwind: {
            path: "$brand",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "suppliers",
            localField: "supplier_id",
            foreignField: "_id",
            as: "supplier",
          },
        },
        {
          $unwind: {
            path: "$supplier",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "sizecodes",
            localField: "size_code_id",
            foreignField: "_id",
            as: "sizecode",
          },
        },
        {
          $unwind: {
            path: "$sizecode",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "vatcodes",
            localField: "vat_code_id",
            foreignField: "_id",
            as: "vatcode",
          },
        },
        {
          $unwind: {
            path: "$vatcode",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "categories",
            foreignField: "_id",
            as: "categoriesz",
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            country_id: 1,
            brand_id: 1,
            supplier_id: 1,
            vat_code_id: 1,
            size_code_id: 1,
            size: 1,
            price: 1,
            buy_price: 1,
            sku: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
            w_prices: 1,
            images: 1,
            categories: 1,
            categoriesz: 1,
            offer_price: 1,
            offer_start_at: 1,
            offer_start_end: 1,
            w_discount_per: 1,
            w_offer_start_at: 1,
            w_offer_start_end: 1,
            bar_code: 1,
            min_qty_stock: 1,
            admin_limit: 1,
            is_special: 1,
            product_info: 1,
            minimum_quantity_for_wholesaler: 1,
            "country._id": { $ifNull: ["$country._id", ""] },
            "country.name": { $ifNull: ["$country.name", ""] },
            "brand._id": { $ifNull: ["$brand._id", ""] },
            "brand.name": { $ifNull: ["$brand.name", ""] },
            "supplier._id": { $ifNull: ["$supplier._id", ""] },
            "supplier.name": { $ifNull: ["$supplier.name", ""] },
            "sizecode._id": { $ifNull: ["$sizecode._id", ""] },
            "sizecode.name": { $ifNull: ["$sizecode.name", ""] },
            "vatcode._id": { $ifNull: ["$vatcode._id", ""] },
            "vatcode.name": { $ifNull: ["$vatcode.name", ""] },
          },
        },
      ];
      const getOldProduct = await Product.aggregate(pipeline);
      //createLog End

      const product = await Product.findByIdAndUpdate({ _id }, productDetails, {
        new: true,
      });

      // set all images default to 0
      await Product.updateOne(
        { _id },
        { $set: { "images.$[].is_default": 0 } }
      );
      // set first image as default image
      if (productExist.images.length > 0) {
        await Product.updateOne(
          { _id },
          { $set: { "images.0.is_default": 1 } }
        );
      }

      const getNewProduct = await Product.aggregate(pipeline);
      //console.log(getOldProduct);
      // console.log(getNewProduct);
      // return false;

      let logMessage = "";
      if (getNewProduct[0].country.name != getOldProduct[0].country.name) {
        logMessage +=
          " </br> Country :   " +
          getOldProduct[0].country.name +
          " to " +
          getNewProduct[0].country.name;
      }
      if (getNewProduct[0].brand.name != getOldProduct[0].brand.name) {
        logMessage +=
          " </br> Brand :   " +
          getOldProduct[0].brand.name +
          " to " +
          getNewProduct[0].brand.name;
      }
      if (getNewProduct[0].supplier.name != getOldProduct[0].supplier.name) {
        logMessage +=
          " </br> Supplier :   " +
          getOldProduct[0].supplier.name +
          " to " +
          getNewProduct[0].supplier.name;
      }
      if (getNewProduct[0].sizecode.name != getOldProduct[0].sizecode.name) {
        logMessage +=
          " </br> SizeCode :   " +
          getOldProduct[0].sizecode.name +
          " to " +
          getNewProduct[0].sizecode.name;
      }
      if (getNewProduct[0].vatcode.name != getOldProduct[0].vatcode.name) {
        logMessage +=
          " </br> VatCode :   " +
          getOldProduct[0].vatcode.name +
          " to " +
          getNewProduct[0].vatcode.name;
      }
      if (getNewProduct[0].name != getOldProduct[0].name) {
        logMessage +=
          " </br> Name :   " +
          getOldProduct[0].name +
          " to " +
          getNewProduct[0].name;
      }
      if (getNewProduct[0].description != getOldProduct[0].description) {
        logMessage +=
          " </br> Description :   " +
          getOldProduct[0].description +
          " to " +
          getNewProduct[0].description;
      }
      if (getNewProduct[0].offer_price != getOldProduct[0].offer_price) {
        logMessage +=
          " </br> Offer Price :   " +
          getOldProduct[0].offer_price +
          " to " +
          getNewProduct[0].offer_price;
      }
      if (getNewProduct[0].offer_start_at != getOldProduct[0].offer_start_at) {
        logMessage +=
          " </br> Offer Start At :   " +
          getOldProduct[0].offer_start_at +
          " to " +
          getNewProduct[0].offer_start_at;
      }
      if (
        getNewProduct[0].offer_start_end != getOldProduct[0].offer_start_end
      ) {
        logMessage +=
          " </br> Offer End At :   " +
          getOldProduct[0].offer_start_end +
          " to " +
          getNewProduct[0].offer_start_end;
      }
      if (getNewProduct[0].w_discount_per != getOldProduct[0].w_discount_per) {
        logMessage +=
          " </br> Wholesale Discount Per :   " +
          getOldProduct[0].w_discount_per +
          " to " +
          getNewProduct[0].w_discount_per;
      }
      if (
        getNewProduct[0].w_offer_start_at != getOldProduct[0].w_offer_start_at
      ) {
        logMessage +=
          " </br> Wholesale Discount Start At :   " +
          getOldProduct[0].w_offer_start_at +
          " to " +
          getNewProduct[0].w_offer_start_at;
      }
      if (
        getNewProduct[0].w_offer_start_end != getOldProduct[0].w_offer_start_end
      ) {
        logMessage +=
          " </br> Wholesale Discount End At :   " +
          getOldProduct[0].w_offer_start_end +
          " to " +
          getNewProduct[0].w_offer_start_end;
      }
      if (getNewProduct[0].price != getOldProduct[0].price) {
        logMessage +=
          " </br> Price :   " +
          getOldProduct[0].price +
          " to " +
          getNewProduct[0].price;
      }

      if (getNewProduct[0].buy_price != getOldProduct[0].buy_price) {
        logMessage +=
          " </br> Buy Price :   " +
          getOldProduct[0].buy_price +
          " to " +
          getNewProduct[0].buy_price;
      }
      if (getNewProduct[0].bar_code != getOldProduct[0].bar_code) {
        logMessage +=
          " </br> Bar Code :   " +
          getOldProduct[0].bar_code +
          " to " +
          getNewProduct[0].bar_code;
      }
      if (getNewProduct[0].sku != getOldProduct[0].sku) {
        logMessage +=
          " </br> SKU :   " +
          getOldProduct[0].sku +
          " to " +
          getNewProduct[0].sku;
      }
      if (getNewProduct[0].min_qty_stock != getOldProduct[0].min_qty_stock) {
        logMessage +=
          " </br> Minimum Quantity Stock :   " +
          getOldProduct[0].min_qty_stock +
          " to " +
          getNewProduct[0].min_qty_stock;
      }
      if (getNewProduct[0].is_special != getOldProduct[0].is_special) {
        logMessage +=
          " </br> Is Special :   " +
          getOldProduct[0].is_special +
          " to " +
          getNewProduct[0].is_special;
      }
      if (getNewProduct[0].admin_limit != getOldProduct[0].admin_limit) {
        logMessage +=
          " </br> Admin Limit :   " +
          getOldProduct[0].admin_limit +
          " to " +
          getNewProduct[0].admin_limit;
      }

      if (getNewProduct[0].product_info != getOldProduct[0].product_info) {
        logMessage +=
          " </br> Product Information :   " +
          getOldProduct[0].product_info +
          " to " +
          getNewProduct[0].product_info;
      }

      if (
        getNewProduct[0].minimum_quantity_for_wholesaler !=
        getOldProduct[0].minimum_quantity_for_wholesaler
      ) {
        logMessage +=
          " </br> Minimum Quantity for Wholesaler :   " +
          getOldProduct[0].minimum_quantity_for_wholesaler +
          " to " +
          getNewProduct[0].minimum_quantity_for_wholesaler;
      }

      if (logMessage != "") {
        addLog(
          req.user._id,
          "Product Updated",
          getOldProduct[0].name,
          logMessage,
          getNewProduct[0]._id
        );
      }

      if (!isEmpty(product)) {
        return res.json(responseData("PRODUCT_UPDATED", product, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  edit_product_price: async (req, res) => {
    try {
      var { _id, c_id, price } = req.body;
      var categoryDetails = await WholesaleUserCategory.findById(
        Types.ObjectId(c_id)
      );
      //console.log(categoryDetails);
      let productExist = await Product.findById(_id).lean();
      var w_prices = productExist?.w_prices;
      var oldPrice = 0;
      if (w_prices && w_prices.length) {
        //console.log(w_prices);
        var alreadyExists = false;
        for (let $i = 0; $i < w_prices.length; $i++) {
          if (
            w_prices[$i]["c_id"].toString() == Types.ObjectId(c_id).toString()
          ) {
            alreadyExists = true;
            oldPrice = w_prices[$i]["price"];
            w_prices[$i]["price"] = price;
          }
        }
        if (alreadyExists == false) {
          w_prices.push({ c_id: Types.ObjectId(c_id), price: price });
        }

        // console.log(w_prices);
      } else {
        w_prices.push({ c_id: Types.ObjectId(c_id), price: price });
      }

      if (oldPrice > 0) {
        if (oldPrice != price) {
          addLog(
            req.user._id,
            "Product Price Updated",
            productExist.name,
            "Product Price Updated for " +
              categoryDetails.name +
              " Category. Old Price " +
              oldPrice +
              " New Price" +
              price,
            _id
          );
        }
      } else {
        addLog(
          req.user._id,
          "Product Price Added",
          productExist.name,
          "Product Price Added for " +
            categoryDetails.name +
            " Category :" +
            price,
          _id
        );
      }
      var productDetails = {};
      w_prices.map((x) => {
        x.price = Number(x.price);
      });
      if (w_prices) productDetails.w_prices = w_prices;

      const product = await Product.findByIdAndUpdate({ _id }, productDetails, {
        new: true,
      });

      if (!isEmpty(product)) {
        return res.json(responseData("PRODUCT_UPDATED", product, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  change_status_product: async (req, res) => {
    try {
      const { id } = req.params;
      const productDetail = await Product.findOne({ _id: id });
      let status = productDetail?.status == 1 ? 0 : 1;
      const product = await Product.findOneAndUpdate(
        { _id: id },
        { status },
        { new: true }
      );
      addLog(
        req.user._id,
        "Product Status Updated",
        productDetail.name,
        status ? "Product has been activated" : "Product has been deactivated",
        id
      );
      if (!isEmpty(product)) {
        return res.json(
          responseData("PRODUCT_STATUS_UPDATED", product, req, true)
        );
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  change_store_product_status: async (req, res) => {
    try {
      const { id } = req.params;
      const productDetail = await StoreProduct.findOne({ _id: id });
      console.log(productDetail);
      let status = productDetail?.status == 1 ? false : true;
      const product = await StoreProduct.findOneAndUpdate(
        { _id: id },
        { status },
        { new: true }
      );
      const productDetail2 = await Product.findOne({
        _id: productDetail.product_id,
      });
      addLog(
        req.user._id,
        "Product Status Updated in Store",
        productDetail2.name,
        status
          ? "Product has been activated in Store"
          : "Product has been deactivated in Store",
        id
      );
      if (!isEmpty(product)) {
        return res.json(
          responseData("PRODUCT_STATUS_UPDATED", product, req, true)
        );
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  list_product_ws_category_price: async (req, res) => {
    try {
      var data = [];
      var { _id } = req.query;
      let productData = await Product.findById(_id).lean();
      var w_prices = productData?.w_prices;
      if (w_prices && w_prices.length) {
        for (let $i = 0; $i < w_prices.length; $i++) {
          var categoryDetails = await WholesaleUserCategory.findById(
            Types.ObjectId(w_prices[$i].c_id)
          );
          data.push({
            _id: w_prices[$i].c_id,
            name: categoryDetails.name,
            price: w_prices[$i].price,
          });
        }
        return res.json(
          responseData("WS product category price list", data, req, true)
        );
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  inventory_product_detail: async (req, res) => {
    try {
      var id = req.query._id;

      var match = {};
      match._id = Types.ObjectId(id);
      var pipeline = [
        { $match: match },
        {
          $lookup: {
            from: "suppliers",
            localField: "supplier_id",
            foreignField: "_id",
            as: "supplier",
          },
        },
        {
          $unwind: {
            path: "$supplier",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            supplier_id: 1,
            buy_price: 1,
            bar_code: 1,
            quantity_c: 1,
            quantity_w: 1,
            supplier: { $ifNull: ["$supplier.name", ""] },
          },
        },
      ];
      const Product_data = await Product.aggregate(pipeline);
      // let ProductInventory_data = await ProductInventory.findOne(
      //   { store_id:Types.ObjectId(req.query.store_id),product_id:Types.ObjectId(req.query._id) }
      // )
      let ProductInventory_data = await StoreProduct.findOne({
        store_id: Types.ObjectId(req.query.store_id),
        product_id: Types.ObjectId(req.query._id),
      });

      console.log(ProductInventory_data);
      // var product_da= JSON.stringify(Product_data);
      // product_da = JSON.parse(product_da);
      if (ProductInventory_data) {
        Product_data[0].quantity_c = ProductInventory_data.quantity_c;
        Product_data[0].quantity_w = ProductInventory_data.quantity_w;
      } else {
        Product_data[0].quantity_c = 0;
        Product_data[0].quantity_w = 0;
      }

      if (!isEmpty(Product_data)) {
        return res.json(
          responseData("Product data found ", Product_data, req, true)
        );
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }

      console.log(
        "inventory_product_detail->>>>>>>>>>>>>>>>>>>>>>>",
        Product_data
      );
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
};
function list2tree(list, root_id) {
  var map = {},
    node,
    roots = [],
    i;
  for (i = 0; i < list.length; i += 1) {
    map[list[i]._id] = i; // initialize the map
    list[i].children = []; // initialize the children
  }
  for (i = 0; i < list.length; i += 1) {
    node = list[i];
    if (node.parent.toString() !== root_id.toString()) {
      list[map[node.parent]].children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}
function list2treeChildren(list, root_id, id) {
  var map = {},
    node,
    roots = [],
    i;
  for (i = 0; i < list.length; i += 1) {
    map[list[i]._id] = i; // initialize the map
    list[i].children = []; // initialize the children
  }
  for (i = 0; i < list.length; i += 1) {
    node = list[i];
    if (checkAvailability(id, node._id)) {
      if (node.parent.toString() !== root_id.toString()) {
        list[map[node.parent]].children.push(node);
      } else {
        roots.push(node);
      }
    }
  }
  return roots;
}

function checkAvailability(arr, val) {
  return arr.some((arrVal) => _.trim(val) === _.trim(arrVal));
}
