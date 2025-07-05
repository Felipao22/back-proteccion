const { Router } = require("express");
const generateVisitExcel = require("../controllers/excelControllers");

const router = Router();

router.post("/generate-visit-excel", generateVisitExcel);

module.exports = router;
