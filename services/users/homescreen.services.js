const HomeScreen = require("../../models/homescreen.model")
const Country = require("../../models/countries.model")
var { isEmpty } = require('lodash')
const { responseData } = require('../../helpers/responseData')
const { addLog } = require('../../helpers/helper')
const _ = require('lodash');
const { Types } = require('mongoose')
const Promise = require("bluebird");
const {
  HOME_FOLDER,
  HOME_THUMB_HEIGHT,
  HOME_THUMB_WIDTH,
} = require('../../helpers/config');
const { saveFile, saveThumbFile } = require('../../helpers/helper')

module.exports = {
  list_home_image: async (req, res) => {
    try {
      let { sort_type,sort_by,type,status,country_name } =
        req.query;
      const sortOptions = {
        [sort_by || "created_at"]: sort_type === "asc" ? 1 : -1,
      };
      
      const findData = await Country.findOne({
        name: country_name
      });

      if(!findData){
        return res.json(responseData("NOT_FOUND",[], req, false));
      }

      var match = {};
      if (status) {
        if (status == 1) {
          match.status = true;
        } else if (status == 0) {
          match.status = false;
        }
      }

      if (findData) {
        match.country_id = findData._id;
      }
      
      if (type==1) {
        match.type = 1;
      }else{
        match.type = 2;
      }

      const finaldata = await HomeScreen.aggregate([
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
            description: 1,
            type: 1,
            image: {
              $cond: {
                if: { $ne: ['$image', null] },
                then: { $concat: [`${process.env.IMAGE_LOCAL_PATH}home/`, '$image'] },
                else: { $concat: [`${process.env.IMAGE_LOCAL_PATH}home/`, 'no_image.png'] }
              }
            },
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
      
      // await Promise.map(finaldata, async (el, index) => {
      //   el.image =`${el.image}`;
      // });

      if (!isEmpty(finaldata)) {
        return res.json(responseData("GET_LIST", finaldata, req, true));
      } else {
        return res.json(responseData("NOT_FOUND", [], req, false));
      }
    } catch (error) {
      return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    }
  }
};
