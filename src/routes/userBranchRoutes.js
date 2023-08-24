const { Router } = require("express");
const {
  getBranches,
  getBranchesById,
  getFilesByBranchId,
  getEmailsByBranchId,
} = require("../controllers/userBranchController");
const { Branch, User } = require("../db");
const transporter = require("../helpers/mailer");
const CryptoJS = require("crypto-js");
const generateEmailTemplate = require("../helpers/templateUser")

const router = Router();

//GET / GET ALL BRANCHES
// http://localhost:3001/branch
router.get("/", async (req, res) => {
  try {
    const dbUsersBranch = await getBranches();
    res.status(201).send(dbUsersBranch);
  } catch (e) {
    res.send("error:" + e.message);
  }
});

router.get("/:branchId", async (req, res) => {
  try {
    const { branchId } = req.params;
    const dbUserBranchById = await getBranchesById(branchId);
    res.status(201).send(dbUserBranchById);
  } catch (e) {
    res.send("error:" + e.message);
  }
});

router.put("/:branchId", async (req, res) => {
  const { branchId } = req.params;
  try {
    const modification = req.body; // JSON con atributos a modificar y nuevos valores
    const result = await Branch.update(modification, {
      where: { branchId: branchId },
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

router.put("/baneo/:branchId", async (req, res) => {
  const { branchId } = req.params;

  try {
    const branches = await Branch.findOne({ where: { branchId } });

    if (!branches) {
      return res.status(404).send("Establecimiento/Obra no encontrado");
    }

    const newActiveState = !branches.active;

    await Branch.update({ active: newActiveState }, { where: { branchId } });

    const message = newActiveState
      ? "Se activó el Establecimiento/Obra correctamente"
      : "El Establecimiento/Obra ha sido bloqueado exitosamente";
    return res.status(200).send(message);
  } catch (e) {
    return res.status(500).send("Error: " + e.message);
  }
});

// http://localhost:3001/branch/baneo/:id
router.put("/activar/:branchId", async (req, res) => {
  const { branchId } = req.params;

  try {
    const branch = await Branch.findOne({ where: { branchId } });
    const activeState = branch.active === false;

    if (!branch) {
      return res.status(404).send("Establecimiento/Obra no encontrada");
    } else if (activeState) {
      await Branch.update({ active: true }, { where: { branchId } });
    }

    const message = "Se activó el Establecimiento/Obra correctamente";

    return res.status(200).send(message);
  } catch (e) {
    return res.status(500).send("Error: " + e.message);
  }
});

//POST new userBranch
router.post("/", async (req, res) => {
  const { nombreSede, userEmail, ciudad, direccion, telefono, emails } = req.body;
  // const emailArray = emails.split(',').map(email => email.trim());
  if (!nombreSede || !userEmail || !ciudad || !direccion || !emails) {
    return res.status(400).json({ warning: "Debe proporcionar todos los campos requeridos." });
  }

  try {
    const branchName = `${nombreSede} - Establecimiento/Obra: ${ciudad} - ${direccion}`;
    const newUserBranch = await Branch.findOrCreate({
      where: {
        nombreSede: branchName,
        userEmail: userEmail,
        ciudad: ciudad,
        direccion: direccion,
        telefono: telefono,
        emails: emails
      },
    });

    // Buscar al usuario por mail
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

    // Enviar el correo electrónico

    const emailData = {
      nombreEmpresa: userCompany,
      email: userEmail,
      decryptedPassword: decryptedPassword,
      nombreSede: nombreSede,
      ciudad: ciudad,
      direccion: direccion
  };

  const emailHtml = generateEmailTemplate(emailData)
  
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
});

router.get("/:branchId/files", getFilesByBranchId);

router.get("/:branchId/emails", getEmailsByBranchId)


module.exports = router;
