const { body } = require("express-validator");
const {
  validatorMiddleware,
  validatorMiddlewareFront,
} = require("../../helpers/helper");

module.exports.validate = (method) => {
  switch (method) {
    case "import-products": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_ID_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
  }
};
