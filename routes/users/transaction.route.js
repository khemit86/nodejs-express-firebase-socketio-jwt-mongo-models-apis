const express = require("express");
const router = express.Router();

const validationRule = require("../../validations/users/auth");
const { verifyTokenFront } = require("../../middlewares/verifyToken");
const { user_profile } = require("../../middlewares/multerUpload");

const {
    create_transaction,
    list_transaction,
    success_status,
    failed_status,
    refund_status
} = require("../../controllers/users/transaction.controller");

router.post("/create", [verifyTokenFront],validationRule.validate("transaction-create-validator"), create_transaction);
router.get("/list",[verifyTokenFront], list_transaction);
router.put("/success",[verifyTokenFront],success_status);
router.put("/failed",[verifyTokenFront],failed_status);
router.put("/refund_me",[verifyTokenFront],refund_status);

module.exports = router;