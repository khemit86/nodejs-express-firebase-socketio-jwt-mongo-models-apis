const express = require("express");
const router = express.Router();
const staticcontent = require("../../controllers/admins/staticcontent.controller");
const validationRule = require("../../validations/admins/auth");
const { verifyToken } = require('../../middlewares/verifyToken')

//get admin users list
router.get("/", staticcontent.staticcontent_list);
router.post("/edit-static-content", [verifyToken], staticcontent.static_content_edit);

module.exports = router;