const { Router } = require("express");
const { getUsersController, getUserByEmailController, updateUserByEmailController, banUserController, activateUserController, createUserController, loginController, logoutController, createEmployeeController, deleteUserController, changePasswordController, forgotPasswordController, resetPasswordController, getFilesByEmail, getEmailsByEmail, sendchangePasswordUsercontroller, changeUserPasswordController } = require("../controllers/userControllers");
// const { getUserBranches } = require("../controllers/userBranchController");

const router = Router();

// router.get("/:email/branch", getUserBranches);

//GET ALL USERS
// http://localhost:3001/user
router.get("/", getUsersController);

router.get("/:email", getUserByEmailController);

router.put("/:email", updateUserByEmailController);

router.put("/baneo/:email", banUserController);

// http://localhost:3001/user/baneo/:email
router.put("/activar/:email", activateUserController);

router.post("/", createUserController);

router.post("/employee", createEmployeeController);

router.post("/login", loginController);

router.post("/logout", logoutController);

router.delete("/:email", deleteUserController);

router.put("/changePsw/:email", changePasswordController);

router.post("/forgot-password", forgotPasswordController);

router.put("/resetPassword/:token", resetPasswordController);

router.get("/:email/files", getFilesByEmail);

router.get("/:email/emails", getEmailsByEmail);

router.post("/changePswUser", sendchangePasswordUsercontroller);

router.put("/changePasswordUser/:token", changeUserPasswordController)




module.exports = router;
