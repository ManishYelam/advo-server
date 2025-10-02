const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');
const base64Helper = require('./base64Helper');

module.exports = {
  // Read a PDF file and return its contents as a buffer
  readPdfFile: filePath => {
    try {
      return fs.readFileSync(filePath);
    } catch (error) {
      console.error(`Error reading PDF file: ${error.message}`);
      throw error;
    }
  },

  // Write data (Buffer) to a PDF file
  writePdfFile: (filePath, pdfBuffer) => {
    try {
      fs.writeFileSync(filePath, pdfBuffer);
      console.log(`PDF file successfully written to ${filePath}`);
    } catch (error) {
      console.error(`Error writing PDF file: ${error.message}`);
      throw error;
    }
  },

  // Encode a PDF file to Base64 string
  encodePdfToBase64: filePath => {
    try {
      const pdfBuffer = fs.readFileSync(filePath);
      return base64Helper.encodeBufferToBase64(pdfBuffer);
    } catch (error) {
      console.error(`Error encoding PDF to Base64: ${error.message}`);
      throw error;
    }
  },

  // Decode a Base64 string and save it as a PDF file
  decodeBase64ToPdf: (base64String, destinationPath) => {
    try {
      const pdfBuffer = base64Helper.decodeBase64ToBuffer(base64String);
      fs.writeFileSync(destinationPath, pdfBuffer);
      console.log(`PDF file successfully created at ${destinationPath}`);
    } catch (error) {
      console.error(`Error decoding Base64 to PDF: ${error.message}`);
      throw error;
    }
  },

  // Generate a simple PDF file with custom text
  generateSimplePdf: async (outputPath, text) => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 400]);
      const { width, height } = page.getSize();

      page.drawText(text, {
        x: 50,
        y: height - 100,
        size: 30,
        color: rgb(0, 0, 0),
      });

      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(outputPath, pdfBytes);
      console.log(`PDF successfully generated at ${outputPath}`);
    } catch (error) {
      console.error(`Error generating PDF: ${error.message}`);
      throw error;
    }
  },
};
