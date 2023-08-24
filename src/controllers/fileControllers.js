const { File, Kind, Branch, User } = require("../db");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");
const iconv = require("iconv-lite");
const encodings = ["utf-8", "latin1", "windows-1252"];
const transporter = require("../helpers/mailer");

//Fucion del POST Files
// async function uploadFile(req, res) {
//   const { kindId, branchBranchId } = req.body;
//   console.log(branchBranchId)
//   try {
//     const {
//       originalname:name,
//       mimetype: type,
//       path: data,
//       size: size,
//     } = req.file;

//     if (!kindId || !branchBranchId) {
//       return res
//         .status(400)
//         .json({ message: "Debe proporcionar el campo Establecimiento/Obras y tipo de archivo" });
//     }

//     const newFile = await File.create({
//       name,
//       type,
//       data,
//       size,
//       kindId: kindId,
//       branchBranchId: branchBranchId,
//     });

//     res.json({ message: 'Archivo subido correctamente', file: newFile });
//   } catch (error) {
//     console.error("Error al subir el archivo:", error);
//     res.status(500).json({ message: "Ocurrió un error al subir el archivo" });
//   }
// }

async function uploadFile(req, res) {
  const { kindId, branchBranchId, emails } = req.body;

  try {
    const { originalname, mimetype: type, path: data, size: size } = req.file;

    if (!kindId || !branchBranchId) {
      return res.status(400).json({
        message:
          "Debe proporcionar el campo Establecimiento/Obras y tipo de archivo",
      });
    }

    // Agregar fecha al nombre del archivo en formato DD/MM/AA
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const formattedDate = `${day}/${month}/${year}`;
    const fileExtension = path.extname(originalname);
    const fileNameWithoutExtension = path.basename(originalname, fileExtension);
    const fileNameWithDate = `${fileNameWithoutExtension} - ${formattedDate}${fileExtension}`;

    // Obtener el nombre del tipo de archivo desde la base de datos
    const kind = await Kind.findOne({
      where: { id: kindId },
      attributes: ["name"],
    });

    // Función recursiva para intentar cada codificación hasta encontrar una válida
    async function tryDecoding(index) {
      if (index >= encodings.length) {
        // Si se han probado todas las codificaciones y ninguna funcionó, usar nombre original
        const newFile = File.create({
          name: fileNameWithDate,
          type,
          data,
          size,
          kindId,
          branchBranchId,
        });
        return res.json({
          message: "Archivo subido correctamente",
          file: newFile,
        });
      }

      const encoding = encodings[index];
      try {
        const decodedName = iconv.decode(
          Buffer.from(fileNameWithDate, "binary"),
          encoding
        );
        const newFile = File.create({
          name: decodedName,
          type,
          data,
          size,
          kindId,
          branchBranchId,
        });
        // Obtener el correo electrónico asociado a la rama (branch) desde alguna fuente
        // Obtener la información de la rama y el tipo de archivo utilizando las relaciones
        const branch = await Branch.findOne({
          where: { branchId: branchBranchId },
          attributes: ["userEmail"], // Asumiendo que el email está en la columna userEmail
          include: [{ model: User, attributes: ["email"] }], // Incluir la información del usuario asociado a la rama
        });

        if (branch && kind) {
          // Enviar el correo electrónico
          const mailOptions = {
            from: `Protección Laboral ${process.env.EMAIL_USER}`,
            to: emails,
            subject: "Nuevo archivo subido",
            html: `<h3>Se ha subido un nuevo archivo:</h3>
            <ul>
              <li>Nombre del archivo: ${fileNameWithDate}</li>
              <li>Tipo del archivo: ${kind.name}.</li>
            </ul>
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
        return res.json({
          message: "Archivo subido correctamente",
          file: newFile,
        });
      } catch (err) {
        // Si hubo un error con la codificación, intentar con la siguiente
        tryDecoding(index + 1);
      }
    }

    // Comenzar con el primer intento de decodificación
    tryDecoding(0);
  } catch (error) {
    console.error("Error al subir el archivo:", error);
    res.status(500).json({ message: "Ocurrió un error al subir el archivo" });
  }
}


//Fucion del GET Files, redirecciona segun haya query name o no
function getFiles(name) {
  if (name) {
    return getFilessByName(name);
  } else {
    return getAllFiles();
  }
}

//Funcion interna, es llamada por getFiles cuando no viene query name
async function getAllFiles() {
  try {
    const foundFilesComplete = await File.findAll({});
    // const filtrado = foundFilesComplete.filter(e => (e.active))
    return foundFilesComplete;
  } catch (error) {
    console.log(error); //res.send(error.message);
  }
}

//Funcion interna, es llamada por getFiles cuando viene query name
//http://localhost:3001/file?name=nombre
async function getFilessByName(name) {
  try {
    const foundFilessName = await File.findAll({
      where: {
        name: {
          [Op.iLike]: `%${name}%`,
        },
      },
      include: [{ model: Kind }],
    });
    if (foundFilessName.length) {
      return foundFilessName;
    } else {
      return "No se encontraron archivos asociados";
    }
  } catch (error) {
    throw new Error(
      `No se encontraron archivos con el nombre ${name}, ${error}`
    );
  }
}

const getFilePath = (data) => {
  return path.join(__dirname, "../..", data);
};

async function downloadFile(req, res) {
  const fileId = req.params.id;

  try {
    const file = await File.findByPk(fileId);

    if (!file) {
      return res.status(404).json({ message: "Archivo no encontrado" });
    }

    const filePath = getFilePath(file.data);
    const fileStream = fs.createReadStream(filePath); // crear un flujo de lectura del archivo
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${file.name}"`);
    fileStream.pipe(res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

async function deleteFileById(req, res) {
  try {
    const fileId = req.params.id;
    const fileToDelete = await File.findOne({ where: { id: fileId } });
    if (!fileToDelete) {
      return res.status(404).json({ message: "Archivo no encontrado" });
    }
    const filePath = getFilePath(fileToDelete.data);
    fs.unlinkSync(filePath);
    await fileToDelete.destroy();
    return res.status(200).json({ message: "Archivo eliminado correctamente" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al eliminar el archivo" });
  }
}

module.exports = {
  getFiles,
  uploadFile,
  deleteFileById,
  getAllFiles,
  getFilessByName,
  downloadFile,
};
