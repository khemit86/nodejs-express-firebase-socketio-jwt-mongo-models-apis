const { body, check } = require("express-validator");
const { validatorMiddleware } = require("../../helpers/helper");

module.exports.validate = (method) => {
  switch (method) {
    case "addproduct": {
      return [
        body("name")
          .notEmpty()
          .withMessage("NAME_EMPTY")
          .isLength({ min: 2 })
          .withMessage("NAME_LENGTH_MIN")
          .isLength({ max: 255 })
          .withMessage("NAME_LENGTH_MAX"),
        body("description").notEmpty().withMessage("DESCRIPTION_IS_REQUIRED"),
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("brand_id").notEmpty().withMessage("BRAND_IS_REQUIRED"),
        body("supplier_id").notEmpty().withMessage("SUPPLIER_IS_REQUIRED"),
        body("vat_code_id").notEmpty().withMessage("VAT_CODE_IS_REQUIRED"),
        body("size_code_id").notEmpty().withMessage("SIZE_CODE_IS_REQUIRED"),
        body("size").notEmpty().withMessage("SIZE_IS_REQUIRED"),
        body("price").notEmpty().withMessage("PRICE_IS_REQUIRED"),
        body("buy_price").notEmpty().withMessage("BUY_PRICE_IS_REQUIRED"),
        body("sku").notEmpty().withMessage("SKU_IS_REQUIRED"),
        body("categories").notEmpty().withMessage("CATEGORIES_ARE_REQUIRED"),

        validatorMiddleware,
      ];
    }
    case "editproduct": {
      return [
        body("name")
          .notEmpty()
          .withMessage("NAME_EMPTY")
          .isLength({ min: 2 })
          .withMessage("NAME_LENGTH_MIN")
          .isLength({ max: 255 })
          .withMessage("NAME_LENGTH_MAX"),
        body("_id").notEmpty().withMessage("ID_IS_REQUIRED"),
        body("description").notEmpty().withMessage("DESCRIPTION_IS_REQUIRED"),
        body("country_id").notEmpty().withMessage("COUNTRY_IS_REQUIRED"),
        body("brand_id").notEmpty().withMessage("BRAND_IS_REQUIRED"),
        body("supplier_id").notEmpty().withMessage("SUPPLIER_IS_REQUIRED"),
        body("vat_code_id").notEmpty().withMessage("VAT_CODE_IS_REQUIRED"),
        body("size_code_id").notEmpty().withMessage("SIZE_CODE_IS_REQUIRED"),
        body("size").notEmpty().withMessage("SIZE_IS_REQUIRED"),
        body("price").notEmpty().withMessage("PRICE_IS_REQUIRED"),
        body("buy_price").notEmpty().withMessage("BUY_PRICE_IS_REQUIRED"),
        body("sku").notEmpty().withMessage("SKU_IS_REQUIRED"),
        body("categories").notEmpty().withMessage("CATEGORIES_ARE_REQUIRED"),

        validatorMiddleware,
      ];
    }
    case "assignProduct": {
      return [
        body("store_id").notEmpty().withMessage("STORE_ID_IS_REQUIRED"),
        body("product_id").notEmpty().withMessage("PRODUCT_ID_IS_REQUIRED"),
        validatorMiddleware,
      ];
    }
    case "addInventory": {
      return [
        body("country_id").notEmpty().withMessage("COUNTRY_ID_IS_REQUIRED"),
        body("city_id").notEmpty().withMessage("CITY_ID_IS_REQUIRED"),
        body("store_id").notEmpty().withMessage("STORE_ID_IS_REQUIRED"),
        body("product_id").notEmpty().withMessage("PRODUCT_ID_IS_REQUIRED"),
        body("quantity_c")
          .notEmpty()
          .withMessage("QUANTITY_CUSTOMER_IS_REQUIRED"),
        body("quantity_w")
          .notEmpty()
          .withMessage("QUANTITY_WHOLESALE_IS_REQUIRED"),
        body("stolen_product_quantity")
          .notEmpty()
          .withMessage("STOLEN_PRODUCT_QUANTITY_IS_REQUIRED"),
        body("damaged_product_quantity")
          .notEmpty()
          .withMessage("DAMAGED_PRODUCT_QUANTITY_IS_REQUIRED"),

        validatorMiddleware,
      ];
    }
    case "editInventory": {
      return [
        body("quantity_c")
          .notEmpty()
          .withMessage("QUANTITY_CUSTOMER_IS_REQUIRED"),
        body("quantity_w")
          .notEmpty()
          .withMessage("QUANTITY_WHOLESALE_IS_REQUIRED"),
        body("stolen_product_quantity")
          .notEmpty()
          .withMessage("STOLEN_PRODUCT_QUANTITY_IS_REQUIRED"),
        body("damaged_product_quantity")
          .notEmpty()
          .withMessage("DAMAGED_PRODUCT_QUANTITY_IS_REQUIRED"),

        validatorMiddleware,
      ];
    }
  }
};
