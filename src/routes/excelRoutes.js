const { Router } = require("express");
const generateVisitExcel = require("../controllers/excelControllers");
const { isAuth } = require("../controllers/authControllers");

const router = Router();

router.post("/generate-visit-excel", isAuth, generateVisitExcel);

module.exports = router;
