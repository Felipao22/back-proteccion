const { Router } = require("express");

const router = Router();

const upload = require("../config/upload.config");
const {
  uploadFile,
  getFiles,
  downloadFile,
  deleteFileById,
  deleteAllFiles,
  getFilesbyKindId,
  filterFiles,
} = require("../controllers/fileControllers");
const { isAuth } = require("../controllers/authControllers");

//POST Files
// http://localhost:3001/file
router.post("/", upload.single("file"), isAuth, uploadFile);

//GET Files con opcion query name
// http://localhost:3001/file
router.get("/", isAuth, async (req, res) => {
  const { name } = req.query;
  try {
    return getFiles(name).then((files) => res.send(files));
  } catch (error) {
    return res.send(error);
  }
});

router.get("/:id", isAuth, downloadFile);

router.delete("/:id", isAuth, deleteFileById);

router.delete("/", isAuth, deleteAllFiles);

router.get("/kind/:kindId", isAuth, getFilesbyKindId);

router.post("/filter", isAuth, filterFiles);

module.exports = router;
