const { Router } = require("express");

const { isAuth } = require("../controllers/authControllers");
const {
  upload,
  generateVisitExcel,
} = require("../controllers/excelControllers");

const router = Router();

router.post(
  "/generate-visit-excel",
  isAuth,
  upload.fields([
    { name: "imagenes", maxCount: 30 },
    { name: "firma", maxCount: 1 },
  ]),
  generateVisitExcel
);

module.exports = router;
