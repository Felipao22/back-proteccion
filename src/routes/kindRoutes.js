const { Router } = require ("express");
const { getKindController, getKindByIdController, addKind } = require("../controllers/kindControllers");
const router = Router();


// http://localhost:3001/kind
router.get('/', getKindController);

router.get('/:id', getKindByIdController);

router.post("/", addKind);

module.exports = router;