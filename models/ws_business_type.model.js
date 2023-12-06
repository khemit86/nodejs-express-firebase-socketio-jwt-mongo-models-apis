const mongoose = require("mongoose")
var aggregatePaginate = require("mongoose-aggregate-paginate-v2")

const WSBusinessTypeSchema = new mongoose.Schema({
        name: {
            type: String,
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

WSBusinessTypeSchema.plugin(aggregatePaginate)
const WSBusinessType = mongoose.model("WSBusinessType", WSBusinessTypeSchema);

module.exports = WSBusinessType;