const { Router } = require ("express");
const { addCategory, getCategory, getCategoryById } = require ('../controllers/categoryControllers');
// const { verifyToken } = require("../middlewares/verifyToken");
const { Category } = require('./../db');
const router = Router();


//POST Category (solo el admin puede agregar categorías)
// http://localhost:3001/category
router.post('/', async (req,res) => {
    // if(req.userLogin.isAdmin){  
        try {
              const addedCategory = await addCategory ({...req.body});
            return res.send (`Categoría agregada correctamente`);
        } catch (error) {
            return res.status(404).send('error:'+ error.message);
        }
    // } else{
    //     res.status(403).json(`No tiene permiso para agregar categorías`);
    //   }  
});

//GET Category
// http://localhost:3001/category
router.get('/', (req,res) => {    
    const {name} = req.query
    try {
        return getCategory(name).then(category => 
            res.send(category));
            
        } catch (error) {
            return res.send(error);
        }
});

//GET Category (id por params)
// http://localhost:3001/category/:id
router.get('/:id', (req, res) => {
    const {id} = req.params;
    try {
        getCategoryById(id).then(category =>
            //Si es objeto lo devuelve, si es texto diciendo q no se encontro el objeto, pone estado de error y lo devuelve
            typeof category === 'object' ? res.json(category) : res.status(404).json(category));
    } catch (error) {
        res.send(error);
    }
});

module.exports = router;