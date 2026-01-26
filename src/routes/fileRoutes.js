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
  getFilesByEmail,
} = require("../controllers/fileControllers");
const { isAuth } = require("../controllers/authControllers");

//POST Files
// http://localhost:3001/file
router.post("/", upload.single("file"), isAuth, uploadFile);

router.get("/branch", isAuth, getFilesByEmail);

router.get("/kind/:kindId", isAuth, getFilesbyKindId);

router.post("/filter", isAuth, filterFiles);

router.get("/", isAuth, getFiles);

router.delete("/", isAuth, deleteAllFiles);

router.get("/:id", isAuth, downloadFile);

router.delete("/:id", isAuth, deleteFileById);

module.exports = router;
