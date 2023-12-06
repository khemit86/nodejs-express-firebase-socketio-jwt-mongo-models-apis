const { body } = require("express-validator");
const { validatorMiddlewareFront } = require("../../helpers/helper");

module.exports.validate = (method) => {
  switch (method) {
    case "forgot-password": {
      return [
        body("email")
          .notEmpty()
          .withMessage("EMAIL_EMPTY")
          .isEmail()
          .withMessage("EMAIL_VALID"),
        validatorMiddlewareFront,
      ];
    }
    case "home_image": {
      return [
        body("country_name").notEmpty().withMessage("COUNTRY_NAME_IS_REQUIRED"),
        validatorMiddlewareFront,
      ];
    }
    case "addFeedback": {
      return [
        body("feedback").notEmpty().withMessage("FEEDBACK_IS_REQUIRED"),
        validatorMiddlewareFront,
      ];
    }
    case "addwuser": {
      return [
        body("first_name")
          .notEmpty()
          .withMessage("FIRST_NAME_EMPTY")
          .isLength({ min: 2 })
          .withMessage("FIRST_NAME_LENGTH_MIN")
          .isLength({ max: 30 })
          .withMessage("FIRST_NAME_LENGTH_MAX"),
        body("last_name")
          .notEmpty()
          .withMessage("FIRST_NAME_EMPTY")
          .isLength({ min: 2 })
          .withMessage("LAST_NAME_LENGTH_MIN")
          .isLength({ max: 30 })
          .withMessage("LAST_NAME_LENGTH_MAX"),
        body("email")
          .notEmpty()
          .withMessage("EMAIL_EMPTY")
          .isEmail()
          .withMessage("EMAIL_VALID"),
        body("mobile")
          .notEmpty()
          .withMessage("MOBILE_EMPTY")
          .isNumeric()
          .withMessage("INVALID_MOBILE"),
        body("password").notEmpty().withMessage("PASSWORD_EMPTY"),
        body("country_code").notEmpty().withMessage("COUNTRYCODE_EMPTY"),
        body("company_name").notEmpty().withMessage("COMPANY_NAME_IS_REQUIRED"),
        body("company_phone")
          .notEmpty()
          .withMessage("COMPANY_PHONE_IS_REQUIRED"),
        body("company_reg_no")
          .notEmpty()
          .withMessage("COMPANY_REGISTRATION_NUMBER_IS_REQUIRED"),
        body("company_vat_no")
          .notEmpty()
          .withMessage("COMPANY_VAT_NUMBER_IS_REQUIRED"),
        body("company_reg_date")
          .notEmpty()
          .withMessage("COMPANY_REGISTRATION_DATE_IS_REQUIRED"),
        body("company_type_id")
          .notEmpty()
          .withMessage("COMPANY_BUSINESS_TYPE_IS_REQUIRED"),
        validatorMiddlewareFront,
      ];
    }
    case "editProfileUser": {
      return [
        body("first_name")
          .notEmpty()
          .withMessage("FIRST_NAME_EMPTY")
          .isLength({ min: 2 })
          .withMessage("FIRST_NAME_LENGTH_MIN")
          .isLength({ max: 30 })
          .withMessage("FIRST_NAME_LENGTH_MAX"),
        body("last_name")
          .notEmpty()
          .withMessage("LAST_NAME_EMPTY")
          .isLength({ min: 2 })
          .withMessage("LAST_NAME_LENGTH_MIN")
          .isLength({ max: 30 })
          .withMessage("LAST_NAME_LENGTH_MAX"),
        body("email")
          .notEmpty()
          .withMessage("EMAIL_EMPTY")
          .isEmail()
          .withMessage("EMAIL_VALID"),
        body("mobile")
          .notEmpty()
          .withMessage("MOBILE_EMPTY")
          .isNumeric()
          .withMessage("INVALID_MOBILE"),
        body("country_code").notEmpty().withMessage("COUNTRYCODE_EMPTY"),
        validatorMiddlewareFront,
      ];
    }
    case "editProfileWholesale": {
      return [
        body("first_name")
          .notEmpty()
          .withMessage("FIRST_NAME_EMPTY")
          .isLength({ min: 2 })
          .withMessage("FIRST_NAME_LENGTH_MIN")
          .isLength({ max: 30 })
          .withMessage("FIRST_NAME_LENGTH_MAX"),
        body("last_name")
          .notEmpty()
          .withMessage("FIRST_NAME_EMPTY")
          .isLength({ min: 2 })
          .withMessage("LAST_NAME_LENGTH_MIN")
          .isLength({ max: 30 })
          .withMessage("LAST_NAME_LENGTH_MAX"),
        // body("email")
        //   .notEmpty()
        //   .withMessage("EMAIL_EMPTY")
        //   .isEmail()
        //   .withMessage("EMAIL_VALID"),
        body("mobile")
          .notEmpty()
          .withMessage("MOBILE_EMPTY")
          .isNumeric()
          .withMessage("INVALID_MOBILE"),
        body("country_code").notEmpty().withMessage("COUNTRYCODE_EMPTY"),
        validatorMiddlewareFront,
      ];
    }
    case "loginw": {
      return [
        body("email")
          .notEmpty()
          .withMessage("EMAIL_EMPTY")
          .isEmail()
          .withMessage("EMAIL_VALID"),
        body("password").notEmpty().withMessage("PASSWORD_IS_REQUIRED"),
        validatorMiddlewareFront,
      ];
    }
    case "add-to-cart": {
      return [
        body("quantity").notEmpty().withMessage("QUANTITY_IS_REQUIRED"),
        body("item_id").notEmpty().withMessage("ITEM_ID_IS_REQUIRED"),
        validatorMiddlewareFront,
      ];
    }
    case "addAddress": {
      return [
        body("name").notEmpty().withMessage("ADDRESS_NAME_IS_REQUIRED"),
        body("delivery_contact")
          .notEmpty()
          .withMessage("PHONE_NUMBER_IS_REQUIRED"),
        body("delivery_address_type")
          .notEmpty()
          .withMessage("ADDRESS_TYPE_IS_REQUIRED"),
        body("zip_code").notEmpty().withMessage("ZIP_CODE_IS_REQUIRED"),
        body("street").notEmpty().withMessage("STREET_IS_REQUIRED"),
        body("latitude").notEmpty().withMessage("LATITUDE_IS_REQUIRED"),
        body("longitude").notEmpty().withMessage("LONGITUDE_IS_REQUIRED"),
        body("city").notEmpty().withMessage("CITY_IS_REQUIRED"),
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),

        validatorMiddlewareFront,
      ];
    }
  }
};
