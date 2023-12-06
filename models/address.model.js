const mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const AddressSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    full_address: {
      type: String,
      default: "",
    },
    latitude: {
      type: Number,
      default: "",
    },
    longitude: {
      type: Number,
      default: "",
    },
    zip_code: {
      type: String,
      default: "",
    },
    delivery_country_code: {
      type: Number,
      default: "",
    },
    receiver_name: {
      type: String,
      default: "",
    },
    delivery_contact: {
      type: String,
      default: "",
    },
    delivery_landmark: {
      type: String,
      default: "",
    },
    // 1 = apartment , 2 = house , 3 = office
    delivery_address_type: { type: Number, default: "" },
    street: {
      type: String,
      default: "",
    },
    building: {
      type: String,
      default: "",
    },
    office_no: {
      type: String,
      default: "",
    },
    apartment_no: {
      type: String,
      default: "",
    },
    house_no: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },

    // city_id: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   required: false,
    //   ref: "City",
    // },
    country_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "Country",
    },
    is_default: {
      type: Number,
      default: 0,
    },

    status: {
      type: Boolean,
      default: true,
    },
    old_id: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

AddressSchema.plugin(aggregatePaginate);
const Address = mongoose.model("Address", AddressSchema);

module.exports = Address;
