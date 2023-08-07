const { Branch, File, User, Kind } = require("../db");
const jsonUserBranch = require("../json/userbranch.json");
const branches = jsonUserBranch.sedes;

//Funcion del GET / GET ALL USERS
async function getBranches() {
  try {
    const foundBranches = await Branch.findAll({
      include: [{ model: File }],
    });
    return foundBranches;
  } catch (e) {
    return `No se encontraron sedes cargadas en la base de datos, ${e.message}`;
  }
}

// Funcion del GET / GET ALL USER BRANCH
async function getBranchesById(branchId) {
  try {
    const foundBranches = await Branch.findByPk(branchId, {
      include: [{ model: File }],
    });
    return foundBranches;
  } catch (e) {
    return "No se encontró la sede solicitada";
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

// const getUserBranches = async (req, res) => {
//   const { email } = req.params;

//   try {
//     // Buscar al usuario por su correo electrónico
//     const user = await User.findOne({
//       where: { email },
//       include: {
//         model: Branch,
//         attributes: [
//           "branchId",
//           "nombreSede",
//           "ciudad",
//           "direccion",
//           "telefono",
//         ],
//         where: { active: true }, // Puedes agregar otras condiciones para filtrar las sucursales si es necesario
//         include: [
//           {
//             model: File,
//           },
//         ],
//       },
//     });

//     if (!user) {
//       return res.status(404).json({ message: "Usuario no encontrado" });
//     }

//     const userBranches = user.branches;

//     return res.status(200).json({ branches: userBranches });
//   } catch (error) {
//     console.error("Error al obtener las sucursales del usuario:", error);
//     return res
//       .status(500)
//       .json({
//         message: "Ocurrió un error al obtener las sucursales del usuario",
//       });
//   }
// };

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
        ],
        where: { active: true }, // Puedes agregar otras condiciones para filtrar las sucursales si es necesario
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

module.exports = {
  getBranches,
  getBranchesById,
  getUserBranches,
  apiBranches,
};
