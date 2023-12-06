const mongoose = require("mongoose")
var aggregatePaginate = require("mongoose-aggregate-paginate-v2")

const VATCodeSchema = new mongoose.Schema({
        name: {
            type: String,
            required: true,
        },
        percentage: {
            type: Number,
            required: true,
        },
        country_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Countries",
            required: true,
        },
        status: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

VATCodeSchema.plugin(aggregatePaginate)
const VATCode = mongoose.model("VATCode", VATCodeSchema);

module.exports = VATCode;