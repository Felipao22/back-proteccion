const { File, Kind, User } = require("../db");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");
const iconv = require("iconv-lite");
const encodings = ["utf-8", "latin1", "windows-1252"];
const transporterFile = require("../helpers/mailerFile");

async function uploadFile(req, res) {
  const { kindId, userEmail, emails, emailText } = req.body;

  const paragraphs = emailText.split("/n");

  try {
    const { originalname, mimetype: type, path: data, size: size } = req.file;

    if (!kindId || !userEmail) {
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
          userEmail,
        });
        return res.json({
          message: "Archivo subido correctamente y correo enviado",
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
          userEmail,
        });

        const user = await User.findOne({
          where: { email: userEmail },
        });

        if (user && kind) {
          // Enviar el correo electrónico
          const mailOptions = {
            from: `Protección Laboral ${process.env.EMAIL_USER_FILE}`,
            to: emails,
            subject: "Notificación importante",
            html: `<p>Se ha cargado en su base de datos de archivos y relevamientos de Higiene y Seguridad información importante, para interiorirarse del contenido y/o acciones a ejecutar con el fin de neutralizar, corregir o eliminar condiciones que pueden ser de ejecución inmediata lo invitamos a ingresar al link para verificar el contenido del siguiente archivo:</p>
            <ul style="font-size: 13px;">
              <li>Nombre del archivo: <span style="font-size: 14px; font-weight: 700">${decodedName}<span/></li>
              <li>Tipo del archivo: <span style="font-size: 14px; font-weight: 700">${
                kind.name
              }.<span/></li>
            </ul>
            <p style="font-size: 14px; color: #333;">
            ${paragraphs
              .map((paragraph) => paragraph.replace(/\n/g, "<br />"))
              .join("<br /><br />")}
            <p/>
            <div style="text-align: center;">
            <a href="https://proteccion-app.vercel.app/login" style="text-decoration: none;
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
          line-height: 32px;">Iniciar Sesión
          </span>
          </span>
            </a>
            </div>
            `,
          };
          transporterFile.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error("Error al enviar el correo:", error);
            } else {
              console.log("Correo enviado:", info.response);
            }
          });
        }
        return res.json({
          message: "Archivo subido correctamente y correo enviado",
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
    return getFilesByName(name);
  } else {
    return getAllFiles();
  }
}

//Funcion interna, es llamada por getFiles cuando no viene query name
async function getAllFiles() {
  try {
    const foundFilesComplete = await File.findAll({
      order: [["createdAt", "DESC"]],
    });
    return foundFilesComplete;
  } catch (error) {
    console.error(error);
  }
}

//Funcion interna, es llamada por getFiles cuando viene query name
//http://localhost:3001/file?name=nombre
async function getFilesByName(name) {
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

async function deleteAllFiles(req, res) {
  try {
    const files = await File.findAll();

    if (!files || files.length === 0) {
      return res.status(404).json({ message: "No hay archivos para eliminar" });
    }

    files.forEach(async (file) => {
      const filePath = getFilePath(file.data);
      try {
        fs.unlinkSync(filePath);
        await file.destroy();
      } catch (error) {
        console.error("Error al eliminar el archivo:", filePath, error);
      }
    });

    return res
      .status(200)
      .json({ message: "Todos los archivos fueron eliminados correctamente" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error al eliminar los archivos" });
  }
}

async function getFilesbyKindId(req, res) {
  try {
    const { kindId } = req.params;
    const files = await File.findAll({
      where: { kindId },
      order: [["createdAt", "DESC"]],
    });
    if (files.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron archivos para este tipo" });
    }
    return res.status(200).json({
      message: `Archivo encontrado según tipo: ${kindId}`,
      data: files,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
}

module.exports = {
  getFiles,
  uploadFile,
  deleteFileById,
  getAllFiles,
  getFilesByName,
  downloadFile,
  deleteAllFiles,
  getFilesbyKindId,
};
