const Order = require("../../models/order.model");
const User = require("../../models/user.model");

var { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
const _ = require("lodash");
const { Types } = require("mongoose");
const { Store } = require("express-session");
var moment = require("moment");
var momentTz = require("moment-timezone");
const {
  base64Encode,
  base64Decode,
  sendNotification,
  sendNotificationOrderStatusChange,
  addLog,
  syncInventoryOrder,
  pdfGenerate,
  sendNotificationOrderCancel,
  sendNotificationOrderReSchedule,
  sendOrderConfirmationEmail,
} = require("../../helpers/helper");
const fs = require("fs");
const path = require("path");
var html = fs.readFileSync(
  path.join(__dirname, "../../email_layouts/pdf_generate.html"),
  "utf8"
);
const Promise = require("bluebird");

module.exports = {
  change_order_status: async (req, res) => {
    try {
      var { id, status, driver_id } = req.body;
      status = parseInt(status);
      if (!driver_id) {
        // if api is getting called from driver side get driver_id from logged in user token
        driver_id = req.user._id;
      }

      var orderDetail = await Order.findOne({ _id: Types.ObjectId(id) })
        .populate("user_id", "is_credit_user")
        .lean();

      if (status == 100) {
        // if order is assigned by driver to himself.
        if (orderDetail?.driver_id?.toString() != undefined) {
          //if (0) {
          if (orderDetail?.driver_id?.toString() == driver_id) {
            return res
              .status(422)
              .json(responseData("ORDER_IS_ALREADY_ACCEPTED", {}, req, false));
          } else {
            return res
              .status(422)
              .json(
                responseData(
                  "ORDER_IS_ALREADY_ASSIGNED_TO_SOMEONE_ELSE",
                  {},
                  req,
                  false
                )
              );
          }
        } else {
          await Order.findOneAndUpdate(
            { _id: Types.ObjectId(id) },
            { driver_id: Types.ObjectId(driver_id), delivery_status: 3 },
            { new: true }
          );
        }
      } else {
        if (status == 4 || status == 5) {
          // see order models for status
          if (orderDetail.delivery_status != status) {
            if (status == 4) {
              await Order.findOneAndUpdate(
                { _id: Types.ObjectId(id) },
                { delivery_status: status },
                { new: true }
              );
            } else {
              if (orderDetail.user_id.is_credit_user == 0) {
                // if user credit = 0 then will generate invoice when payment is received right now.

                const invoice_no_details = await Order.aggregate([
                  { $match: { invoice_no: { $ne: "" } } },
                  {
                    $group: {
                      _id: null,
                      invoice_no: { $max: "$invoice_no" },
                    },
                  },
                ]);
                if (invoice_no_details.length > 0) {
                  if (invoice_no_details[0].invoice_no) {
                    var invoice_no = parseInt(invoice_no_details[0].invoice_no);

                    invoice_no = invoice_no + 1;
                  } else {
                    invoice_no = 1;
                  }
                } else {
                  invoice_no = 1;
                }
                await Order.findOneAndUpdate(
                  { _id: Types.ObjectId(id) },
                  {
                    delivery_status: status,
                    invoice_no: invoice_no,
                    payment_status: 1,
                  },
                  { new: true }
                );
                // true means send invoice instead of confirmation email.
                await sendOrderConfirmationEmail(id, true);
              } else {
                // if delivered and is credit = 1 then we will not generate invoice no and payment status from here.

                await Order.findOneAndUpdate(
                  { _id: Types.ObjectId(id) },
                  { delivery_status: status },
                  { new: true }
                );
              }
            }
          }
        }
      }

      var statusText = "";
      if (status == 100) {
        statusText = " Driver Assigned to HimSelf.";
      } else if (status == 4) {
        statusText = " Driver updated to Out of Delivery.";
      } else if (status == 5) {
        statusText = " Driver updated to Delivered.";
      }

      addLog(
        req.user._id,
        "Order Status Updated",
        "#" + orderDetail.order_id,
        "Order Status Changed for order id #" +
          orderDetail.order_id +
          statusText,
        Types.ObjectId(id)
      );

      sendNotificationOrderStatusChange(id);

      if (!isEmpty(orderDetail)) {
        return res.json(
          responseData("ORDER_UPDATED_SUCCESSFULLY", orderDetail, req, true)
        );
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  delete_order: async (req, res) => {
    try {
      const order = await Order.findOneAndRemove({
        _id: req.params.id,
      });
      if (!isEmpty(order)) {
        return res.json(responseData("ORDER_DELETED", {}, req, true));
      } else {
        return res.json(responseData("ERROR_OCCUR", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  list: async (req, res) => {
    try {
      let {
        page,
        limit,
        status,
        sort_by,
        keyword,
        store_id,
        brand,
        product,
        category,
        sort_type,
        consumer,
        driver_id,
        queryType,
        type,
      } = req.query;
      keyword = _.trim(keyword);

      const sortOptions = {
        [sort_by || "createdAt"]: sort_type === "asc" ? 1 : -1,
      };
      // var sortOptions = {
      //   [sort_by || "createdAt"]: sort_type === "desc" ? 1 : -1,
      // };
      const options = {
        page: page || 1,
        limit: limit || 10,
        sort_by: sortOptions,
      };

      var match = {};
      const { _id, is_credit_user } = req.user;

      //console.log('ccc ........',is_credit_user,req.user);

      if (consumer == "driver") {
        // apply driver specific filters here.
        // api calling is from driver side.
        if (queryType == 2) {
          // show only admin accepted and unassigned orders
          match.driver_id = null;
          match.delivery_status = parseInt(queryType);

          // iF DRIVER IS OFFLINE THEN ORDER NOT COME
          const User_data = await User.findOne({ _id: _id });
          if (User_data.d_availability_flag == false) {
            return res.json(responseData("GET_LIST", finalData, req, true));
          }
        } else {
          match.driver_id = Types.ObjectId(_id);
          match.delivery_status = parseInt(queryType);
        }
      } else {
        // api calling is from customer side
        match.user_id = Types.ObjectId(_id);
        if (type == "cancelled") {
          match.delivery_status = 5;
          match.is_cancelled = 1;
        } else if (type == "completed") {
          match.delivery_status = 5;
          match.is_cancelled = 0;
        } else {
          match.delivery_status = { $in: [1, 2, 3, 4] };
          match.is_cancelled = 0;
        }
      }
      match.status = 0;
      if (status) {
        if (status == 1) {
          match.status = true;
        } else if (status == 0) {
          match.status = false;
        }
      }

      if (store_id) {
        match.store_id = Types.ObjectId(store_id);
      }

      if (category) {
        match["$or"] = [{ "items.categories": { $in: [category] } }];
      }

      if (brand) {
        match["$or"] = [{ "items.brand": { $regex: brand, $options: "i" } }];
      }
      if (product) {
        match["$or"] = [{ "items.name": { $regex: product, $options: "i" } }];
      }
      //var match = {};
      const query = Order.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
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
            as: "store",
          },
        },
        {
          $unwind: "$store",
        },
        {
          $lookup: {
            from: "users",
            localField: "driver_id",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  first_name: 1,
                  last_name: 1,
                  mobile: 1,
                  country_code: 1,
                },
              },
            ],
            as: "driver",
          },
        },
        { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
        {
          $match: match,
        },
        {
          $project: {
            _id: 1,
            order_id: 1,
            invoice_no: 1,
            "store._id": 1,
            "store.name": 1,
            "user._id": 1,
            "user.first_name": 1,
            "user.last_name": 1,
            "user.mobile": 1,
            "user.country_code": 1,
            items: 1,
            transaction_id: 1,
            special_instruction: 1,
            quantity: 1,
            loyalty_points: 1,
            subtotal: 1,
            vat: 1,
            vat_inclusive: 1,
            total: 1,
            driver_id: 1,
            delivery_status: 1,
            delivery_night_charges: 1,
            referral_value: 1,
            referral_amount: 1,
            delivery_type: 1,
            delivery_date: 1,
            delivery_time: 1,
            delivery_price: 1,
            delivery_message: 1,
            gift_card_price: 1,
            delivery_message: 1,
            gift_card_message: 1,
            is_rescheduled: 1,
            is_cancelled: 1,
            gift_card_message: 1,
            placedAt: 1,
            payment_status: 1,
            payment_mode: 1,
            post_code: 1,
            total_taxable: 1,
            total_margin: 1,
            driver: { $ifNull: ["$driver", {}] },
            // "country": { $ifNull: ["$user.country", {}] },
            // "city": { $ifNull: ["$user.city", {}] },
            discount: 1,
            status: 1,
            offer: 1,
            address: 1,
            address_id: 1,
            createdAt: 1,
            updatedAt: 1,
            __v: 1,
          },
        },
        {
          $sort: sortOptions,
        },
      ]).collation({ locale: "en", strength: 1 });
      var finalData = await Order.aggregatePaginate(query, options);

      await Promise.map(finalData.docs, async (item, index) => {
        if (item.address == undefined) {
          item.address = {}; // order is imported no address key will found.
        }
        // item["delivery_date"] = moment
        //   .unix(item["delivery_date"])
        //   .format("YYYY-MM-DD");

        item.is_credit_user = is_credit_user;
        if (!isEmpty(item.user.first_name))
          item.user.first_name = base64Decode(item.user.first_name);
        if (!isEmpty(item.user.last_name))
          item.user.last_name = base64Decode(item.user.last_name);

        item.user.mobile = base64Decode(item.user.mobile);
        item.user.country_code = base64Decode(item.user.country_code);
        if (item?.address?.name != "" && item?.address?.name != null) {
          item.address.name = base64Decode(item?.address?.name);
        } else {
          item.address.name = "";
        }
        if (item?.address?.address != "" && item?.address?.address != null) {
          item.address.address = base64Decode(item?.address?.address);
        } else {
          item.address.address = "";
        }
        if (
          item?.address?.full_address != "" &&
          item?.address?.full_address != null
        ) {
          item.address.full_address = base64Decode(item?.address?.full_address);
        } else {
          item.address.full_address = "";
        }
        if (item?.address?.zip_code != "" && item?.address?.zip_code != null) {
          item.address.zip_code = base64Decode(item?.address?.zip_code);
        } else {
          item.address.zip_code = "";
        }
        if (
          item?.address?.delivery_contact != "" &&
          item?.address?.delivery_contact != null
        ) {
          item.address.delivery_contact = base64Decode(
            item?.address?.delivery_contact
          );
        } else {
          item.address.delivery_contact = "";
        }
        if (
          item?.address?.delivery_landmark != "" &&
          item?.address?.delivery_landmark != null
        ) {
          item.address.delivery_landmark = base64Decode(
            item?.address?.delivery_landmark
          );
        } else {
          item.address.delivery_landmark = "";
        }
        if (item?.address?.street != "" && item?.address?.street != null) {
          item.address.street = base64Decode(item?.address?.street);
        } else {
          item.address.street = "";
        }

        if (item?.address?.building != "" && item?.address?.building != null) {
          item.address.building = base64Decode(item?.address?.building);
        } else {
          item.address.building = "";
        }
        if (
          item?.address?.office_no != "" &&
          item?.address?.office_no != null
        ) {
          item.address.office_no = base64Decode(item?.address?.office_no);
        } else {
          item.address.office_no = "";
        }

        if (
          item?.address?.apartment_no != "" &&
          item?.address?.apartment_no != null
        ) {
          item.address.apartment_no = base64Decode(item?.address?.apartment_no);
        } else {
          item.address.apartment_no = "";
        }
        if (item?.address?.city != "" && item?.address?.city != null) {
          item.address.city = base64Decode(item?.address?.city);
        } else {
          item.address.city = "";
        }
        if (item?.address?.house_no != "" && item?.address?.house_no != null) {
          item.address.house_no = base64Decode(item?.address?.house_no);
        } else {
          item.address.house_no = "";
        }

        if (item?.driver) {
          if (item?.driver?.first_name)
            item.driver.first_name = base64Decode(item?.driver?.first_name);
          if (item?.driver?.last_name)
            item.driver.last_name = base64Decode(item?.driver?.last_name);
          if (item?.driver?.mobile)
            item.driver.mobile = base64Decode(item?.driver?.mobile);
          if (item?.driver?.country_code)
            item.driver.country_code = base64Decode(item?.driver?.country_code);
        }
      });

      if (!isEmpty(finalData)) {
        return res.json(responseData("GET_LIST", finalData, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      console.log(error);
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  orderDetails: async (req, res) => {
    try {
      const { id } = req.query;
      const { _id, is_credit_user } = req.user;
      var match = {};
      match._id = Types.ObjectId(id);
      const query = Order.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
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
            as: "store",
          },
        },
        {
          $unwind: "$store",
        },
        {
          $lookup: {
            from: "users",
            localField: "driver_id",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  first_name: 1,
                  last_name: 1,
                  mobile: 1,
                  country_code: 1,
                },
              },
            ],
            as: "driver",
          },
        },
        { $unwind: { path: "$driver", preserveNullAndEmptyArrays: true } },
        {
          $match: match,
        },
        {
          $project: {
            _id: 1,
            order_id: 1,
            transaction_id: 1,
            special_instruction: 1,
            quantity: 1,
            subtotal: 1,
            loyalty_points: 1,
            discount: 1,
            vat: 1,
            vat_inclusive: 1,
            payment_status: 1,
            payment_mode: 1,
            delivery_status: 1,
            delivery_type: 1,
            delivery_date: 1,
            delivery_time: 1,
            delivery_price: 1,
            delivery_message: 1,
            gift_card_price: 1,
            delivery_message: 1,
            gift_card_message: 1,
            is_rescheduled: 1,
            is_cancelled: 1,
            delivery_night_charges: 1,
            referral_value: 1,
            referral_amount: 1,
            post_code: 1,
            placedAt: 1,
            order_id: 1,
            driver: { $ifNull: ["$driver", {}] },
            "user._id": 1,
            "user.first_name": 1,
            "user.last_name": 1,
            "user.mobile": 1,
            "user.country_code": 1,
            "store._id": 1,
            "store.name": 1,
            total: 1,
            total_taxable: 1,
            total_margin: 1,
            status: 1,
            items: 1,
            offer: 1,
            address: 1,
            address_id: 1,
            createdAt: 1,
            updatedAt: 1,
            __v: 1,
          },
        },
      ]).collation({ locale: "en", strength: 1 });
      var finalData = await Order.aggregatePaginate(query);

      await Promise.map(finalData.docs, async (item, index) => {
        // item["delivery_date"] = moment
        //   .unix(item["delivery_date"])
        //   .format("YYYY-MM-DD");
        if (item.address == undefined) {
          item.address = {}; // order is imported no address key will found.
        }
        item.is_credit_user = is_credit_user;
        if (!isEmpty(item.user.first_name))
          item.user.first_name = base64Decode(item.user.first_name);
        if (!isEmpty(item.user.last_name))
          item.user.last_name = base64Decode(item.user.last_name);

        item.user.mobile = base64Decode(item.user.mobile);
        item.user.country_code = base64Decode(item.user.country_code);

        if (item?.address?.name != "" && item?.address?.name != null) {
          item.address.name = base64Decode(item?.address?.name);
        } else {
          item.address.name = "";
        }
        if (item?.address?.address != "" && item?.address?.address != null) {
          item.address.address = base64Decode(item?.address?.address);
        } else {
          item.address.address = "";
        }
        if (item?.address?.address != "" && item?.address?.address != null) {
          item.address.address = base64Decode(item?.address?.address);
        } else {
          item.address.address = "";
        }

        if (
          item?.address?.full_address != "" &&
          item?.address?.full_address != null
        ) {
          item.address.full_address = base64Decode(item?.address?.full_address);
        } else {
          item.address.full_address = "";
        }
        if (item?.address?.zip_code != "" && item?.address?.zip_code != null) {
          item.address.zip_code = base64Decode(item?.address?.zip_code);
        } else {
          item.address.zip_code = "";
        }
        if (
          item?.address?.delivery_contact != "" &&
          item?.address?.delivery_contact != null
        ) {
          item.address.delivery_contact = base64Decode(
            item?.address?.delivery_contact
          );
        } else {
          item.address.delivery_contact = "";
        }
        if (
          item?.address?.delivery_landmark != "" &&
          item?.address?.delivery_landmark != null
        ) {
          item.address.delivery_landmark = base64Decode(
            item?.address?.delivery_landmark
          );
        } else {
          item.address.delivery_landmark = "";
        }
        if (item?.address?.street != "" && item?.address?.street != null) {
          item.address.street = base64Decode(item?.address?.street);
        } else {
          item.address.street = "";
        }
        if (item?.address?.building != "" && item?.address?.building != null) {
          item.address.building = base64Decode(item?.address?.building);
        } else {
          item.address.building = "";
        }
        if (
          item?.address?.office_no != "" &&
          item?.address?.office_no != null
        ) {
          item.address.office_no = base64Decode(item?.address?.office_no);
        } else {
          item.address.office_no = "";
        }
        if (
          item?.address?.apartment_no != "" &&
          item?.address?.apartment_no != null
        ) {
          item.address.apartment_no = base64Decode(item?.address?.apartment_no);
        } else {
          item.address.apartment_no = "";
        }
        if (item?.address?.city != "" && item?.address?.city != null) {
          item.address.city = base64Decode(item?.address?.city);
        } else {
          item.address.city = "";
        }
        if (item?.address?.house_no != "" && item?.address?.house_no != null) {
          item.address.house_no = base64Decode(item?.address?.house_no);
        } else {
          item.address.house_no = "";
        }

        if (item?.driver) {
          if (item?.driver?.first_name)
            item.driver.first_name = base64Decode(item?.driver?.first_name);
          if (item?.driver?.last_name)
            item.driver.last_name = base64Decode(item?.driver?.last_name);
          if (item?.driver?.mobile)
            item.driver.mobile = base64Decode(item?.driver?.mobile);
          if (item?.driver?.country_code)
            item.driver.country_code = base64Decode(item?.driver?.country_code);
        }
      });

      var orderDetail = finalData?.docs[0];
      console.log(finalData);
      if (!isEmpty(orderDetail)) {
        return res.json(responseData("ORDER_DETAILS", orderDetail, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  change_status_order: async (req, res) => {
    try {
      const { id } = req.params;
      const orderDetail = await Order.findOne({ _id: id });
      let status = orderDetail?.status == 1 ? 0 : 1;
      const order = await Order.findOneAndUpdate(
        { _id: id },
        { status },
        { new: true }
      );
      addLog(
        req.user._id,
        "Order Status Updated",
        orderDetail.name,
        status ? "Order has been activated" : "Order has been deactiavted",
        id
      );
      if (!isEmpty(order)) {
        return res.json(responseData("ORDER_STATUS_UPDATED", order, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  cancelOrder: async (req, res) => {
    try {
      const { id } = req.params;
      const orderDetail = await Order.findOne({ _id: id });

      if (orderDetail?.driver_id) {
        return res.json(
          responseData(
            "You can't cancel this order because delivery boy already assigned",
            {},
            req,
            false
          )
        );
      }
      let status = orderDetail?.status == 1 ? 0 : 1;
      const order = await Order.findOneAndUpdate(
        { _id: id },
        { delivery_status: 5, is_cancelled: 1 },
        { new: true }
      );

      syncInventoryOrder(id);
      sendNotificationOrderCancel(id);
      if (!isEmpty(order)) {
        return res.json(responseData("ORDER_CANCEL", order, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  rescheduleOrder: async (req, res) => {
    try {
      const { id, delivery_time, delivery_date, timezone } = req.body;
      const orderDetail = await Order.findOne({ _id: id });
      let status = orderDetail?.status == 1 ? 0 : 1;

      var delivery_time_slot = delivery_time.split(" ");

      if (delivery_time_slot[1] == "PM") {
        let arr2 = delivery_time_slot[0].split(":");
        if (Number(arr2[0]) < 12) {
          arr2[0] = Number(arr2[0]) + 12;
          delivery_time_slot[0] = arr2.join(":");
        }
      }

      if (delivery_time_slot[3] == "PM") {
        let arr2 = delivery_time_slot[2].split(":");
        if (Number(arr2[0]) < 12) {
          arr2[0] = Number(arr2[0]) + 12;
          delivery_time_slot[2] = arr2.join(":");
        }
      }
      var delivery_date1 = new Date(
        momentTz
          .tz(delivery_date + " " + delivery_time_slot[0] + "", timezone)
          .utc()
          .toISOString()
      );

      var delivery_time1 = new Date(
        momentTz
          .tz(delivery_date + " " + delivery_time_slot[2] + "", timezone)
          .utc()
          .toISOString()
      );

      console.log("..ddd", delivery_time_slot[2]);
      console.log("..cccc", delivery_time_slot[0]);

      const order = await Order.findOneAndUpdate(
        { _id: id },
        {
          delivery_date: delivery_date1,
          delivery_time: delivery_time1,
          is_rescheduled: 1,
        },
        { new: true }
      );

      sendNotificationOrderReSchedule(id);
      if (!isEmpty(order)) {
        return res.json(responseData("ORDER_RESCHEDULE", order, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  complatedOrder: async (req, res) => {
    try {
      let {
        page,
        limit,
        status,
        sort_by,
        keyword,
        store_id,
        brand,
        product,
        category,
        sort_type,
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
      const { _id } = req.user;
      match.user_id = Types.ObjectId(_id);
      match.delivery_status = { $in: [5] };
      match.is_cancelled = { $ne: [1] };

      if (status) {
        if (status == 1) {
          match.status = true;
        } else if (status == 0) {
          match.status = false;
        }
      }

      if (store_id) {
        match.store_id = Types.ObjectId(store_id);
      }

      if (category) {
        match["$or"] = [{ "items.categories": { $in: [category] } }];
      }

      if (brand) {
        match["$or"] = [{ "items.brand": { $regex: brand, $options: "i" } }];
      }
      if (product) {
        match["$or"] = [{ "items.name": { $regex: product, $options: "i" } }];
      }

      match["$or"] = [{ is_cancelled: 1 }];

      const query = Order.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
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
            as: "store",
          },
        },
        {
          $unwind: "$store",
        },
        {
          $match: match,
        },
        {
          $project: {
            _id: 1,
            order_id: 1,
            transaction_id: 1,
            quantity: 1,
            subtotal: 1,
            discount: 1,
            vat: 1,
            vat_inclusive: 1,
            payment_status: 1,
            payment_mode: 1,
            delivery_status: 1,
            delivery_type: 1,
            delivery_date: 1,
            delivery_time: 1,
            delivery_price: 1,
            gift_card_price: 1,
            post_code: 1,
            "user._id": 1,
            "user.name": 1,
            "store._id": 1,
            "store.name": 1,
            total: 1,
            status: 1,
            items: 1,
            offer: 1,
            address: 1,
            address_id: 1,
            createdAt: 1,
            updatedAt: 1,
            __v: 1,
          },
        },
        {
          $sort: sortOptions,
        },
      ]).collation({ locale: "en", strength: 1 });
      var finalData = await Order.aggregatePaginate(query, options);
      finalData.docs.map((item, key) => {
        //item["order_id"] = "#" + item["order_id"];
        // item["delivery_date"] = moment
        //   .unix(item["delivery_date"])
        //   .format("YYYY-MM-DD");
      });

      if (!isEmpty(finalData)) {
        return res.json(responseData("GET_LIST", finalData, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  reOrder: async (req, res) => {
    try {
      const { id } = req.body;

      var { _id: user_id } = req.user;
      user_id = Types.ObjectId(user_id);

      const orderDetail = await Order.findOne({ user_id: user_id, status: 1 });
      const reOrderItem = await Order.findOne({ _id: id });

      if (orderDetail) {
        await Order.updateOne(
          { _id: orderDetail._id },
          { items: reOrderItem.items }
        );
        return res.json(responseData("RE_ORDER", orderDetail, req, true));
      } else {
        newOrderAdd = await Order.create({
          user_id: user_id,
          status: 1,
          store_id: reOrderItem.store_id,
          items: reOrderItem.items,
        });
        return res.json(responseData("RE_ORDER", orderDetail, req, true));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  generate_pdf: async (req, res) => {
    try {
      var { id, mail } = req.query;
      let orderDetails = await Order.findOne({ order_id: +id })
        .populate("user_id", "email first_name last_name mobile country_code")
        .lean();
      if (!isEmpty(orderDetails)) {
        orderDetails.user_id.email = base64Decode(orderDetails.user_id.email);
        orderDetails.user_id.first_name = base64Decode(
          orderDetails.user_id.first_name
        );
        orderDetails.user_id.last_name = base64Decode(
          orderDetails.user_id.last_name
        );
        orderDetails.user_id.mobile = base64Decode(orderDetails.user_id.mobile);
        orderDetails.user_id.country_code = base64Decode(
          orderDetails.user_id.country_code
        );
        orderDetails.address.full_address = base64Decode(
          orderDetails.address.full_address
        );

        // const generateToken = () => {
        //   return Math.floor(Math.pow(10,12-1) + Math.random()* Math.pow(10,12)-Math.pow(10,12-1)-1)
        // }
        // const name = generateToken()

        const filePath = path.join(
          __dirname,
          `../../public/pdf/INV00${orderDetails.invoice_no}.pdf`
        );
        //const url = `${process.env.API_URL}/pdf/INV00${orderDetails.invoice_no}.pdf`;
        const url = `${process.env.API_URL}/pdf/invoice/104.pdf`;
        var options = {
          format: "A3",
          orientation: "portrait",
          border: "10mm",
        };
        var document = {
          html: html,
          data: {
            orderDetail: orderDetails,
            item: orderDetails.items,
            date: moment(orderDetails.delivery_date).format("MMM DD, YYYY"),
            time: `(${moment(orderDetails.delivery_date).format(
              "hh:mm:ss A"
            )} - ${moment(orderDetails.delivery_time).format("hh:mm:ss A")})`,
            address: orderDetails.address.full_address,
          },
          path: filePath,
          type: "",
        };
        const attachment = [
          {
            filename: "Invoice_bill.pdf",
            path: `./public/pdf/INV00${orderDetails.invoice_no}.pdf`,
            contentType: "application/pdf",
          },
        ];
        await pdfGenerate(
          document,
          options,
          orderDetails.user_id.email,
          "Zoom Delivery App",
          `Your Invoice is generated.`,
          attachment,
          mail
        );
        return res.json(responseData("PDF_GENERATED", url, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", {}, req, false));
      }
    } catch (error) {
      console.log("error", error);
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  },
  transactionList: async (req, res) => {
    try {
      let { page, limit, status, sort_by, keyword, sort_type } = req.query;
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
      const { _id } = req.user;
      match.user_id = Types.ObjectId(_id);
      match.delivery_status = { $in: [4] };
      if (status) {
        if (status == 1) {
          match.status = true;
        } else if (status == 0) {
          match.status = false;
        }
      }

      const query = Order.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
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
            as: "store",
          },
        },
        {
          $unwind: "$store",
        },
        {
          $match: match,
        },
        {
          $project: {
            _id: 1,
            order_id: 1,
            transaction_id: 1,
            type: "Debit",
            subtotal: 1,
            payment_status: 1,
            payment_mode: 1,
            delivery_status: 1,
            total: 1,
            delivery_type: 1,
            delivery_date: 1,
            delivery_time: 1,
            __v: 1,
          },
        },
        {
          $sort: sortOptions,
        },
      ]).collation({ locale: "en", strength: 1 });
      var finaldata = await Order.aggregatePaginate(query, options);
      finaldata.docs.map((item, key) => {
        item["delivery_date"] = moment
          .unix(item["delivery_date"])
          .format("YYYY-MM-DD");
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
};
