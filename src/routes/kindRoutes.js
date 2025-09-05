const { Router } = require("express");
const {
  getKindController,
  getKindByIdController,
  addKind,
} = require("../controllers/kindControllers");
const { isAuth } = require("../controllers/authControllers");
const router = Router();

// http://localhost:3001/kind
router.get("/", isAuth, getKindController);

router.get("/:id", isAuth, getKindByIdController);

router.post("/", isAuth, addKind);

module.exports = router;
