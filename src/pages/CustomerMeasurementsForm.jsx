import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FiCheck, FiAlertCircle, FiLogOut } from 'react-icons/fi';

const CustomerMeasurementsForm = () => {
  const { token } = useParams();
  
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
  
  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    measureA: '',
    measureB: '',
    measureC: '',
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

  // Fetch measurements data by token (only if authenticated)
  useEffect(() => {
    if (!isAuthenticated || authLoading) return;

    const fetchMeasurement = async () => {
      if (!token) {
        setError('Invalid link');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('customer_measurements')
          .select('*')
          .eq('measurements_token', token)
          .single();

        if (fetchError || !data) {
          setError('Link not found or has expired');
          setLoading(false);
          return;
        }

        // Check if already submitted
        if (data.is_submitted) {
          setSubmitted(true);
          setFormData({
            customerName: data.customer_name || '',
            vehicleMake: data.vehicle_make || '',
            vehicleModel: data.vehicle_model || '',
            vehicleYear: data.vehicle_year || '',
            measureA: data.measure_a || '',
            measureB: data.measure_b || '',
            measureC: data.measure_c || '',
            measureD: data.measure_d || '',
            measureH: data.measure_h || '',
            floorToGround: data.floor_to_ground || ''
          });
        } else {
          // Pre-fill if data exists
          if (data.payload) {
            setFormData({
              customerName: data.customer_name || '',
              vehicleMake: data.vehicle_make || '',
              vehicleModel: data.vehicle_model || '',
              vehicleYear: data.vehicle_year?.toString() || '',
              measureA: data.measure_a?.toString() || '',
              measureB: data.measure_b?.toString() || '',
              measureC: data.measure_c?.toString() || '',
              measureD: data.measure_d?.toString() || '',
              measureH: data.measure_h?.toString() || '',
              floorToGround: data.floor_to_ground?.toString() || ''
            });
          }
        }
      } catch (err) {
        console.error('Error fetching measurements:', err);
        setError('Failed to load form. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMeasurement();
  }, [token, isAuthenticated, authLoading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
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
          redirectTo: `${window.location.origin}/customer-measurements/${token}`
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

  const validate = () => {
    const newErrors = {};

    if (!formData.customerName?.trim()) {
      newErrors.customerName = 'Customer name is required';
    }
    if (!formData.vehicleMake?.trim()) {
      newErrors.vehicleMake = 'Vehicle make is required';
    }
    if (!formData.vehicleModel?.trim()) {
      newErrors.vehicleModel = 'Vehicle model is required';
    }
    if (!formData.vehicleYear?.trim()) {
      newErrors.vehicleYear = 'Vehicle year is required';
    }

    // At least some measurements should be filled
    const hasMeasurements = formData.measureA || formData.measureB || formData.measureC || 
                           formData.measureD || formData.measureH || formData.floorToGround;
    
    if (!hasMeasurements) {
      newErrors.measurements = 'Please enter at least one vehicle measurement';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        customerName: formData.customerName,
        vehicle: {
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          year: parseInt(formData.vehicleYear)
        },
        measurements: {
          A: formData.measureA ? parseFloat(formData.measureA) : null,
          B: formData.measureB ? parseFloat(formData.measureB) : null,
          C: formData.measureC ? parseFloat(formData.measureC) : null,
          D: formData.measureD ? parseFloat(formData.measureD) : null,
          H: formData.measureH ? parseFloat(formData.measureH) : null,
          floorToGround: formData.floorToGround ? parseFloat(formData.floorToGround) : null
        },
        submittedAt: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('customer_measurements')
        .update({
          customer_name: formData.customerName,
          customer_email: userEmail,
          vehicle_make: formData.vehicleMake,
          vehicle_model: formData.vehicleModel,
          vehicle_year: parseInt(formData.vehicleYear),
          measure_a: formData.measureA ? parseFloat(formData.measureA) : null,
          measure_b: formData.measureB ? parseFloat(formData.measureB) : null,
          measure_c: formData.measureC ? parseFloat(formData.measureC) : null,
          measure_d: formData.measureD ? parseFloat(formData.measureD) : null,
          measure_h: formData.measureH ? parseFloat(formData.measureH) : null,
          floor_to_ground: formData.floorToGround ? parseFloat(formData.floorToGround) : null,
          is_submitted: true,
          submitted_at: new Date().toISOString(),
          payload: {
            ...payload,
            submittedByEmail: userEmail
          }
        })
        .eq('measurements_token', token);

      if (updateError) throw updateError;

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting measurements:', err);
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
            Please sign in with your Google account to access the vehicle measurements form
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
            Your information will be securely stored and used only for your vehicle measurements
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
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <FiCheck className="mx-auto text-green-600 text-5xl mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-2">
            Your vehicle measurements have been submitted successfully.
          </p>
          <p className="text-sm text-gray-500">
            Your sales representative will use this information to prepare your job request.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with User Info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Vehicle Measurements Form
              </h1>
              <p className="text-gray-600">
                Please provide your vehicle information and measurements
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
          <div className="space-y-6">
            {/* Section 1: Customer Information */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Your Information</h2>
              
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
            </div>

            {/* Section 2: Vehicle Information */}
            <div className="border-b pb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Vehicle Information</h2>
              
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

            {/* Section 3: Vehicle Measurements */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Vehicle Measurements (mm)</h2>
              <p className="text-sm text-gray-600 mb-4">
                Please measure the following distances in millimeters. At least one measurement is required.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Measurement A
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
                    Measurement B
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
                    Measurement C
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Measurement D
                  </label>
                  <input
                    type="number"
                    name="measureD"
                    value={formData.measureD}
                    onChange={handleChange}
                    placeholder="mm"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Measurement H
                  </label>
                  <input
                    type="number"
                    name="measureH"
                    value={formData.measureH}
                    onChange={handleChange}
                    placeholder="mm"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Floor to Ground
                  </label>
                  <input
                    type="number"
                    name="floorToGround"
                    value={formData.floorToGround}
                    onChange={handleChange}
                    placeholder="mm"
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {errors.measurements && (
                <p className="text-red-500 text-sm mt-3">{errors.measurements}</p>
              )}
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
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {submitting ? (
              <>Submitting...</>
            ) : (
              <><FiCheck /> Submit Measurements</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerMeasurementsForm;
