const express = require('express');
const router = express.Router();

const validationRule = require('../../validations/users/auth');
const { verifyToken } = require('../../middlewares/verifyToken');
// const { user_profile } = require('../../middlewares/multerUpload');

const {
    notification_list,
    notification_create,
    notification_delete,
    notification_status
} = require('../../controllers/service_provider/notification.controller');

router.get('/',[verifyToken], notification_list);
router.post('/',[verifyToken], notification_create);
router.delete('/',[verifyToken], notification_delete);
router.put('/',[verifyToken], notification_status);

module.exports = router;