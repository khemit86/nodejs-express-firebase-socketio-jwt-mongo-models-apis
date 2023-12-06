const Product = require("../../models/product.model");
const Order = require("../../models/order.model");
const User = require("../../models/user.model");
const Notify = require("../../models/notify.model");
const Favorite = require("../../models/favorite.model");
const Supplier = require("../../models/supplier.model");
const Brand = require("../../models/brand.model");
const VATCode = require("../../models/vat_code.model");
const Category = require("../../models/category.model");
const SizeCode = require("../../models/sizecode.model");
const Store = require("../../models/store.model");
const StoreProduct = require("../../models/storeproduct.model");
const ProductInventory = require("../../models/productinventory.model");
const WholesaleUserCategory = require("../../models/wholesale_user_category.model");
const Rating = require("../../models/rating.model");
var moment = require("moment");
var momentTz = require("moment-timezone");
const Promise = require("bluebird");
var { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
const _ = require("lodash");
const { Types } = require("mongoose");
const async = require("async");
const { ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken'); 
module.exports = {
  home_product_list: async (req, res) => {
    try {
      let { longitude, latitude } = req.body;

      const allStores = await Store.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [req.body.longitude, req.body.latitude],
            },
            distanceField: "distance",
          },
        },
        { $match: { $expr: { $lte: ["$distance", 20000] } } },
        //{ $match: { $expr: { $lte: ["$distance", "$store_radius"] } } },
      ]);

      console.log(allStores[0]._id);
      if (allStores.length > 0) {
        var match = {};
        if (allStores[0]._id) {
          //match.items ={ $eq:{ id:Types.ObjectId('63cbcfb7564dcd15322756df')}} ;
          match = { "items.id": Types.ObjectId("63cbd071564dcd15322756ff") };
        }

        const orderData = await Order.aggregate([
          {
            $match: match,
          },

          // { "$group":{
          //     "_id" : "$items.id",
          //     "total": { "$sum": "$items.quantity" }
          // } },
          {
            $project: {
              _id: 1,
              user_id: 1,
              store_id: 1,
              items: 1,
            },
          },
          {
            $sort: { "items.quantity": -1 },
          },
        ]).collation({ locale: "en", strength: 1 });
        console.log(match);
        if (!isEmpty(orderData)) {
          return res.json(responseData("GET_LIST", orderData, req, true));
        } else {
          return res.json(responseData("NOT_FOUND", {}, req, false));
        }
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  category_product_list_old: async (req, res) => {
    try {
      let { longitude, latitude, category_id } = req.body;
      const sortOptions = {
        ["name"]: 1,
      };

      const allStores = await Store.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [req.body.longitude, req.body.latitude],
            },
            distanceField: "distance",
          },
        },
        { $match: { $expr: { $lte: ["$distance", 20000] } } },
        //{ $match: { $expr: { $lte: ["$distance", "$store_radius"] } } },
      ]);

      console.log(allStores[0]._id);
      if (allStores.length > 0) {
        var match = {};
        if (allStores[0]._id) {
          match.store_id = Types.ObjectId(allStores[0]._id);
        }

        let match1 = {
          "product.categories": {
            $elemMatch: {
              $in: [Types.ObjectId(category_id)],
            },
          },
        };

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
            $match: match1,
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
            $project: {
              _id: 1,
              name: 1,
              product_id: 1,
              store_id: 1,
              city_id: 1,
              country_id: 1,
              quantity_c: 1,
              quantity_w: 1,
              "store.name": { $ifNull: ["$store.name", ""] },
              "product._id": { $ifNull: ["$product._id", ""] },
              "product.name": { $ifNull: ["$product.name", ""] },
              "product.categories": { $ifNull: ["$product.categories", ""] },
              "product.bar_code": { $ifNull: ["$product.bar_code", ""] },
              "product.buy_price": { $ifNull: ["$product.buy_price", ""] },
            },
          },
          {
            $sort: sortOptions,
          },
        ]).collation({ locale: "en", strength: 1 });

        if (!isEmpty(storeProductData)) {
          return res.json(
            responseData("GET_LIST", storeProductData, req, true)
          );
        } else {
          return res.json(responseData("NOT_FOUND", {}, req, false));
        }
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  home_category_list: async (req, res) => {
    try {
      let { longitude, latitude } = req.body;
      const sortOptions = {
        ["name"]: 1,
      };

      const allStores = await Store.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            distanceField: "distance",
          },
        },
        { $match: { $expr: { $lte: ["$distance", 20000] } } },
        //{ $match: { $expr: { $lte: ["$distance", "$store_radius"] } } },
      ]);

      if (allStores.length > 0) {
        var match = {};
        if (allStores[0]._id) {
          match.store_id = Types.ObjectId(allStores[0]._id);
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
            $project: {
              _id: 1,
              name: 1,
              product_id: 1,
              store_id: 1,
              // city_id:1,
              // country_id:1,
              // quantity_c: 1,
              // quantity_w: 1,
              // "store.name": { $ifNull: ["$store.name", ""] },
              categories: { $ifNull: ["$product.categories", ""] },
              // "product.name": { $ifNull: ["$product.name", ""] },
              // "product.bar_code": { $ifNull: ["$product.bar_code", ""] },
              // "product.buy_price": { $ifNull: ["$product.buy_price", ""] },
            },
          },
          {
            $sort: sortOptions,
          },
        ]).collation({ locale: "en", strength: 1 });

        if (storeProductData) {
          let category_arr = [];
          storeProductData.forEach(function (item, index) {
            let data = item.categories;
            var len1 = data.length;
            for (let j = 0; j < len1; j++) {
              category_arr.push(data[j].toString());
            }
          });

          if (category_arr) {
            category_arr = [...new Set(category_arr)];
            let categories_list = [];
            async.eachSeries(
              category_arr,
              (item, callback) => {
                console.log("->>>>>>>>>>>>>id", item);
                var cat = Category.findOne({
                  _id: Types.ObjectId(item),
                })
                  .then((item_new) => {
                    console.log("->>>>>>>>>>>>>cat", item_new);
                    categories_list.push(item_new);
                    callback(null);
                  })
                  .catch((error) => {
                    callback(error);
                  });
              },
              async (error) => {
                if (error) {
                  return res.json(responseData(error, {}, req, false));
                }
                console.log("categories_list", categories_list);
                if (!isEmpty(categories_list)) {
                  let new_categories_list = categories_list.sort(
                    (a, b) => b.name - a.name
                  );
                  console.log("categories_list", categories_list);
                  return res.json(
                    responseData("GET_LISTss", new_categories_list, req, true)
                  );
                } else {
                  return res.json(responseData("NOT_FOUND", {}, req, false));
                }
              }
            );
          } else {
            return res.json(responseData("NOT_FOUND", {}, req, false));
          }
        } else {
          return res.json(responseData("NOT_FOUND", {}, req, false));
        }
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  categoryProductList: async (req, res) => {
    try {
      let {
        longitude,
        latitude,
        category_id,
        brand_id,
        sub_cat_id,
        rating_arr,
        page,
        limit,
        status,
        sort_type,
        price_min,
        price_max,
        sort_by,
        discounted_product,
        most_popular,
      } = req.body;

      var userId='';
      userId=  getUserId(req, res);
      var wholesaleCatId ='';
      var roleId ='';
      if(userId){
        var user_data = await User.findOne({ _id: userId});
        wholesaleCatId = user_data.wholesaleusercategory_id;
        roleId=user_data.role_id;
      }
      
      var sortOptions = {
        [sort_by || "createdAt"]: sort_type === "asc" ? 1 : -1,
      };
      if(most_popular){
        const sortOptions = {
          [sort_by || "product.avg_rating"]: sort_type === "desc" ? 1 : -1,
        };
      }

      if(discounted_product){
        const sortOptions = {
          [sort_by || "product.percent"]: sort_type === "desc" ? 1 : -1,
        };
      }
      
      const options = {
        page: page || 1,
        limit: limit || 10,
        sort_by: sortOptions,
      };

      let category_arr = [];
      if (category_id) {
        var result = await Category.find({
          parent: Types.ObjectId(category_id),
        });

        category_arr.push(Types.ObjectId(category_id));
        result.forEach(function (item, index) {
          category_arr.push(Types.ObjectId(item._id));
        });
      }

      const allStores = await Store.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            distanceField: "distance",
          },
        },
        //{ $match: { $expr: { $lte: ["$distance", 20000] } } },
        { $match: { $expr: { $lte: ["$distance", { $multiply: ["$store_radius", 1000] }] } } },
      ]);


      if (allStores.length > 0) {
        var match = {};
        if (allStores[0]._id) {
          match.store_id = Types.ObjectId(allStores[0]._id);
        }
        match.status = true;
        var match1 = {};
        
        if (sub_cat_id?.length > 0 && category_id) {
          const new_arr1 = sub_cat_id.map((el) => Types.ObjectId(el));
          //{$and: [{$or: [{approval: 0 },{ approval: 2}]},{role_id:2}]}
         

          match1 = {
            $and: [
              {
                "product.categories": {
                  $elemMatch: {
                    $in: category_arr,
                  },
                },
              },
              {
                "product.categories": {
                  $elemMatch: {
                    $in: new_arr1,
                  },
                },
              },
              {"product.status": true},
            ],
          };
        } else {
          match1 = {
            "product.categories": {
              $elemMatch: {
                $in: category_arr,
              },
            },
            "product.status": true,
          };
        }
        
        //var favorite = [];
        // console.log('',match1);
        // if (price_min  && price_max) {
        //   match1.product = {price:{
        //     $gte: price_min,
        //     $lte: price_max,
        //   }};
        // }

        // const productCheck = await Product.distinct("_id", { price: { $lte: price_max } });

        // console.log('productCheck----',productCheck)

        if (price_max) {
             match1.product_id = {
              $in: await Product.distinct("_id", { price: { $gte: price_min, $lte: price_max } }),
            };
        }
        if (brand_id?.length > 0 && brand_id) {
          const new_arr = brand_id.map((el) => Types.ObjectId(el));
          match1.product_id = {
            $in: await Product.distinct("_id", { brand_id: { $in: new_arr } }),
          };
         
        }
        let match2 = {}
        if (!isEmpty(rating_arr)) {
          //rating_arr=[1,2,3,4,5];
          match2 = {"product.rating.product_avg_rating":{$in:rating_arr}};
        } 
        
        const storeProductData = StoreProduct.aggregate([
          {
            $match: match,
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
                  $addFields: {
                    offer_val: { $subtract: ["$price", "$offer_price"] },
                  },
                },
                // {
                //   $project:{
                //     top_sale:1,
                //   }
                // },
                {
                  $lookup: {
                    from: "brands",
                    let: { id: "$brand_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: { $eq: ["$$id", "$_id"] },
                        },
                      },
                    ],
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
                    from: "sizecodes",
                    let: { id: "$size_code_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: { $eq: ["$$id", "$_id"] },
                        },
                      },
                    ],
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
                    from: "favorites",
                    let: { id: "$_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: { 
                            $and: [
                            { $eq: ["$user_id", ObjectId(userId)] },
                            { $eq: ["$product_id", "$$id"] }
                        ] },
                        },
                      },
                    ],
                    as: "favorite",
                  },
                },
                {
                  $lookup: {
                    from: "orders",
                    let:{ id: "$_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: { 
                              $and: [
                              { $eq: ["$user_id", ObjectId(userId)] },
                              { $eq: ["$status", 1] },
                              {$in:["$$id","$items.id"]},
                          ],},
                        },
                      },
                    ],
                    as: "order",
                  },
                },
                {
                  $lookup: {
                    from: "notifies",
                    let:{ id: "$_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: { 
                              $and: [
                              { $eq: ["$user_id", ObjectId(userId)] },
                              { $eq: ["$product_id", "$$id"] },
                              { $eq: ["$store_id", Types.ObjectId(allStores[0]._id)] },
                          ],},
                        },
                      },
                    ],
                    as: "notifiy",
                  },
                },
                {
                  $lookup: {
                    from: "ratings",
                    let:{ id: "$_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: { 
                              $and: [
                              { $eq: ["$product_id", "$$id"] },
                              //{ $eq: ["$store_id", Types.ObjectId(allStores[0]._id)] },
                          ],},
                        },
                        
                      },
                      {
                        $group:{
                            _id:"$product_id",
                            'product_avg_rating':{'$avg': '$product_rating'}
                        }
                      },
                      {
                        $project:{
                          'product_avg_rating':{$ceil:'$product_avg_rating'},
                        }
                      }
                    ],
                    as: "rating",
                  },
                },
                {
                  $unwind: {
                    path: "$rating",
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $project: {
                    _id: 1,
                    offer_val:1,
                    price: 1,
                    admin_limit:1,
                    name: 1,
                    offer_price:1,
                    buy_price: 1,
                    size:1,
                    images: 1,
                    minimum_quantity_for_wholesaler:1,
                    min_qty_stock:1,
                    offer_start_at:1,
                    offer_start_end:1,
                    w_discount_per: 1,
                    w_offer_start_at:1,
                    w_offer_start_end: 1,
                    createdAt:1,
                    top_sale:1,
                    vatcode:1,
                    top_sale: {
                      $filter: {
                        input: "$top_sale",
                        as: "top_sal",
                        cond: { $eq: ["$$top_sal.store_id", Types.ObjectId(allStores[0]._id)] },
                      },
                    },
                    w_prices: {
                      $filter: {
                        input: "$w_prices",
                        as: "w_price",
                        cond: { $eq: ["$$w_price.c_id", wholesaleCatId] },
                      },
                    },
                    //w_prices:1,
                    sizecode:1,
                    order:1,
                    notifiy:1,
                    favorite:1,
                    rating:1,
                    brand:1,
                    brand_id:1,
                    categories:1,
                    status:1,
                    
                  }
                }    
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
          {
            $match: {
              ...match1,
              ...match2,
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              product_id: 1,
              quantity_c: 1,
              quantity_w: 1,
              brand_id: 1,
              "product.offer_val":{ $ifNull: ["$product.offer_val", ""] },
              "product.offer_percent":{ $ifNull: [{ $multiply: [{ $divide: ["$product.offer_val", "$product.price"] }, 100], }, 0] },
              // percent: {
              //   $multiply: [{ $divide: ["$offer_val", "$price"] }, 100],
              // },
              //"product.avg_rating":"$product.rating",
              "product.avg_rating":{ $ifNull: ["$product.rating.product_avg_rating", 0] },
              product_price:"$product.price",
              "product.admin_limit":{ $ifNull: ["$product.admin_limit", ""] },
              "product.product_unit":{ $ifNull: ["$product.sizecode.name", ""] },
              "product.name": { $ifNull: ["$product.name", ""] },
              "product.price": { $ifNull: ["$product.price", ""] },
              "product.offer_price": { $ifNull: ["$product.offer_price", ""] },
              "product.buy_price": { $ifNull: ["$product.buy_price", ""] },
              "product.size": { $ifNull: ["$product.size", ""] },
              "product.bar_code": { $ifNull: ["$product.bar_code", ""] },
              "product.sku": { $ifNull: ["$product.sku", ""] },
              "product.min_qty_stock": { $ifNull: ["$product.min_qty_stock", ""] },
              "product.minimum_quantity_for_wholesaler": { $ifNull: ["$product.minimum_quantity_for_wholesaler", ""] },
              "product.images": {
                $map: {
                  input: "$product.images",
                  as: "image",
                  in: {
                    $mergeObjects: [
                      "$$image",
                      {
                        name: {
                          $concat: [
                            process.env.IMAGE_LOCAL_PATH,
                            "product/",
                            "$$image.name"
                          ],
                        },
                      },
                    ],
                  },
                },
              },
              "product.offer_start_at": { $ifNull: ["$product.offer_start_at", ""] },
              "product.offer_start_end": { $ifNull: ["$product.offer_start_end", ""] },
              "product.w_discount_per": { $ifNull: ["$product.w_discount_per", ""] },
              "product.w_offer_start_at": { $ifNull: ["$product.w_offer_start_at", ""] },
              "product.w_offer_start_end": { $ifNull: ["$product.w_offer_start_end", ""] },
              is_notify: { $cond: [{ $gt: [{ $size: {$ifNull: ["$product.notifiy", []]} }, 0] }, true, false]},
              is_fav: { $cond: [{ $gt: [{ $size: {$ifNull: ["$product.favorite", []]} }, 0] }, true, false]},
              add_cart: { $cond: [{ $gt: [{ $size: {$ifNull: ["$product.order", []]} }, 0] }, 1, 0]},
              "product.createdAt": { $ifNull: ["$product.createdAt", ""] },
              brand_id: { $ifNull: ["$product.brand_id", ""] },
              store_id: 1,
              categories: { $ifNull: ["$product.categories", ""] },
              "brand.brand_id": { $ifNull: ["$product.brand._id", ""] },
              "brand.brand": { $ifNull: ["$product.brand.name", ""] },
              "product.top_sale": { $ifNull: ["$product.top_sale", ""] },
              "product.w_prices": { $ifNull: ["$product.w_prices", ""] },
              "product.vat_percent": { $ifNull: ["$product.vatcode.percentage", 0] },
            },
          },
          {
            $sort: sortOptions,
          },
        ]).collation({ locale: "en", strength: 1 });

        console.log('sssss',Types.ObjectId(allStores[0]._id));
        
        var finaldata = await StoreProduct.aggregatePaginate(
          storeProductData,
          options
        );
        var current_timestamp = moment().unix();
        if (finaldata.docs.length) {
          await Promise.map(finaldata.docs, async (el) => {

            var offer_start = el.product.offer_start_at;
            var offer_end = el.product.offer_start_end;

            var w_offer_start = el.product.w_offer_start_at;
            var w_offer_end = el.product.w_offer_start_end;

            el.product.offer_percent = parseFloat((el.product.offer_percent).toFixed(2));
            
            // if (offer_start) {
            //   el.product.offer_start_at = moment
            //     .unix(offer_start)
            //     .format("YYYY-MM-DD");
            // }
            // if (offer_end) {
            //   el.product.offer_start_at = moment
            //     .unix(offer_end)
            //     .format("YYYY-MM-DD");
            // }

            if(roleId==2 && el.product.w_prices.length){

              el.product.offer_percent=el.product.w_discount_per;
              let dicount_price = parseFloat(
                parseFloat((el.product.w_discount_per / 100) * el.product.w_prices?.[0]?.price ?? 0).toFixed(2)
              );
              //if(w_offer_start && current_timestamp >= w_offer_start && current_timestamp <= w_offer_end) {
              if((current_timestamp >= w_offer_start && current_timestamp <= w_offer_end && w_offer_start && w_offer_end) || ( current_timestamp >= w_offer_start && (w_offer_end == null || w_offer_end == "") && w_offer_start) || ( (w_offer_start == null || w_offer_start == "") && current_timestamp <= w_offer_end && w_offer_end)) {
                el.product.offer_flag=1;
                el.product.offer_price=el.product.w_prices?.[0]?.price - dicount_price;
              }else{
                  el.product.offer_flag=0;
                  el.product.offer_price=el.product.w_prices?.[0]?.price ?? 0;
              }
             
              el.product.price=el.product.w_prices?.[0]?.price ?? 0;
               
              

            }else{
              // let vatAmount_price = parseFloat(
              //   parseFloat((el.product.vat_percent / 100) * el.product.price).toFixed(2)
              // );
              // let vatAmount_offer = parseFloat(
              //   parseFloat((el.product.vat_percent / 100) * el.product.offer_price).toFixed(2)
              // );

              if((current_timestamp >= offer_start && current_timestamp <= offer_end && offer_start && offer_end) || ( current_timestamp >= offer_start && (offer_end == null || offer_end == "") && offer_start) || ( (offer_start == null || offer_start == "") && current_timestamp <= offer_end && offer_end)) {
                el.product.offer_flag=1;
              //}else if( current_timestamp >= offer_start && offer_end == null) {
              //  el.product.offer_flag=1;
              //}else if( offer_start == null && current_timestamp <= offer_end) {
              //  el.product.offer_flag=1;
              } else{
                el.product.offer_flag=0;
              }
              // el.product.price=el.product.price + vatAmount_price;
              // el.product.offer_price=el.product.offer_price + vatAmount_offer;
            }
          });
        }
        
        return res.json(responseData("storeProductData", finaldata, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }

      return res.json(responseData("GET_LIST", allStores, req, true));
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  home_product_list_old: async (req, res) => {
    try {
      let { longitude, latitude } = req.body;
      const sortOptions = {
        ["name"]: 1,
      };

      const allStores = await Store.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [req.body.longitude, req.body.latitude],
            },
            distanceField: "distance",
          },
        },
        { $match: { $expr: { $lte: ["$distance", 20000] } } },
        //{ $match: { $expr: { $lte: ["$distance", "$store_radius"] } } },
      ]);

      console.log(allStores[0]._id);
      if (allStores.length > 0) {
        var match = {};
        if (allStores[0]._id) {
          match.store_id = Types.ObjectId(allStores[0]._id);
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
            $project: {
              _id: 1,
              name: 1,
              product_id: 1,
              store_id: 1,
              city_id: 1,
              country_id: 1,
              quantity_c: 1,
              quantity_w: 1,
              "store.name": { $ifNull: ["$store.name", ""] },
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
          return res.json(
            responseData("GET_LIST", storeProductData, req, true)
          );
        } else {
          return res.json(responseData("NOT_FOUND", {}, req, false));
        }
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  topSaleProductList: async (req, res) => {
    try {
      let { longitude, latitude,page,
        limit,
        status,
        sort_type,sort_by } = req.query;

      const sortOptions = {
        [sort_by || "created_at"]: sort_type === "asc" ? 1 : -1,
      };

      const options = {
        page: page || 1,
        limit: limit || 10,
        sort_by: sortOptions,
      };

      var userId='';
      userId=  getUserId(req, res);
      var wholesaleCatId ='';
      var roleId ='';
      if(userId){
        var user_data = await User.findOne({ _id: userId});
        wholesaleCatId = user_data.wholesaleusercategory_id;
        roleId=user_data.role_id;
      }

      //console.log('wholesaleCatId..........',user_data);
      const allStores = await Store.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            distanceField: "distance",
          },
        },
        //{ $match: { $expr: { $lte: ["$distance", 20000] } } },
        { $match: { $expr: { $lte: ["$distance", { $multiply: ["$store_radius", 1000] }] } } },
      ]);

      //console.log(allStores);
      if (allStores.length > 0) {
        var match = {};
        if (allStores[0]._id) {
          match = { "top_sale.store_id": Types.ObjectId(allStores[0]._id) };
        }
        

        const productData = Product.aggregate([
          { $match: { "top_sale.store_id": Types.ObjectId(allStores[0]._id),"status":true } },
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
              from: "ratings",
              let: { id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { 
                      $and: [
                      { $eq: ["$user_id", ObjectId(userId)] },
                      { $eq: ["$product_id", "$$id"] }
                  ] },
                  },
                },
              ],
              as: "rating",
            },
          },
          {
            $lookup: {
              from: "storeproducts",
              let: { id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { 
                      $and: [
                      { $eq: ["$store_id", Types.ObjectId(allStores[0]._id)] },
                      { $eq: ["$product_id", "$$id"] }
                  ] },
                  },
                },
              ],
              as: "storeproduct",
            },
          },
          {
            $unwind: {
              path: "$storeproduct",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "favorites",
              let: { id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { 
                      $and: [
                      { $eq: ["$user_id", ObjectId(userId)] },
                      { $eq: ["$product_id", "$$id"] }
                  ] },
                  },
                },
              ],
              as: "favorite",
            },
          },
          {
            $lookup: {
              from: "orders",
              let:{ id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { 
                        $and: [
                        { $eq: ["$user_id", ObjectId(userId)] },
                        { $eq: ["$status", 1] },
                        {$in:["$$id","$items.id"]},
                    ],},
                  },
                },
              ],
              as: "order",
            },
          },
          {
            $lookup: {
              from: "notifies",
              let:{ id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { 
                        $and: [
                        { $eq: ["$user_id", ObjectId(userId)] },
                        { $eq: ["$product_id", "$$id"] },
                        { $eq: ["$store_id", Types.ObjectId(allStores[0]._id)] },
                    ],},
                  },
                },
              ],
              as: "notifiy",
            },
          },
          {
            $project: {
              name: 1,
              price: 1,
              storeproduct:1,
              size: 1,
              admin_limit:1,
              min_qty_stock:1,
              minimum_quantity_for_wholesaler:1,
              vatcode:1,
              quantity_c:{ $ifNull: ["$storeproduct.quantity_c", 0] },
              quantity_w:{ $ifNull: ["$storeproduct.quantity_w", 0] },
              store_id:Types.ObjectId(allStores[0]._id),
              product_unit:{ $ifNull: ["$sizecode.name", ""] },
              "brand.brand_id": { $ifNull: ["$brand._id", ""] },
              "brand.brand": { $ifNull: ["$brand.name", ""] },
              offer_price: 1,
              description: 1,
              offer_val: 1,
              offer_start_at: 1,
              offer_start_end: 1,
              w_discount_per : 1,
              w_offer_start_at : 1,
              w_offer_start_end : 1,
              images: 1,
              rating:1,
              is_notify: { $cond: [{ $gt: [{ $size: {$ifNull: ["$notifiy", []]} }, 0] }, true, false]},
              is_fav: { $cond: [{ $gt: [{ $size: {$ifNull: ["$favorite", []]} }, 0] }, true, false]},
              add_cart: { $cond: [{ $gt: [{ $size: "$order" }, 0] }, 1, 0]},
              images: {
                $map: {
                  input: "$images",
                  as: "image",
                  in: {
                    $mergeObjects: [
                      "$$image",
                      {
                        name: {
                          $concat: [
                            process.env.IMAGE_LOCAL_PATH,
                            "product/",
                            "$$image.name"
                          ],
                        },
                      },
                    ],
                  },
                },
              },
              top_sale: {
                $setDifference: [
                  {
                    $map: {
                      input: "$top_sale",
                      as: "p",
                      in: {
                        $cond: [
                          {
                            $eq: [
                              "$$p.store_id",
                              Types.ObjectId(allStores[0]._id),
                            ],
                          },
                          "$$p",
                          false,
                        ],
                      },
                    },
                  },
                  [false],
                ],
              },
              w_prices: {
                $filter: {
                  input: "$w_prices",
                  as: "w_price",
                  cond: { $eq: ["$$w_price.c_id", wholesaleCatId] },
                },
              },
            },
          },
          { $sort: { "top_sale.product_count": -1 } },
          {
            $sort: sortOptions,
          },
        ]);

        var finaldata = await Product.aggregatePaginate(
          productData,
          options
        );

        var current_timestamp = moment().unix();
        if (finaldata.docs.length) {
          await Promise.map(finaldata.docs, async (el) => {

            var offer_start = el.offer_start_at;
            var offer_end = el.offer_start_end;

            var w_offer_start = el.w_offer_start_at;
            var w_offer_end = el.w_offer_start_end;

              console.log('>>>>>>>>el.w_prices....',el.w_prices)
            if(roleId==2 && el.w_prices.length){
                if(el.w_prices.length){
                    //el.product.offer_percent=el.product.w_discount_per;
                  let discount_price = parseFloat(
                    parseFloat((el.w_discount_per / 100) * el.w_prices[0].price).toFixed(2)
                  );
                  //if(w_offer_start && current_timestamp >= w_offer_start && current_timestamp <= w_offer_end) {
                  if((current_timestamp >= w_offer_start && current_timestamp <= w_offer_end && w_offer_start && w_offer_end) || ( current_timestamp >= w_offer_start && (w_offer_end == null || w_offer_end == "") && w_offer_start) || ( (w_offer_start == null || w_offer_start == "") && current_timestamp <= w_offer_end && w_offer_end)) {
                    el.offer_flag=1;
                    el.offer_price=el.w_prices?.[0]?.price - discount_price;
                  }else{
                      el.offer_flag=0;
                      el.offer_price=el.w_prices?.[0]?.price ?? 0;
                  }
                
                  el.price=el.w_prices[0].price;
                }
            }else{
              // let vatAmount_price = parseFloat(
              //   parseFloat((el.vatcode.percentage / 100) * el.price).toFixed(2)
              // );
              // let vatAmount_offer = parseFloat(
              //   parseFloat((el.vatcode.percentage / 100) * el.offer_price).toFixed(2)
              // );

              if((current_timestamp >= offer_start && current_timestamp <= offer_end && offer_start && offer_end) || ( current_timestamp >= offer_start && (offer_end == null || offer_end == "") && offer_start) || ( (offer_start == null || offer_start == "") && current_timestamp <= offer_end && offer_end)) {
                  el.offer_flag=1;
              }else{
                  el.offer_flag=0;
              }
              // el.price=el.price + vatAmount_price;
              // el.offer_price=el.offer_price + vatAmount_offer;
            }
          });
        }  


        if (!isEmpty(finaldata)) {
          return res.json(responseData("GET_LIST", finaldata, req, true));
        } else {
          return res.json(responseData("NOT_FOUND", {}, req, false));
        }
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  topOfferProductList: async (req, res) => {
    try {
      let { longitude, latitude,page,
        limit,
        status,
        sort_type,sort_by } = req.query;
      var userId='';

      const sortOptions = {
        [sort_by || "created_at"]: sort_type === "asc" ? 1 : -1,
      };

      const options = {
        page: page || 1,
        limit: limit || 10,
        sort_by: sortOptions,
      };

      userId=  getUserId(req, res);
      var wholesaleCatId ='';
      var roleId ='';
      if(userId){
        var user_data = await User.findOne({ _id: userId});
        wholesaleCatId = user_data.wholesaleusercategory_id;
        roleId=user_data.role_id;
      }

      const allStores = await Store.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            distanceField: "distance",
          },
        },
        { $match: { $expr: { $lte: ["$distance", 20000] } } },
        //{ $match: { $expr: { $lte: ["$distance", "$store_radius"] } } },
      ]);

      //console.log('allStores       ....',allStores[0]._id);
      if (allStores.length > 0) {
        
        var match = {};

        var current_date = new Date().toString();
        console.log("dddd", current_date);

        match = {
          "top_sale.store_id": Types.ObjectId(allStores[0]._id),
          offer_price: { $gt: 0 },
        };
        match.status = true;

        match.offer_start_at = {
          $lte: moment(current_date).unix(),
        };
        match.offer_start_end = {
          $gte: moment(current_date).unix(),
        };
        //moment.unix(value).format("MM/DD/YYYY")

        //console.log("matchmatchmatchmatchmatchmatchmatchmatchmatch   ",current_date);
        const productData = Product.aggregate([
          { $match: match },
          {
            $addFields: {
              offer_val: { $subtract: ["$price", "$offer_price"] },
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
              from: "ratings",
              let: { id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { 
                      $and: [
                      { $eq: ["$user_id", ObjectId(userId)] },
                      { $eq: ["$product_id", "$$id"] }
                  ] },
                  },
                },
              ],
              as: "rating",
            },
          },
          {
            $lookup: {
              from: "storeproducts",
              let: { id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { 
                      $and: [
                      { $eq: ["$store_id", Types.ObjectId(allStores[0]._id)] },
                      { $eq: ["$product_id", "$$id"] },
                  ] },
                  },
                },
              ],
              as: "storeproduct",
            },
          },
          {
            $unwind: {
              path: "$storeproduct",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "favorites",
              let: { id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { 
                      $and: [
                      { $eq: ["$user_id", ObjectId(userId)] },
                      { $eq: ["$product_id", "$$id"] },
                  ] },
                  },
                },
              ],
              as: "favorite",
            },
          },
          {
            $lookup: {
              from: "orders",
              let:{ id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { 
                        $and: [
                        { $eq: ["$user_id", ObjectId(userId)] },
                        { $eq: ["$status", 1] },
                        {$in:["$$id","$items.id"]},
                    ],},
                  },
                },
              ],
              as: "order",
            },
          },
          {
            $lookup: {
              from: "notifies",
              let:{ id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { 
                        $and: [
                        { $eq: ["$user_id", ObjectId(userId)] },
                        { $eq: ["$product_id", "$$id"] },
                        { $eq: ["$store_id", Types.ObjectId(allStores[0]._id)] },
                    ],},
                  },
                },
              ],
              as: "notifiy",
            },
          },
          {
            $project: {
              name: 1,
              //"storeproduct":"$storeproduct",
              price: 1,
              price: 1,
              vatcode:1,
              size: 1,
              admin_limit:1,
              min_qty_stock:1,
              minimum_quantity_for_wholesaler:1,
              quantity_c:{ $ifNull: ["$storeproduct.quantity_c", 0] },
              quantity_w:{ $ifNull: ["$storeproduct.quantity_w", 0] },
              product_unit:{ $ifNull: ["$sizecode.name", ""] },
              offer_price: 1,
              w_discount_per : 1,
              w_offer_start_at : 1,
              w_offer_start_end : 1,
              description: 1,
              offer_val: 1,
              offer_start_at: 1,
              offer_start_end: 1,
              store_id: Types.ObjectId(allStores[0]._id),
              rating:1,
              is_notify: { $cond: [{ $gt: [{ $size: {$ifNull: ["$notifiy", []]} }, 0] }, true, false]},
              is_fav: { $cond: [{ $gt: [{ $size: {$ifNull: ["$favorite", []]} }, 0] }, true, false]},
              add_cart: { $cond: [{ $gt: [{ $size: "$order" }, 0] }, 1, 0]},
              images: {
                $map: {
                  input: "$images",
                  as: "image",
                  in: {
                    $mergeObjects: [
                      "$$image",
                      {
                        name: {
                          $concat: [
                            process.env.IMAGE_LOCAL_PATH,
                            "product/",
                            "$$image.name"
                          ],
                        },
                      },
                    ],
                  },
                },
              },
              w_prices: {
                $filter: {
                  input: "$w_prices",
                  as: "w_price",
                  cond: { $eq: ["$$w_price.c_id", wholesaleCatId] },
                },
              },
              offer_percent: {
                $multiply: [{ $divide: ["$offer_val", "$price"] }, 100],
              },
            },
          },
          //{ $sort: { 'top_sale.product_count': -1 } },
          {
            $sort: sortOptions,
          },
        ]);
        console.log("dddd", moment().format("MM/DD/YYYY"));

        var finaldata = await Product.aggregatePaginate(
          productData,
          options
        );

        var current_timestamp = moment().unix();
        if (finaldata.docs.length) {
          await Promise.map(finaldata.docs, async (el) => {
           
            var offer_start = el.offer_start_at;
            var offer_end = el.offer_start_end;

            var w_offer_start = el.w_offer_start_at;
            var w_offer_end = el.w_offer_start_end;

            if(roleId==2 && el.w_prices.length){
              
              el.offer_percent=el.w_discount_per;
              if(el.w_prices.length){
                let discount_price = parseFloat(
                  parseFloat((el.w_discount_per / 100) * el.w_prices[0].price).toFixed(2)
                );
                
                //if(w_offer_start && current_timestamp >= w_offer_start && current_timestamp <= w_offer_end) {
                if((current_timestamp >= w_offer_start && current_timestamp <= w_offer_end && w_offer_start && w_offer_end) || ( current_timestamp >= w_offer_start && (w_offer_end == null || w_offer_end == "") && w_offer_start) || ( (w_offer_start == null || w_offer_start == "") && current_timestamp <= w_offer_end && w_offer_end)) {
                  el.offer_flag=1;
                  el.offer_price=el.w_prices?.[0]?.price - discount_price;
                }else{
                  el.offer_flag=0;
                  el.offer_price=el.w_prices?.[0]?.price ?? 0;
                }
                console.log("testttt",el.name,el.w_discount_per,el.w_prices[0].price,discount_price,el.offer_price,el.offer_flag);
                el.price=el.w_prices[0].price;
                
              }else{
                el.offer_price=0;
                el.price=0;
              }

            }else{
              console.log("22222",el.name);
              // let vatAmount_price = parseFloat(
              //   parseFloat((el.vatcode.percentage / 100) * el.price).toFixed(2)
              // );
              // let vatAmount_offer = parseFloat(
              //   parseFloat((el.vatcode.percentage / 100) * el.offer_price).toFixed(2)
              // );
              el.offer_percent = (((el.price-el.offer_price)/el.price)*100).toFixed(1);
              if((current_timestamp >= offer_start && current_timestamp <= offer_end && offer_start && offer_end) || ( current_timestamp >= offer_start && (offer_end == null || offer_end == "") && offer_start) || ( (offer_start == null || offer_start == "") && current_timestamp <= offer_end && offer_end)) {
                  el.offer_flag=1;
              }else{
                  el.offer_flag=0;
              }
              // el.price=el.price + vatAmount_price;
              // el.offer_price=el.offer_price + vatAmount_offer;
            }

             el.offer_start_at = moment
            .unix(el.offer_start_at)
            .format("MM/DD/YYYY");

            el.offer_start_end = moment
            .unix(el.offer_start_end)
            .format("MM/DD/YYYY");
          });
        } 

        if (!isEmpty(finaldata)) {
          return res.json(responseData("GET_LISTdd  ", finaldata, req, true));
        } else {
          return res.json(responseData("NOT_FOUND", {}, req, false));
        }
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  ProductDetails: async (req, res) => {
    try {
      let { id,store_id } = req.query;

      var userId='';
      userId=  getUserId(req, res);
      var wholesaleCatId ='';
      var roleId ='';
      
      if(userId){
        var user_data = await User.findOne({ _id: userId});
        wholesaleCatId = user_data.wholesaleusercategory_id;
        roleId=user_data.role_id;

        var already_rating_data = await Rating.findOne({ user_id: userId,product_id:ObjectId(id),store_id:ObjectId(store_id)});
        // console.log("rating_data",rating_data);

      }
     
      
      const product_data = await Product.aggregate([
        { $match: { _id: ObjectId(id) } },
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
          $unwind: {
            path: "$brand",
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
            from: "categories",
            pipeline: [
              {
                $match: {
                  _id:{ $in:await Product.distinct('categories',{_id: ObjectId(id)})},
                },
              },
            ],
            as: "category",
          }
        },
        {
          $lookup: {
            from: "ratings",
            let: { id: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { 
                    $and: [
                    { $eq: ["$user_id", ObjectId(userId)] },
                    { $eq: ["$product_id", "$$id"] }
                ] },
                },
              },
            ],
            as: "rating",
          },
        },
        {
          $lookup: {
            from: "favorites",
            let: { id: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { 
                    $and: [
                    { $eq: ["$user_id", ObjectId(userId)] },
                    { $eq: ["$product_id", "$$id"] }
                ] },
                },
              },
            ],
            as: "favorite",
          },
        },
        {
          $lookup: {
            from: "orders",
            let:{ id: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { 
                      $and: [
                      { $eq: ["$user_id", ObjectId(userId)] },
                      { $eq: ["$status", 1] },
                      {$in:["$$id","$items.id"]},
                  ],},
                },
              },
              {
                $project: {
                  _id: 0,
                  items: {
                    $filter: {
                      input: "$items",
                      as: "item",
                      cond: { $eq: ["$$item.id", "$$id"] },
                    },
                  },
                },
              },
            ],
            as: "order",
          },
        },
       {
          $unwind: {
            path: "$order",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "ratings",
            let: { id: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { 
                    $and: [
                    { $eq: ["$product_id", "$$id"] },
                    { $eq: ["$store_id", Types.ObjectId(store_id)] },
                ] },
                },
              },
            ],
            as: "rating_count",
          },
        },
        {
          $lookup: {
            from: "notifies",
            let:{ id: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { 
                      $and: [
                      { $eq: ["$user_id", ObjectId(userId)] },
                      { $eq: ["$product_id", "$$id"] },
                      { $eq: ["$store_id", Types.ObjectId(store_id)] },
                  ],},
                },
              },
            ],
            as: "notifiy",
          },
        },
        {
          $lookup: {
            from: "storeproducts",
            let:{ id: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { 
                      $and: [
                      { $eq: ["$product_id", "$$id"] },
                      { $eq: ["$store_id", Types.ObjectId(store_id)] },
                  ],},
                },
              },
            ],
            as: "storeproduct",
          },
        },
        {
          $unwind: {
            path: "$storeproduct",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            name: 1,
            vatcode:1,
            add_cart:"$order.items.quantity",
            description : 1,
            product_info:1,
            country_id : 1,
            brand_id : 1,
            size: 1,
            admin_limit:1,
            quantity_c:{ $ifNull: ["$storeproduct.quantity_c", 0] },
            quantity_w:{ $ifNull: ["$storeproduct.quantity_w", 0] },
            minimum_quantity_for_wholesaler:1,
            min_qty_stock:1,
            product_unit:{ $ifNull: ["$sizecode.name", ""] },
            supplier_id : 1,
            vat_code_id : 1,
            size_code_id : 1,
            size : 1,
            offer_price : 1,
            offer_start_at : 1,
            offer_start_end : 1,
            w_discount_per : 1,
            w_offer_start_at : 1,
            w_offer_start_end : 1,
            price : 1,
            buy_price : 1,
            bar_code : 1,
            sku : 1,
            status : 1,
            is_special : 1,
            min_qty_stock : 1,
            admin_limit : 1,
            top_sale:1,
            categories:1,
            category:1,
            "brand.name":"$brand.name",
            rating:1,
            is_notify: { $cond: [{ $gt: [{ $size: {$ifNull: ["$notifiy", []]} }, 0] }, true, false]},
            is_fav: { $cond: [{ $gt: [{ $size: {$ifNull: ["$favorite", []]} }, 0] }, true, false]},
            //add_cart: { $cond: [{ $gt: [{ $size: "$order" }, 0] }, 1, 0]},
            images: {
              $map: {
                input: "$images",
                as: "image",
                in: {
                  $mergeObjects: [
                    "$$image",
                    {
                      name: {
                        $concat: [
                          process.env.IMAGE_LOCAL_PATH,
                          "product/",
                          "$$image.name"
                        ],
                      },
                    },
                  ],
                },
              },
            },
            review_rating_count: { $size: "$rating_count" },
            rating_avg: { $avg: "$rating_count.product_rating"},
            w_prices: {
              $filter: {
                input: "$w_prices",
                as: "w_price",
                cond: { $eq: ["$$w_price.c_id", wholesaleCatId] },
              },
            },
          },
        },
      ]);
      
        
        var current_timestamp = moment().unix();
        if (product_data.length) {
          await Promise.map(product_data, async (el) => {

            if(el?.add_cart){
              el.add_cart = el.add_cart[0];
            }else{
              el.add_cart = 0;
            }

            var offer_start = el.offer_start_at;
            var offer_end = el.offer_start_end;

            var w_offer_start = el.w_offer_start_at;
            var w_offer_end = el.w_offer_start_end;

            // varoffer_val: { $subtract: ["$price", "$offer_price"] },
            // percent: {
            //   $multiply: [{ $divide: ["$offer_val", "$price"] }, 100],
            // },


            el.offer_percent = (((el.price-el.offer_price)/el.price)*100).toFixed(2);
            
            // if (offer_start) {
            //   el.product.offer_start_at = moment
            //     .unix(offer_start)
            //     .format("YYYY-MM-DD");
            // }
            // if (offer_end) {
            //   el.product.offer_start_at = moment
            //     .unix(offer_end)
            //     .format("YYYY-MM-DD");
            // }

            if(roleId==2  && el.w_prices.length){

              el.offer_percent=el.w_discount_per;
              let vatAmount_price = parseFloat(
                parseFloat((el.w_discount_per / 100) * el.w_prices[0].price).toFixed(2)
              );
              //if(w_offer_start && current_timestamp >= w_offer_start && current_timestamp <= w_offer_end) {
              if((current_timestamp >= w_offer_start && current_timestamp <= w_offer_end && w_offer_start && w_offer_end) || ( current_timestamp >= w_offer_start && (w_offer_end == null || w_offer_end == "") && w_offer_start) || ( (w_offer_start == null || w_offer_start == "") && current_timestamp <= w_offer_end && w_offer_end)) {
                 el.offer_flag=1;
                el.offer_price=el.w_prices?.[0]?.price - vatAmount_price;
              }else{
                  el.offer_flag=0;
                  el.offer_price=el.w_prices?.[0]?.price ?? 0;
              }
             
              el.price=el.w_prices[0].price;
             
            }else{
              // let vatAmount_price = parseFloat(
              //   parseFloat((el.vatcode.percentage / 100) * el.price).toFixed(2)
              // );
              // let vatAmount_offer = parseFloat(
              //   parseFloat((el.vatcode.percentage / 100) * el.offer_price).toFixed(2)
              // );

              if((current_timestamp >= offer_start && current_timestamp <= offer_end && offer_start && offer_end) || ( current_timestamp >= offer_start && (offer_end == null || offer_end == "") && offer_start) || ( (offer_start == null || offer_start == "") && current_timestamp <= offer_end && offer_end)) {
                  el.offer_flag=1;
              }else{
                  el.offer_flag=0;
              }
              // el.price=el.price + vatAmount_price;
              // el.offer_price=el.offer_price + vatAmount_offer;
            }
          });
        }  
      
      
      const query1 = await Rating.aggregate([
        {
          $match: {product_id:ObjectId(id),store_id:Types.ObjectId(store_id)},
        },
        {
          $group: { 
             _id: {product_rating:{$ceil: "$product_rating"}}, 
             count:{$sum:1}
          }
        },
        {
          $project: {
            _id:0,
            rating: "$_id.product_rating",
            percent: {
              $multiply: [{ $divide: ["$count", product_data[0]?.review_rating_count] }, 100],
            },
            count:1,
          },
        },
        
      ]).collation({ locale: "en", strength: 1 });
      product_data[0]['rating_arr']=query1;
      if(already_rating_data){
        product_data[0]['is_already_rated']=1;
        product_data[0]['rating_id']=already_rating_data._id;
      }else{
        product_data[0]['is_already_rated']=0;
        product_data[0]['rating_id']=0;
      }

      
     // product_data[0]
      if (product_data) {
        return res.json(responseData("DATA_FOUND", product_data[0], req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  relatedProductList: async (req, res) => {
    try {
      const {
        longitude,
        latitude,
        category_id,
        product_id,
      } = req.body;

     
      var userId='';
      userId=  getUserId(req, res);
      var wholesaleCatId ='';
      var roleId ='';
      if(userId){
        var user_data = await User.findOne({ _id: userId});
        wholesaleCatId = user_data.wholesaleusercategory_id;
        roleId=user_data.role_id;
      }
      console.log("wholesaleCatIdwholesaleCatId....",wholesaleCatId)

      let category_arr = [];
      if (category_id) {
        var result = await Category.find({
          parent: Types.ObjectId(category_id),
        });

        category_arr.push(Types.ObjectId(category_id));
        result.forEach(function (item, index) {
          category_arr.push(Types.ObjectId(item._id));
        });
      }

      const allStores = await Store.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            distanceField: "distance",
          },
        },
        { $match: { $expr: { $lte: ["$distance", 20000] } } },
        //{ $match: { $expr: { $lte: ["$distance", "$store_radius"] } } },
      ]);

      if (allStores.length > 0) {
        var match = {};
        if (allStores[0]._id) {
          match.store_id = Types.ObjectId(allStores[0]._id);
        }
        match.status = true;
        var match1 = {};
        match1 = {
            "product.categories": {
              $elemMatch: {
                $in: category_arr,
              },
              
            },
            "product.status": true,
            $and:[ { "product_id": { $ne: Types.ObjectId(product_id) } } ]
          };
        
        const finaldata = await StoreProduct.aggregate([
          {
            $match: match,
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
                    from: "brands",
                    let: { id: "$brand_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: { $eq: ["$$id", "$_id"] },
                        },
                      },
                    ],
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
                    from: "sizecodes",
                    let: { id: "$size_code_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: { $eq: ["$$id", "$_id"] },
                        },
                      },
                    ],
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
                    from: "ratings",
                    let: { id: "$_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: { 
                            $and: [
                            { $eq: ["$user_id", ObjectId(userId)] },
                            { $eq: ["$product_id", "$$id"] }
                        ] },
                        },
                      },
                    ],
                    as: "rating",
                  },
                },
                {
                  $lookup: {
                    from: "favorites",
                    let: { id: "$_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: { 
                            $and: [
                            { $eq: ["$user_id", ObjectId(userId)] },
                            { $eq: ["$product_id", "$$id"] }
                        ] },
                        },
                      },
                    ],
                    as: "favorite",
                  },
                },
                {
                  $lookup: {
                    from: "orders",
                    let:{ id: "$_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: { 
                              $and: [
                              { $eq: ["$user_id", ObjectId(userId)] },
                              { $eq: ["$status", 1] },
                              {$in:["$$id","$items.id"]},
                          ],},
                        },
                      },
                    ],
                    as: "order",
                  },
                },
                {
                  $lookup: {
                    from: "notifies",
                    let:{ id: "$_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: { 
                              $and: [
                              { $eq: ["$user_id", ObjectId(userId)] },
                              { $eq: ["$product_id", "$$id"] },
                              { $eq: ["$store_id", Types.ObjectId(allStores[0]._id)] },
                          ],},
                        },
                      },
                    ],
                    as: "notifiy",
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
          {
            $match: match1,
          },
          {
            $project: {
              _id: 1,
              name: 1,
              product_id: 1,
              quantity_c: 1,
              quantity_w: 1,
              brand_id: 1,
              "product.vatcode":1,
              "product.minimum_quantity_for_wholesaler":{ $ifNull: ["$product.minimum_quantity_for_wholesaler", ""] },
              "product.min_qty_stock":{ $ifNull: ["$product.min_qty_stock", ""] },
              "product.admin_limit":{ $ifNull: ["$product.admin_limit", ""] },
              "product.product_unit":{ $ifNull: ["$product.sizecode.name", ""] },
              "product.name": { $ifNull: ["$product.name", ""] },
              "product.price": { $ifNull: ["$product.price", ""] },
              "product.offer_price": { $ifNull: ["$product.offer_price", ""] },
              "product.buy_price": { $ifNull: ["$product.buy_price", ""] },
              "product.size": { $ifNull: ["$product.size", ""] },
              "product.bar_code": { $ifNull: ["$product.bar_code", ""] },
              "product.sku": { $ifNull: ["$product.sku", ""] },
              "product.images": {
                $map: {
                  input: "$product.images",
                  as: "image",
                  in: {
                    $mergeObjects: [
                      "$$image",
                      {
                        name: {
                          $concat: [
                            process.env.IMAGE_LOCAL_PATH,
                            "product/",
                            "$$image.name"
                          ],
                        },
                      },
                    ],
                  },
                },
              },
              "product.rating":{ $ifNull: ["$product.rating", ""] },
              "product.is_notify": { $cond: [{ $gt: [{ $size: {$ifNull: ["$product.notifiy", []]} }, 0] }, true, false]},
              "product.is_fav":{ $cond: [{ $gt: [{ $size: "$product.favorite" }, 0] }, true, false]},
              "product.add_cart":{ $cond: [{ $gt: [{ $size: "$product.order" }, 0] }, 1, 0]},
              "product.offer_start_at": { $ifNull: ["$product.offer_start_at", ""] },
              "product.offer_start_end": { $ifNull: ["$product.offer_start_end", ""] },
              "product.w_discount_per": { $ifNull: ["$product.w_discount_per", ""] },
              "product.w_offer_start_at": { $ifNull: ["$product.w_offer_start_at", ""] },
              "product.w_offer_start_end": { $ifNull: ["$product.w_offer_start_end", ""] },
              "product.createdAt": { $ifNull: ["$product.createdAt", ""] },
              "product.w_prices": {
                $filter: {
                  input: "$product.w_prices",
                  as: "w_price",
                  cond: { $eq: ["$$w_price.c_id", wholesaleCatId] },
                },
              },
              brand_id: { $ifNull: ["$product.brand_id", ""] },
              store_id: 1,
              categories: { $ifNull: ["$product.categories", ""] },
              "brand.brand_id": { $ifNull: ["$product.brand._id", ""] },
              "brand.brand": { $ifNull: ["$product.brand.name", ""] },
            },
          },
         
        ]).collation({ locale: "en", strength: 1 });

        
        var current_timestamp = moment().unix();
        if (finaldata.length) {
          await Promise.map(finaldata, async (el) => {

            var offer_start = el.product.offer_start_at;
            var offer_end = el.product.offer_start_end;

            var w_offer_start = el.product.w_offer_start_at;
            var w_offer_end = el.product.w_offer_start_end;

            //el.product.offer_percent = parseFloat((el.product.offer_percent).toFixed(2));
            el.product.offer_percent = (((el.product.price-el.product.offer_price)/el.product.price)*100).toFixed(2);
            
            
            if(roleId==2  && el.product.w_prices.length){

              el.product.offer_percent=el.product.w_discount_per;
              let vatAmount_price = parseFloat(
                parseFloat((el.product.w_discount_per / 100) * el.product.w_prices?.[0]?.price ?? 0).toFixed(2)
              );
              //if(w_offer_start && current_timestamp >= w_offer_start && current_timestamp <= w_offer_end) {
              if((current_timestamp >= w_offer_start && current_timestamp <= w_offer_end && w_offer_start && w_offer_end) || ( current_timestamp >= w_offer_start && (w_offer_end == null || w_offer_end == "") && w_offer_start) || ( (w_offer_start == null || w_offer_start == "") && current_timestamp <= w_offer_end && w_offer_end)) {
                el.product.offer_flag=1;
                el.product.offer_price=el.product.w_prices?.[0]?.price - vatAmount_price;
              }else{
                  el.product.offer_flag=0;
                  el.product.offer_price=el.product.w_prices?.[0]?.price ?? 0;
              }
             
              el.product.price=el.product.w_prices?.[0]?.price ?? 0;
             
            }else{
              // let vatAmount_price = parseFloat(
              //   parseFloat((el.product.vat_percent / 100) * el.product.price).toFixed(2)
              // );
              // let vatAmount_offer = parseFloat(
              //   parseFloat((el.product.vat_percent / 100) * el.product.offer_price).toFixed(2)
              // );

              if((current_timestamp >= offer_start && current_timestamp <= offer_end && offer_start && offer_end) || ( current_timestamp >= offer_start && (offer_end == null || offer_end == "") && offer_start) || ( (offer_start == null || offer_start == "") && current_timestamp <= offer_end && offer_end)) {
                  el.product.offer_flag=1;
              }else{
                  el.product.offer_flag=0;
              }
              // el.product.price=el.product.price + vatAmount_price;
              // el.product.offer_price=el.product.offer_price + vatAmount_offer;
            }
          });
        }

        if(finaldata.length>0){
          return res.json(responseData("storeProductData", finaldata, req, true));
        }else{
          return res.json(responseData("NOT_FOUND", [], req, false));
        }
        
      } else {
        return res.json(responseData("NOT_FOUND", [], req, false));
      }

    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  searchProduct: async (req, res) => {
    try {
      let { longitude, latitude ,keyword,sort_by,sort_type,page,limit} = req.query;
      var userId='';
      userId=  getUserId(req, res);
      var wholesaleCatId ='';
      var roleId ='';
      if(userId){
        var user_data = await User.findOne({ _id: userId});
        wholesaleCatId = user_data.wholesaleusercategory_id;
        roleId=user_data.role_id;
      }

      const allStores = await Store.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            distanceField: "distance",
          },
        },
        { $match: { $expr: { $lte: ["$distance", 200000] } } },
        //{ $match: { $expr: { $lte: ["$distance", "$store_radius"] } } },
      ]);

      //console.log(allStores[0]._id);
      if (allStores.length > 0) {
        var match = {};
       
        if (allStores[0]._id) {
          match = { "top_sale.store_id": Types.ObjectId(allStores[0]._id) };
        }
        if (keyword) {
          match["name"] = { $regex: _.trim(keyword), $options: "i" };
        }
        const sortOptions = {
          [sort_by || "created_at"]: sort_type === "asc" ? 1 : -1,
        };
        match["status"] = true;
        const options = {
          page: page || 1,
          limit: limit || 10,
          sort_by: sortOptions,
        };

        const productData =  Product.aggregate([
          { $match: match},
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
              from: "ratings",
              let: { id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { 
                      $and: [
                      { $eq: ["$user_id", ObjectId(userId)] },
                      { $eq: ["$product_id", "$$id"] }
                  ] },
                  },
                },
              ],
              as: "rating",
            },
          },
          {
            $lookup: {
              from: "favorites",
              let: { id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { 
                      $and: [
                      { $eq: ["$user_id", ObjectId(userId)] },
                      { $eq: ["$product_id", "$$id"] }
                  ] },
                  },
                },
              ],
              as: "favorite",
            },
          },
          {
            $lookup: {
              from: "orders",
              let:{ id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { 
                        $and: [
                        { $eq: ["$user_id", ObjectId(userId)] },
                        { $eq: ["$status", 1] },
                        {$in:["$$id","$items.id"]},
                    ],},
                  },
                },
              ],
              as: "order",
            },
          },
          {
            $lookup: {
              from: "notifies",
              let:{ id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { 
                        $and: [
                        { $eq: ["$user_id", ObjectId(userId)] },
                        { $eq: ["$product_id", "$$id"] },
                        { $eq: ["$store_id", Types.ObjectId(allStores[0]._id)] },
                    ],},
                  },
                },
              ],
              as: "notifiy",
            },
          },
          {
            $lookup: {
              from: "storeproducts",
              let:{ id: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { 
                        $and: [
                        { $eq: ["$product_id", "$$id"] },
                        { $eq: ["$store_id", Types.ObjectId(allStores[0]._id)] },
                    ],},
                  },
                },
              ],
              as: "storeproduct",
            },
          },
          {
            $unwind: {
              path: "$storeproduct",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              name: 1,
              price: 1,
              notifiy:1,
              size: 1,
              vatcode:1,
              admin_limit:1,
              min_qty_stock:1,
              minimum_quantity_for_wholesaler:1,
              store_id:Types.ObjectId(allStores[0]._id),
              quantity_c:{ $ifNull: ["$storeproduct.quantity_c", 0] },
              quantity_w:{ $ifNull: ["$storeproduct.quantity_w", 0] },
              product_unit:{ $ifNull: ["$sizecode.name", ""] },
              "brand.brand_id": { $ifNull: ["$brand._id", ""] },
              "brand.brand": { $ifNull: ["$brand.name", ""] },
              offer_price: 1,
              description: 1,
              offer_val: 1,
              offer_start_at: 1,
              offer_start_end: 1,
              w_discount_per : 1,
              w_offer_start_at : 1,
              w_offer_start_end : 1,
              images: 1,
              rating:1,
              is_notify: { $cond: [{ $gt: [{ $size: {$ifNull: ["$notifiy", []]} }, 0] }, true, false]},
              is_fav: { $cond: [{ $gt: [{ $size: {$ifNull: ["$favorite", []]} }, 0] }, true, false]},
              add_cart: { $cond: [{ $gt: [{ $size: "$order" }, 0] }, 1, 0]},
              images: {
                $map: {
                  input: "$images",
                  as: "image",
                  in: {
                    $mergeObjects: [
                      "$$image",
                      {
                        name: {
                          $concat: [
                            process.env.IMAGE_LOCAL_PATH,
                            "product/",
                            "$$image.name"
                          ],
                        },
                      },
                    ],
                  },
                },
              },
              w_prices: {
                $filter: {
                  input: "$w_prices",
                  as: "w_price",
                  cond: { $eq: ["$$w_price.c_id", wholesaleCatId] },
                },
              },
            },
          },
          { $sort: { "top_sale.product_count": -1 } },
        ]);

        console.log("optionnn->>>>", options);
        var finaldata = await Product.aggregatePaginate(
          productData,
          options
        );

        var current_timestamp = moment().unix();
        if (finaldata.docs.length) {
          await Promise.map(finaldata.docs, async (el) => {

            var offer_start = el.offer_start_at;
            var offer_end = el.offer_start_end;

            var w_offer_start = el.w_offer_start_at;
            var w_offer_end = el.w_offer_start_end;

              console.log('>>>>>>>>el.w_prices....',el.w_prices)
            if(roleId==2){
                if(el.w_prices.length){
                  el.offer_percent=el.w_discount_per;
                  let discount_price = parseFloat(
                    parseFloat((el.w_discount_per / 100) * el.w_prices[0].price).toFixed(2)
                  );
                  //if(w_offer_start && current_timestamp >= w_offer_start && current_timestamp <= w_offer_end) {
                  if((current_timestamp >= w_offer_start && current_timestamp <= w_offer_end && w_offer_start && w_offer_end) || ( current_timestamp >= w_offer_start && (w_offer_end == null || w_offer_end == "") && w_offer_start) || ( (w_offer_start == null || w_offer_start == "") && current_timestamp <= w_offer_end && w_offer_end)) {
                    el.offer_flag=1;
                    el.offer_price=el.w_prices?.[0]?.price - discount_price;
                  }else{
                      el.offer_flag=0;
                      el.offer_price=el.w_prices?.[0]?.price ?? 0;
                  }
                
                  el.price=el.w_prices[0].price;
                  
                }else{
                  el.offer_price=0;
                  el.price=0;
                }
            }else{
              el.offer_percent = (((el.price-el.offer_price)/el.price)*100).toFixed(2);
              // let vatAmount_price = parseFloat(
              //   parseFloat((el.vatcode.percentage / 100) * el.price).toFixed(2)
              // );
              // let vatAmount_offer = parseFloat(
              //   parseFloat((el.vatcode.percentage / 100) * el.offer_price).toFixed(2)
              // );

              if((current_timestamp >= offer_start && current_timestamp <= offer_end && offer_start && offer_end) || ( current_timestamp >= offer_start && (offer_end == null || offer_end == "") && offer_start) || ( (offer_start == null || offer_start == "") && current_timestamp <= offer_end && offer_end)) {
                  el.offer_flag=1;
              }else{
                  el.offer_flag=0;
              }
              // el.price=el.price + vatAmount_price;
              // el.offer_price=el.offer_price + vatAmount_offer;
                //el.price=el.price;
                //el.offer_price=el.offer_price;
            }
          });
        }

        if (!isEmpty(finaldata)) {
          return res.json(responseData("GET_LIST", finaldata, req, true));
        } else {
          return res.json(responseData("NOT_FOUND", [], req, false));
        }
      } else {
        return res.json(responseData("NOT_FOUND", [], req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  productQuantity: async (req, res) => {
    try {
      let { product_id,store_id } = req.query;
      
      var userId='';
      userId=  getUserId(req, res);

        let order_data = await Order.aggregate([
          {$match: {"status": 1,"user_id": Types.ObjectId(userId)}},
          {
            $project: {
              _id: 1,
              user_id: 1,
              store_id: 1,
              status: 1,
              items: {
                $filter: {
                  input: "$items",
                  as: "item",
                  cond: { $eq: ["$$item.id", Types.ObjectId(product_id)] },
                },
            },
            },
          },
        ]);
        var product_data = await Product.findOne({ _id: Types.ObjectId(product_id)});

        var store_product_data = await StoreProduct.findOne(
          {
            product_id:product_id, 
            store_id:store_id
          });
        // if (order_data[0]?.items[0]>0) {
        //   return res.json(responseData("GET_LIST",[{"product_id":product_id,"quantity":order_data[0].items[0].quantity}], req, true));
        // } else {
        //   return res.json(responseData("GET_LIST",[{"product_id":product_id,"quantity":0}], req, true));
        // }
        if (!isEmpty(order_data[0]?.items[0])) {

          return res.json(responseData("GET_LIST",[{"product_id":product_id,"quantity_c":store_product_data?.quantity_c,"quantity_w":store_product_data?.quantity_w,"quantity":order_data[0].items[0].quantity,"minimum_quantity_for_wholesaler":product_data.minimum_quantity_for_wholesaler}], req, true));
        } else {
          return res.json(responseData("GET_LIST",[{"product_id":product_id,"quantity_c":store_product_data?.quantity_c,"quantity_w":store_product_data?.quantity_w,"quantity":0,"minimum_quantity_for_wholesaler":product_data.minimum_quantity_for_wholesaler}], req, true));
        }
      
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

function getUserId(req, res) {
      let token;
      if (
        req.headers["authorization"] &&
        req.headers["authorization"].startsWith("Bearer")
      ) {
        token = req.headers["authorization"].split(" ")[1];
      }
      var userId='';
      var is_fav='';
      if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
          if (user.user) {
            req.user = user.user;
            userId  = req.user._id;
          }
          
        });

        return userId;
      }
}
