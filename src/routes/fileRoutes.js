const { Router } = require ("express");
const { File } = require('./../db');

const router = Router();

const upload = require('../config/upload.config');
const {uploadFile, getFiles, getFileById, downloadFile, deleteFileById} = require('../controllers/fileControllers')


//POST Files
// http://localhost:3001/file
router.post('/', upload.single('file'), uploadFile)



//GET Files con opcion query name
// http://localhost:3001/file
router.get('/', async (req, res) => {
    const { name } = req.query;
    try {
        return getFiles(name).then(files =>
            res.send(files));
    } catch (error) {
        return res.send(error);
    }
});

//GET Files (id por params)
// http://localhost:3001/file/:id
// router.get('/:id', (req, res) => {
//     const id = req.params.id;
//     try {
//         getFileById(id).then(files =>
//             //Si es objeto lo devuelve, si es texto diciendo q no se encontro el objeto, pone estado de error y lo devuelve
//             typeof files === 'object' ? res.json(files) : res.status(404).json(files));
//     } catch (error) {
//         res.send(error);
//     }
// });

router.get('/:id', downloadFile);

router.delete('/:id', deleteFileById)

module.exports = router;

