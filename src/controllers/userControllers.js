const jsonUsers = require("../json/users.json");
const users = jsonUsers.usuarios;
const { User, Branch } = require("../db");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");

//Funcion del GET / GET ALL USERS
async function getUsersController(req, res) {
  try {
    const dbUsers = await getUsers();
    res.status(200).send(dbUsers);
  } catch (e) {
    res.status(500).send(`Error: ${e.message}`);
  }
}

async function getUsers() {
  try {
    const foundUsers = await User.findAll({
      include: [{ model: Branch }],
    });
    return foundUsers;
  } catch (e) {
    return `No se encontraron usuarios cargados en la base de datos, ${e.message}`;
  }
}

async function getUserByEmailController(req, res) {
  const { email } = req.params;

  try {
    const dbUserByEmail = await getUserByEmail(email);
    if (dbUserByEmail) {
      res.status(200).send(dbUserByEmail);
    } else {
      res.status(404).send("No se encontró el usuario solicitado");
    }
  } catch (e) {
    res.status(500).send(`Error: ${e.message}`);
  }
}

async function getUserByEmail(email) {
  try {
    const foundUser = await User.findByPk(email, {
      include: [{ model: Branch }],
    });
    return foundUser;
  } catch (e) {
    return null;
  }
}

async function updateUserByEmailController(req, res) {
  const { email } = req.params;
  const modification = req.body;

  try {
    const result = await updateUserByEmail(email, modification);
    if (result) {
      res.status(200).json({ message: "Usuario modificado", modification });
    } else {
      res.status(404).send("Usuario no encontrado");
    }
  } catch (e) {
    res.status(500).send(`Error: ${e.message}`);
  }
}

async function updateUserByEmail(email, modification) {
  try {
    const [numUpdatedRows] = await User.update(modification, {
      where: { email: email },
    });
    return numUpdatedRows === 1;
  } catch (e) {
    return false;
  }
}

async function banUserController(req, res) {
  const { email } = req.params;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    }

    // if (!user.admin) {
    //   return res.status(403).send('Acceso no autorizado');
    // }

    const newActiveState = !user.active;

    await toggleUserActiveState(email, newActiveState);

    const message = newActiveState
      ? "Se activó el usuario correctamente"
      : "El usuario ha sido bloqueado exitosamente";
    return res.status(200).send(message);
  } catch (e) {
    return res.status(500).send(`Error: ${e.message}`);
  }
}

async function toggleUserActiveState(email, newActiveState) {
  try {
    await User.update({ active: newActiveState }, { where: { email } });
  } catch (e) {
    throw e;
  }
}

async function activateUserController(req, res) {
  const { email } = req.params;

  try {
    const user = await User.findOne({ where: { email } });
    const activeState = user.active === false;

    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    } else if (activeState) {
      await activateUser(email);
      const message = "Se activó el usuario correctamente";
      return res.status(200).send(message);
    }

    return res.status(200).send("El usuario ya está activo");
  } catch (e) {
    return res.status(500).send(`Error: ${e.message}`);
  }
}

async function activateUser(email) {
  try {
    await User.update({ active: true }, { where: { email } });
  } catch (e) {
    throw e;
  }
}

async function createUserController(req, res) {
  try {
    const [user, created] = await User.findOrCreate({
      where: {
        email: req.body.email,
        nombreEmpresa: req.body.nombreEmpresa,
        cuit: req.body.cuit,
        password: CryptoJS.AES.encrypt(
          req.body.password,
          process.env.PASS_SEC
        ).toString(),
      },
    });

    if (created) {
      res.status(201).json({ message: "Empresa creada", created });
    } else {
      res.status(200).json({ warning: "La empresa ya existe", user });
    }
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

async function createEmployeeController(req, res) {
  try {
    const { email, password } = req.body;
    const [user, created] = await User.findOrCreate({
      where: {
        email: email,
        isAdmin: true,
        nombreEmpresa: null,
        cuit: null,
        password: CryptoJS.AES.encrypt(
          password,
          process.env.PASS_SEC
        ).toString(),
      },
    });

    if (created) {
      res.status(201).json({ message: "Empleado creado", created });
    } else {
      res.status(200).json({ warning: "El empleado ya existe", user });
    }
  } catch (error) {
    res.status(500).send(`Error: ${error}`);
  }
}

async function loginController(req, res) {
  const { email, password } = req.body;

  try {
    const userAdmin = await User.findOne({ where: { email, isAdmin: true } });
    if (userAdmin) {
      const decryptedPassword = CryptoJS.AES.decrypt(
        userAdmin.password,
        process.env.PASS_SEC
      );
      const originalPassword = decryptedPassword.toString(CryptoJS.enc.Utf8);

      if (originalPassword !== password) {
        return res.status(401).json({ error: "Contraseña incorrecta" });
      }

      const token = generateJWTToken(userAdmin.userId);

      return res.status(200).json({
        message: "Administrador logeado correctamente",
        user: userAdmin,
        token,
      });
    }

    const userLogin = await User.findOne({
      where: { email },
      include: {
        model: Branch,
        where: { active: true },
      },
    });

    if (!userLogin) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const decryptedPassword = CryptoJS.AES.decrypt(
      userLogin.password,
      process.env.PASS_SEC
    );
    const originalPassword = decryptedPassword.toString(CryptoJS.enc.Utf8);

    if (originalPassword !== password) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    if (!userLogin.active) {
      return res.status(401).json({ error: "Usuario bloqueado" });
    }

    const token = generateJWTToken(userLogin.userId);

    return res.status(200).json({
      message: "Usuario logeado correctamente",
      user: userLogin,
      token,
    });
  } catch (error) {
    console.error("Error al ingresar al sistema:", error);
    return res
      .status(500)
      .json({ message: "Ocurrió un error al ingresar al sistema" });
  }
}

function generateJWTToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SEC, {
    expiresIn: "1h", // el token expira en 1 hora
  });
}

async function logoutController(req, res) {
  try {
    return res
      .status(200)
      .json({ message: "Usuario deslogueado correctamente" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Ocurrió un error al salir del sistema" });
  }
}

async function deleteUserController(req, res) {
  const { email } = req.params;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    }

    await deleteUser(email);

    return res.status(200).send("Usuario eliminado exitosamente");
  } catch (e) {
    return res.status(500).send(`Error: ${e.message}`);
  }
}

async function deleteUser(email) {
  try {
    await User.destroy({ where: { email } });
  } catch (e) {
    throw e;
  }
}

const apiUsers = async () => {
  try {
    const foundUsers = await User.findOne();
    if (!foundUsers) {
      const usersToCreate = users.map((user) => {
        // const encryptedPassword = CryptoJS.AES.encrypt(user.password, process.env.PASS_SEC).toString();
        return {
          ...user,
          // password: encryptedPassword,
          isAdmin: user.isAdmin ? true : false,
          isSuperAdmin: user.isSuperAdmin ? true : false, // Asignar isAdmin: true si user.isAdmin es true, de lo contrario, asignar false
        };
      });

      await User.bulkCreate(usersToCreate);
      console.log(`Users saved successfully!`);
    } else {
      console.log(`Users already loaded`);
    }
  } catch (error) {
    console.log(`Error at apiUsers function: ${error}`);
  }
};

module.exports = {
  getUsersController,
  getUserByEmailController,
  apiUsers,
  updateUserByEmailController,
  banUserController,
  activateUserController,
  createUserController,
  loginController,
  logoutController,
  createEmployeeController,
  deleteUserController
};
