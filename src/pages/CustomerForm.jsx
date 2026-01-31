import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { uploadVehiclePhoto } from '../utils/pdfService';
import { FiUpload, FiX, FiCheck } from 'react-icons/fi';

const CustomerForm = () => {
  const { token } = useParams();
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

        // Check if already submitted and load their data
        if (found.customer_submitted) {
          setSubmitted(true);
          // Load previously submitted data
          if (found.customer_filled_data) {
            setPhotos(found.customer_filled_data.vehicle_photos || found.customer_vehicle_photos || []);
            setCustomerNotes(found.customer_filled_data.notes || found.customer_notes || '');
            setSignatureData(found.customer_filled_data.signature || null);
          }
        }

        console.log('📋 Customer Form - Request Data:', found);
        console.log('📋 Customer Form - Payload:', found.payload);
        console.log('📋 Customer Form - Signature:', found.payload?.signature);
        console.log('📋 Customer Form - Customer Filled Data:', found.customer_filled_data);
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
        const dataUrl = canvas.toDataURL('image/png');
        setSignatureData(dataUrl);
        console.log('✍️ Signature captured:', dataUrl.substring(0, 50) + '...');
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

    console.log('📤 Submitting customer form:', {
      photos: photos.length,
      notes: customerNotes.substring(0, 50),
      signature: signatureData.substring(0, 50) + '...',
      token: token
    });

    setSubmitting(true);

    try {
      // Prepare filled data with signature
      const customerFilledData = {
        vehicle_photos: photos,
        notes: customerNotes,
        signature: signatureData,
        submitted_at: new Date().toISOString()
      };

      console.log('💾 Saving to table:', requestData.tableName);
      console.log('🖊️ Signature data being saved:', signatureData ? signatureData.substring(0, 50) + '...' : 'MISSING!');
      console.log('🖊️ customerFilledData object:', { ...customerFilledData, signature: signatureData ? 'exists' : 'MISSING' });

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

      if (updateError) {
        console.error('❌ Update error:', updateError);
        throw updateError;
      }

      console.log('✅ Customer form submitted successfully');
      setSubmitted(true);
    } catch (error) {
      console.error('❌ Error submitting customer data:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="border-4 border-black bg-yellow-300 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="animate-pulse text-center">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-black font-black text-xl uppercase">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="border-4 border-black bg-red-200 p-8 max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="text-6xl mb-4 text-center">⚠️</div>
          <h1 className="text-3xl font-black text-black mb-4 uppercase text-center border-b-4 border-black pb-3">Error</h1>
          <p className="text-black font-bold text-center">{error}</p>
        </div>
      </div>
    );
  }

  // Submitted view now shows the form in read-only mode
  const isReadOnly = submitted;

  const payload = requestData?.payload || {};

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-12">
        
        {/* Success Banner - Neo-brutalist Style */}
        {isReadOnly && (
          <div className="mb-8 border-4 border-black bg-green-400 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start gap-4">
              <div className="text-4xl">✓</div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-black mb-2">FORM SUBMITTED</h2>
                <p className="text-black text-sm md:text-base font-medium">
                  Your sales representative will contact you shortly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header - Neo-brutalist */}
        <div className="mb-8 border-4 border-black bg-yellow-300 p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-2xl md:text-4xl font-black text-black mb-3 uppercase tracking-tight">
            Vehicle Information
          </h1>
          <div className="border-2 border-black bg-white px-4 py-2 inline-block mb-3">
            <p className="text-xs md:text-sm font-bold text-black uppercase">
              Request: <span className="font-mono">{requestData?.request_code}</span>
            </p>
          </div>
          {!isReadOnly && (
            <p className="text-sm md:text-base text-black font-medium mt-3">
              Please upload vehicle photos and provide your signature below.
            </p>
          )}
        </div>

        {/* Customer Information - Neo-brutalist */}
        <div className="mb-6 border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl md:text-2xl font-black text-black mb-6 uppercase border-b-4 border-black pb-3">
            Your Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Name</p>
              <p className="text-base md:text-lg font-bold text-black border-l-4 border-black pl-3">
                {payload.customer?.name || requestData?.customer_name || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Mobile</p>
              <p className="text-base md:text-lg font-bold text-black border-l-4 border-black pl-3">
                {payload.customer?.mobile || requestData?.customer_mobile || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Vehicle</p>
              <p className="text-base md:text-lg font-bold text-black border-l-4 border-black pl-3">
                {payload.job?.vehicle?.make || requestData?.vehicle_make} {payload.job?.vehicle?.model || requestData?.vehicle_model} {payload.job?.vehicle?.year || requestData?.vehicle_year}
              </p>
            </div>
          </div>
        </div>

        {/* Training Checklist - Neo-brutalist */}
        <div className="mb-6 border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl md:text-2xl font-black text-black mb-4 uppercase border-b-4 border-black pb-3">
            Training Acknowledgement
          </h2>
          <div className="space-y-3">
            {['Operate Device', 'Emergency Procedure', 'Main Fuse Location', 'Tie Down & Seatbelts'].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 border-2 border-black bg-green-100 p-3">
                <span className="text-2xl">✓</span>
                <span className="text-sm md:text-base font-bold text-black">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Initial Request Signature - Neo-brutalist */}
        {requestData?.payload?.signature && (
          <div className="mb-6 border-4 border-black bg-blue-100 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-xl md:text-2xl font-black text-black mb-4 uppercase border-b-4 border-black pb-3">
              Installation Request Signature
            </h2>
            <div className="border-4 border-black bg-white p-4">
              {requestData.payload.signature?.dataUrl || requestData.payload.signature ? (
                <img 
                  src={requestData.payload.signature?.dataUrl || requestData.payload.signature} 
                  alt="Initial Signature" 
                  className="w-full h-auto max-h-32 object-contain"
                  onError={(e) => {
                    console.error('Failed to load signature image:', e);
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm font-bold">NO SIGNATURE</div>
              )}
            </div>
          </div>
        )}

        {/* Photo Upload - Neo-brutalist */}
        <div className="mb-6 border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl md:text-2xl font-black text-black mb-4 uppercase border-b-4 border-black pb-3">
            Vehicle Photos {!isReadOnly && <span className="text-red-600">*</span>}
          </h2>
          
          {!isReadOnly && (
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhotos}
              />
              <div className={`border-4 border-black px-6 py-4 font-black text-base uppercase transition-all inline-flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${
                uploadingPhotos
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-400 text-black hover:bg-blue-500'
              }`}>
                <FiUpload className="text-xl" />
                {uploadingPhotos ? 'UPLOADING...' : 'UPLOAD PHOTOS'}
              </div>
            </label>
          )}

          {photos.length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((url, index) => (
                <div key={index} className="relative group border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <img
                    src={url}
                    alt={`Vehicle ${index + 1}`}
                    className="w-full h-32 md:h-40 object-cover"
                  />
                  {!isReadOnly && (
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 bg-red-600 border-2 border-black text-white font-black px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <FiX className="text-lg" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {photos.length === 0 && (
            <div className="mt-4 border-4 border-dashed border-gray-400 bg-gray-50 p-8 text-center">
              <p className="text-gray-600 font-bold uppercase text-sm">No photos uploaded yet</p>
            </div>
          )}
        </div>

        {/* Additional Notes - Neo-brutalist */}
        <div className="mb-6 border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl md:text-2xl font-black text-black mb-4 uppercase border-b-4 border-black pb-3">
            Additional Notes
          </h2>
          <textarea
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value)}
            placeholder="Any additional information, concerns, or special requests..."
            rows={5}
            readOnly={isReadOnly}
            className="w-full border-4 border-black p-4 font-medium text-base focus:outline-none focus:ring-4 focus:ring-yellow-300"
            style={isReadOnly ? { backgroundColor: '#f3f4f6', cursor: 'default' } : {}}
          />
        </div>

        {/* Signature Section - Neo-brutalist */}
        <div className="mb-6 border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl md:text-2xl font-black text-black mb-4 uppercase border-b-4 border-black pb-3">
            Your Signature {!isReadOnly && <span className="text-red-600">*</span>}
          </h2>
          
          {isReadOnly && signatureData ? (
            <div className="border-4 border-black bg-green-100 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <img 
                src={signatureData} 
                alt="Customer Signature" 
                className="w-full h-auto max-h-40 object-contain bg-white border-2 border-black p-2"
              />
              <div className="mt-4 bg-green-500 border-2 border-black p-3 text-center">
                <p className="text-black font-black text-sm uppercase">✓ SIGNED & SUBMITTED</p>
              </div>
            </div>
          ) : (
            <>
              <div className="border-4 border-black bg-white relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
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
                  className="w-full h-40 md:h-48 cursor-crosshair touch-none"
                  style={{ touchAction: 'none' }}
                />
                {signatureData && (
                  <div className="absolute top-2 right-2 bg-green-500 border-2 border-black px-3 py-1 font-black text-xs uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    ✓ CAPTURED
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={clearSignature}
                className="mt-4 border-4 border-black bg-gray-200 text-black px-6 py-3 font-black uppercase text-sm hover:bg-gray-300 transition shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1"
              >
                Clear Signature
              </button>
            </>
          )}
        </div>

        {/* Submit Button - Neo-brutalist */}
        {!isReadOnly && (
          <div className="border-4 border-black bg-white p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <button
              onClick={handleSubmit}
              disabled={submitting || photos.length === 0 || !signatureData}
              className={`w-full border-4 border-black px-8 py-5 font-black text-lg md:text-xl uppercase transition-all flex items-center justify-center gap-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 ${
                submitting || photos.length === 0 || !signatureData
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-green-400 text-black hover:bg-green-500'
              }`}
            >
              {submitting ? (
                <>SUBMITTING...</>
              ) : (
                <><FiCheck className="text-2xl" /> SUBMIT FORM</>
              )}
            </button>
            {(photos.length === 0 || !signatureData) && (
              <div className="mt-4 border-4 border-red-500 bg-red-50 p-4 text-center">
                <p className="text-red-700 font-black text-sm uppercase">
                  {photos.length === 0 && '⚠ Upload photos'}
                  {photos.length === 0 && !signatureData && ' & '}
                  {!signatureData && '⚠ Sign above'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerForm;
