const axios = require('axios');

// Free Face++ API credentials (replace with your own if needed)
const FACEPP_API_KEY = process.env.FACEPP_API_KEY || 'YOUR_FACEPP_API_KEY';
const FACEPP_API_SECRET = process.env.FACEPP_API_SECRET || 'YOUR_FACEPP_API_SECRET';

// POST /api/verify-face
// Expects: { idImage: base64, faceImage: base64 }
exports.verifyFace = async (req, res) => {
  const { idImage, faceImage } = req.body;
  if (!idImage || !faceImage) {
    return res.status(400).json({ message: 'Both ID image and face image are required.' });
  }

  try {
    // Step 1: Detect faces in both images
    const detectFace = async (imageBase64) => {
      const response = await axios.post('https://api-us.faceplusplus.com/facepp/v3/detect', null, {
        params: {
          api_key: FACEPP_API_KEY,
          api_secret: FACEPP_API_SECRET,
          image_base64: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
        },
      });
      return response.data.faces[0]?.face_token;
    };

    const idFaceToken = await detectFace(idImage);
    const facePhotoToken = await detectFace(faceImage);

    if (!idFaceToken || !facePhotoToken) {
      return res.status(400).json({ message: 'Face not detected in one or both images.' });
    }

    // Step 2: Compare faces
    const compareResponse = await axios.post('https://api-us.faceplusplus.com/facepp/v3/compare', null, {
      params: {
        api_key: FACEPP_API_KEY,
        api_secret: FACEPP_API_SECRET,
        face_token1: idFaceToken,
        face_token2: facePhotoToken,
      },
    });

    const { confidence, thresholds } = compareResponse.data;
    // Use threshold for 1e-5 false accept rate (recommended)
    const threshold = thresholds['1e-5'] || 80;
    const isMatch = confidence >= threshold;

    res.json({ match: isMatch, confidence });
  } catch (error) {
    console.error('Face verification error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Face verification failed', error: error.response?.data || error.message });
  }
};
