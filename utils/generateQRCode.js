const QRCode = require("qrcode");

const generateQRCode = async (url) => {
  if (!url) {
    throw new Error("URL required");
  }

  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 300
  });
};

module.exports = generateQRCode;
