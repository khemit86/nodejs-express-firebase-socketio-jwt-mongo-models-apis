const mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const StoreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    store_radius: { 
        type: Number, 
        required: false, 
        default: 0 
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
    city_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },
    country_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Countries",
      required: true,
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

StoreSchema.plugin(aggregatePaginate);
const Store = mongoose.model("Store", StoreSchema);

module.exports = Store;
