const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

module.exports = {
  // Create a ZIP file from a directory or multiple files
  createZip: (inputPaths, outputZipPath) => {
    try {
      const zip = new AdmZip();

      inputPaths.forEach(inputPath => {
        if (fs.lstatSync(inputPath).isDirectory()) {
          zip.addLocalFolder(inputPath, path.basename(inputPath));
        } else {
          zip.addLocalFile(inputPath);
        }
      });

      zip.writeZip(outputZipPath);
      console.log(`ZIP file created at ${outputZipPath}`);
    } catch (error) {
      console.error(`Error creating ZIP file: ${error.message}`);
      throw error;
    }
  },

  // Extract a ZIP file to a target directory
  extractZip: (zipFilePath, extractToDir) => {
    try {
      const zip = new AdmZip(zipFilePath);
      zip.extractAllTo(extractToDir, true);
      console.log(`ZIP file extracted to ${extractToDir}`);
    } catch (error) {
      console.error(`Error extracting ZIP file: ${error.message}`);
      throw error;
    }
  },

  // List the contents of a ZIP file
  listZipContents: zipFilePath => {
    try {
      const zip = new AdmZip(zipFilePath);
      const zipEntries = zip.getEntries(); // Array of ZipEntry objects

      console.log(`Contents of ${zipFilePath}:`);
      zipEntries.forEach(zipEntry => {
        console.log(zipEntry.entryName); // Output each file name
      });
    } catch (error) {
      console.error(`Error listing ZIP contents: ${error.message}`);
      throw error;
    }
  },

  // Add files to an existing ZIP
  addFilesToZip: (zipFilePath, filesToAdd) => {
    try {
      const zip = new AdmZip(zipFilePath);

      filesToAdd.forEach(filePath => {
        if (fs.existsSync(filePath)) {
          zip.addLocalFile(filePath);
        } else {
          console.error(`File not found: ${filePath}`);
        }
      });

      zip.writeZip(zipFilePath); // Overwrite the existing ZIP
      console.log(`Files added to ZIP file at ${zipFilePath}`);
    } catch (error) {
      console.error(`Error adding files to ZIP: ${error.message}`);
      throw error;
    }
  },

  // Remove a file from an existing ZIP
  removeFileFromZip: (zipFilePath, fileNameInZip) => {
    try {
      const zip = new AdmZip(zipFilePath);
      zip.deleteFile(fileNameInZip);
      zip.writeZip(zipFilePath); // Save the changes to the ZIP
      console.log(`${fileNameInZip} removed from ZIP file at ${zipFilePath}`);
    } catch (error) {
      console.error(`Error removing file from ZIP: ${error.message}`);
      throw error;
    }
  },
};
