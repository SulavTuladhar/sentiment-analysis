var router = require("express").Router();
const reviewController = require("./review.controller");

router.route("/").post(reviewController.searchStores);
router.route("/analyze-review").post(reviewController.analyzeReview);

module.exports = router;
