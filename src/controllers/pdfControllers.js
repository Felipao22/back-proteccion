const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const excelToPdf = (inputPath) => {
  return new Promise((resolve, reject) => {
    // ✅ Ruta real a soffice.exe
    const sofficePath = `"C:\\Program Files\\LibreOffice\\program\\soffice.exe"`;
    //para ubuntu sería algo como:
    // `libreoffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;
    const outputDir = path.dirname(inputPath);

    // 🧠 Comando para Windows con rutas con espacios escapadas correctamente
    const command = `${sofficePath} --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;

    console.log("▶ Ejecutando comando:", command);

    exec(command, (error, stdout, stderr) => {
      console.log("STDOUT:", stdout);
      console.log("STDERR:", stderr);

      const outputPdfPath = inputPath.replace(/\.xlsx?$/, ".pdf");

      if (error) {
        console.error("❌ Error ejecutando LibreOffice:", error);
        return reject(new Error("Error al convertir Excel a PDF"));
      }

      if (fs.existsSync(outputPdfPath)) {
        console.log("✅ PDF generado en:", outputPdfPath);
        resolve(outputPdfPath);
      } else {
        console.error("❌ PDF no encontrado en:", outputPdfPath);
        reject(new Error("Archivo PDF no generado"));
      }
    });
  });
};

module.exports = excelToPdf;
