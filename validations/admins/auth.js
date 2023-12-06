const { body } = require('express-validator')
const {
  validatorMiddleware,
  validatorMiddlewareFront
} = require('../../helpers/helper')

module.exports.validate = (method) => {
  switch (method) {
    case 'admin-login': {
      return [
        body('email')
          .notEmpty()
          .withMessage('EMAIL_EMPTY')
          .isEmail()
          .withMessage('EMAIL_VALID'),
        body('password').notEmpty().withMessage('PASSWORD_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'forgot-password': {
      return [
        body('email')
          .notEmpty()
          .withMessage('EMAIL_EMPTY')
          .isEmail()
          .withMessage('EMAIL_VALID'),
        validatorMiddleware
      ]
    }
    case 'reset-password': {
      return [
        body('password').notEmpty().withMessage('PASSWORD_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'change-password': {
      return [
        body('oldPassword').notEmpty().withMessage('OLDPASSWORD_EMPTY'),
        body('newPassword').notEmpty().withMessage('NEWPASSWORD_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'adduser': {
      return [
        body('first_name')
          .notEmpty()
          .withMessage('FIRST_NAME_EMPTY')
          .isLength({ min: 2 })
          .withMessage('FIRST_NAME_LENGTH_MIN')
          .isLength({ max: 30 })
          .withMessage('FIRST_NAME_LENGTH_MAX'),
        body('last_name')
          .notEmpty()
          .withMessage('LAST_NAME_EMPTY')
          .isLength({ min: 2 })
          .withMessage('LAST_NAME_LENGTH_MIN')
          .isLength({ max: 30 })
          .withMessage('LAST_NAME_LENGTH_MAX'),
        body('email')
          .notEmpty()
          .withMessage('EMAIL_EMPTY')
          .isEmail()
          .withMessage('EMAIL_VALID'),
        body('mobile')
          .notEmpty()
          .withMessage('MOBILE_EMPTY')
          .isNumeric()
          .withMessage('INVALID_MOBILE'),
        body('country_code').notEmpty().withMessage('COUNTRYCODE_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'addwuser': {
      return [
        body('first_name')
          .notEmpty()
          .withMessage('FIRST_NAME_EMPTY')
          .isLength({ min: 2 })
          .withMessage('FIRST_NAME_LENGTH_MIN')
          .isLength({ max: 30 })
          .withMessage('FIRST_NAME_LENGTH_MAX'),
        body('last_name')
          .notEmpty()
          .withMessage('FIRST_NAME_EMPTY')
          .isLength({ min: 2 })
          .withMessage('LAST_NAME_LENGTH_MIN')
          .isLength({ max: 30 })
          .withMessage('LAST_NAME_LENGTH_MAX'),
        body('email')
          .notEmpty()
          .withMessage('EMAIL_EMPTY')
          .isEmail()
          .withMessage('EMAIL_VALID'),
        body('mobile')
          .notEmpty()
          .withMessage('MOBILE_EMPTY')
          .isNumeric()
          .withMessage('INVALID_MOBILE'),
        body('password').notEmpty().withMessage('PASSWORD_EMPTY'),
        body('country_code').notEmpty().withMessage('COUNTRYCODE_EMPTY'),
        body('company_name').notEmpty().withMessage('test message'),
        body('company_phone')
          .notEmpty()
          .withMessage('COMPANY_PHONE_IS_REQUIRED'),
        body('company_reg_no')
          .notEmpty()
          .withMessage('COMPANY_REGISTRATION_NUMBER_IS_REQUIRED'),
        body('company_vat_no')
          .notEmpty()
          .withMessage('COMPANY_VAT_NUMBER_IS_REQUIRED'),
        body('company_reg_date')
          .notEmpty()
          .withMessage('COMPANY_REGISTRATION_DATE_IS_REQUIRED'),
        body('company_type_id')
          .notEmpty()
          .withMessage('COMPANY_BUSINESS_TYPE_IS_REQUIRED'),
        validatorMiddleware,
        // body('company_street')
        //   .notEmpty()
        //   .withMessage('COMPANY_STREET_IS_REQUIRED'),
        validatorMiddleware
      ]
    }
    case 'editwuser': {
      return [
        body('first_name')
          .notEmpty()
          .withMessage('FIRST_NAME_EMPTY')
          .isLength({ min: 2 })
          .withMessage('FIRST_NAME_LENGTH_MIN')
          .isLength({ max: 30 })
          .withMessage('FIRST_NAME_LENGTH_MAX'),
        body('last_name')
          .notEmpty()
          .withMessage('FIRST_NAME_EMPTY')
          .isLength({ min: 2 })
          .withMessage('LAST_NAME_LENGTH_MIN')
          .isLength({ max: 30 })
          .withMessage('LAST_NAME_LENGTH_MAX'),
        body('email')
          .notEmpty()
          .withMessage('EMAIL_EMPTY')
          .isEmail()
          .withMessage('EMAIL_VALID'),
        body('mobile')
          .notEmpty()
          .withMessage('MOBILE_EMPTY')
          .isNumeric()
          .withMessage('INVALID_MOBILE'),
        body('country_code').notEmpty().withMessage('COUNTRYCODE_EMPTY'),
        body('company_name').notEmpty().withMessage('COMPANY_NAME_IS_REQUIRED'),
        body('company_phone')
          .notEmpty()
          .withMessage('COMPANY_PHONE_IS_REQUIRED'),
        body('company_reg_no')
          .notEmpty()
          .withMessage('COMPANY_REGISTRATION_NUMBER_IS_REQUIRED'),
        body('company_vat_no')
          .notEmpty()
          .withMessage('COMPANY_VAT_NUMBER_IS_REQUIRED'),
        body('company_reg_date')
          .notEmpty()
          .withMessage('COMPANY_REGISTRATION_DATE_IS_REQUIRED'),
        body('company_type_id')
          .notEmpty()
          .withMessage('COMPANY_BUSINESS_TYPE_IS_REQUIRED'),
        validatorMiddleware,
        // body('company_street')
        //   .notEmpty()
        //   .withMessage('COMPANY_STREET_IS_REQUIRED'),
        validatorMiddleware
      ]
    }
    case 'deleteuser': {
      return [
        body('_id').notEmpty().withMessage('ID_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'change-status-user': {
      return [
        body('_id').notEmpty().withMessage('ID_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'addsubadmin': {
      return [
        body('first_name')
          .notEmpty()
          .withMessage('FIRST_NAME_EMPTY')
          .isLength({ min: 2 })
          .withMessage('NAME_LENGTH_MIN')
          .isLength({ max: 30 })
          .withMessage('NAME_LENGTH_MAX'),
        body('last_name')
          .notEmpty()
          .withMessage('LAST_NAME_EMPTY')
          .isLength({ min: 2 })
          .withMessage('NAME_LENGTH_MIN')
          .isLength({ max: 30 })
          .withMessage('NAME_LENGTH_MAX'),
        body('email')
          .notEmpty()
          .withMessage('EMAIL_EMPTY')
          .isEmail()
          .withMessage('EMAIL_VALID'),
        body('password').notEmpty().withMessage('PASSWORD_EMPTY'),
        body('role_id').notEmpty().withMessage('ROLE_ID_IS_REQUIRED'),
        body('country_code').notEmpty().withMessage('COUNTRY_CODE_IS_REQUIRED'),
        body('country_id').notEmpty().withMessage('COUNTRY_IS_REQUIRED'),
        body('mobile').notEmpty().withMessage('MOBILE_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'editsubadmin': {
      return [
        body('first_name')
          .notEmpty()
          .withMessage('FIRST_NAME_EMPTY')
          .isLength({ min: 2 })
          .withMessage('NAME_LENGTH_MIN')
          .isLength({ max: 30 })
          .withMessage('NAME_LENGTH_MAX'),
        body('last_name')
          .notEmpty()
          .withMessage('LAST_NAME_EMPTY')
          .isLength({ min: 2 })
          .withMessage('NAME_LENGTH_MIN')
          .isLength({ max: 30 })
          .withMessage('NAME_LENGTH_MAX'),
        body('email')
          .notEmpty()
          .withMessage('EMAIL_EMPTY')
          .isEmail()
          .withMessage('EMAIL_VALID'),
        body('role_id').notEmpty().withMessage('ROLE_ID_IS_REQUIRED'),
        body('country_code').notEmpty().withMessage('COUNTRY_CODE_IS_REQUIRED'),
        body('country_id').notEmpty().withMessage('COUNTRY_IS_REQUIRED'),
        body('mobile').notEmpty().withMessage('MOBILE_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'addserviceprovider': {
      return [
        body('name')
          .notEmpty()
          .withMessage('NAME_EMPTY')
          .isLength({ min: 2 })
          .withMessage('NAME_LENGTH_MIN')
          .isLength({ max: 30 })
          .withMessage('NAME_LENGTH_MAX'),
        body('email')
          .notEmpty()
          .withMessage('EMAIL_EMPTY')
          .isEmail()
          .withMessage('EMAIL_VALID'),
        body('password').notEmpty().withMessage('PASSWORD_EMPTY'),
        body('country_code').notEmpty().withMessage('COUNTRY_CODE_EMPTY'),
        body('mobile').notEmpty().withMessage('MOBILE_EMPTY'),
        body('address').notEmpty().withMessage('ADDRESS_EMPTY'),
        body('working_hours').notEmpty().withMessage('WORKING_HOURS_EMPTY'),
        body('days_in_week').notEmpty().withMessage('DAYS_IN_WEEK_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'addFAQ': {
      return [
        body('title').notEmpty().withMessage('TITLE_EMPTY'),
        body('content').notEmpty().withMessage('CONTENT_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'addoffer': {
      return [
        body('name').notEmpty().withMessage('NAME_EMPTY'),
        body('discount').notEmpty().withMessage('DISCOUNT_EMPTY'),
        body('code').notEmpty().withMessage('CODE_EMPTY'),
        body('expiry_date').notEmpty().withMessage('EXPIRY_EMPTY'),
        body('description').notEmpty().withMessage('DESCRIPTION_EMPTY'),
        body('count').notEmpty().withMessage('COUNT_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'user-signup': {
      return [
        body('name').notEmpty().withMessage('NAME_EMPTY'),
        body('email')
          .notEmpty()
          .withMessage('EMAIL_EMPTY')
          .isEmail()
          .withMessage('EMAIL_VALID'),
        body('country_code').notEmpty().withMessage('COUNTRY_CODE_EMPTY'),
        body('mobile').notEmpty().withMessage('MOBILE_EMPTY'),
        body('password').notEmpty().withMessage('PASSWORD_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'verify-mobile': {
      return [
        body('country_code').notEmpty().withMessage('COUNTRY_CODE_EMPTY'),
        body('mobile').notEmpty().withMessage('MOBILE_EMPTY'),
        body('otp').notEmpty().withMessage('OTP_EMPTY'),
        validatorMiddlewareFront
      ]
    }
    case 'resend-otp': {
      return [
        body('country_code').notEmpty().withMessage('COUNTRY_CODE_EMPTY'),
        body('mobile').notEmpty().withMessage('MOBILE_EMPTY'),
        validatorMiddlewareFront
      ]
    }
    case 'login': {
      return [
        body('country_code').notEmpty().withMessage('COUNTRY_CODE_IS_REQUIRED'),
        body('mobile').notEmpty().withMessage('MOBILE_NUMBER_IS_REQUIRED'),
        validatorMiddlewareFront
      ]
    }
    case 'add-pet': {
      return [
        body('name').notEmpty().withMessage('PET_NAME_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'delete-pet': {
      return [
        body('_id').notEmpty().withMessage('ID_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'edit-pet': {
      return [
        body('name').notEmpty().withMessage('PET_NAME_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'add-breed': {
      return [
        body('pet_type_id').notEmpty().withMessage('PET_ID_EMPTY'),
        body('name').notEmpty().withMessage('BREED_NAME_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'add-service': {
      return [
        body('pet_type_id').notEmpty().withMessage('PET_ID_EMPTY'),
        body('breed_name').notEmpty().withMessage('BREED_NAME_EXIST'),
        body('name').notEmpty().withMessage('SERVICE_NAME_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'booking-detail': {
      return [
        body('_id').notEmpty().withMessage('ID_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'change-sp': {
      return [
        body('service_provider_id').notEmpty().withMessage('SP_ID_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'address-add-edit-validater': {
      return [
        body('name')
          .notEmpty()
          .withMessage('Name cant be empty')
          .isString()
          .withMessage('Name should be String')
          .trim()
          .isLength({ min: 3 })
          .withMessage('Name should be atleast min 3 letter'),
        body('address').notEmpty().withMessage('Address cant be empty'),
        body('city')
          .notEmpty()
          .withMessage('City cant be empty')
          .isString()
          .withMessage('City should be '),
        body('zipcode').notEmpty().withMessage('zipcode cant be empty'),
        body('longitude')
          .notEmpty()
          .withMessage('longitude cant be empty')
          .isNumeric()
          .withMessage('longitude should be numeric'),
        body('latitude')
          .notEmpty()
          .withMessage('latitude cant be empty')
          .isNumeric()
          .withMessage('latitude should be numeric'),
        validatorMiddleware
      ]
    }
    case 'delete-address': {
      return [
        body('_id').notEmpty().withMessage('ID_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'add-edit-card-validate': {
      return [
        body('card_number')
          .notEmpty()
          .withMessage('card number cant be empty')
          .isString()
          .withMessage('card Number should be String')
          .trim(),
        body('card_expiry')
          .notEmpty()
          .withMessage('card expirey cant be empty')
          .isString()
          .withMessage('card expirey should be String')
          .trim(),
        body('cvv_number')
          .notEmpty()
          .withMessage('cvv number cant be empty')
          .isNumeric()
          .withMessage('cvv number should be Number'),
        validatorMiddleware
      ]
    }
    case 'permission': {
      return [
        body('permission').notEmpty().withMessage('PERMISSION_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'add-subservice': {
      return [
        body('pet_type_id').notEmpty().withMessage('PET_ID_EMPTY'),
        body('service_type_id').notEmpty().withMessage('SERVICE_ID_EMPTY'),
        body('name').notEmpty().withMessage('NAME_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'social-check': {
      return [
        body('social_id').notEmpty().withMessage('SOCIAL_ID_EMPTY'),
        body('social_type').notEmpty().withMessage('SOCIAL_TYPE_EMPTY'),
        validatorMiddleware
      ]
    }
    case 'contact-us': {
      return [
        body('name').notEmpty().withMessage('NAME_EMPTY'),
        body('email').notEmpty().withMessage('EMAIL_EMPTY'),
        body('mobile').notEmpty().withMessage('MOBILE_EMPTY'),
        body('message').notEmpty().withMessage('message cant be empty'),
        validatorMiddleware
      ]
    }
  }
}
