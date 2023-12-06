require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
var logger = require("morgan");
var fileUpload = require("express-fileupload");
//admin routes
const adminUsersRouter = require("./routes/admins/users.route");
const adminDriversRouter = require("./routes/admins/drivers.route");
const adminWUsersRouter = require("./routes/admins/w_users.route");
const adminCountryRouter = require("./routes/admins/country.route");
const adminEmailTemplateRouter = require("./routes/admins/emailtemplate.route");
const adminCMSRouter = require("./routes/admins/cms.route");
const adminCityRouter = require("./routes/admins/city.route");
const adminStoreRouter = require("./routes/admins/store.route");
const adminSupplierRouter = require("./routes/admins/supplier.route");
const adminBrandRouter = require("./routes/admins/brand.route");
const adminProductRouter = require("./routes/admins/product.route");
const adminFAQRouter = require("./routes/admins/faq.route");
const adminWholesaleUserCategoryRouter = require("./routes/admins/wholesale_user_category.route");
const adminVATCodeRouter = require("./routes/admins/vat_code.route");
const adminWSBusinessTypeRouter = require("./routes/admins/ws_business_type.route");
const adminSettingRouter = require("./routes/admins/setting.route");
const adminCategoryRouter = require("./routes/admins/category.route");
const adminsRouter = require("./routes/admins/admins.route");
const adminSubadminRouter = require("./routes/admins/subadmin.route");
const adminStaticContentRouter = require("./routes/admins/staticcontent.route");
const adminDashboardRouter = require("./routes/admins/dashboard.route");
const adminOfferRouter = require("./routes/admins/offers.route");
const adminOrderRouter = require("./routes/admins/order.route");
const adminNotificationRouter = require("./routes/admins/notification.route");
const adminFeedbackRouter = require("./routes/admins/feedback.route");
const adminhomeScreenRouter = require("./routes/admins/homescreen.route");
const adminreportRouter = require("./routes/admins/report.route");
const adminImportRouter = require("./routes/admins/import.route");
const adminSyncRouter = require("./routes/admins/sync.route");

// userRoute
const frontRouter = require("./routes/users/front.route");
const userRouter = require("./routes/users/user.route");
const productRouter = require("./routes/users/product.route");
const cronRouter = require("./routes/users/cron.route");
const homeScreenRouter = require("./routes/users/homescreen.route");
const categoryRouter = require("./routes/users/category.route");
const brandRouter = require("./routes/users/brand.route");
const favoriteRouter = require("./routes/users/favorite.route");
const RatingRouter = require("./routes/users/rating.route");
const orderRouter = require("./routes/users/order.route");
const cmsRouter = require("./routes/users/cms.route");
const feedbackRouter = require("./routes/users/feedback.route");
const NotifyRouter = require("./routes/users/notify.route");
const NotificationRouter = require("./routes/users/notification.route");
const LoyaltyPointRouter = require("./routes/users/loyaltypoint.route");

// driverRoutes

const DriverIndexRouter = require("./routes/drivers/index.route");

const db = require("./models/index");
require("./cron/index");

const path = require("path");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
//require("./helpers/socket_work")(io);

db.initialize();

var corsOption = {
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  // credentials: true,
  exposedHeaders: ["x-access-token"],
};

app.use(cors(corsOption));

app.use(
  require("express-session")({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(logger("dev"));
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/v1/admin/user", adminUsersRouter);
app.use("/v1/admin/driver", adminDriversRouter);
app.use("/v1/admin/wuser", adminWUsersRouter);
app.use("/v1/admin/country", adminCountryRouter);
app.use("/v1/admin/email-template", adminEmailTemplateRouter);
app.use("/v1/admin/cms", adminCMSRouter);
app.use("/v1/admin/city", adminCityRouter);
app.use("/v1/admin/store", adminStoreRouter);
app.use("/v1/admin/supplier", adminSupplierRouter);
app.use("/v1/admin/brand", adminBrandRouter);
app.use("/v1/admin/product", adminProductRouter);
app.use("/v1/admin/faq", adminFAQRouter);
app.use("/v1/admin/wholesale-user-category", adminWholesaleUserCategoryRouter);
app.use("/v1/admin/ws-business-type", adminWSBusinessTypeRouter);
app.use("/v1/admin/vat-code", adminVATCodeRouter);
app.use("/v1/admin/setting", adminSettingRouter);
app.use("/v1/admin/category", adminCategoryRouter);
app.use("/v1/admin/subadmin", adminSubadminRouter);
app.use("/v1/admin/static-content", adminStaticContentRouter);
app.use("/v1/admin/offers", adminOfferRouter);
app.use("/v1/admin/orders", adminOrderRouter);
app.use("/v1/admin", adminsRouter, adminDashboardRouter);
app.use("/v1/admin/notification", adminNotificationRouter);
app.use("/v1/admin/home-screen", adminhomeScreenRouter);
app.use("/v1/admin/feedback", adminFeedbackRouter);
app.use("/v1/admin/report", adminreportRouter);
app.use("/v1/admin/import", adminImportRouter);
app.use("/v1/admin/sync", adminSyncRouter);

// users mount
app.use("/v1/front", frontRouter);
app.use("/v1/user", userRouter);
app.use("/v1/product", productRouter);
app.use("/v1/home-screen", homeScreenRouter);
app.use("/v1/category", categoryRouter);
app.use("/v1/brand", brandRouter);
app.use("/v1/favorite", favoriteRouter);
app.use("/v1/rating", RatingRouter);
app.use("/v1/orders", orderRouter);
app.use("/v1/cms", cmsRouter);
app.use("/v1/feedback", feedbackRouter);
app.use("/v1/notify", NotifyRouter);
app.use("/v1/notification", NotificationRouter);
app.use("/v1/loyaltypoints", LoyaltyPointRouter);

cmsRouter;

// drivers mount
app.use("/v1/drivers", DriverIndexRouter);

//app.use("/v1/brand", fa);

app.use("/v1/cron", cronRouter);

app.use("/img", express.static(path.join(__dirname, "public/images/")));
app.use("/pdf", express.static(path.join(__dirname, "public/pdf/")));
app.use("/csvFile", express.static(path.join(__dirname, "public/csv/")));

// app.listen(process.env.PORT, () => {
//     console.log("Server is running at PORT", process.env.PORT);
// });

server.listen(process.env.PORT, () => {
  console.log("Server is running at PORT", process.env.PORT);
});

app.use(function (req, res) {
  res.status(404).json({
    status: 404,
    message: "Sorry can't find that!",
    data: {},
  });
});
