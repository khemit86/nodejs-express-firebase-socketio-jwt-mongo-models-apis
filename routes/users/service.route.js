const express = require("express");
const router = express.Router();

const validationRule = require("../../validations/users/auth");
const { verifyTokenFront } = require("../../middlewares/verifyToken");
const { user_profile } = require("../../middlewares/multerUpload");

const {
    list,
    list_sub
} = require("../../controllers/users/service.controller");

router.get("/", list);
router.get("/list_sub", list_sub);

module.exports = router;