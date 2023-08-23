const { Router } = require ("express");

const router = Router();

const upload = require('../config/upload.config');
const {uploadFile, getFiles, downloadFile, deleteFileById } = require('../controllers/fileControllers')


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


router.get('/:id', downloadFile);

router.delete('/:id', deleteFileById)


module.exports = router;

