const express = require("express");
const router = express.Router();
const rating = require("../../controllers/users/rating.controller");
const { verifyTokenFront } = require("../../middlewares/verifyToken");

//get admin brand list
router.get("/", [verifyTokenFront], rating.list_rating);
router.post("/", [verifyTokenFront], rating.add_rating);
router.delete("/:id", [verifyTokenFront], rating.delete_rating);
router.get("/productRatingListing",rating.productRating);
router.put("/editRating/",rating.editRating);
module.exports = router;
