const User = require("../../models/user.model");
const Notification = require("../../models/notification.model");
var { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
const { addLog } = require("../../helpers/helper");
const _ = require("lodash");
const { Types } = require("mongoose");
const { Store } = require("express-session");
var moment = require("moment");
var momentTz = require("moment-timezone");
const { base64Encode, base64Decode } = require("../../helpers/helper");

module.exports = {
   
    list_notification: async (req,res) => {
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
              //match.user_id = Types.ObjectId(_id);
              match.user_id = Types.ObjectId(_id);
              
             
              const finaldata = await Notification.aggregate([
                {
                  $match: match,
                },
                {
                  $project: {
                    user_id:1,
                    type:1,
                    title:1,
                    body:1,
                    seen:1,
                    createdAt: 1,
                    updatedAt: 1,
                    __v: 1,
                  },
                },
                {
                  $sort: sortOptions,
                },
              ]).collation({ locale: "en", strength: 1 });
              //var finaldata = await Notification.aggregatePaginate(query, options);
              let new_arr = [];

              var count_val={};
              finaldata.forEach(function(item){
                count_val[item.seen] ? count_val[item.seen]++ :  count_val[item.seen] = 1;
              });

              new_arr= {"unseen_count":count_val.false,"notification":finaldata}
              if (!isEmpty(new_arr)) {
                return res.json(responseData("GET_LIST", new_arr, req, true));
              } else {
                return res.json(responseData("NOT_FOUND", {}, req, false));
              }
            
            
            
        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
    notificationRead: async (req,res) => {
      try {

        let {
          notification_id,
          type,
        } = req.query;

        if(type==1){
          if (isEmpty(notification_id)) {
            return res.json(
              responseData("ID_REQUIRED", {}, req, false)
            );
          }
          const seen_notification = await Notification.updateOne({ _id: notification_id }, { $set: {seen:true} });
          if (seen_notification.modifiedCount) {
            return res.json(responseData("NOTIFICATION_READ", {}, req, true));
          } else {
            return res.json(responseData("NOTIFICATION_NOT_READ", {}, req, false));
          }
        }else if(type==2){
          const { _id } = req.user;
          const seen_all_notification = await Notification.updateMany({ user_id: _id }, { $set: {seen:true} });
          if (seen_all_notification.modifiedCount) {
            return res.json(responseData("ALL_NOTIFICATION_READ", {}, req, true));
          } else {
            return res.json(responseData("NOTIFICATION_NOT_READ", {}, req, false));
          }
        }
        
          
      } catch (error) {
          return res.json(responseData("ERROR_OCCUR", error.message, req, false));
      }
    },
    notificationDelete: async (req,res) => {
      try {

        let {
          notification_id,
          type,
        } = req.query;

        if(type==1){
          if (isEmpty(notification_id)) {
            return res.json(
              responseData("ID_REQUIRED", {}, req, false)
            );
          }
          const resp = await Notification.deleteOne({ _id: notification_id });
          if (resp.deletedCount) {
            return res.json(responseData("NOTIFICATION_DELETED", {}, req, true));
          } else {
            return res.json(responseData("ERROR_OCCUR", {}, req, false));
          }
        }else if(type==2){
          const { _id } = req.user;
          const delete_all_notification = await Notification.deleteMany({ user_id: _id });

          console.log('...........delete_all_notification',delete_all_notification);

          if (delete_all_notification.deletedCount>0) {
            return res.json(responseData("NOTIFICATION_DELETED", {}, req, true));
          } else {
            return res.json(responseData("Notification not found", {}, req, false));
          }
        }
        
          
      } catch (error) {
          return res.json(responseData("ERROR_OCCUR", error.message, req, false));
      }
    },


   
}