const express = require('express');
const router = express.Router();

const validationRule = require('../../validations/users/auth');
const { verifyToken } = require('../../middlewares/verifyToken');
const { user_profile } = require('../../middlewares/multerUpload');

const {
    update_booking_status,
    list,
    detail,
    update_job_status,
    rating_to_user,
    rating_to_user_edit,
    list_service_addon,
    list_sub_service_addon,
    calculate_and_send,
    getRoomId,
    accept_waiting_appointment,
    list_sent_addon_status
} = require('../../controllers/service_provider/booking.controller');

router.post('/update_booking_status',[verifyToken],user_profile.array('image'), update_booking_status);
router.get('/list',[verifyToken], list);
router.get('/detail',[verifyToken], detail);
router.put('/update_job_status',[verifyToken],update_job_status);
router.post('/rating_to_user',[verifyToken],validationRule.validate('rating-validator'),rating_to_user),
router.put('/rating_to_user_edit',[verifyToken],validationRule.validate('rating-validator'),rating_to_user_edit)
router.get('/list_service_addon',[verifyToken],list_service_addon);
router.get('/list_sub_service_addon',[verifyToken],list_sub_service_addon);
router.post('/calculate_and_send_addon',[verifyToken],calculate_and_send);
router.post('/getRoomId',[verifyToken],getRoomId);
router.post('/accept_waiting',[verifyToken],accept_waiting_appointment);
router.post('/list_sent_addon_status',[verifyToken],list_sent_addon_status);

module.exports = router;