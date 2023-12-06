const __ = require("multi-lang")();

module.exports = {
  responseData: (message = "", result = {}, req, success) => {
    const language = req.headers["accept-language"]
      ? req.headers["accept-language"]
      : "en";
    var response = {};
    response.success = success;
    let arr = message.split(' ')
    //console.log("arr....",arr);
    if(arr.length > 1) {
      response.message = message;
    }else{
      response.message =
      __(message, language) || __("SOMETHING_WENT_WRONG", language);
    }
    
    response.results = result;
    return response;
  },
  setMessage: (message, language) => {
    return __(message, language);
  },
};
