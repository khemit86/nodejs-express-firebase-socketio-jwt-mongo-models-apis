const Serviceprovider = require("../../models/serviceprovider.model");
const Otp = require("../../models/mobileotps.model");
const Fcm_token = require("../../models/userdevices.model");
const { isEmpty } = require("lodash");
const { responseData } = require("../../helpers/responseData");
var bcrypt = require('bcryptjs');
const { v4 } = require("uuid");
const { generateAuthToken, generateOTP,sendEmail } = require("../../helpers/helper")

module.exports = {
    // signup_user: async (req, res) => {
    //     try {
    //         const { name, email, mobile,country_code, password } = req.body;
    //         const findRecord = await User.findOne({ email });
    //         if (!isEmpty(findRecord)) {
    //             return res.json(responseData("EMAIL_EXIST", {}, req, false));
    //         }
    //         const findRecordM = await User.findOne({ country_code, mobile });
    //         if (!isEmpty(findRecordM)) {
    //             return res.json(responseData("MOBILE_EXIST", {}, req, false));
    //         }
    //         bcrypt.genSalt(10, function (err, salt) {
    //             bcrypt.hash(password, salt, async function (err, hash) {
    //                 if (err || !hash) {
    //                     return res.json(responseData("ERROR_OCCUR", {}, req, false));
    //                 } else {
    //                     var otp = 1234;
    //                     var otp = Math.floor(1000 + Math.random() * 9000);
    //                     const user = {
    //                         name,
    //                         email,
    //                         country_code,
    //                         mobile,
    //                         password: hash,
    //                     }
    //                     await User.create(user);
    //                     await Otp.create({ role: "user",country_code, mobile, otp })
    //                     return res.json(responseData("SIGNUP_MOBILE_VERIFY", {}, req, true));
    //                 }
    //             });
    //         });
    //     } catch (error) {
    //         return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    //     }
    // },
    // verify_user_mobile: async (req, res) => {
    //     try {
    //         const { country_code,mobile, otp } = req.body;
    //         const checkOtp = await Otp.findOne({ role: "user", country_code, mobile, otp });
    //         if (!isEmpty(checkOtp)) {
    //             const user = await User.findOneAndUpdate({ country_code, mobile }, { is_mobile_verified: 1 }, { new: true })
    //             const userdata = user.toJSON()
    //             await Otp.findOneAndRemove({ role: "user", country_code, mobile, otp })
    //             const deviceToken = generateAuthToken(user)
    //             return res.json(responseData("SIGNUP_VERIFY_SUCCESS", { ...userdata, ...deviceToken }, req, true));
    //         } else {
    //             return res.json(responseData("INVALID_OTP", {}, req, false));
    //         }
    //     } catch (error) {
    //         return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    //     }
    // },
    // resend_otp_mobile: async (req, res) => {
    //     try {
    //         const { country_code,mobile } = req.body;
    //         const checkUser = await User.findOne({ country_code, mobile });
    //         if (!isEmpty(checkUser)) {
    //             var otp = Math.floor(1000 + Math.random() * 9000);
    //             await Otp.create({ role: "user",country_code, mobile, otp })
    //             return res.json(responseData("OTP_SENT", {}, req, true));
    //         } else {
    //             return res.json(responseData("USER_NOT_FOUND", {}, req, true));
    //         }
    //     } catch (error) {
    //         return res.json(responseData("ERROR_OCCUR", error.message, req, false));
    //     }
    // },
    service_provider_login: async (req, res) => {
        try {
            const { login_type,
                // country_code,
                login_input, password } = req.body;
            if (login_type == "mobile") {
                // if (!country_code) {
                //     return res.json(responseData("COUNTRY_CODE_EMPTY", {}, req, false));
                // } else if (/[a-zA-Z]/.test(login_input) === true) {
                //     return res.json(responseData("INVALID_MOBILE", {}, req, false));
                // }
                var serviceprovider = await Serviceprovider.findOne(
                    { 
                        // country_code,
                        mobile: login_input 
                    }
                )
            } else if(login_type == "email") {
                var serviceprovider = await Serviceprovider.findOne(
                    { email: login_input }
                )
            } else {
                return res.json(responseData("INVALID_LOGIN_TYPE", {}, req, false));
            }
            if (!isEmpty(serviceprovider)) {
                bcrypt.compare(password, serviceprovider.password, async (err, response) => {
                    if (err)
                        return res
                            .json(responseData("INVALID_LOGIN", {}, req, false));
                    if (!response)
                        return res.json(responseData("INVALID_LOGIN", {}, req, false));
                    const userData = serviceprovider.toJSON()
                    delete userData["password", "__v"];
                    let deviceTokens = generateAuthToken(serviceprovider);
                    return res.json(responseData("ACCOUNT_LOGIN", { ...userData, ...deviceTokens }, req, true));
                });
            } else {
                return res.json(responseData("USER_NOT_FOUND", {}, req, false));
            }
        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
    service_provider_profile: async (req, res) => {
        try {
            const { _id } = req.user;
            const serviceprovier = await Serviceprovider.findOne({ _id })
            if (!isEmpty(serviceprovier)) {
                return res.json(responseData("PROFILE_DETAILS", serviceprovier, req, true));
            } else {
                return res.json(responseData("PROFILE_DETAILS", {}, req, false));
            }
        } catch (error) {
            return res.json(responseData("ERROR_OCCUR", error.message, req, false));
        }
    },
    service_provider_forgot_password: async (req, res) => {
        try {
            const { email,type,mobile } = req.body;
            let ServiceproviderExist = null
            if(type == 'email'){
                ServiceproviderExist = await Serviceprovider.findOne({ email })
            }else if(type == 'mobile'){
                ServiceproviderExist = await Serviceprovider.findOne({ mobile })
            }else{
                return res.json(responseData("FORGOT_PASSWORD_TYPE_USER", {}, req, false));
            }

            if (!isEmpty(ServiceproviderExist)) {
                const otp = 1234
                const otp_send = `${otp}`;
                
                if(type == 'mobile'){
                    // #check_me send otp 
                    await Otp.findOneAndUpdate({
                        mobile,
                        role:'serviceprovider'
                    },{
                        otp:otp,
                        country_code:ServiceproviderExist.country_code,
                        role:'serviceprovider'
                    },{
                        "upsert":true
                    })
                }else if(type == 'email'){
                    sendEmail(email, "Password reset", otp_send);
                    await Otp.findOneAndUpdate({
                        email,
                        role:'serviceprovider'
                    },{
                        otp:otp,
                        role:'serviceprovider'
                    },{
                        "upsert":true
                    })
                }

                return res.json(responseData("OTP_SUCCESSFULY_SEND", {}, req, true));

            } else {
                return res.json(responseData("USER_NOT_FOUND", {}, req, false));
            }
        } catch (err) {
            return res.status(422).json(responseData(err.message, {}, req));
        }
    },
    service_provider_verify_otp: async(req,res) => {
        const { otp,email,mobile,type } = req.body;

        if(!otp){
            return res.json(responseData("OTP_IS_REQUIRED", {}, req, false));
        }

        let resetotpfound = {};

        if(type == 'mobile'){
    
            resetotpfound = await Otp.findOne({ mobile:mobile,otp:otp,role:"serviceprovider" });

        }else if(type == 'email'){

            resetotpfound = await Otp.findOne({ email:email,otp:otp,role:"serviceprovider" });

        }else{
            return res.json(responseData("FORGOT_PASSWORD_TYPE_USER", {}, req, false));
        }

        if(resetotpfound){
            return res.json(responseData("OTP_IS_VERIFIED", resetotpfound, req, true));
        }else{
            return res.json(responseData("OTP_NOT_VERIFIED", resetotpfound, req, false));
        }


    },
    service_provider_reset_password: async (req, res) => {
        try {
                const { password,otp,email,mobile,type } = req.body;

                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(password, salt, async function (err, hash) {
                        if (err || !hash) {
                            return res.json(responseData("ERROR", {}, req, false));
                        } else {

                            if(type == 'mobile'){

                                await Serviceprovider.findOneAndUpdate({ mobile: mobile }, { password: hash, token: null })
                                await Otp.deleteOne({mobile: mobile,role:"serviceprovider"});
                
                            }else if(type == 'email'){
                
                                await Serviceprovider.findOneAndUpdate({ email: email }, { password: hash, token: null })
                                await Otp.deleteOne({email:email,role:"serviceprovider"});
                
                            }else{
                
                                return res.json(responseData("TYPE_USER_INVALID_WAY", {}, req, false));
                
                            }

                            return res.json(responseData("PASSWORD_CHANGED", {}, req, true));
                        }
                    });
                });
                
            } catch (err) {
                return res.status(422).json(responseData(err, {}, req, false));
            }
    },
    changePassword: async (req, res) => {
        try {
            const { oldPassword, newPassword } = req.body;
            const { _id } = req.user;
            const service_provider = await Serviceprovider.findOne({ _id })
            const match = await bcrypt.compare(oldPassword, service_provider.password)
            if (match) {
                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(newPassword, salt, async function (err, hash) {
                        if (err || !hash) {
                            return res.json(responseData("ERROR_OCCUR", {}, req, false));
                        } else {
                            await Serviceprovider.findOneAndUpdate({ _id }, { password: hash });
                            return res.json(responseData("PASSWORD_CHANGED", {}, req, true));
                        }
                    });
                });
            } else {
                return res.json(responseData("INVALID_OLD_PASSWORD", {}, req, false));
            }
        } catch (err) {
            return res.status(422).json(responseData(err, {}, req, false));
        }
    },
    edit_service_provider: async (req, res) => {
        try {
            const { name, address,working_hours,days_in_week } = req.body;
            const { _id } = req.user;
            const updateValues = {}
            if (req.file) {
                updateValues.profile_pic = req.file.filename
            }
            if (name) updateValues.name = name;
            if (address) updateValues.address = address;
            if (working_hours) updateValues.working_hours = working_hours;
            if (days_in_week) updateValues.days_in_week = days_in_week;
            const serviceProviderUpdate = await Serviceprovider.findOneAndUpdate({ _id }, { $set: updateValues }, { new: true })
            if (serviceProviderUpdate) {
                const serviceProviderData = serviceProviderUpdate.toJSON()
                let deviceTokens = generateAuthToken(serviceProviderData);
                return res.json(responseData("USER_UPDATE_SUCCESS", { ...serviceProviderData, ...deviceTokens }, req, true));
            } else {
                return res.json(responseData("ERROR_OCCUR", {}, req, false));
            }
        } catch (err) {
            return res.status(422).json(responseData(err, {}, req, false));
        }
    },
    fcm_token: async (req, res) => {
        try {
            const user_id = req.user._id
            const {fcm_token,device_id,device_type} = req.body;
            await Fcm_token.findOneAndUpdate({user_id,device_id},{$set:{user_id,fcm_token,device_id,device_type}},{upsert:true})
            return res.json(responseData("GET_LIST", {}, req, true));
        } catch (err) {
            return res.status(422).json(responseData(err, {}, req, false));
        }
    },
}