const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");
const excelToPdf = require("./pdfControllers");

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
    } = req.body;

    if (!empresa || !direccion || !localidad || !cuit || !fechaVisita) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const templatePath = path.join(
      __dirname,
      "../../files/Constancia visita/Constancia de Visita.xlsx"
    );
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ message: "Archivo base no encontrado" });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const worksheet = workbook.getWorksheet(1); // primera hoja

    // Insertar datos manteniendo estilos
    worksheet.getCell("A7").value = empresa;
    worksheet.getCell("A9").value = direccion;
    worksheet.getCell("D11").value = localidad;
    worksheet.getCell("I7").value = cuit;
    // worksheet.getCell('D5').value = responsable;
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
    worksheet.getCell("A33").value = notas || "";
    worksheet.getCell("A33").alignment = {
      vertical: "top",
      horizontal: "left",
      wrapText: true,
    };

    // Generar nombre único
    const date = new Date();
    const timestamp = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
    const outputFileName = `Constancia-de-Visita-${timestamp}.xlsx`;

    const outputDir = path.join(__dirname, "../files/generated");
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, outputFileName);

    await workbook.xlsx.writeFile(outputPath);
    await excelToPdf(outputPath);

    return res.status(200).json({
      message: "Archivo generado correctamente",
      excelPath: `files/generated/${outputFileName}`,
      pdfPath: `files/generated/${outputFileName.replace(/\.xlsx?$/, ".pdf")}`,
    });
  } catch (error) {
    console.error("Error al generar el archivo Excel:", error);
    res.status(500).json({ message: "Error interno al generar el Excel" });
  }
};

module.exports = generateVisitExcel;
