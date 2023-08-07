const { Router } = require("express");
const {
  getBranches,
  getBranchesById,
} = require("../controllers/userBranchController");
const { Branch, City } = require("../db");

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
// http://localhost:3001/branch
// router.post("/", async (req, res) => {
//     const { nombreSede, userEmail, ciudad, direccion, telefono } = req.body;
//     if(nombreSede && userEmail && ciudad && direccion){
//       try {
//         const branchName = `${nombreSede} - Establecimiento/Obra: ${ciudad} - ${direccion}`;
//         const newUserBranch = await Branch.findOrCreate({
//           where:{
//             nombreSede: branchName,
//             userEmail:userEmail,
//             ciudad:ciudad,
//             direccion:direccion,
//             telefono: telefono
//           }
//         });
//         res.status(201).json({ message: "Establecimiento/Obra agregada", newUserBranch });
//       } catch (error) {
//         return res.status(404).send(`error: ` + error);
//       }
//   } else {
//     res.status(403).json(`No tiene permiso para agregar Establecimiento/Obra a esta empresa`);
//   }
// });

router.post("/", async (req, res) => {
  const { nombreSede, userEmail, ciudad, direccion, telefono } = req.body;
  if (!nombreSede || !userEmail || !ciudad || !direccion) {
    return res.status(400).json({warning:"Debe proporcionar todos los campos requeridos."});
  }

  try {
    const branchName = `${nombreSede} - Establecimiento/Obra: ${ciudad} - ${direccion}`;
    const newUserBranch = await Branch.findOrCreate({
      where: {
        nombreSede: branchName,
        userEmail: userEmail,
        ciudad: ciudad,
        direccion: direccion,
        telefono: telefono
      }
    });
    res.status(201).json({ message: "Establecimiento/Obra agregada", newUserBranch });
  } catch (error) {
    return res.status(500).json(`Ocurrió un error al agregar el Establecimiento/Obra: ${error}`);
  }
});

module.exports = router;
