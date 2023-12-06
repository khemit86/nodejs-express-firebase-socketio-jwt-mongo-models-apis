const Serviceprovider = require("../../models/serviceprovider.model");
const Notification = require("../../models/notification.model");
const { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
const {ObjectId} = require('mongodb');

module.exports = {
  notification_list: async (req, res) => {
    try {
      const service_provider_id = req.user._id;
      const list = await Notification.find({ service_provider_id,is_admin:false });
      if (!isEmpty(list)) {
        return res.json(responseData("GET_LIST", list, req, true));
      } else {
        return res.json(responseData("NOTIFICATION_NOT_FOUND", {}, req, true));
      }
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
  notification_create: async (req, res) => {
    try {
      const service_provider_id = req.user._id;
      const { type, message,item_id,item_type } = req.body;
      const data = {
        service_provider_id,
        user_flag: false,
        type,
        message,
        item_id,
        item_type
      };
      const notification = await Notification.create(data);
      return res.json(
        responseData("NOTIFICATION_CREATED", notification, req, true)
      );
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
  // notification_delete: async (req, res) => {
  //   try {
  //     const service_provider_id = req.user._id;
  //     const {notification_id} = req.params
  //     await Notification.findOneAndRemove({ service_provider_id,notification_id });
  //     return res.json(responseData("NOTIFICATION_DELETED", {}, req, true));
  //   } catch (err) {
  //     return res.status(422).json(responseData(err, {}, req, false));
  //   }
  // },
  notification_delete: async (req,res) => {
    try {

          const service_provider_id = req.user._id;
          const {notification_id} = req.query
          let {is_all} = req.query

          if(parseInt(is_all)){
            is_all = parseInt(is_all)?true:false
          }else{
            is_all = false
          }

          if(is_all){
            console.log('object1');
              await Notification.deleteMany({
                  service_provider_id:ObjectId(service_provider_id),
                  user_flag:false,
              })
          }else{
            console.log('object2');
              let NotificationData= await Notification.findOne({
                _id:ObjectId(notification_id),
                service_provider_id:ObjectId(service_provider_id)
              })

              if(!NotificationData){
                  return res.json(responseData("NOTIFICATION_NOT_FOUND", {}, req, true));
              }

              await Notification.deleteOne({
                  _id:ObjectId(notification_id),
                  service_provider_id:ObjectId(service_provider_id),
                  user_flag:false,
              })
          }

          return res.json(responseData("NOTIFICATION_DELETED", {}, req, true));
          
      } catch (error) {
          return res.json(responseData("ERROR_OCCUR", error.message, req, false));
      }
  },
  notification_status: async (req, res) => {
    try {
      const service_provider_id = req.user._id;
      const sp = await Serviceprovider.findOne({service_provider_id})
      const status = sp.notification_flag == true ? false : true
      await Serviceprovider.findOneAndUpdate({ service_provider_id },{notification_flag:status});
      return res.json(responseData("SP_NOTIFICATION_FLAG_UPDATED", {}, req, true));
    } catch (err) {
      return res.status(422).json(responseData(err, {}, req, false));
    }
  },
};
