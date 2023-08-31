const { Router } = require("express");
const {
  getBranches,
  getFilesByBranchId,
  getEmailsByBranchId,
  getBranchByIdController,
  updateBranchByIdController,
  banBranchController,
  activateBranchController,
  createBranchController,
  deleteBranchController,
} = require("../controllers/userBranchController");

const router = Router();

//GET / GET ALL BRANCHES
// http://localhost:3001/branch
router.get("/", getBranches);

router.get("/:branchId", getBranchByIdController);

router.put("/:branchId", updateBranchByIdController)

router.put("/baneo/:branchId", banBranchController)

// http://localhost:3001/branch/baneo/:id
router.put("/activar/:branchId", activateBranchController)

//POST new userBranch
router.post("/", createBranchController)

router.get("/:branchId/files", getFilesByBranchId);

router.get("/:branchId/emails", getEmailsByBranchId)

router.delete("/:branchId", deleteBranchController)


module.exports = router;
