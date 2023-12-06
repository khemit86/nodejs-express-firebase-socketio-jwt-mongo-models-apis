const { responseData } = require("../../helpers/responseData");
const brand_service = require('../../services/users/brand.services')
module.exports = {
    
    list_brand: async (req, res) => {
        try {
            await brand_service.list_brand(req, res);
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    
}