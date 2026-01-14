import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { uploadVehiclePhoto } from '../utils/pdfService';
import { FiUpload, FiX, FiCheck, FiFileText } from 'react-icons/fi';

const CustomerForm = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Form state
  const [photos, setPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');
  
  // Signature state
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState(null);

  // Fetch request data by token
  useEffect(() => {
    const fetchRequest = async () => {
      if (!token) {
        setError('Invalid link');
        setLoading(false);
        return;
      }

      try {
        // Try all tables
        const tables = [
          'requests',
          'g24_requests',
          'diving_solution_requests',
          'turney_seat_requests'
        ];

        let found = null;
        let foundTable = null;

        for (const table of tables) {
          const { data, error: fetchError } = await supabase
            .from(table)
            .select('*')
            .eq('customer_form_token', token)
            .single();

          if (!fetchError && data) {
            found = data;
            foundTable = table;
            break;
          }
        }

        if (!found) {
          setError('Request not found or link has expired');
          setLoading(false);
          return;
        }

        // Check if already submitted
        if (found.customer_submitted) {
          setSubmitted(true);
        }

        setRequestData({ ...found, tableName: foundTable });
      } catch (err) {
        console.error('Error fetching request:', err);
        setError('Failed to load request details');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [token]);

  // Initialize signature canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
    }
  }, []);

  // Signature drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (point.clientX - rect.left) * scaleX;
    const y = (point.clientY - rect.top) * scaleY;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (point.clientX - rect.left) * scaleX;
    const y = (point.clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        setSignatureData(canvas.toDataURL('image/png'));
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData(null);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true);
    const uploadedUrls = [];

    try {
      for (const file of files) {
        const url = await uploadVehiclePhoto(file, token);
        uploadedUrls.push(url);
      }
      setPhotos([...photos, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload some photos. Please try again.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  // Remove photo
  const handleRemovePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  // Submit customer data
  const handleSubmit = async () => {
    if (photos.length === 0) {
      alert('Please upload at least one vehicle photo');
      return;
    }

    if (!signatureData) {
      alert('Please provide your signature');
      return;
    }

    setSubmitting(true);

    try {
      // Prepare filled data with signature
      const customerFilledData = {
        vehicle_photos: photos,
        notes: customerNotes,
        signature: signatureData,
        submitted_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from(requestData.tableName)
        .update({
          customer_vehicle_photos: photos,
          customer_notes: customerNotes,
          customer_filled_data: customerFilledData,
          customer_submitted: true,
          customer_submitted_at: new Date().toISOString()
        })
        .eq('customer_form_token', token);

      if (updateError) throw updateError;

      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting customer data:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <div className="text-green-600 text-5xl mb-4">
            <FiCheck className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-4">
            Your vehicle photos and information have been submitted successfully.
          </p>
          <p className="text-sm text-gray-500">
            Your sales representative will contact you shortly.
          </p>
        </div>
      </div>
    );
  }

  const payload = requestData?.payload || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Vehicle Information Form
          </h1>
          <p className="text-gray-600">
            Request Code: <span className="font-mono font-bold">{requestData?.request_code}</span>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please upload photos of your vehicle and provide any additional information.
          </p>
        </div>

        {/* Customer Information Display */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Your Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Name</p>
              <p className="font-semibold">{payload.customer?.name || requestData?.customer_name || '—'}</p>
            </div>
            <div>
              <p className="text-gray-600">Mobile</p>
              <p className="font-semibold">{payload.customer?.mobile || requestData?.customer_mobile || '—'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600">Vehicle</p>
              <p className="font-semibold">
                {payload.job?.vehicle?.make || requestData?.vehicle_make} {payload.job?.vehicle?.model || requestData?.vehicle_model} {payload.job?.vehicle?.year || requestData?.vehicle_year}
              </p>
            </div>
          </div>
        </div>

        {/* Training Checklist */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Training Acknowledgement</h2>
          <p className="text-sm text-gray-600 mb-4">
            Please acknowledge that you have received training in the following areas:
          </p>
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-green-700 text-lg">✓</span>
              <span className="text-gray-700">Operate Device</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-700 text-lg">✓</span>
              <span className="text-gray-700">Emergency Procedure</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-700 text-lg">✓</span>
              <span className="text-gray-700">Main Fuse Location</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-700 text-lg">✓</span>
              <span className="text-gray-700">Tie Down & Seatbelts</span>
            </div>
          </div>
        </div>

        {/* Initial Request Signature */}
        {requestData?.payload?.signature && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Installation Request Signature</h2>
            <p className="text-sm text-gray-600 mb-4">
              This is the signature from the initial installation request:
            </p>
            <div className="border-2 border-gray-300 rounded-lg bg-gray-50 p-3">
              {requestData.payload.signature?.dataUrl ? (
                <img 
                  src={requestData.payload.signature.dataUrl} 
                  alt="Initial Signature" 
                  className="w-full h-auto max-h-32 object-contain"
                />
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm italic">No initial signature available</div>
              )}
            </div>
          </div>
        )}

        {/* PDF Preview */}
        {requestData?.pdf_url && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiFileText className="text-blue-600" />
              Request Details (PDF)
            </h2>
            <div className="border rounded-lg overflow-hidden">
              <iframe
                src={requestData.pdf_url}
                className="w-full h-96"
                title="Request PDF"
              />
            </div>
            <a
              href={requestData.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-blue-600 hover:text-blue-700 text-sm underline"
            >
              Open PDF in new tab
            </a>
          </div>
        )}

        {/* Photo Upload */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Vehicle Photos <span className="text-red-500">*</span>
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Please upload clear photos of your vehicle from multiple angles (exterior, interior, installation area, etc.)
          </p>

          {/* Upload Button */}
          <label className="cursor-pointer inline-block">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploadingPhotos}
            />
            <div className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
              uploadingPhotos
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
              <FiUpload />
              {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
            </div>
          </label>

          {/* Photo Grid */}
          {photos.length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Vehicle ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg border"
                  />
                  <button
                    onClick={() => handleRemovePhoto(index)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Additional Notes (Optional)</h2>
          <textarea
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder="Any additional information, concerns, or special requests..."
            rows={4}
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Signature Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Your Signature <span className="text-red-500">*</span>
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Please sign below to confirm the information provided
          </p>
          <div className="border-2 border-gray-300 rounded-lg bg-white">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-48 cursor-crosshair touch-none"
              style={{ touchAction: 'none' }}
            />
          </div>
          <button
            type="button"
            onClick={clearSignature}
            className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition text-sm font-medium"
          >
            Clear Signature
          </button>
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button
            onClick={handleSubmit}
            disabled={submitting || photos.length === 0 || !signatureData}
            className={`w-full px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 ${
              submitting || photos.length === 0 || !signatureData
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {submitting ? (
              <>Submitting...</>
            ) : (
              <><FiCheck /> Submit Information</>
            )}
          </button>
          {(photos.length === 0 || !signatureData) && (
            <p className="text-sm text-red-600 text-center mt-2">
              {photos.length === 0 && 'Please upload at least one photo'}
              {photos.length === 0 && !signatureData && ' and '}
              {!signatureData && 'provide your signature'}
              {' before submitting'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;
