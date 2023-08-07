const { Router } = require ("express");
const { getKind, getKindById } = require("../controllers/kindControllers");
const router = Router();


// //POST Kind (solo el admin puede agregar categorías)
// // http://localhost:3001/kind
// router.post('/', async (req,res) => {
//     // if(req.userLogin.isAdmin){  
//         try {
    //               const addedKind = await addKind ({...req.body});
    //             return res.send (`Tipo agregado correctamente`);
//         } catch (error) {
//             return res.status(404).send('error:'+ error.message);
//         }
//     // } else{
//     //     res.status(403).json(`No tiene permiso para agregar tipos`);
//     //   }  
// });

//GET Category
// http://localhost:3001/kind
router.get('/', (req,res) => {   
    const {name} = req.query 
    try {
        return getKind(name).then(kind => 
            res.send(kind));
            
        } catch (error) {
            return res.send(error);
        }
});

router.get('/:id', (req, res) => {
    const {id} = req.params;
    try {
        getKindById(id).then(kind => {
            typeof kind === 'object' ? res.json(kind) : res.status(404).json(kind);
        });
    } catch (error) {
        res.send(error)
    }
})

module.exports = router;