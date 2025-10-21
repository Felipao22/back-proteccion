const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const excelToPdf = require("./pdfControllers");
const { File, User } = require("../db");

const generateVisitExcel = async (req, res) => {
  try {
    const {
      empresa,
      direccion,
      localidad,
      cuit,
      responsable,
      fechaVisita,
      observaciones,
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
      notas,
      otros,
      inputOtros,
    } = req.body;

    if (!empresa || !direccion || !localidad || !cuit || !fechaVisita) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const user = await User.findOne({ where: { nombreEmpresa: empresa } });
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const userEmail = user.email;

    // Plantilla base
    const templatePath = path.join(
      __dirname,
      "../../files/Constancia visita/Constancia de Visita.xlsx"
    );
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ message: "Archivo base no encontrado" });
    }

    // Cargar plantilla
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const worksheet = workbook.getWorksheet(1);

    // Insertar datos
    worksheet.getCell("A7").value = empresa;
    worksheet.getCell("A9").value = direccion;
    worksheet.getCell("D11").value = localidad;
    worksheet.getCell("I7").value = cuit;
    worksheet.getCell("I9").value = fechaVisita;
    // worksheet.getCell('A9').value = observaciones || '';
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
    worksheet.getCell("A33").value = notas || "";
    worksheet.getCell("A33").alignment = {
      vertical: "top",
      horizontal: "left",
      wrapText: true,
    };

    // Formatear nombre con fecha (DD/MM/AA)
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const formattedDate = `${day}-${month}-${year}`;

    const outputFileName = `Constancia-de-Visita-${formattedDate}.xlsx`;

    const outputDir = path.join("uploads");
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, outputFileName);

    // Guardar Excel temporal
    await workbook.xlsx.writeFile(outputPath);

    // Convertir a PDF
    const pdfPath = await excelToPdf(outputPath);
    const pdfFullPath = path.resolve(pdfPath);

    try {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log(`🧹 Archivo Excel eliminado: ${outputPath}`);
      }
    } catch (deleteErr) {
      console.warn(
        `⚠ No se pudo eliminar el Excel temporal: ${deleteErr.message}`
      );
    }

    // Normalizar a ruta relativa con "/" (para DB y URLs)
    const relativePath = path
      .join("uploads", path.basename(pdfFullPath))
      .replace(/\\/g, "/");

    const stats = fs.statSync(pdfFullPath);

    // Guardar en DB
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
      pdfUrl: `/${relativePath}`, // lista para servir con express.static
    });
  } catch (error) {
    console.error("Error al generar el archivo:", error);
    res.status(500).json({ message: "Error interno al generar el archivo" });
  }
};

module.exports = generateVisitExcel;
