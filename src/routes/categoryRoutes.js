const { Router } = require("express");
const {
  addCategory,
  getCategoryByIdController,
  getCategoryController,
  getFilesByCategoryController,
} = require("../controllers/categoryControllers");
const { isAuth } = require("../controllers/authControllers");

const router = Router();

router.post("/", isAuth, addCategory);
router.get("/", isAuth, getCategoryController);
router.get("/:id", isAuth, getCategoryByIdController);
router.get("/:categoryId/file", isAuth, getFilesByCategoryController);

module.exports = router;
