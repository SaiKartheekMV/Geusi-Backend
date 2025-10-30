const express = require("express");
const router = express.Router();
const { adminAuthMiddleware } = require("../middleware/adminAuthMiddleware");
const {
  searchOrders,
  getOrderDetails,
  searchUsers,
  searchChefs,
  globalSearch,
} = require("../controllers/searchController");


router.use(adminAuthMiddleware);


router.get("/orders", searchOrders);
router.get("/orders/:id", getOrderDetails);
router.get("/users", searchUsers);
router.get("/chefs", searchChefs);
router.get("/global", globalSearch);

module.exports = router;