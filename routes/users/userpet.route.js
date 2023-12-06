const express = require("express");
const router = express.Router();

const validationRule = require("../../validations/admins/auth");
const { verifyTokenFront } = require("../../middlewares/verifyToken");
const { user_profile } = require("../../middlewares/multerUpload");

const {
    add_user_pet,
    edit_user_pet,
    list_user_pet,
    delete_user_pet
} = require("../../controllers/users/userpet.controller");

router.post("/", [verifyTokenFront], user_profile.single('pet_img'), add_user_pet)
router.put("/", [verifyTokenFront], user_profile.single('pet_img'), edit_user_pet);
router.get("/", [verifyTokenFront], list_user_pet);
router.delete('/',[verifyTokenFront],delete_user_pet);


module.exports = router;