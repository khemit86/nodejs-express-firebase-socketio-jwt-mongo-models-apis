const mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const SizeCodeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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

SizeCodeSchema.plugin(aggregatePaginate);
const SizeCode = mongoose.model("SizeCode", SizeCodeSchema);

module.exports = SizeCode;
