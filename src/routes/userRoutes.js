const { Router } = require("express");
const {
  getUsersController,
  getUserByEmailController,
  updateUserByEmailController,
  banUserController,
  activateUserController,
  createUserController,
  loginController,
  logoutController,
  createEmployeeController,
  deleteUserController,
  changePasswordController,
  forgotPasswordController,
  resetPasswordController,
  getFilesByEmail,
  getEmailsByEmail,
  sendchangePasswordUsercontroller,
  changeUserPasswordController,
  changePasswordForAllsController,
} = require("../controllers/userControllers");
const { isAuth } = require("../controllers/authControllers");

const router = Router();

//GET ALL USERS
// http://localhost:3001/user
router.get("/", isAuth, getUsersController);

router.get("/:email", isAuth, getUserByEmailController);

router.put("/:email", isAuth, updateUserByEmailController);

router.put("/baneo/:email", isAuth, banUserController);

// http://localhost:3001/user/baneo/:email
router.put("/activar/:email", isAuth, activateUserController);

router.post("/", isAuth, createUserController);

router.post("/employee", isAuth, createEmployeeController);

router.post("/login", loginController);

router.post("/logout", logoutController);

router.delete("/:email", isAuth, deleteUserController);

router.put("/changePsw/:email", isAuth, changePasswordController);

router.put("/changePsw/users/:email", isAuth, changePasswordForAllsController);

router.post("/forgot-password", isAuth, forgotPasswordController);

router.put("/resetPassword/:token", isAuth, resetPasswordController);

router.get("/:email/files", isAuth, getFilesByEmail);

router.get("/:email/emails", isAuth, getEmailsByEmail);

router.post("/changePswUser", isAuth, sendchangePasswordUsercontroller);

router.put("/changePasswordUser/:token", isAuth, changeUserPasswordController);

module.exports = router;
