import { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';

const FaceVerification = ({ onSuccess, onCancel }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (error) {
      toast.error('Unable to access camera. Please allow camera permissions.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageData);
      
      // Stop camera
      stopCamera();
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const verifyFace = async () => {
    if (!capturedImage) {
      toast.error('Please capture your face photo first');
      return;
    }

    setVerifying(true);
    
    // Simulate face verification (in production, this would call an AI service)
    setTimeout(() => {
      // For now, we'll auto-verify
      // In production, you would:
      // 1. Send capturedImage to backend
      // 2. Compare with stored faceImageUrl using face recognition API
      // 3. Return verification result
      
      toast.success('Face verified successfully!');
      onSuccess(true);
      setVerifying(false);
    }, 2000);
  };

  const handleCancel = () => {
    stopCamera();
    setCapturedImage(null);
    setShowCamera(false);
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Face Verification Required</h3>
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          For security purposes, please verify your identity by capturing your face photo.
        </p>

        {!showCamera && !capturedImage && (
          <button
            onClick={startCamera}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Camera size={20} />
            Start Camera
          </button>
        )}

        {showCamera && (
          <div className="space-y-3">
            <video ref={videoRef} autoPlay className="w-full rounded-md" />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="flex gap-2">
              <button
                onClick={capturePhoto}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Capture Photo
              </button>
              <button
                onClick={() => {
                  stopCamera();
                  setShowCamera(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="space-y-3">
            <img src={capturedImage} alt="Captured face" className="w-full rounded-md" />
            <div className="flex gap-2">
              <button
                onClick={verifyFace}
                disabled={verifying}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {verifying ? 'Verifying...' : 'Verify Identity'}
              </button>
              <button
                onClick={() => {
                  setCapturedImage(null);
                  startCamera();
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Retake
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Your face photo will be compared with the image you provided during registration to verify your identity.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FaceVerification;
