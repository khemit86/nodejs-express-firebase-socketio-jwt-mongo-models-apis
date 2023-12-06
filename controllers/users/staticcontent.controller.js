const { responseData } = require("../../helpers/responseData");
const staticcontent_service = require('../../services/users/staticcontent.services')


module.exports = {

    list_faq: async (req, res) => {
        try {
            await staticcontent_service.getFaqList(req,res)
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
    detail_slug: async (req, res) => {
        try {
            await staticcontent_service.getStaticContentDetail(req,res)
        } catch (err) {
            var msg = err.message || "SOMETHING_WENT_WRONG";
            return res.status(422).json(responseData(msg, {}, req));
        }
    },
}