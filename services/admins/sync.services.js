const { responseData } = require("../../helpers/responseData");
const Promise = require("bluebird");
const DBHostName = process.env.DBHostNameMysql;
const DBName = process.env.DBNameMysql;
const DBUserName = process.env.DBUserNameMysql;
const DBPassword = process.env.DBPasswordMysql;
var mysql = require("mysql");
const Product = require("../../models/product.model");
const User = require("../../models/user.model");
const Order = require("../../models/order.model");
const Brand = require("../../models/brand.model");
const Supplier = require("../../models/supplier.model");
const Category = require("../../models/category.model");
const Store = require("../../models/store.model");
const StoreProduct = require("../../models/storeproduct.model");
const ProductInventory = require("../../models/productinventory.model");
const Address = require("../../models/address.model");

const countryID = "641d369467627ab5b119d940";
const storeID = "646b4d720fa2c343d92e12fd";

const util = require("util");
const { Types } = require("mongoose");
var momentTz = require("moment-timezone");
var bcrypt = require("bcryptjs");
var moment = require("moment");
const SizeCode = require("../../models/sizecode.model");
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const WSBusinessType = require("../../models/ws_business_type.model");
const WholesaleUserCategory = require("../../models/wholesale_user_category.model");
const {
  getAllCategories,
  getAllBrandsOfCountry,
  getAllSuppliersOfCountry,
  getSupplierIdFromSuppliers,
  getAllSizesOfCountry,
  getSizeIdFromSizes,
  upsertItemOrder,
  base64Encode,
} = require("../../helpers/helper");

module.exports = {
  importCustomers: async (req, res) => {
    try {
      var allTypes = await WSBusinessType.find({
        country_id: Types.ObjectId(countryID),
        status: true,
      })
        .sort({ name: 1 })
        .select("name _id");

      var wCategories = await WholesaleUserCategory.find({
        country_id: Types.ObjectId(countryID),
        status: true,
      })
        .sort({ name: 1 })
        .select("name _id");

      //console.log(wCategories);
      //return false;

      var connection = mysql.createConnection({
        host: DBHostName,
        user: DBUserName,
        password: DBPassword,
        database: DBName,
        acquireTimeout: 1000000,
      });
      connection.connect();
      const query = util.promisify(connection.query).bind(connection);
      const sql =
        "SELECT users.*,date_format(users.date_of_registration, '%Y-%m-%d') as date_of_registration,buc.name as bname from users left join business_user_categories as buc on (users.business_user_category_id = buc.id) where role_id in (2,4) and users.id= 25401 order by id limit 100";
      connection.query(sql, async function (error, results) {
        if (error) throw error;
        await Promise.map(results, async (item, index) => {
          try {
            const salt = await bcrypt.genSalt(10);
            if (item.org_password != "" && item.org_password != null) {
              var password = await bcrypt.hash(
                item.org_password.toString(),
                salt
              );
            } else {
              var password = await bcrypt.hash("123456", salt);
            }
            var company_type_id = null;
            var company_category_id = null;
            if (item.type_of_business != "" && item.type_of_business != null) {
              var searchString = item.type_of_business.toString().trim();
              var matchedC = allTypes.find(
                ({ name }) => name.toLowerCase() === searchString.toLowerCase()
              );

              if (matchedC != undefined) {
                company_type_id = matchedC._id;
              }
            }
            if (item.type_of_business != "" && item.type_of_business != null) {
              var searchString = item.bname.toString().trim();
              var matchedC = wCategories.find(
                ({ name }) => name.toLowerCase() === searchString.toLowerCase()
              );

              if (matchedC != undefined) {
                company_category_id = matchedC._id;
              }
            }
            var role_id = 0;
            if (item.role_id == 2) {
              role_id = 1;
            } else {
              role_id = 2;
            }
            var userObject = {
              country_id: Types.ObjectId(countryID),
              first_name: item.first_name,
              last_name: item.last_name,
              role_id: role_id,
              email: item.email,
              country_code: item.country_code,
              mobile: item.role_id == 2 ? item.mobile_number : item.contact_no,
              status: item.status == 1 ? true : false,
              approval: item.status,
              d_availability_flag: item.is_available == 1 ? true : false,
              company_type_id: company_type_id,
              wholesaleusercategory_id: company_category_id,
              company_name: item.company_name,
              company_phone: item.landline_no,
              company_reg_no: item.company_registration_number,
              company_vat_no: item.licence_number,
              company_postal_code: item.postal_code,
              company_address1: item.trading_address_1,
              company_address2: item.trading_address_2,
              company_reg_date: item.date_of_registration,
              reg_certificate: item.registration_certificate,
              image: item.profile_image,
              org_password: item.org_password,
              zoom_updates: item.marketing_offers == 1 ? true : false,
              marketing_offers: item.marketing_offers,
              minimum_order_amount: item.min_order_value,
              password: password,
              device_type: item.device_type,
              is_credit_user: item.is_credit_user,
              old_id: item.id,
              createdAt: new Date(
                momentTz
                  .tz(item.created + "", "UTC")
                  .utc()
                  .toISOString()
              ),
              updatedAt: new Date(
                momentTz
                  .tz(item.modified + "", "UTC")
                  .utc()
                  .toISOString()
              ),
            };
            if (
              userObject.country_code != "" &&
              userObject.country_code != null
            ) {
              userObject.country_code = base64Encode(
                userObject.country_code.replace("+", "")
              );
            }
            if (
              userObject.company_name != "" &&
              userObject.company_name != null
            ) {
              userObject.company_name = base64Encode(userObject.company_name);
            }

            if (
              userObject.company_reg_no != "" &&
              userObject.company_reg_no != null
            ) {
              userObject.company_reg_no = base64Encode(
                userObject.company_reg_no
              );
            }
            if (
              userObject.company_vat_no != "" &&
              userObject.company_vat_no != null
            ) {
              userObject.company_vat_no = base64Encode(
                userObject.company_vat_no
              );
            }
            if (
              userObject.company_reg_date != "" &&
              userObject.company_reg_date != null
            ) {
              userObject.company_reg_date = base64Encode(
                userObject.company_reg_date
              );
            }
            var alreadyExists = await User.findOne({
              old_id: userObject.old_id,
            });
            //console.log(alreadyExists, userObject.old_id);
            if (alreadyExists == null) {
              let user = await User.create(userObject);
              var sql =
                "UPDATE users SET is_sync=1,mongo_id = '" +
                user._id +
                "' WHERE id = " +
                item.id;
              await query(sql);
              console.log("Insert");
            } else {
              await User.updateOne({ old_id: userObject.old_id }, userObject);
              var sql =
                "UPDATE users SET is_sync = 1 WHERE id = " + userObject.old_id;
              await query(sql);
              console.log("Update");
            }
          } catch (err) {
            console.log(err);
          }
        });
        connection.end();
        //console.log(req);
        if (req) {
          return res.json(
            responseData("Data Imported successfully.", "", req, true)
          );
        }
      });
    } catch (error) {
      console.log(error);
      if (req) {
        return res.json(responseData("ERROR_OCCUR", error.message, req, false));
      }
    }
  },
  assignStore: async (req, res) => {
    try {
      var store_id = Types.ObjectId("64782ad214faee0374d662fb");
      var user_id = Types.ObjectId("638586e6d49a8349c9b3a01b");

      var allStoreProducts = await StoreProduct.find({
        country_id: Types.ObjectId(countryID),
        store_id: Types.ObjectId(store_id),
      });
      try {
        for (let i = 0; i < allStoreProducts.length; i++) {
          var element = allStoreProducts[i];
          //console.log(element);
          var aa = await ProductInventory.create({
            country_id: Types.ObjectId(countryID),
            product_id: element.product_id,
            store_id: element.store_id,
            city_id: element.city_id,
            user_id: user_id,
            sync: false,
            quantity_c: 100,
            quantity_w: 100,
          });
          //console.log(aa);
          //return false;
        }
      } catch (error) {
        console.log(error);
      }
      //console.log(element);
      return res.json(
        responseData("Data Imported successfully.", "", req, true)
      );

      var storeDetails = await Store.findOne({
        _id: Types.ObjectId(store_id),
      });
      // console.log(storeDetails);

      var allProducts = await Product.find({
        country_id: Types.ObjectId(countryID),
        status: true,
      })
        .sort({ name: 1 })
        .select("_id country_id");
      if (allProducts.length > 0) {
        for (let i = 0; i < allProducts.length; i++) {
          var element = allProducts[i];
          var alreadyExists = await StoreProduct.findOne({
            product_id: element._id,
            store_id: storeDetails._id,
          });
          if (alreadyExists == null) {
            await StoreProduct.create({
              country_id: Types.ObjectId(countryID),
              product_id: element._id,
              store_id: storeDetails._id,
              city_id: storeDetails.city_id,
              user_id: user_id,
            });
          }
        }
      }
      return res.json(
        responseData("Data Imported successfully.", "", req, true)
      );
    } catch (error) {
      console.log(error);
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  importOrders: async (req, res) => {
    try {
      //console.log(end_date);
      //return false;

      var connection = mysql.createConnection({
        host: DBHostName,
        user: DBUserName,
        password: DBPassword,
        database: DBName,
        acquireTimeout: 1000000,
      });
      connection.connect();
      const query = util.promisify(connection.query).bind(connection);
      var allCategoriesMysql = await query("select * from categories");
      //console.log(allCategoriesMysql);
      var result = await query(
        "select orders.*,date_format(delivery_date, '%Y-%m-%d') as delivery_date ,users.mongo_id,users.role_id from orders left join users on (users.id = orders.user_id ) where orders.is_sync = 0 order by orders.id asc limit 100 "
      );
      var orderIds = [];
      var allOrders = [];
      if (result.length > 0) {
        result.forEach((c) => {
          orderIds.push(c.id);
          //allOrders.push(c);
        });
        if (orderIds.length > 0) {
          var sql =
            "select order_items.*,products.category_id,products.product_name,products.buy_avg_price,products.category_id ,brands.brand_name from order_items left join products on (products.id = order_items.product_id) left join brands on (products.brand_id = brands.id)  where order_id in (" +
            orderIds.toString() +
            ") order by order_items.order_id,order_items.id asc";
          //console.log(sql);
          var result2 = await query(sql);
          result2.forEach((c) => {
            upsertItemOrder(result, c);
          });

          for (let i = 0; i < result.length; i++) {
            let row = result[i];
            // console.log(row.mongo_id);

            var obj = {};
            //obj.user_id = row.mongo_id;
            obj.user_id = Types.ObjectId("64770fb9646ebebee5745f73");
            obj.store_id = Types.ObjectId(storeID);
            obj.address_id = null;
            obj.driver_id = null;
            obj.order_id = row.id;
            obj.old_id = row.id;
            obj.quantity = row.total_quantity;

            obj.total = row.total_amount;
            obj.subtotal = row.net_amount;
            if (row.role_id == 2) {
              obj.role_id = 1;
            } else {
              obj.role_id = 2;
            }
            obj.is_rescheduled = row.is_reschedule;
            obj.is_cancelled = row.is_cancelled;

            obj.delivery_price = row.delivery_charges;
            obj.discount = row.coupon_discount;
            obj.delivery_night_charges = row.night_charge;
            obj.gift_card_price = row.gift_bag_prices;
            // return false;
            obj.delivery_date = new Date(
              momentTz
                .tz(row.delivery_date + " " + row.delivery_start_time, "EET")
                .utc()
                .toISOString()
            );
            obj.delivery_time = new Date(
              momentTz
                .tz(row.delivery_date + " " + row.delivery_end_time, "EET")
                .utc()
                .toISOString()
            );
            obj.address = {};

            obj.address.delivery_country_code = row.delivery_country_code;

            if (row.deliver_to != "" && row.deliver_to != null) {
              obj.address.receiver_name = base64Encode(row.deliver_to);
            } else {
              obj.address.receiver_name = "";
            }

            if (row.deliver_mobile != "" && row.deliver_mobile != null) {
              obj.address.delivery_contact = base64Encode(row.deliver_mobile);
            } else {
              obj.address.delivery_contact = "";
            }
            if (row.delivery_address != "" && row.delivery_address != null) {
              obj.address.full_address = base64Encode(row.delivery_address);
            } else {
              obj.address.full_address = "";
            }
            if (row.delivery_landmark != "" && row.delivery_landmark != null) {
              obj.address.delivery_landmark = base64Encode(
                row.delivery_landmark
              );
            } else {
              obj.address.delivery_landmark = "";
            }

            obj.address.latitude = row.delivery_latitude;
            obj.address.longitude = row.delivery_longitude;

            obj.status = 0;
            if (row.delivery_type == 2) {
              // normal
              obj.delivery_type = 1;
            } else {
              obj.delivery_type = 2; // express
            }

            if (row.payment_mode == 1) {
              // cod
              obj.payment_mode = 1;
            } else if (row.payment_mode == 2) {
              // card / online
              obj.payment_mode = 3;
            } else if (row.payment_mode == 3) {
              // wallet // card on delivery
              obj.payment_mode = 3;
            }

            obj.gift_card_message = row.message;

            obj.invoice_no = row.accounting_invoice
              ? row.accounting_invoice
              : 0;
            obj.transaction_id = row.transaction_id;
            obj.items = [];
            obj.return_quantity = 0;
            obj.return_amount = 0;
            obj.vat = 0;
            obj.total_margin = 0;
            obj.device_type = row.order_device;
            obj.placedAt = new Date(
              momentTz
                .tz(row.order_date + "", "EET")
                .utc()
                .toISOString()
            );
            for (let j = 0; j < row?.items?.length; j++) {
              let row2 = row.items[j];
              var obj2 = {};
              obj2.id = row2.id;
              obj2.name = row2.product_name;
              obj2.brand = row2.brand_name;
              obj2.buy_price = row2.buy_avg_price;
              obj2.unitPrice = row2.price;
              obj2.quantity = row2.quantity;
              obj2.priceAmount = parseFloat(
                obj2.quantity * obj2.unitPrice
              ).toFixed(2);
              obj2.margin_price = parseFloat(
                obj2.unitPrice * obj2.buy_price
              ).toFixed(2);
              obj2.vat = row2.vat_percentage;
              obj2.vatAmount = row2.vat;
              obj2.return_quantity =
                row2.return_quantity == "" || row2.return_quantity == null
                  ? 0
                  : row2.return_quantity;
              obj2.return_amount =
                row2.return_amount == "" || row2.return_amount == null
                  ? 0
                  : row2.return_amount;
              let categories = [];
              if (row2.category_id != "" && row2.category_id != null) {
                let cat = row2.category_id.split(",");
                if (cat.length > 0) {
                  cat.forEach((c) => {
                    let searchString = c;
                    let matchedC = allCategoriesMysql.find(
                      ({ id }) => id == searchString
                    );
                    if (matchedC != undefined) {
                      categories.push(matchedC.category_name);
                    }
                  });
                }
              }
              obj2.categories = categories;
              obj.items.push(obj2);
              obj.return_amount = obj.return_amount + obj2.return_amount;
              obj.return_quantity = obj.return_quantity + obj2.return_quantity;
              obj.vat = obj.vat + obj2.vatAmount;
              obj.total_margin = obj.total_margin + obj2.margin_price;
            }

            obj.return_amount = parseFloat(obj.return_amount).toFixed(2);
            obj.vat = parseFloat(obj.vat).toFixed(2);
            obj.total_margin = parseFloat(obj.total_margin).toFixed(2);

            if (obj.role_id == 1) {
              // in case of customer taxable will be subtotal - vat
              obj.total_taxable = parseFloat(obj.subtotal - obj.vat).toFixed(2);
            } else {
              // in wholesaler it will be same.
              obj.total_taxable = obj.subtotal;
            }
            obj.delivery_status = 2;

            var alreadyExists = await Order.findOne({
              old_id: obj.old_id,
            });
            var order = null;
            if (alreadyExists == null) {
              order = await Order.create(obj);
              if (order != null) {
                var sql =
                  "UPDATE orders SET is_sync = 1,mongo_id = '" +
                  order._id +
                  "' WHERE id = " +
                  row.id;
                await query(sql);
              }
              console.log("insert");
            } else {
              await Order.updateOne({ old_id: obj.old_id }, obj);
              console.log("update");

              var sql = "UPDATE orders SET is_sync = 1 WHERE id = " + row.id;
              await query(sql);
            }
            //console.log(order);
            allOrders.push(obj);
          }
        }
      }
      if (req) {
        return res.json(
          responseData("Data Imported successfully.", allOrders, req, true)
        );
      }
    } catch (error) {
      console.log(error);
      if (req) {
        return res.json(responseData("ERROR_OCCUR", error.message, req, false));
      }
    }
  },
  importBrands: async (req, res) => {
    try {
      var connection = mysql.createConnection({
        host: DBHostName,
        user: DBUserName,
        password: DBPassword,
        database: DBName,
        acquireTimeout: 1000000,
      });
      connection.connect();

      const query = util.promisify(connection.query).bind(connection);
      const sql =
        "SELECT * from brands where mongo_id is null order by id limit 1000";
      connection.query(sql, async function (error, results) {
        if (error) throw error;
        await Promise.map(results, async (item, index) => {
          try {
            let user = await Brand.create({
              country_id: Types.ObjectId(countryID),
              name: item.brand_name,
              status: true,
            });
            var sql =
              "UPDATE brands SET mongo_id = '" +
              user._id +
              "' WHERE id = " +
              item.id;
            //console.log(sql);
            await query(sql);
          } catch (err) {
            console.log(err);
          }
        });
        connection.end();
        return res.json(
          responseData("Data Imported successfully.", "", req, true)
        );
      });
    } catch (error) {
      console.log(error);
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  importAddresses: async (req, res) => {
    try {
      var connection = mysql.createConnection({
        host: DBHostName,
        user: DBUserName,
        password: DBPassword,
        database: DBName,
        acquireTimeout: 1000000,
      });
      connection.connect();

      const query = util.promisify(connection.query).bind(connection);
      const sql =
        "SELECT ua.*,u.mongo_id as user_mongo_id FROM `user_addresses` as ua left join users as u on (u.id=ua.user_id) where ua.is_sync =0 order by id limit 1000";
      connection.query(sql, async function (error, results) {
        if (error) throw error;
        await Promise.map(results, async (item, index) => {
          try {
            var addressObject = {
              user_id: Types.ObjectId("64770fb9646ebebee5745f73"),
              country_id: Types.ObjectId(countryID),
              name: item.name,
              address: item.address,
              full_address: item.full_address,
              latitude: item.latitude,
              longitude: item.longitude,
              zip_code: item.zip_code,
              delivery_contact: item.delivery_contact,
              delivery_address_type: item.delivery_address_type,
              delivery_landmark: item.delivery_landmark,
              street: item.street,
              building: item.building,
              office_no: item.office_no,
              apartment_no: item.appartment_no,
              house_no: item.house_number,
              is_default: item.is_default,
              old_id: item.id,
            };
            var alreadyExists = await Address.findOne({
              old_id: addressObject.old_id,
            });

            if (alreadyExists == null) {
              var address = await Address.create(addressObject);
              var sql =
                "UPDATE user_addresses SET is_sync=1,mongo_id = '" +
                address._id +
                "' WHERE id = " +
                item.id;
              await query(sql);
              console.log("insert");
            } else {
              var sql =
                "UPDATE user_addresses SET is_sync=1 WHERE id = " + item.id;
              await query(sql);
              await Order.updateOne(
                { old_id: addressObject.old_id },
                addressObject
              );
              console.log("update");
            }
          } catch (err) {
            console.log(err);
          }
        });
        connection.end();
        return res.json(
          responseData("Data Imported successfully.", "", req, true)
        );
      });
    } catch (error) {
      console.log(error);
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  importSuppliers: async (req, res) => {
    try {
      var connection = mysql.createConnection({
        host: DBHostName,
        user: DBUserName,
        password: DBPassword,
        database: DBName,
        acquireTimeout: 1000000,
      });
      connection.connect();
      const query = util.promisify(connection.query).bind(connection);
      const sql =
        "SELECT id,supplier from products where supplier is not null and supplier != '' group by supplier";
      connection.query(sql, async function (error, results) {
        if (error) throw error;
        await Promise.map(results, async (item, index) => {
          try {
            let user = await Supplier.create({
              country_id: Types.ObjectId(countryID),
              name: item.supplier,
              status: true,
            });
          } catch (err) {
            //console.log(item);
            console.log(err);
          }
        });
        connection.end();
        return res.json(
          responseData("Data Imported successfully.", "", req, true)
        );
      });
    } catch (error) {
      console.log(error);
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  importCategories: async (req, res) => {
    try {
      if (req.query.type == 1) {
        var connection = mysql.createConnection({
          host: DBHostName,
          user: DBUserName,
          password: DBPassword,
          database: DBName,
          acquireTimeout: 1000000,
        });
        connection.connect();
        var query = util.promisify(connection.query).bind(connection);
        var sql =
          "SELECT id,sort,category_name,category_image FROM `categories` WHERE `parent_id` = 0 and mongo_id is null ORDER BY `parent_id` DESC ";
        connection.query(sql, async function (error, results) {
          if (error) throw error;
          await Promise.map(results, async (item, index) => {
            try {
              let user = await Category.create({
                country_id: Types.ObjectId(countryID),
                name: item.category_name,
                status: true,
                order_cat: item.sort,
                image: item.category_image,
              });
              var sql =
                "UPDATE categories SET mongo_id = '" +
                user._id +
                "' WHERE id = " +
                item.id;
              //console.log(sql);
              await query(sql);
            } catch (err) {
              console.log(err);
            }
          });
          connection.end();
          return res.json(
            responseData("Data Imported successfully.", "", req, true)
          );
        });
      } else {
        var match = {};
        match.country_id = Types.ObjectId(countryID);
        var allCategories = await Category.aggregate([
          { $match: match },
          {
            $project: {
              _id: 1,
              name: 1,
              status: 1,
            },
          },
          { $sort: { title: 1 } },
        ]);
        console.log(allCategories);

        var connection = mysql.createConnection({
          host: DBHostName,
          user: DBUserName,
          password: DBPassword,
          database: DBName,
          acquireTimeout: 1000000,
        });

        connection.connect();
        var query = util.promisify(connection.query).bind(connection);
        var sql =
          "select c1.category_image,c1.id,c1.sort,c1.category_name as name,c2.category_name as parent from categories as c1 left join categories as c2 on (c1.parent_id=c2.id) where c1.parent_id != 0 and c1.mongo_id is null";
        connection.query(sql, async function (error, results) {
          if (error) throw error;
          await Promise.map(results, async (item, index) => {
            try {
              var searchString = item.parent.trim();
              var matchedC = allCategories.find(
                ({ name }) => name.toLowerCase() === searchString.toLowerCase()
              );
              if (matchedC != undefined) {
                let user = await Category.create({
                  country_id: Types.ObjectId(countryID),
                  name: item.name,
                  status: true,
                  order_cat: item.sort,
                  parent: matchedC._id,
                  image: item.category_image,
                });
                var sql =
                  "UPDATE categories SET mongo_id = '" +
                  user._id +
                  "' WHERE id = " +
                  item.id;
                //console.log(sql);
                await query(sql);
              }
            } catch (err) {
              console.log(err);
            }
          });
          connection.end();
          return res.json(
            responseData("Data Imported successfully.", "", req, true)
          );
        });
      }
    } catch (error) {
      console.log(error);
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  importBusinessTypes: async (req, res) => {
    try {
      var connection = mysql.createConnection({
        host: DBHostName,
        user: DBUserName,
        password: DBPassword,
        database: DBName,
        acquireTimeout: 1000000,
      });
      connection.connect();
      const query = util.promisify(connection.query).bind(connection);
      const sql = "SELECT * from business_types";
      connection.query(sql, async function (error, results) {
        if (error) throw error;
        await Promise.map(results, async (item, index) => {
          try {
            let user = await WSBusinessType.create({
              country_id: Types.ObjectId(countryID),
              name: item.business_type,
              status: item.status == 1 ? true : false,
            });
          } catch (err) {
            console.log(err);
          }
        });
        connection.end();
        return res.json(
          responseData("Data Imported successfully.", "", req, true)
        );
      });
    } catch (error) {
      console.log(error);
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  importWholeSaleCategories: async (req, res) => {
    try {
      var connection = mysql.createConnection({
        host: DBHostName,
        user: DBUserName,
        password: DBPassword,
        database: DBName,
        acquireTimeout: 1000000,
      });
      connection.connect();
      const query = util.promisify(connection.query).bind(connection);
      const sql = "SELECT * from business_user_categories";
      connection.query(sql, async function (error, results) {
        if (error) throw error;
        await Promise.map(results, async (item, index) => {
          try {
            let user = await WholesaleUserCategory.create({
              country_id: Types.ObjectId(countryID),
              name: item.name,
              default: item.is_default == 1 ? true : false,
              status: item.status == 1 ? true : false,
            });
          } catch (err) {
            console.log(err);
          }
        });
        connection.end();
        return res.json(
          responseData("Data Imported successfully.", "", req, true)
        );
      });
    } catch (error) {
      console.log(error);
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  importSizeCode: async (req, res) => {
    try {
      var sizes = [
        "kg",
        "gm",
        "ltr",
        "ml",
        "pcs",
        "cl",
        "oz",
        "rolls",
        "pack",
        "packs",
        "unit",
        "units",
        "case",
        "cases",
        "bottle",
        "bottles",
        "carton",
        "cartons",
      ];

      try {
        for (let i = 0; i < sizes.length; i++) {
          let user = await SizeCode.create({
            country_id: Types.ObjectId(countryID),
            name: sizes[i],
            old_id: i + 1,
            status: true,
          });
        }
      } catch (err) {
        console.log(err);
      }
      return res.json(
        responseData("Data Imported successfully.", "", req, true)
      );
    } catch (error) {
      console.log(error);
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  importProducts: async (req, res) => {
    try {
      const allCategories = await getAllCategories(countryID);
      const allBrands = await getAllBrandsOfCountry(countryID);
      const allSuppliers = await getAllSuppliersOfCountry(countryID);
      const allSizes = await getAllSizesOfCountry(countryID);

      var connection = mysql.createConnection({
        host: DBHostName,
        user: DBUserName,
        password: DBPassword,
        database: DBName,
        acquireTimeout: 1000000,
      });
      connection.connect();
      const query = util.promisify(connection.query).bind(connection);

      var allCategoriesMysql = await query("select * from categories");

      const sql =
        "SELECT products.*,brands.brand_name from products left join brands on (brands.id=products.brand_id) where products.mongo_id is null order by products.id limit 100 ";
      connection.query(sql, async function (error, results) {
        if (error) throw error;
        await Promise.map(results, async (item, index) => {
          try {
            let categories = [];
            if (item.category_id != "" && item.category_id != null) {
              let cat = item.category_id.split(",");
              if (cat.length > 0) {
                cat.forEach((c) => {
                  let searchString = c;
                  let matchedC = allCategoriesMysql.find(
                    ({ id }) => id == searchString
                  );
                  if (matchedC != undefined) {
                    let category_name = matchedC.category_name;
                    let matchedC2 = allCategories.find(
                      ({ name }) =>
                        name.toLowerCase() === category_name.toLowerCase()
                    );
                    if (matchedC2 != undefined) {
                      categories.push(matchedC2._id);
                    }
                  }
                });
              }
            }
            console.log(item.brand_name);
            let brand_id = null;
            if (item.brand_name != "" && item.brand_name != null) {
              let searchString = item.brand_name;
              let matchedC = allBrands.find(
                ({ name }) => name.toLowerCase() === searchString.toLowerCase()
              );
              if (matchedC != undefined) {
                brand_id = matchedC._id;
              }
            }

            let product = {};
            product.country_id = Types.ObjectId(countryID);
            product.categories = categories;
            product.brand_id = brand_id;
            product.supplier_id = await getSupplierIdFromSuppliers(
              item.supplier,
              allSuppliers
            );
            product.size_code_id = await getSizeIdFromSizes(
              item.weight_in,
              allSizes
            );
            console.log(product.size_code_id);
            console.log(item.id);
            product.vat_code_id = Types.ObjectId("647830e014faee0374d6673b");

            product.name = item.product_name;
            product.size = item.weight;
            product.price = item.avg_price;
            product.buy_price = item.buy_avg_price;
            product.description = item.product_description;
            product.product_info = item.product_description;
            product.sku = item.sku;
            product.bar_code = item.qr_code;
            product.offer_price = item.offer_price;
            product.w_discount_per = item.wholesale_discount;
            product.images = [];
            if (item.min_quantity == "" || item.min_quantity == null) {
              product.min_qty_stock = 1;
            } else {
              product.min_qty_stock = item.min_quantity;
            }

            product.minimum_quantity_for_wholesaler = 1;

            product.is_special = item.is_special_product ? true : false;
            product.status = item.status ? true : false;
            product.old_id = item.id;
            if (item.offer_starts_at != "" && item.offer_starts_at != null) {
              product.offer_start_at = moment.utc(item.offer_starts_at).unix();
            } else {
              product.offer_start_at = null;
            }
            if (item.offer_expires_on != "" && item.offer_expires_on != null) {
              product.offer_start_end = moment
                .utc(item.offer_expires_on)
                .unix();
            } else {
              product.offer_start_end = null;
            }

            if (
              item.wholesale_offer_start_at != "" &&
              item.wholesale_offer_start_at != null
            ) {
              product.w_offer_start_at = moment
                .utc(item.wholesale_offer_start_at)
                .unix();
            } else {
              product.w_offer_start_at = null;
            }

            if (
              item.wholesale_offer_end_on != "" &&
              item.wholesale_offer_end_on != null
            ) {
              product.w_offer_start_end = moment
                .utc(item.wholesale_offer_end_on)
                .unix();
            } else {
              product.w_offer_start_end = null;
            }

            let user = await Product.create(product);

            var sql =
              "UPDATE products SET mongo_id = '" +
              user._id +
              "' WHERE id = " +
              item.id;
            //console.log(sql);
            await query(sql);
          } catch (err) {
            console.log(err);
          }
        });
        connection.end();
        return res.json(
          responseData("Data Imported successfully.", "", req, true)
        );
      });
    } catch (error) {
      console.log(error);
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  importImages: async (req, res) => {
    try {
      var connection = mysql.createConnection({
        host: DBHostName,
        user: DBUserName,
        password: DBPassword,
        database: DBName,
        acquireTimeout: 1000000,
      });
      connection.connect();
      const query = util.promisify(connection.query).bind(connection);

      const sql =
        "SELECT product_images.* FROM product_images left join products on (products.id = product_images.product_id) where is_sync = 0 and mongo_id is not null order by product_images.id limit 100 ";
      connection.query(sql, async function (error, results) {
        if (error) throw error;
        await Promise.map(results, async (item, index) => {
          try {
            await Product.updateMany(
              { old_id: item.product_id },
              {
                $push: {
                  images: {
                    name: item.product_image,
                    is_default: item.is_default,
                  },
                },
              }
            );
            var sql =
              "UPDATE product_images SET is_sync = 1 WHERE id = " + item.id;
            console.log(sql);
            await query(sql);
          } catch (err) {
            console.log(err);
          }
        });
        connection.end();
        return res.json(
          responseData("Data Imported successfully...", "", req, true)
        );
      });
    } catch (error) {
      console.log(error);
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
};
