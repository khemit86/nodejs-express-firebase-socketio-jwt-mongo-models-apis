const multer = require("multer");
var path = require("path");

let user_profile_stroage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

var user_profile = multer({
  storage: user_profile_stroage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      return cb(
        {
          message: `Only .jpg .png and .jpeg are allowed.`,
          status: 422,
        },
        false
      );
    }
  },
});

let csv_upload = multer({
  storage: user_profile_stroage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "text/csv") {
      cb(null, true);
    } else {
      return cb(
        {
          message: `Only .csv are allowed.`,
          status: 422,
        },
        false
      );
    }
  },
});

/* upload image for match league */
// let match_league_storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/league-logo");
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(
//       null,
//       file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
//     );
//   },
// });

// var match_league = multer({
//   storage: match_league_storage,
//   fileFilter: (req, file, cb) => {
//     if (
//       file.mimetype == "image/png" ||
//       file.mimetype == "image/jpg" ||
//       file.mimetype == "image/jpeg"
//     ) {
//       cb(null, true);
//     } else {
//       return cb(
//         {
//           message: `Only .jpg .png and .jpeg are allowed.`,
//           status: 422,
//         },
//         false
//       );
//     }
//   },
// });

/* upload image for match */
// let match_storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/team-logo");
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//     cb(
//       null,
//       file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
//     );
//   },
// });

// var match = multer({
//   storage: match_storage,
//   fileFilter: (req, file, cb) => {
//     if (
//       file.mimetype == "image/png" ||
//       file.mimetype == "image/jpg" ||
//       file.mimetype == "image/jpeg"
//     ) {
//       cb(null, true);
//     } else {
//       return cb(
//         {
//           message: `Only .jpg .png and .jpeg are allowed.`,
//           status: 422,
//         },
//         false
//       );
//     }
//   },
// });

module.exports = {
  user_profile,
  csv_upload,
  // match_league,
  // match
};
