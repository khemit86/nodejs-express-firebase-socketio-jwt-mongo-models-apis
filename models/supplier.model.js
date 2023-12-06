const mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const SupplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: false,
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

SupplierSchema.plugin(aggregatePaginate);
const Supplier = mongoose.model("Supplier", SupplierSchema);

module.exports = Supplier;
