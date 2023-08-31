const { Router } = require ("express");
const { getKindController, getKindByIdController } = require("../controllers/kindControllers");
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
router.get('/', getKindController);

router.get('/:id', getKindByIdController)

module.exports = router;