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
  upload.array("imagenes"),
  generateVisitExcel
);

module.exports = router;
