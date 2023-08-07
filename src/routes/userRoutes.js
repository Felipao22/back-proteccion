const { Router } = require("express");
const { getUsers, getUserByEmail } = require("../controllers/userControllers");
const { User, Branch } = require("../db");
const jwt = require('jsonwebtoken');
const { isAuth } = require("../controllers/authControllers");
const CryptoJS = require('crypto-js');
const { getUserBranches } = require("../controllers/userBranchController");

const router = Router();

router.get("/:email/branch", getUserBranches);

//GET / GET ALL USERS
// http://localhost:3001/user
router.get("/", async (req, res) => {
  try {
    const dbUsers = await getUsers();
    res.status(201).send(dbUsers);
  } catch (e) {
    res.send("error:" + e.message);
  }
});

router.get("/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const dbUserByEmail = await getUserByEmail(email);
    res.status(201).send(dbUserByEmail);
  } catch (e) {
    res.send("error:" + e.message);
  }
});



router.put("/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const modification = req.body; // JSON con atributos a modificar y nuevos valores
    const result = await User.update(modification, {
      where: { email: email },
    });
    if (result[0] === 1) {
      res.status(200).json({ message: "Usuario modificado", modification });
    } else {
      res.status(404).send("Usuario no encontrado"); // Corregido: utiliza send en lugar de message
    }
  } catch (e) {
    res.status(500).send("Error: " + e.message);
  }
});



router.put('/baneo/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).send('Usuario no encontrado');
    }

    // if (!user.admin) {
    //   return res.status(403).send('Acceso no autorizado');
    // }

    const newActiveState = !user.active;

    await User.update({ active: newActiveState }, { where: { email } });

    const message = newActiveState
      ? 'Se activó el usuario correctamente'
      : 'El usuario ha sido bloqueado exitosamente';
    return res.status(200).send(message);
  } catch (e) {
    return res.status(500).send('Error: ' + e.message);
  }
});


// http://localhost:3001/user/baneo/:email
router.put("/activar/:email", async (req, res) => {
  const { email } = req.params;
  
  try {
    const user = await User.findOne({ where: { email } });
    const activeState = user.active === false;

    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    }

    else if(activeState){
      await User.update({ active: true }, { where: { email } });
    }



    const message = "Se activó el usuario correctamente"
    
    return res.status(200).send(message);
  } catch (e) {
    return res.status(500).send("Error: " + e.message);
  }
});

router.post("/", async (req, res) => {
  try {
    const [user, created] = await User.findOrCreate({
      where: {
        email: req.body.email,
        nombreEmpresa: req.body.nombreEmpresa,
        cuit: req.body.cuit,
        password: CryptoJS.AES.encrypt(req.body.password, process.env.PASS_SEC).toString(),
      },
    });

    if (created) {
      res.status(201).json({message:"Empresa creada", created});
    } else {
      res.status(200).json({warning:"La empresa ya existe", user});
    }
  } catch (error) {
    res.status(500).send("Error: " + error);
  }
});


// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const userLogin = await User.findByPk(email);

//     if (!userLogin) {
//       return res.status(401).json({ warning: "Usuario no encontrado" });
//     }

//     const decryptedPassword = CryptoJS.AES.decrypt(userLogin.password, process.env.PASS_SEC);
//     const originalPassword = decryptedPassword.toString(CryptoJS.enc.Utf8);

//     if (originalPassword !== password) {
//       return res.status(401).json({ warning: "Contraseña incorrecta" });
//     }

//     if (!userLogin.active) {
//       return res.status(401).json({ warning: "Usuario bloqueado" });
//     }

//     // Generar token JWT
//     const token = jwt.sign({ userId: userLogin.userId }, process.env.JWT_SEC, {
//       expiresIn: '1h', // El token expirará en 1 hora
//     });
//     return res.status(200).json({ message: 'Usuario logeado correctamente', userLogin, token });
//   } catch (error) {
//     console.error("Error al ingresar al sistema:", error);
//     console.log(error.data.message)
//     return res.status(500).json({ message: "Ocurrió un error al ingresar al sistema" });
//   }
// });

// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const userAdmin = await User.findByPk(email,{where: {isAdmin: true}})
//     if(userAdmin){

//     }
//     // prueba para logear usuario con branch
//     const userLogin = await User.findByPk(email, {
//       include: {
//         model: Branch,
//         where: { active: true },
//       },
//     });
//     // const userLogin = await User.findByPk(email);
//     // if (!userLogin) {
//     //   return res.status(401).json({ warning: "Usuario no encontrado" });
//     // }

//     if (!userLogin) {
//       return res.status(401).json({ warning: "Usuario no encontrado" });
//     }

//     const decryptedPassword = CryptoJS.AES.decrypt(userLogin.password, process.env.PASS_SEC);
//     const originalPassword = decryptedPassword.toString(CryptoJS.enc.Utf8);

//     if (originalPassword !== password) {
//       return res.status(401).json({ warning: "Contraseña incorrecta" });
//     }

//     if (!userLogin.active) {
//       return res.status(401).json({ warning: "Usuario bloqueado" });
//     }

//     // Generar token JWT
//     const token = jwt.sign({ userId: userLogin.userId }, process.env.JWT_SEC, {
//       expiresIn: '1h', // El token expirará en 1 hora
//     });

//     return res.status(200).json({
//       message: 'Usuario logeado correctamente',
//       userLogin,
//       token,
//     });
//   } catch (error) {
//     console.error("Error al ingresar al sistema:", error);
//     console.log(error.data.message)
//     return res.status(500).json({ message: "Ocurrió un error al ingresar al sistema" });
//   }
// });

// actual
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const userAdmin = await User.findOne({ where: { email, isAdmin: true } });
//     if (userAdmin) {
//       // Si el usuario no es admin, no incluir el modelo Branch
//       const decryptedPassword = CryptoJS.AES.decrypt(userAdmin.password, process.env.PASS_SEC);
//       const originalPassword = decryptedPassword.toString(CryptoJS.enc.Utf8);
      
//       if (originalPassword !== password) {
//         return res.status(401).json({ warning: "Contraseña incorrecta" });
//       }

//       // Generate token JWT
//       const token = jwt.sign({ userId: userAdmin.userId }, process.env.JWT_SEC, {
//         expiresIn: '1h', // el token expira en 1 hora
//       });

//       return res.status(200).json({
//         message: 'Administrador logeado correctamente',
//         user: userAdmin,
//         token,
//       });
//     }

//     // Si el usuario no es admin, agregar modelo Branch
//     const userLogin = await User.findOne({
//       where: { email },
//       include: {
//         model: Branch,
//         where: { active: true },
//       },
//     });

//     if (!userLogin) {
//       return res.status(401).json({ warning: "Usuario no encontrado" });
//     }

//     const decryptedPassword = CryptoJS.AES.decrypt(userLogin.password, process.env.PASS_SEC);
//     const originalPassword = decryptedPassword.toString(CryptoJS.enc.Utf8);

//     if (originalPassword !== password) {
//       return res.status(401).json({ warning: "Contraseña incorrecta" });
//     }

//     if (!userLogin.active) {
//       return res.status(401).json({ warning: "Usuario bloqueado" });
//     }

//     // Generar token JWT
//     const token = jwt.sign({ userId: userLogin.userId }, process.env.JWT_SEC, {
//       expiresIn: '1h', // el token expira en 1 hora
//     });

//     return res.status(200).json({
//       message: 'Usuario logeado correctamente',
//       user: userLogin,
//       token,
//     });
//   } catch (error) {
//     console.error("Error al ingresar al sistema:", error);
//     console.log(error.message);
//     return res.status(500).json({ message: "Ocurrió un error al ingresar al sistema" });
//   }
// });

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userAdmin = await User.findOne({ where: { email, isAdmin: true } });
    if (userAdmin) {
      // Si el usuario no es admin, no incluir el modelo Branch
      const decryptedPassword = CryptoJS.AES.decrypt(userAdmin.password, process.env.PASS_SEC);
      const originalPassword = decryptedPassword.toString(CryptoJS.enc.Utf8);
      
      if (originalPassword !== password) {
        return res.status(401).json({ error: "Contraseña incorrecta" });
      }

      // Generate token JWT
      const token = jwt.sign({ userId: userAdmin.userId }, process.env.JWT_SEC, {
        expiresIn: '1h', // el token expira en 1 hora
      });

      return res.status(200).json({
        message: 'Administrador logeado correctamente',
        user: userAdmin,
        token,
      });
    }

    // Si el usuario no es admin, agregar modelo Branch
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

    const decryptedPassword = CryptoJS.AES.decrypt(userLogin.password, process.env.PASS_SEC);
    const originalPassword = decryptedPassword.toString(CryptoJS.enc.Utf8);

    if (originalPassword !== password) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    if (!userLogin.active) {
      return res.status(401).json({ error: "Usuario bloqueado" });
    }

    // Generar token JWT
    const token = jwt.sign({ userId: userLogin.userId }, process.env.JWT_SEC, {
      expiresIn: '1h', // el token expira en 1 hora
    });

    return res.status(200).json({
      message: 'Usuario logeado correctamente',
      user: userLogin,
      token,
    });
  } catch (error) {
    console.error("Error al ingresar al sistema:", error);
    console.log(error.message);
    return res.status(500).json({ message: "Ocurrió un error al ingresar al sistema" });
  }
});

router.post("/logout", (req, res) => {  
  // Enviar una respuesta exitosa indicando que el usuario se ha deslogueado correctamente
  try {
    return res.status(200).json({ message: "Usuario deslogueado correctamente" });
  } catch (error) {
    return res.status(500).json({message:"Ocurrió un error al salir del sistema"})
  }
});


module.exports = router;
