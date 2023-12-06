const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2');

const StaticContentSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    slug: {
        type: String,
    },
    content: {
        type: String,
    },
    status: {
        type: String,
        required: true,
        default:'active'
    }
},
{ 
    timestamps: true,
    toObject : {getters: true,setters: true, virtuals: false},
    toJSON : {getters: true, setters: true, virtuals: false}
});
StaticContentSchema.plugin(mongoosePaginate);
const Staticcontent = mongoose.model("Staticcontent", StaticContentSchema);

module.exports = Staticcontent;