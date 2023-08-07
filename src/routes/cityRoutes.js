const { Router } = require ("express");
const { getAllCities } = require('../controllers/cityControllers');

const router = Router();

router.get('/', getAllCities);


module.exports = router;