const { body, check } = require("express-validator");
const { validatorMiddleware } = require("../../helpers/helper");

module.exports.validate = (method) => {
  switch (method) {
    case "addEmailTemplate": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("title").notEmpty().withMessage("TITLE_IS_REQUIRED"),
        body("subject").notEmpty().withMessage("SUBJECT_IS_REQUIRED"),
        body("description").notEmpty().withMessage("DESCRIPTION_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "editEmailTemplate": {
      return [
        body("title").notEmpty().withMessage("TITLE_IS_REQUIRED"),
        body("subject").notEmpty().withMessage("SUBJECT_IS_REQUIRED"),
        body("description").notEmpty().withMessage("DESCRIPTION_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "addBrand": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "editBrand": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "addCategory": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "editCategory": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "addCity": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "editCity": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "addCMS": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("title").notEmpty().withMessage("TITLE_IS_REQUIRED"),
        body("description").notEmpty().withMessage("DESCRIPTION_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "editCMS": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("title").notEmpty().withMessage("TITLE_IS_REQUIRED"),
        body("description").notEmpty().withMessage("DESCRIPTION_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "addCountry": {
      return [
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "editCountry": {
      return [
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "addFAQ": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("question").notEmpty().withMessage("QUESTION_IS_REQUIRED"),
        body("answer").notEmpty().withMessage("ANSWER_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "editFAQ": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("question").notEmpty().withMessage("QUESTION_IS_REQUIRED"),
        body("answer").notEmpty().withMessage("ANSWER_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "addStore": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("city_id").notEmpty().withMessage("CITY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "editStore": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("city_id").notEmpty().withMessage("CITY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "addSupplier": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "editSupplier": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "addVAT": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        body("percentage").notEmpty().withMessage("PERCENTAGE_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "editVAT": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        body("percentage").notEmpty().withMessage("PERCENTAGE_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "addWCat": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "editWCat": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "addBS": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "editBS": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "addOffer": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        body("discount").notEmpty().withMessage("DISCOUNT_IS_REQUIRED"),
        body("code").notEmpty().withMessage("CODE_IS_REQUIRED"),
        body("expiry_date").notEmpty().withMessage("EXPIRY_DATE_IS_REQUIRED"),
        body("description").notEmpty().withMessage("DESCRIPTION_IS_REQUIRED"),
        body("offer_type").notEmpty().withMessage("OFFER_TYPE_IS_REQUIRED"),
        body("max_use").notEmpty().withMessage("MAX_USES_ARE_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "editOffer": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("name").notEmpty().withMessage("NAME_IS_REQUIRED"),
        body("discount").notEmpty().withMessage("DISCOUNT_IS_REQUIRED"),
        body("code").notEmpty().withMessage("CODE_IS_REQUIRED"),
        body("expiry_date").notEmpty().withMessage("EXPIRY_DATE_IS_REQUIRED"),
        body("description").notEmpty().withMessage("DESCRIPTION_IS_REQUIRED"),
        body("offer_type").notEmpty().withMessage("OFFER_TYPE_IS_REQUIRED"),
        body("max_use").notEmpty().withMessage("MAX_USES_ARE_REQUIRED"),
        validatorMiddleware,
      ];
    }
  }
};
