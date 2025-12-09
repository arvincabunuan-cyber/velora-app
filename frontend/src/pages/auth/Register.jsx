import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService, faceService } from '../../services/apiService';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import FaceVerification from '../../components/FaceVerification';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'buyer',
    idType: '',
    idNumber: '',
    idImageUrl: '',
    faceImageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [capturedFace, setCapturedFace] = useState(null);
  const navigate = useNavigate();
  const { setUser, setToken } = useAuthStore();


  const handleFaceSuccess = (imageData) => {
    setCapturedFace(imageData);
    setFormData({ ...formData, faceImageUrl: imageData });
    setShowFaceModal(false);
    toast.success('Face photo captured!');
  };

  const handleFaceCancel = () => {
    setShowFaceModal(false);
  };

  const handleIdImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, idImageUrl: reader.result });
        toast.success('ID image uploaded!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate buyer ID verification
    if (formData.role === 'buyer') {
      if (!formData.idType || !formData.idNumber) {
        toast.error('Please provide ID type and number for verification');
        return;
      }
      if (!formData.idImageUrl) {
        toast.error('Please upload your ID image');
        return;
      }
      if (!formData.faceImageUrl) {
        toast.error('Please capture your face photo for verification');
        return;
      }

      setLoading(true);
      // Call backend to verify face
      try {
        const result = await faceService.verifyFace(formData.idImageUrl, formData.faceImageUrl);
        if (!result.match) {
          toast.error(`Face verification failed. Confidence: ${result.confidence || 'N/A'}`);
          setLoading(false);
          return;
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Face verification failed');
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      await authService.register(formData);
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="Velora Logo" 
              className="h-24 w-auto"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <input
              type="text"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <input
              type="email"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <input
              type="password"
              required
              minLength={6}
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Password (min 6 characters)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <input
              type="tel"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <select
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="rider">Rider</option>
            </select>

            {/* ID Verification for Buyers */}
            {formData.role === 'buyer' && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">ID Verification (Required for Buyers)</h3>
                  
                  <select
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm mb-3"
                    value={formData.idType}
                    onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                  >
                    <option value="">Select ID Type</option>
                    <option value="drivers-license">Driver's License</option>
                    <option value="passport">Passport</option>
                    <option value="national-id">National ID</option>
                    <option value="voters-id">Voter's ID</option>
                  </select>

                  <input
                    type="text"
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm mb-3"
                    placeholder="ID Number"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  />

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload ID Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleIdImageUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    />
                    {formData.idImageUrl && (
                      <p className="mt-1 text-xs text-green-600">✓ ID image uploaded</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Face Verification
                    </label>
                    {!capturedFace ? (
                      <button
                        type="button"
                        onClick={() => setShowFaceModal(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <span className="inline-block mr-2"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-camera"><circle cx="9" cy="9" r="7"></circle><path d="M5 9h.01"></path><path d="M9 9h.01"></path><path d="M13 9h.01"></path></svg></span>
                        Capture Face Photo
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <img src={capturedFace} alt="Captured face" className="w-full h-48 object-cover rounded-md" />
                        <button
                          type="button"
                          onClick={() => {
                            setCapturedFace(null);
                            setFormData({ ...formData, faceImageUrl: '' });
                          }}
                          className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                        >
                          Retake Photo
                        </button>
                      </div>
                    )}
                  </div>
                      {showFaceModal && (
                        <FaceVerification
                          onSuccess={handleFaceSuccess}
                          onCancel={handleFaceCancel}
                        />
                      )}
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
