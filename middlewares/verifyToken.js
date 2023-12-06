const jwt = require("jsonwebtoken");
const { responseData } = require("../helpers/responseData");
const User = require("../models/user.model");
const Admin = require("../models/admin.model");
exports.verifyToken = (req, res, next) => {
  let token;
  if (
    req.headers["authorization"] &&
    req.headers["authorization"].startsWith("Bearer")
  ) {
    token = req.headers["authorization"].split(" ")[1];
  }

  if (!token) {
    return res.status(401).json(responseData("NOT_AUTHORIZED", {}, req, false));
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET, async(err, user) => {
      if (err) {
        // console.log(err.message)
        // return res.json(responseData("TOKEN_EXPIRED", {}, 401, req,false));
        return res
          .status(401)
          .json({ success: false, message: "Token is expired", data: {} });
      }else{
		  var filter = {};
		  filter._id = user.user._id;
		  filter.role_id = user.user.role_id;
		  filter.status = true;
		  //console.log(filter);
		  const userData = await Admin.findOne(filter, { _id: 1 }).lean();
		   if (userData && userData._id) {
			    req.user = user.user;
				next();
		   }else{
			   return res
				.status(401)
				.json({ success: false, message: "Unauthorised", data: {} });
		   }
	  }
    });
  } catch (error) {
    return res.status(401).json(responseData("NOT_AUTHORIZED", {}, req, false));
  }
};

exports.verifyTokenFront = (req, res, next) => {
  let token;
  if (
    req.headers["authorization"] &&
    req.headers["authorization"].startsWith("Bearer")
  ) {
    token = req.headers["authorization"].split(" ")[1];
  }

  if (!token) {
    return res.status(401).json(responseData("NOT_AUTHORIZED", {}, req, false));
  }
  try {
    jwt.verify(token, process.env.JWT_SECRET, async(err, user) => {
		console.log(user);
      if (err) {
        // console.log(err.message)
        // return res.json(responseData("TOKEN_EXPIRED", {}, 401, req,false));
        return res
          .status(401)
          .json({ success: false, message: "Token is expired", data: {} });
      }else{
		  var filter = {};
		  filter._id = user.user._id;
		  filter.role_id = user.user.role_id;
		  filter.status = true;
		  //console.log(filter);
		  const userData = await User.findOne(filter, { _id: 1 }).lean();
		   if (userData && userData._id) {
			    req.user = user.user;
				next();
		   }else{
			   return res
				.status(401)
				.json({ success: false, message: "Unauthorised", data: {} });
		   }
	  }
     
    });
  } catch (error) {
    return res.status(401).json(responseData("NOT_AUTHORIZED", {}, req, false));
  }
};
