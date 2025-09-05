const { Router } = require("express");
const { getAllCities } = require("../controllers/cityControllers");
const { isAuth } = require("../controllers/authControllers");

const router = Router();

router.get("/", isAuth, getAllCities);

module.exports = router;
