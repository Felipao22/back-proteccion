const jsonUsers = require("../json/users.json");
const users = jsonUsers.usuarios;
const { User, File } = require("../db");
const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const transporter = require("../helpers/mailer");
const generateEmailTemplate = require("../helpers/templateUser")

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
      include: [{ model: File }],
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
      include: [{ model: File }],
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
  const {
    nombreSede,
    ciudad,
    direccion,
    telefono,
    emails,
    accessUser,
    email,
    password,
    nombreEmpresa,
    cuit,
    emailJefe
  } = req.body;

  if (
    !nombreSede ||
    !ciudad ||
    !direccion ||
    !emails ||
    !email ||
    !password ||
    !nombreEmpresa ||
    !cuit ||
    !emailJefe
  ) {
    return res
      .status(400)
      .json({ warning: "Debe proporcionar todos los campos requeridos." });
  }

  try {
    const [newUser, created] = await User.findOrCreate({
      where: {
        nombreSede: nombreSede,
        ciudad: ciudad,
        direccion: direccion,
        telefono: telefono,
        emails: emails,
        accessUser: accessUser,
        email: email,
        password: CryptoJS.AES.encrypt(
          password,
          process.env.PASS_SEC
        ).toString(),
        nombreEmpresa: nombreEmpresa,
        cuit: cuit,
        emailJefe: emailJefe
      },
    });

    if (!created) {
      return res
        .status(409)
        .json({ warning: "Establecimiento/Obra ya existente." });
    }

    const userCompany = nombreEmpresa;
    const userPassword = password;

    const emailData = {
      nombreEmpresa: userCompany,
      email: email,
      decryptedPassword: userPassword,
      nombreSede: req.body.nombreSede,
      ciudad: ciudad,
      direccion: direccion,
    };

    const emailHtml = generateEmailTemplate(emailData);

    const mailOptions = {
      from: `Protección Laboral ${process.env.EMAIL_USER}`,
      to: `${email};${emails};${emailJefe}`,
      subject: "Nuevo establecimiento agregado",
      html: emailHtml,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error al enviar el correo:", error);
      } else {
        console.log("Correo enviado:", info.response);
      }
    });

    res
      .status(201)
      .json({ message: "Establecimiento/Obra agregada", newUser });
  } catch (error) {
    return res
      .status(500)
      .json(`Ocurrió un error al agregar el Establecimiento/Obra: ${error}`);
  }
}

async function createEmployeeController(req, res) {
  try {
    const { email, password, name, lastName } = req.body;
    const [user, created] = await User.findOrCreate({
      where: {
        email: email,
        name: name,
        lastName: lastName,
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
        message: "Administrador has iniciado sesión con éxito. ¡Bienvenido de nuevo!",
        user: userAdmin,
        token,
      });
    }

    const userLogin = await User.findOne({
      where: { email },
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
      message: "Has iniciado sesión con éxito. ¡Bienvenido de nuevo!",
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
      .json({ message: "Has cerrado sesión con éxito. ¡Hasta la próxima vez!" });
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

async function changePasswordController(req, res) {
  const { email } = req.params;
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    }

    // Decrypt and check if the old password matches
    const decryptedPassword = CryptoJS.AES.decrypt(
      user.password,
      process.env.PASS_SEC
    ).toString(CryptoJS.enc.Utf8);

    if (decryptedPassword !== oldPassword) {
      return res.status(401).json({ error: "Contraseña anterior incorrecta" });
    }

    // Encrypt and update the new password
    const encryptedNewPassword = CryptoJS.AES.encrypt(
      newPassword,
      process.env.PASS_SEC
    ).toString();

    await User.update({ password: encryptedNewPassword }, { where: { email } });

    return res.status(200).send("Contraseña actualizada exitosamente");
  } catch (error) {
    return res.status(500).send(`Error: ${error.message}`);
  }
}

async function forgotPasswordController(req, res) {
  const { email } = req.body;

  try {
    // Buscar al usuario por su correo electrónico
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    }

    // Generar un token de restablecimiento de contraseña
    const resetToken = jwt.sign({ email }, process.env.JWT_SEC, {
      expiresIn: "1h", // El token expira en 1 hora
    });

    // Determinar la URL base según el entorno
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? process.env.DEVELOPMENT_BASE_URL
        : process.env.PRODUCTION_URL;

    // Construir el enlace de restablecimiento de contraseña
    const resetLink = `${baseUrl}/resetPassword?token=${resetToken}`;

    // Enviar el enlace por correo electrónico
    await sendResetPasswordEmail(email, resetLink);

    return res
      .status(200)
      .send(
        "Se ha enviado un enlace para restablecer la contraseña por correo electrónico"
      );
  } catch (error) {
    return res.status(500).send(`Error: ${error.message}`);
  }
}

async function resetPasswordController(req, res) {
  const { newPassword } = req.body;
  const token = req.params.token; // Obtener el token desde la consulta

  console.log(newPassword);
  if (!token) {
    return res
      .status(400)
      .send("Token de restablecimiento de contraseña no proporcionado");
  }

  try {
    // Verificar y decodificar el token de restablecimiento de contraseña
    const decodedToken = jwt.verify(token, process.env.JWT_SEC);
    // Extraer el correo electrónico del token
    const { email, exp } = decodedToken;

    // Verificar si el token ha caducado
    const currentTimestamp = Math.floor(Date.now() / 1000); // Obtener la marca de tiempo actual en segundos
    if (exp < currentTimestamp) {
      return res.status(401).send("El token de restablecimiento de contraseña ha caducado");
    }

    // Buscar al usuario por su correo electrónico
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    }

    // Encriptar la nueva contraseña
    const encryptedNewPassword = CryptoJS.AES.encrypt(
      newPassword,
      process.env.PASS_SEC
    ).toString();

    // Actualizar la contraseña del usuario
    await User.update({ password: encryptedNewPassword }, { where: { email } });

    return res.status(200).send("Contraseña restablecida exitosamente");
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).send("El token de restablecimiento de contraseña ha caducado");
    }
    return res.status(500).send(`Error: ${error.message}`);
  }
}


// Función para enviar el correo electrónico de restablecimiento de contraseña
async function sendResetPasswordEmail(email, resetLink) {
  const mailOptions = {
    from: `Protección Laboral ${process.env.EMAIL_USER}`,
    to: email,
    subject: "Restablecimiento de contraseña",
    html: `
      <p>Haz clic en el siguiente enlace para restablecer su contraseña:</p>
      <div style="text-align: center;">
            <a href="${resetLink}" style="text-decoration: none;
            display: inline-block;
            color: #ffffff;
            background-color: #6b67f5;
            border-radius: 4px;
            width: auto;
            border-top: 0px solid #8a3b8f;
            border-right: 0px solid #8a3b8f;
            border-bottom: 0px solid #8a3b8f;
            border-left: 0px solid #8a3b8f;
            padding-top: 5px;
            padding-bottom: 5px;
            font-family: Arial,Helvetica Neue,Helvetica,sans-serif;
            font-size: 16px;
            text-align: center;
            word-break: keep-all">
          <span style="padding-left: 20px;
          padding-right: 20px;
          font-size: 16px;
          display: inline-block;
          letter-spacing: normal;">
          <span style="word-break: break-word;
          line-height: 32px;">Restablecer contraseña
          </span>
          </span>
            </a>
            </div>
        <p>O ingresar al siguiente link:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error al enviar el correo:", error);
    } else {
      console.log("Correo enviado:", info.response);
    }
  });
}

async function sendchangePasswordUsercontroller(req, res) {
  const { emailJefe } = req.body; 

  try {
    // Buscar al usuario por su correo electrónico
    const user = await User.findOne({ where: { emailJefe: emailJefe } });
    
    const email = user.email

    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    }
    
    // if (!emailBoss) {
    //   return res.status(404).send("Usuario sin permiso");
    // }

    // Generar un token de restablecimiento de contraseña
    const resetToken = jwt.sign({ email: email }, process.env.JWT_SEC, {
      expiresIn: "1h", // El token expira en 1 hora
    });

    // Determinar la URL base según el entorno
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? process.env.DEVELOPMENT_BASE_URL
        : process.env.PRODUCTION_URL;

    // Construir el enlace de restablecimiento de contraseña
    const resetLink = `${baseUrl}/changePasswordUser?token=${resetToken}`;

    // Enviar el enlace por correo electrónico
    await sendChangePasswordEmail(emailJefe, resetLink);

    return res
      .status(200)
      .send(
        "Se ha enviado un enlace para cambiar la contraseña por correo electrónico"
      );
  } catch (error) {
    return res.status(500).send(`Error: ${error.message}`);
  }
}

async function sendChangePasswordEmail(email, resetLink) {
  const mailOptions = {
    from: `Protección Laboral ${process.env.EMAIL_USER}`,
    to: email,
    subject: "Cambiar de contraseña",
    html: `
      <p>Haz clic en el siguiente enlace para cambiar su contraseña:</p>
      <div style="text-align: center;">
            <a href="${resetLink}" style="text-decoration: none;
            display: inline-block;
            color: #ffffff;
            background-color: #6b67f5;
            border-radius: 4px;
            width: auto;
            border-top: 0px solid #8a3b8f;
            border-right: 0px solid #8a3b8f;
            border-bottom: 0px solid #8a3b8f;
            border-left: 0px solid #8a3b8f;
            padding-top: 5px;
            padding-bottom: 5px;
            font-family: Arial,Helvetica Neue,Helvetica,sans-serif;
            font-size: 16px;
            text-align: center;
            word-break: keep-all">
          <span style="padding-left: 20px;
          padding-right: 20px;
          font-size: 16px;
          display: inline-block;
          letter-spacing: normal;">
          <span style="word-break: break-word;
          line-height: 32px;">Restablecer contraseña
          </span>
          </span>
            </a>
            </div>
        <p>O ingresar al siguiente link:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error al enviar el correo:", error);
    } else {
      console.log("Correo enviado:", info.response);
    }
  });
}

async function changeUserPasswordController(req, res) {
  const { oldPassword, newPassword } = req.body;
  const token = req.params.token; // Obtener el token desde la consulta

  if (!token) {
    return res
      .status(400)
      .send("Token de restablecimiento de contraseña no proporcionado");
  }

  try {
    // Verificar y decodificar el token de restablecimiento de contraseña
    const decodedToken = jwt.verify(token, process.env.JWT_SEC);
    // Extraer el correo electrónico del token
    const { email, exp } = decodedToken;

    // Verificar si el token ha caducado
    const currentTimestamp = Math.floor(Date.now() / 1000); // Obtener la marca de tiempo actual en segundos
    if (exp < currentTimestamp) {
      return res.status(401).send("El token de restablecimiento de contraseña ha caducado");
    }

    // Buscar al usuario por su correo electrónico
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    }
 // Decrypt and check if the old password matches
 const decryptedPassword = CryptoJS.AES.decrypt(
  user.password,
  process.env.PASS_SEC
).toString(CryptoJS.enc.Utf8);

if (decryptedPassword !== oldPassword) {
  return res.status(401).json({ error: "Contraseña anterior incorrecta" });
}

// Encrypt and update the new password
const encryptedNewPassword = CryptoJS.AES.encrypt(
  newPassword,
  process.env.PASS_SEC
).toString();

await User.update({ password: encryptedNewPassword }, { where: { email } });

    return res.status(200).send("Se cambio la contraseña exitosamente");
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).send("El token de cambio de contraseña ha caducado");
    }
    return res.status(500).send(`Error: ${error.message}`);
  }
}

const getFilesByEmail = async (req, res) => {
  const {email} = req.params
  try {
    const user = await User.findByPk(email, {
      include: {
        model: File,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'No se encontró Establecimiento/Obra' });
    }
    res.json(user.files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el sistema' });
  }
}

const getEmailsByEmail = async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findByPk(email);
    if(!user) {
      return res.status(404).json({error: "No se encontró el Establecimiento/Obra"});
    }
    res.json(user.emails)
  } catch (error) {
    res.status(500).json({error: "Error en el sistema"})
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
  deleteUserController,
  changePasswordController,
  forgotPasswordController,
  resetPasswordController,
  getFilesByEmail,
  getEmailsByEmail,
  sendchangePasswordUsercontroller,
  changeUserPasswordController
};
