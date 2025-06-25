const axios = require('axios');
const Jimp = require('jimp');

const DEFAULT_FRAME_URL = process.env.FRAME_URL || 'https://raw.githubusercontent.com/Yudzxml/UploaderV2/main/tmp/f2bee145.png';

/**
 * Menambahkan gambar QRIS ke dalam frame PNG transparan.
 *
 * @param {string} qrImageUrl - URL gambar QRIS asli
 * @param {string} frameUrl - URL frame PNG transparan
 * @returns {Promise<Buffer>}
 */
async function generateFramedQR(qrImageUrl, frameUrl) {
  // Ambil frame PNG
  const frameResp = await axios.get(frameUrl, { responseType: 'arraybuffer' });
  const frame = await Jimp.read(frameResp.data);

  // Ambil gambar QRIS asli dari URL
  const qrResp = await axios.get(qrImageUrl, { responseType: 'arraybuffer' });
  const qrImage = await Jimp.read(qrResp.data);

  const qrSize = 670;
  const offsetX = 18;
  const offsetY = 160;
  const x = (frame.bitmap.width - qrSize) / 2 + offsetX;
  const y = (frame.bitmap.height - qrSize) / 2 + offsetY;

  // Resize QRIS dan tempelkan ke dalam frame
  qrImage.resize(qrSize, qrSize);
  frame.composite(qrImage, x, y);

  return frame.getBufferAsync(Jimp.MIME_PNG);
}

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const qrImageUrl = req.query.text; // ini sekarang URL gambar QRIS
  const frameUrl = req.query.frameUrl || DEFAULT_FRAME_URL;

  if (!qrImageUrl) {
    return res.status(400).json({ error: 'Missing query parameter: text (should be a QRIS image URL)' });
  }

  try {
    const pngBuffer = await generateFramedQR(qrImageUrl, frameUrl);
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(pngBuffer);
  } catch (err) {
    console.error('🛑 Frame generation failed:', err.message);
    return res.status(500).json({ error: 'Failed to generate framed QR image' });
  }
};