const fs = require('fs');
const path = require('path');
const fastcsv = require('fast-csv');

module.exports = {
  parseCSV: filePath => {
    return new Promise((resolve, reject) => {
      const data = [];
      fs.createReadStream(filePath)
        .pipe(fastcsv.parse({ headers: true, skipEmptyLines: true }))
        .on('data', row => {
          data.push(row);
        })
        .on('end', () => {
          resolve(data);
        })
        .on('error', error => {
          reject(error);
        });
    });
  },
};
