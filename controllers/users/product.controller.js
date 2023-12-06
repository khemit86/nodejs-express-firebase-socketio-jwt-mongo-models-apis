const { responseData } = require("../../helpers/responseData");
const product_service = require("../../services/users/product.services");
module.exports = {
  
  home_product_list: async (req, res) => {
    try {
      await product_service.home_product_list(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },

  categoryProductList: async (req, res) => {
    try {
      //console.log('categoryProductList');
      await product_service.categoryProductList(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  ProductDetails: async (req, res) => {
    try {
      await product_service.ProductDetails(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  relatedProductList: async (req, res) => {
    try {
      await product_service.relatedProductList(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  searchProduct: async (req, res) => {
    try {
      await product_service.searchProduct(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },
  home_category_list: async (req, res) => {
    try {
      await product_service.home_category_list(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },

  topSaleProductList: async (req, res) => {
    try {
      await product_service.topSaleProductList(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },

  productQuantity: async (req, res) => {
    try {
      await product_service.productQuantity(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  },

  topOfferProductList: async (req, res) => {
    try {
      await product_service.topOfferProductList(req, res);
    } catch (err) {
      var msg = err.message || "SOMETHING_WENT_WRONG";
      return res.status(422).json(responseData(msg, {}, req));
    }
  }
  

  
};
