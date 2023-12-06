const { body } = require("express-validator");
const { validatorMiddlewareFront } = require("../../helpers/helper");

module.exports.validate = (method) => {
  switch (method) {
    case "driver-login": {
      return [
        body("email")
          .notEmpty()
          .withMessage("EMAIL_EMPTY")
          .isEmail()
          .withMessage("EMAIL_VALID"),
        body("password").notEmpty().withMessage("PASSWORD_EMPTY"),
        validatorMiddlewareFront,
      ];
    }
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
    case "reset-password": {
      return [
        body("password").notEmpty().withMessage("PASSWORD_EMPTY"),
        validatorMiddlewareFront,
      ];
    }
    case "change-password": {
      return [
        body("oldPassword").notEmpty().withMessage("OLDPASSWORD_EMPTY"),
        body("newPassword").notEmpty().withMessage("NEWPASSWORD_EMPTY"),
        validatorMiddlewareFront,
      ];
    }
    case "update-profile": {
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
        body("country_code").notEmpty().withMessage("COUNTRY_CODE_EMPTY"),
        body("vehicle_number")
          .notEmpty()
          .withMessage("VEHICLE_NUMBER_IS_EMPTY"),
        validatorMiddlewareFront,
      ];
    }
    case "update-notification": {
      return [
        body("status").notEmpty().withMessage("STATUS_IS_REQUIRED"),
        validatorMiddlewareFront,
      ];
    }
    case "change-order-status": {
      return [
        body("status").notEmpty().withMessage("STATUS_IS_REQUIRED"),
        validatorMiddlewareFront,
      ];
    }
  }
};
