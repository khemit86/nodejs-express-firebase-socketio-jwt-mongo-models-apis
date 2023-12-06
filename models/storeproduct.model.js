const mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const StoreProductSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products",
      required: true,
    },
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stores",
      required: true,
    },
    city_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cities",
      required: true,
    },
    country_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Countries",
      required: true,
    },
    quantity_c: { type: Number, required: false, default: 0 },
    quantity_w: { type: Number, required: false, default: 0 },
    quantity_c_s: { type: Number, required: false, default: 0 },
    quantity_w_s: { type: Number, required: false, default: 0 },
    status: {
      type: Boolean,
      default: true,
    },
    old_sync: {
      // this field we use in assignInventory to check if during import inventory is added or not ?.
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

StoreProductSchema.plugin(aggregatePaginate);
const StoreProduct = mongoose.model("StoreProduct", StoreProductSchema);

module.exports = StoreProduct;
