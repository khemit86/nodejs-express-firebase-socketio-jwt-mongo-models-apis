const express = require("express");
const router = express.Router();

const validationRule = require("../../validations/admins/auth");
const { verifyTokenFront } = require("../../middlewares/verifyToken");

const {
    getOne_timeslot,
    getList_timeslot
} = require("../../controllers/users/timeslot.controller");

router.get("/getOne/:id",[verifyTokenFront], getOne_timeslot)
router.get("/list",[verifyTokenFront], getList_timeslot)

module.exports = router;