const express = require("express");
const router = express.Router();
const store = require("../../controllers/admins/store.controller");
const validationRule = require("../../validations/admins/admin");
const { verifyToken } = require("../../middlewares/verifyToken");

//get admin store list
router.get("/", [verifyToken], store.list_store);
router.get("/get_stores", [verifyToken], store.get_stores);
//add admin store
router.post(
  "/",
  [verifyToken],
  validationRule.validate("addStore"),
  store.add_store
);
//edit admin store
router.put(
  "/edit-store",
  [verifyToken],
  validationRule.validate("editStore"),
  store.edit_store
);
//delete admin store
router.delete("/delete-store/:id", [verifyToken], store.delete_store);
//change admin store status
router.put("/change-status/:id", [verifyToken], store.change_status_store);

module.exports = router;
