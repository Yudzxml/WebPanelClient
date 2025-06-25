const axios = require('axios');
const Jimp = require('jimp');
const QRCode = require('qrcode');

const DEFAULT_FRAME_URL = process.env.FRAME_URL || 'https://raw.githubusercontent.com/Yudzxml/UploaderV2/main/tmp/f2bee145.png';

/**
 * Generate a framed QR code buffer.
 *
 * @param {string} qrText
 * @param {string} frameUrl
 * @returns {Promise<Buffer>}
 */
async function generateFramedQR(qrText, frameUrl) {
  const resp = await axios.get(frameUrl, { responseType: 'arraybuffer' });
  const frame = await Jimp.read(resp.data);

  const qrSize = 670;
  const offsetX = 18;
  const offsetY = 160;
  const x = (frame.bitmap.width - qrSize) / 2 + offsetX;
  const y = (frame.bitmap.height - qrSize) / 2 + offsetY;

  const qrBuffer = await QRCode.toBuffer(qrText, {
    width: qrSize,
    margin: 1,
  });
  const qrImage = await Jimp.read(qrBuffer);
  qrImage.resize(qrSize, qrSize);

  frame.composite(qrImage, x, y);
  return frame.getBufferAsync(Jimp.MIME_PNG);
}

module.exports = async (req, res) => {
  // Handle preflight CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const qrText = req.query.text;
  const frameUrl = req.query.frameUrl || DEFAULT_FRAME_URL;

  if (!qrText) {
    return res.status(400).json({ error: 'Missing query parameter: text' });
  }

  try {
    const pngBuffer = await generateFramedQR(qrText, frameUrl);
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(pngBuffer);
  } catch (err) {
    console.error('🛑 QR generation failed:', err);
    return res.status(500).json({ error: 'Failed to generate QR code' });
  }
};