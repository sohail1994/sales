const bwipjs = require('bwip-js');

/**
 * Generate a barcode PNG buffer for the given text.
 * @param {string} text  Barcode value
 * @param {string} type  bwip-js bcid (default 'code128')
 * @returns {Promise<Buffer>}
 */
const generateBarcodeImage = (text, type = 'code128') => {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: type,
        text: String(text),
        scale: 3,
        height: 12,
        includetext: true,
        textxalign: 'center',
      },
      (err, png) => {
        if (err) reject(err);
        else resolve(png);
      }
    );
  });
};

module.exports = { generateBarcodeImage };
