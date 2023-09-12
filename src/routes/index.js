const { Router } = require('express');
const userRoutes = require('./userRoutes')
const cityRoutes = require('./cityRoutes')
const fileRoutes = require('./fileRoutes')
const kindRoutes = require('./kindRoutes.js')


const router = Router();

router.use('/user', userRoutes)
router.use('/cities', cityRoutes)
router.use('/file', fileRoutes)
router.use('/kind', kindRoutes)




module.exports = router;
