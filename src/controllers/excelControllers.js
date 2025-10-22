const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const excelToPdf = require("./pdfControllers");
const { File, User } = require("../db");
const formatDate = require("../utils/formatDate");
const multer = require("multer");
const { imageSize } = require("image-size");
const sharp = require("sharp");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const generateVisitExcel = async (req, res) => {
  try {
    const data = JSON.parse(req.body.data || "{}");

    const {
      empresa,
      direccion,
      localidad,
      cuit,
      fechaVisita,
      provincia,
      botiquines,
      extintores,
      luces,
      maquinas,
      tableros,
      epp,
      vehiculos,
      arneses,
      escaleras,
      inspeccion,
      relevamiento,
      capacitacion,
      otros,
      inputOtros,
      areas,
      notas,
      documentacion,
    } = data;

    const imageFiles = req.files || [];

    if (!empresa || !direccion || !localidad || !cuit || !fechaVisita) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const user = await User.findOne({ where: { nombreEmpresa: empresa } });
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });
    const userEmail = user.email;

    // Plantilla base
    const templatePath = path.join(
      __dirname,
      "../../files/Constancia visita/Constancia de Visita.xlsx"
    );
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ message: "Archivo base no encontrado" });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const worksheet = workbook.getWorksheet(1);

    // Insertar datos en Excel
    worksheet.getCell("A7").value = empresa;
    worksheet.getCell("A9").value = direccion;
    worksheet.getCell("D11").value = localidad;
    worksheet.getCell("I7").value = cuit;
    worksheet.getCell("I9").value = fechaVisita;
    worksheet.getCell("A14").value = documentacion || "";
    worksheet.getCell("A11").value = provincia;
    worksheet.getCell("F17").value = botiquines ? "✓" : "";
    worksheet.getCell("F18").value = extintores ? "✓" : "";
    worksheet.getCell("F19").value = luces ? "✓" : "";
    worksheet.getCell("F20").value = maquinas ? "✓" : "";
    worksheet.getCell("F21").value = tableros ? "✓" : "";
    worksheet.getCell("F22").value = epp ? "✓" : "";
    worksheet.getCell("F23").value = vehiculos ? "✓" : "";
    worksheet.getCell("L17").value = arneses ? "✓" : "";
    worksheet.getCell("L18").value = escaleras ? "✓" : "";
    worksheet.getCell("L19").value = inspeccion ? "✓" : "";
    worksheet.getCell("L20").value = relevamiento ? "✓" : "";
    worksheet.getCell("L21").value = capacitacion ? "✓" : "";
    worksheet.getCell("L22").value = otros ? "✓" : "";
    if (inputOtros) {
      const currentOtrosValue = worksheet.getCell("G22").value || "Otros:";
      worksheet.getCell("G22").value = `${currentOtrosValue} ${inputOtros}`;
      worksheet.getCell("G22").alignment = { wrapText: true };
    }
    worksheet.getCell("A25").value = areas || "";
    worksheet.getCell("A33").value = notas || "";
    worksheet.getCell("A33").alignment = {
      vertical: "top",
      horizontal: "left",
      wrapText: true,
    };

    const startRow = 35;
    const maxCols = 3;
    const imageWidth = 200;
    const maxHeight = 300;
    const colSpacing = 0.2;
    const leftMargin = 0.5;

    let rowIndex = startRow;
    let colIndex = leftMargin;

    for (let i = 0; i < imageFiles.length; i += maxCols) {
      const rowImages = imageFiles.slice(i, i + maxCols);
      const heights = [];

      // Recorro cada imagen de la fila
      for (const file of rowImages) {
        // Corrijo orientación (EXIF)
        const correctedBuffer = await sharp(file.buffer).rotate().toBuffer();

        // Calculo dimensiones proporcionales
        const { width, height } = imageSize(correctedBuffer);
        const aspectRatio = height / width;
        const imageHeight = Math.min(imageWidth * aspectRatio, maxHeight);
        heights.push(imageHeight);

        // Agrego imagen al Excel
        const imageId = workbook.addImage({
          buffer: correctedBuffer,
          extension: "jpeg",
        });

        worksheet.addImage(imageId, {
          tl: { col: colIndex, row: rowIndex },
          ext: { width: imageWidth, height: imageHeight },
        });

        // Avanzo a la siguiente columna
        colIndex += imageWidth / 50 + colSpacing;
      }

      // Avanzo hacia abajo según la imagen más alta de la fila
      const rowMaxHeight = Math.max(...heights);
      rowIndex += rowMaxHeight / 20 + 1;
      colIndex = leftMargin;
    }

    // Guardar Excel temporal
    const outputFileName = `Constancia-de-Visita-${formatDate()}.xlsx`;
    const outputDir = path.join("uploads");
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, outputFileName);
    await workbook.xlsx.writeFile(outputPath);

    // Convertir a PDF
    const pdfPath = await excelToPdf(outputPath);
    const pdfFullPath = path.resolve(pdfPath);

    // Eliminar Excel temporal
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    // Guardar PDF en DB
    const relativePath = path
      .join("uploads", path.basename(pdfFullPath))
      .replace(/\\/g, "/");
    const stats = fs.statSync(pdfFullPath);

    const fileRecord = await File.create({
      type: "application/pdf",
      name: path.basename(pdfFullPath),
      data: relativePath,
      size: stats.size,
      userEmail,
      kindId: "12",
    });

    return res.status(200).json({
      message: "Archivo generado y guardado en la base de datos",
      file: fileRecord,
      pdfUrl: `/${relativePath}`,
    });
  } catch (error) {
    console.error("Error al generar el archivo:", error);
    res.status(500).json({ message: "Error interno al generar el archivo" });
  }
};

module.exports = { generateVisitExcel, upload };
