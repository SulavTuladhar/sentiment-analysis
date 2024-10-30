var router = require("express").Router();

let authRouter = require("./modules/auth/auth.router");
let reviewRouter = require("./modules/review/review.router");

router.use("/auth", authRouter);
router.use("/review", reviewRouter);

module.exports = router;
