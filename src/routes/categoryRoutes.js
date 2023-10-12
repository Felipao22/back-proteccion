const { Router } = require("express");
const {
  addCategory,
  getCategoryByIdController,
  getCategoryController,
  getFilesByCategoryController
} = require('../controllers/categoryControllers');

const router = Router();

router.post('/', addCategory);
router.get('/', getCategoryController);
router.get('/:id', getCategoryByIdController);
router.get('/:categoryId/file', getFilesByCategoryController);

module.exports = router;
