const mongoose = require("mongoose");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

function imageURL(image) {
  // const path = config.USER + '/' + image;
  if (image) {
    return process.env.IMAGE_LOCAL_PATH + "user/" + image;
  } else {
    return "";
    //   return null;
  }
}

function companyImageURL(company_image) {
  // const path = config.USER + '/' + image;
  if (company_image) {
    return process.env.IMAGE_LOCAL_PATH + "company/" + company_image;
  } else {
    return "";
    //   return null;
  }
}

function certificateImageURL(certificateImageURL) {
  // const path = config.USER + '/' + image;
  if (certificateImageURL) {
    return process.env.IMAGE_LOCAL_PATH + "company/" + certificateImageURL;
  } else {
    return "";
    //   return null;
  }
}

const UserSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    last_name: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: false,
      trim: true,
    },
    org_password: {
      type: String,
      required: false,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      required: false,
      trim: true,
    },
    country_code: {
      type: String,
      max: 10,
      default: 91,
    },
    mobile: {
      type: String,
      required: false,
    },
    store_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "Store",
    },
    wholesaleusercategory_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "wholesaleusercategories",
    },
    city_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "City",
    },
    country_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "Country",
    },
    status: {
      type: Boolean,
      required: true,
      default: false,
    },
    token: {
      type: String,
      default: "",
    },
    employee_code: {
      type: String,
      default: "",
    },
    vehicle_number: {
      type: String,
      default: "",
    },
    is_deleted: {
      type: Number,
      default: 0,
    },
    notification_flag: {
      type: Boolean,
      default: true,
    },
    d_availability_flag: {
      type: Boolean,
      default: true,
    },
    zoom_updates: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: 0,
    },
    otp_expiry: {
      type: String,
      default: 0,
    },
    is_mobile_verified: {
      type: Number,
      default: 0,
    },
    profile_updated: {
      type: Number,
      default: 0,
    },
    role_id: {
      // 1 = regular customer, 2= wholesale customer , 3 = delivery boy
      type: Number,
      default: 1,
    },
    user_type: {
      // 1 = web, 2= ios , 3 = android
      type: Number,
      default: 1,
    },
    device_type: {
      // 1 = web, 2= ios , 3 = android
      type: String,
      default: "",
    },
    vehicle_number: {
      type: String,
      default: "",
    },
    marketing_offers: {
      // 1 = Yes, 2= No
      type: Number,
      default: 1,
    },
    minimum_order_amount: {
      type: Number,
      default: 0,
      required: false,
    },
    image: {
      type: String,
      default: "",
      required: false,
      get: imageURL,
    },
    device_token: {
      type: String,
      default: "",
      required: false,
    },
    company_name: {
      type: String,
      default: "",
      required: false,
    },
    company_phone: {
      type: String,
      default: "",
      required: false,
    },
    company_reg_no: {
      type: String,
      default: "",
      required: false,
    },
    company_vat_no: {
      type: String,
      default: "",
      required: false,
    },
    company_reg_date: {
      type: String,
      default: "",
      required: false,
    },
    company_postal_code: {
      type: String,
      default: "",
      required: false,
    },
    company_address1: {
      type: String,
      default: "",
      required: false,
    },
    company_address2: {
      type: String,
      default: "",
      required: false,
    },
    company_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "wsbusinesstypes",
      required: false,
    },
    company_w_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WholesaleUserCategory",
      required: false,
    },
    company_street: {
      type: String,
      default: "",
      required: false,
    },
    company_image: {
      type: String,
      default: "",
      required: false,
      get: companyImageURL,
    },
    reg_certificate: {
      type: String,
      default: "",
      required: false,
      get: certificateImageURL,
    },
    referral_code: {
      type: String,
      default: "",
    },
    refer_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: "Users",
    },
    referral_status: {
      type: Number,
      default: 0,
    },
    approval: {
      // 0 = new 1 = approved 2 = rejected
      type: Number,
      default: 0,
    },
    is_credit_user: {
      // 0 = false 1 = true
      type: Number,
      default: 0,
    },
    stripe_customer_id: {
      type: String,
      default: "",
    },
    old_id: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
    toObject: { getters: true, setters: true, virtuals: false },
    toJSON: { getters: true, setters: true, virtuals: false },
  }
);

UserSchema.plugin(aggregatePaginate);
const User = mongoose.model("User", UserSchema);

module.exports = User;
