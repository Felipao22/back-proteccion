const { Router } = require('express');
const userRoutes = require('./userRoutes')
const cityRoutes = require('./cityRoutes')
const categoryRoutes = require('./categoryRoutes')
const fileRoutes = require('./fileRoutes')
const kindRoutes = require('./kindRoutes.js')
const userBranchRoutes = require('./userBranchRoutes')


const router = Router();

router.use('/user', userRoutes)
router.use('/cities', cityRoutes)
router.use('/category', categoryRoutes)
router.use('/file', fileRoutes)
router.use('/kind', kindRoutes)
router.use('/branch', userBranchRoutes)




module.exports = router;
