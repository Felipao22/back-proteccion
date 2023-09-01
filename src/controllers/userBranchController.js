const { Branch, File, User, Kind } = require("../db");
const jsonUserBranch = require("../json/userbranch.json");
const branches = jsonUserBranch.sedes;
const CryptoJS = require('crypto-js'); // Asegúrate de importar CryptoJS
const generateEmailTemplate = require("../helpers/templateUser") // Importa la función que genera el template de email
const transporter = require("../helpers/mailer");

//Funcion del GET / GET ALL USERS
async function getBranches(req, res) {
  try {
    const foundBranches = await Branch.findAll({
      include: [{ model: File }],
    });
    res.status(201).send(foundBranches);
  } catch (e) {
    res.status(500).send(`No se encontraron sedes cargadas en la base de datos, ${e.message}`);
  }
}

async function getBranchByIdController(req, res) {
  try {
    const { branchId } = req.params;
    const foundBranch = await getBranchesById(branchId);
    if (foundBranch) {
      res.status(200).send(foundBranch);
    } else {
      res.status(404).send("No se encontró la sede solicitada");
    }
  } catch (e) {
    res.status(500).send(`Error: ${e.message}`);
  }
}

async function getBranchesById(branchId) {
  try {
    const foundBranch = await Branch.findByPk(branchId, {
      include: [{ model: File }],
    });
    return foundBranch;
  } catch (e) {
    return null;
  }
}

async function updateBranchByIdController(req, res) {
  const { branchId } = req.params;
  const modification = req.body;

  try {
    const result = await updateBranchById(branchId, modification);
    if (result) {
      res.status(200).json({ message: "Establecimiento/Obra modificado", modification });
    } else {
      res.status(404).send("Establecimiento/Obra no encontrado");
    }
  } catch (e) {
    res.status(500).send(`Error: ${e.message}`);
  }
}

async function updateBranchById(branchId, modification) {
  try {
    const [numUpdatedRows] = await Branch.update(modification, {
      where: { branchId: branchId }, // Asegúrate de que la columna se llame "id"
    });
    return numUpdatedRows === 1; // Devuelve true si se actualizó una fila, o false si no se encontró la sede
  } catch (e) {
    return false;
  }
}

async function banBranchController(req, res) {
  const { branchId } = req.params;

  try {
    const branch = await Branch.findOne({ where: { branchId: branchId } });

    if (!branch) {
      return res.status(404).send("Establecimiento/Obra no encontrado");
    }

    const newActiveState = !branch.active;

    await toggleBranchActiveState(branchId, newActiveState);

    const message = newActiveState
      ? "Se activó el Establecimiento/Obra correctamente"
      : "El Establecimiento/Obra ha sido bloqueado exitosamente";
    return res.status(200).send(message);
  } catch (e) {
    return res.status(500).send(`Error: ${e.message}`);
  }
}

async function toggleBranchActiveState(branchId, newActiveState) {
  try {
    await Branch.update({ active: newActiveState }, { where: { branchId: branchId } });
  } catch (e) {
    throw e;
  }
}

async function activateBranchController(req, res) {
  const { branchId } = req.params;

  try {
    const branch = await Branch.findOne({ where: { branchId: branchId } });

    if (!branch) {
      return res.status(404).send("Establecimiento/Obra no encontrada");
    }

    if (!branch.active) {
      await activateBranch(branchId);
      const message = "Se activó el Establecimiento/Obra correctamente";
      return res.status(200).send(message);
    }

    return res.status(200).send("El Establecimiento/Obra ya está activo");
  } catch (e) {
    return res.status(500).send(`Error: ${e.message}`);
  }
}

async function activateBranch(branchId) {
  try {
    await Branch.update({ active: true }, { where: { branchId: branchId } });
  } catch (e) {
    throw e;
  }
}

async function createBranchController(req, res) {
  const { nombreSede, userEmail, ciudad, direccion, telefono, emails, accessUser } = req.body;

  if (!nombreSede || !userEmail || !ciudad || !direccion || !emails) {
    return res.status(400).json({ warning: "Debe proporcionar todos los campos requeridos." });
  }

  try {
    const branchName = `${nombreSede} - Establecimiento/Obra: ${ciudad} - ${direccion}`;
    const [newUserBranch, created] = await Branch.findOrCreate({
      where: {
        nombreSede: branchName,
        userEmail: userEmail,
        ciudad: ciudad,
        direccion: direccion,
        telefono: telefono,
        emails: emails,
        accessUser: accessUser
      },
    });

    if (!created) {
      return res.status(409).json({ warning: "Establecimiento/Obra ya existente." });
    }

    const user = await User.findOne({
      where: { email: userEmail },
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const userCompany = user.nombreEmpresa;
    const userPassword = user.password;
    const decryptedPasswordBytes = CryptoJS.AES.decrypt(
      userPassword,
      process.env.PASS_SEC
    );
    const decryptedPassword = decryptedPasswordBytes.toString(
      CryptoJS.enc.Utf8
    );

    const emailData = {
      nombreEmpresa: userCompany,
      email: userEmail,
      decryptedPassword: decryptedPassword,
      nombreSede: nombreSede,
      ciudad: ciudad,
      direccion: direccion
    };

    const emailHtml = generateEmailTemplate(emailData);

    const mailOptions = {
      from: `Protección Laboral ${process.env.EMAIL_USER}`,
      to: `${userEmail};${emails}`,
      subject: "Nuevo establecimiento agregado",
      html: emailHtml
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error al enviar el correo:", error);
      } else {
        console.log("Correo enviado:", info.response);
      }
    });

    res.status(201).json({ message: "Establecimiento/Obra agregada", newUserBranch });
  } catch (error) {
    return res.status(500).json(`Ocurrió un error al agregar el Establecimiento/Obra: ${error}`);
  }
}

async function deleteBranchController(req, res) {
  const { branchId } = req.params;

  try {
    const branch = await Branch.findOne({ where: { branchId } });

    if (!branch) {
      return res.status(404).send("Establecimiento/Obra no encontrado");
    }

    await deleteBranch(branchId);

    return res.status(200).send("Establecimiento/Obra eliminado exitosamente");
  } catch (e) {
    return res.status(500).send(`Error: ${e.message}`);
  }
}

async function deleteBranch(branchId) {
  try {
    await Branch.destroy({ where: { branchId } });
  } catch (e) {
    throw e;
  }
}

// SAVE DATA FROM JSON TO DB
const apiBranches = async () => {
  try {
    const foundBranches = await Branch.findOne();
    if (!foundBranches) {
      await Branch.bulkCreate(branches);
      console.log(`Sedes saved successfully!`);
    } else {
      console.log(`Sedes already loaded`);
    }
  } catch (error) {
    console.log(`Error at apiBranches function: ${error}`);
  }
};

const getUserBranches = async (req, res) => {
  const { email } = req.params;

  try {
    // Buscar al usuario por su correo electrónico
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (user.isAdmin) {
      // Si el usuario es administrador, no tiene establecimientos asociados, devolvemos un arreglo vacío
      return res.status(200).json({ branches: [] });
    }

    // Si el usuario no es administrador, realizamos la búsqueda de establecimientos
    const userBranches = await User.findOne({
      where: { email },
      include: {
        model: Branch,
        attributes: [
          "branchId",
          "nombreSede",
          "ciudad",
          "direccion",
          "telefono",
          "emails"
        ],
        where: { active: true },
        include: [
          {
            model: File,
          },
        ],
      },
    });

    if (!userBranches) {
      return res.status(404).json({ message: "No se encontraron sucursales para el usuario" });
    }

    return res.status(200).json({ branches: userBranches.branches });
  } catch (error) {
    console.error("Error al obtener las sucursales del usuario:", error);
    return res.status(500).json({
      message: "Ocurrió un error al obtener las sucursales del usuario",
    });
  }
};

const getFilesByBranchId = async (req, res) => {
  const {branchId} = req.params
  try {
    const branch = await Branch.findByPk(branchId, {
      include: {
        model: File,
      },
    });

    if (!branch) {
      return res.status(404).json({ error: 'No se encontró Establecimiento/Obra' });
    }
    res.json(branch.files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error en el sistema' });
  }
}

const getEmailsByBranchId = async (req, res) => {
  const { branchId } = req.params;
  try {
    const branch = await Branch.findByPk(branchId);
    if(!branch) {
      return res.status(404).json({error: "No se encontró el Establecimiento/Obra"});
    }
    res.json(branch.emails)
  } catch (error) {
    res.status(500).json({error: "Error en el sistema"})
  }
}

module.exports = {
  getBranches,
  getBranchByIdController,
  getUserBranches,
  apiBranches,
  getFilesByBranchId,
  getEmailsByBranchId,
  updateBranchByIdController,
  banBranchController,
  activateBranchController,
  createBranchController,
  deleteBranchController
};
