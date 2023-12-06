const express = require('express');
const router = express.Router();

const validationRule = require('../../validations/users/auth');
const { verifyTokenFront } = require('../../middlewares/verifyToken');
const { user_profile } = require('../../middlewares/multerUpload');

const {
    providerListGeo
} = require('../../controllers/users/serviceprovider.controller');

router.get('/listGeo',providerListGeo);

module.exports = router;