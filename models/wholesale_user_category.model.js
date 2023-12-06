const mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const WholesaleUserCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    country_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Countries",
      required: true,
    },
    default: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

WholesaleUserCategorySchema.plugin(aggregatePaginate);
const WholesaleUserCategory = mongoose.model(
  "WholesaleUserCategory",
  WholesaleUserCategorySchema
);

module.exports = WholesaleUserCategory;
