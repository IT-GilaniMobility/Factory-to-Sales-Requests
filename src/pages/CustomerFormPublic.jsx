import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { generateAndUploadCustomerFormPDF } from '../utils/pdfService';
import { FiCheck, FiAlertCircle, FiLogOut } from 'react-icons/fi';
import wheelchairSide from '../assets/wheelchair_sideview.png';
import wheelchairFront from '../assets/wheelchair_front.webp';
import vehicleMeasurements from '../assets/vehicle_measurements.png';

const CustomerFormPublic = () => {
  const { token } = useParams();
  const canvasRef = useRef(null);
  const formContainerRef = useRef(null);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [userName, setUserName] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  
  // Signature state
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerMobile: '',
    customerAddress: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    userWeight: '',
    wheelchairWeight: '',
    wheelchairType: '',
    measureA: '',
    measureB: '',
    measureC: '',
    userSituation: '',
    measureD: '',
    measureH: '',
    floorToGround: ''
  });

  const [errors, setErrors] = useState({});

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session?.user) {
          setIsAuthenticated(true);
          setUserEmail(sessionData.session.user.email);
          setUserName(sessionData.session.user.user_metadata?.full_name || sessionData.session.user.email);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setIsAuthenticated(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email);
        setUserName(session.user.user_metadata?.full_name || session.user.email);
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
        setUserName(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  // Fetch form data by token (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    const fetchForm = async () => {
      if (!token) {
        setError('Invalid link');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('customer_forms_public')
          .select('*')
          .eq('form_token', token)
          .single();

        if (fetchError || !data) {
          setError('Form not found or link has expired');
          setLoading(false);
          return;
        }

        // Check if already submitted
        if (data.is_submitted) {
          setSubmitted(true);
          // Populate form data for display
          setFormData({
            customerName: data.customer_name || '',
            customerMobile: data.customer_mobile || '',
            customerAddress: data.customer_address || '',
            vehicleMake: data.vehicle_make || '',
            vehicleModel: data.vehicle_model || '',
            vehicleYear: data.vehicle_year?.toString() || '',
            userWeight: data.user_weight_kg?.toString() || '',
            wheelchairWeight: data.wheelchair_weight_kg?.toString() || '',
            wheelchairType: data.wheelchair_type || '',
            measureA: data.measure_a?.toString() || '',
            measureB: data.measure_b?.toString() || '',
            measureC: data.measure_c?.toString() || '',
            userSituation: data.user_situation || '',
            measureD: data.measure_d?.toString() || '',
            measureH: data.measure_h?.toString() || '',
            floorToGround: data.floor_to_ground?.toString() || ''
          });
          if (data.signature_data_url) {
            setSignatureData(data.signature_data_url);
          }
          if (data.payload && data.payload.pdfUrl) {
            setPdfUrl(data.payload.pdfUrl);
          }
        }
      } catch (err) {
        console.error('Error fetching form:', err);
        setError('Failed to load form. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [token, isAuthenticated, authLoading]);

  // Initialize and resize canvas for device pixel ratio and container width
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;

      const dpr = Math.max(window.devicePixelRatio || 1, 1);
      const cssWidth = parent.clientWidth; // fill container width
      const cssHeight = Math.max(Math.floor(cssWidth * 0.25), 160); // 4:1 ratio min 160px

      canvas.style.width = cssWidth + 'px';
      canvas.style.height = cssHeight + 'px';
      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
    };

    if (isAuthenticated && !loading) {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
    }
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isAuthenticated, loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Google Login Handler
  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/customer-form-public/${token}`
        }
      });

      if (error) {
        setError(`Login failed: ${error.message}`);
        setIsSigningIn(false);
      }
    } catch (err) {
      console.error('Google login error:', err);
      setError('Failed to sign in with Google. Please try again.');
      setIsSigningIn(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setUserEmail(null);
      setUserName(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Signature canvas handlers
  const startDrawing = (e) => {
    if (e.touches) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    // We already scale the context by DPR, so use CSS pixel coords
    const x = (point.clientX - rect.left);
    const y = (point.clientY - rect.top);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.touches) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    // Use CSS pixel coords since context is DPR-scaled
    const x = (point.clientX - rect.left);
    const y = (point.clientY - rect.top);
    
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

  const validate = () => {
    const newErrors = {};

    if (!formData.customerName?.trim()) newErrors.customerName = 'Name is required';
    if (!formData.customerMobile?.trim()) newErrors.customerMobile = 'Mobile is required';
    if (!formData.customerAddress?.trim()) newErrors.customerAddress = 'Address is required';
    
    if (!formData.vehicleMake?.trim()) newErrors.vehicleMake = 'Vehicle make is required';
    if (!formData.vehicleModel?.trim()) newErrors.vehicleModel = 'Vehicle model is required';
    if (!formData.vehicleYear?.trim()) newErrors.vehicleYear = 'Vehicle year is required';
    
    if (!formData.userWeight?.trim()) newErrors.userWeight = 'User weight is required';
    if (!formData.wheelchairWeight?.trim()) newErrors.wheelchairWeight = 'Wheelchair weight is required';
    if (!formData.wheelchairType?.trim()) newErrors.wheelchairType = 'Wheelchair type is required';
    
    if (!formData.measureD?.trim()) newErrors.measureD = 'Measure D is required';
    if (!formData.measureH?.trim()) newErrors.measureH = 'Measure H is required';
    if (!formData.floorToGround?.trim()) newErrors.floorToGround = 'Floor to Ground is required';
    
    if (!signatureData) newErrors.signature = 'Signature is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formRootRef = useRef(null);

  const handleSubmit = async () => {
    if (!validate()) {
      window.scrollTo(0, 0);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        customerName: formData.customerName,
        customerMobile: formData.customerMobile,
        customerAddress: formData.customerAddress,
        customerEmail: userEmail,
        vehicle: {
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          year: parseInt(formData.vehicleYear)
        },
        userMeasurements: {
          weight: parseFloat(formData.userWeight),
          wheelchairWeight: parseFloat(formData.wheelchairWeight),
          wheelchairType: formData.wheelchairType,
          measureA: formData.measureA ? parseFloat(formData.measureA) : null,
          measureB: formData.measureB ? parseFloat(formData.measureB) : null,
          measureC: formData.measureC ? parseFloat(formData.measureC) : null,
          situation: formData.userSituation
        },
        vehicleMeasurements: {
          measureD: parseFloat(formData.measureD),
          measureH: parseFloat(formData.measureH),
          floorToGround: parseFloat(formData.floorToGround)
        },
        signature: signatureData,
        submittedAt: new Date().toISOString(),
        submittedByEmail: userEmail
      };

      const { error: updateError } = await supabase
        .from('customer_forms_public')
        .update({
          customer_name: formData.customerName,
          customer_mobile: formData.customerMobile,
          customer_address: formData.customerAddress,
          customer_email: userEmail,
          vehicle_make: formData.vehicleMake,
          vehicle_model: formData.vehicleModel,
          vehicle_year: parseInt(formData.vehicleYear),
          user_weight_kg: parseFloat(formData.userWeight),
          wheelchair_weight_kg: parseFloat(formData.wheelchairWeight),
          wheelchair_type: formData.wheelchairType,
          measure_a: formData.measureA ? parseFloat(formData.measureA) : null,
          measure_b: formData.measureB ? parseFloat(formData.measureB) : null,
          measure_c: formData.measureC ? parseFloat(formData.measureC) : null,
          user_situation: formData.userSituation,
          measure_d: parseFloat(formData.measureD),
          measure_h: parseFloat(formData.measureH),
          floor_to_ground: parseFloat(formData.floorToGround),
          signature_data_url: signatureData,
          is_submitted: true,
          submitted_at: new Date().toISOString(),
          payload
        })
        .eq('form_token', token);

      if (updateError) throw updateError;

      // Show success immediately; then generate PDF in background
      setSubmitted(true);
      (async () => {
        try {
          const targetEl = formRootRef.current || document.body;
          const uploadedUrl = await generateAndUploadCustomerFormPDF(targetEl, token);
          setPdfUrl(uploadedUrl);
          await supabase
            .from('customer_forms_public')
            .update({
              payload: {
                ...payload,
                pdfUrl: uploadedUrl
              }
            })
            .eq('form_token', token);
        } catch (pdfErr) {
          console.error('PDF generation failed (non-blocking):', pdfErr);
        }
      })();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show Google login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome</h1>
          <p className="text-gray-600 mb-6">
            Please sign in with your Google account to access the customer form
          </p>
          
          <button
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border-2 border-gray-200 shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              <path fill="none" d="M1 1h22v22H1z"/>
            </svg>
            {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
          </button>

          <p className="text-xs text-gray-500 mt-4">
            Your information will be securely stored and used only for your vehicle installation request
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <FiAlertCircle className="mx-auto text-red-600 text-5xl mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl">
          <div className="text-center mb-4">
            <FiCheck className="mx-auto text-green-600 text-4xl mb-2" />
            <h1 className="text-2xl font-bold text-gray-800">{formData.customerName || 'Customer'}</h1>
            <p className="text-gray-600">Your form was submitted successfully.</p>
          </div>
          {pdfUrl ? (
            <div className="border rounded-lg overflow-hidden" style={{ height: '80vh' }}>
              <iframe title="Customer Form PDF" src={pdfUrl} className="w-full h-full" />
            </div>
          ) : (
            <p className="text-center text-gray-500">Your PDF is being generated in the background. You may close this page.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div ref={formContainerRef} className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with User Info */}
        <div ref={formRootRef} className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Customer Information Form
              </h1>
              <p className="text-gray-600">
                Please fill in all required information for your wheelchair lifter installation
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-2">Signed in as:</p>
              <p className="font-semibold text-gray-800 mb-2">{userName}</p>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
              >
                <FiLogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="space-y-8">
            {/* Section 1: Customer Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">1. Your Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.customerName && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerMobile"
                    value={formData.customerMobile}
                    onChange={handleChange}
                    placeholder="+971 50 123 4567"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.customerMobile && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerMobile}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="customerAddress"
                    value={formData.customerAddress}
                    onChange={handleChange}
                    placeholder="Enter your full address"
                    rows={3}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.customerAddress && (
                    <p className="text-red-500 text-sm mt-1">{errors.customerAddress}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Vehicle Information */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">2. Vehicle Information</h2>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="vehicleMake"
                    value={formData.vehicleMake}
                    onChange={handleChange}
                    placeholder="e.g., Toyota"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.vehicleMake && (
                    <p className="text-red-500 text-sm mt-1">{errors.vehicleMake}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="vehicleModel"
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    placeholder="e.g., Camry"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.vehicleModel && (
                    <p className="text-red-500 text-sm mt-1">{errors.vehicleModel}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="vehicleYear"
                    value={formData.vehicleYear}
                    onChange={handleChange}
                    placeholder="e.g., 2023"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.vehicleYear && (
                    <p className="text-red-500 text-sm mt-1">{errors.vehicleYear}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: User & Wheelchair Measurements */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">3. User & Wheelchair Information</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Weight (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="userWeight"
                    value={formData.userWeight}
                    onChange={handleChange}
                    placeholder="kg"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.userWeight && (
                    <p className="text-red-500 text-sm mt-1">{errors.userWeight}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wheelchair Weight (kg) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="wheelchairWeight"
                    value={formData.wheelchairWeight}
                    onChange={handleChange}
                    placeholder="kg"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.wheelchairWeight && (
                    <p className="text-red-500 text-sm mt-1">{errors.wheelchairWeight}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wheelchair Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="wheelchairType"
                    value={formData.wheelchairType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="Manual">Manual</option>
                    <option value="Electric">Electric</option>
                  </select>
                  {errors.wheelchairType && (
                    <p className="text-red-500 text-sm mt-1">{errors.wheelchairType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Situation
                  </label>
                  <input
                    type="text"
                    name="userSituation"
                    value={formData.userSituation}
                    onChange={handleChange}
                    placeholder="Describe user's mobility situation"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Reference Images:</p>
                <div className="grid grid-cols-2 gap-4">
                  <img src={wheelchairSide} alt="Wheelchair side view" className="w-full rounded border" />
                  <img src={wheelchairFront} alt="Wheelchair front view" className="w-full rounded border" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Measure A (mm)
                  </label>
                  <input
                    type="number"
                    name="measureA"
                    value={formData.measureA}
                    onChange={handleChange}
                    placeholder="mm"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Measure B (mm)
                  </label>
                  <input
                    type="number"
                    name="measureB"
                    value={formData.measureB}
                    onChange={handleChange}
                    placeholder="mm"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Measure C (mm)
                  </label>
                  <input
                    type="number"
                    name="measureC"
                    value={formData.measureC}
                    onChange={handleChange}
                    placeholder="mm"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Vehicle Measurements */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">4. Vehicle Measurements</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Reference Image:</p>
                <img src={vehicleMeasurements} alt="Vehicle measurements" className="w-full rounded border" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Measure D (mm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="measureD"
                    value={formData.measureD}
                    onChange={handleChange}
                    placeholder="mm"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.measureD && (
                    <p className="text-red-500 text-sm mt-1">{errors.measureD}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Measure H (mm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="measureH"
                    value={formData.measureH}
                    onChange={handleChange}
                    placeholder="mm"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.measureH && (
                    <p className="text-red-500 text-sm mt-1">{errors.measureH}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Floor to Ground (mm) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="floorToGround"
                    value={formData.floorToGround}
                    onChange={handleChange}
                    placeholder="mm"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.floorToGround && (
                    <p className="text-red-500 text-sm mt-1">{errors.floorToGround}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 5: Signature */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">5. Signature</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Signature <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    // dimensions set dynamically; keep attributes but overridden by style
                    width={800}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    onTouchCancel={stopDrawing}
                    className="w-full h-32 cursor-crosshair touch-none select-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="mt-2 px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Clear Signature
                </button>
                {errors.signature && (
                  <p className="text-red-500 text-sm mt-1">{errors.signature}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full px-8 py-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 ${
              submitting
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {submitting ? (
              <>Submitting...</>
            ) : (
              <><FiCheck /> Submit Information</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerFormPublic;
