const express = require("express");
const router = express.Router();
const wholesale_user_category = require("../../controllers/admins/wholesale_user_category.controller");
const validationRule = require("../../validations/admins/admin");
const { verifyToken } = require("../../middlewares/verifyToken");

//get admin wholesale_user_category list
router.get(
  "/",
  [verifyToken],
  wholesale_user_category.list_wholesale_user_category
);
//add admin wholesale_user_category
router.post(
  "/",
  [verifyToken],
  validationRule.validate("addWCat"),
  wholesale_user_category.add_wholesale_user_category
);
//edit admin wholesale_user_category
router.put(
  "/edit-wholesale-user-category",
  [verifyToken],
  validationRule.validate("editWCat"),
  wholesale_user_category.edit_wholesale_user_category
);
//delete admin wholesale_user_category
router.delete(
  "/delete-wholesale-user-category/:id",
  [verifyToken],
  wholesale_user_category.delete_wholesale_user_category
);
//change admin wholesale_user_category status
router.put(
  "/change-status/:id",
  [verifyToken],
  wholesale_user_category.change_status_wholesale_user_category
);
router.put(
  "/change-default/:id",
  [verifyToken],
  wholesale_user_category.change_default_wholesale_user_category
);

module.exports = router;
