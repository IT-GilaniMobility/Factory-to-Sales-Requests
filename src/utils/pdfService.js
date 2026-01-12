import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '../lib/supabaseClient';

/**
 * Generate a unique customer form token
 */
export const generateToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Generate PDF from HTML element
 * @param {HTMLElement} element - The element to convert to PDF
 * @param {string} filename - Name for the PDF file
 * @returns {Promise<Blob>} - PDF as a Blob
 */
export const generatePDFFromElement = async (element, filename = 'request.pdf') => {
  try {
    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    let position = 0;
    
    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if content is longer
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Return as blob
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Upload PDF to Supabase Storage
 * @param {Blob} pdfBlob - PDF as a Blob
 * @param {string} requestCode - Request code for filename
 * @returns {Promise<string>} - Public URL of uploaded PDF
 */
export const uploadPDFToStorage = async (pdfBlob, requestCode) => {
  try {
    const filename = `${requestCode}_${Date.now()}.pdf`;
    const filepath = `pdfs/${filename}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('request-pdfs')
      .upload(filepath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      });
    
    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('request-pdfs')
      .getPublicUrl(filepath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
};

/**
 * Upload vehicle photo to Supabase Storage
 * @param {File} file - Image file
 * @param {string} token - Customer form token
 * @returns {Promise<string>} - Public URL of uploaded image
 */
export const uploadVehiclePhoto = async (file, token) => {
  try {
    const fileExt = file.name.split('.').pop();
    const filename = `${token}_${Date.now()}.${fileExt}`;
    const filepath = `photos/${filename}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('vehicle-photos')
      .upload(filepath, file, {
        contentType: file.type,
        upsert: false
      });
    
    if (error) {
      console.error('Supabase photo upload error:', error);
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('vehicle-photos')
      .getPublicUrl(filepath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading vehicle photo:', error);
    throw error;
  }
};

/**
 * Generate PDF and upload to storage
 * @param {HTMLElement} element - Element to convert to PDF
 * @param {string} requestCode - Request code
 * @returns {Promise<string>} - Public URL of uploaded PDF
 */
export const generateAndUploadPDF = async (element, requestCode) => {
  try {
    console.log('🎨 Generating PDF...');
    const pdfBlob = await generatePDFFromElement(element, `${requestCode}.pdf`);
    
    console.log('📤 Uploading PDF to storage...');
    const pdfUrl = await uploadPDFToStorage(pdfBlob, requestCode);
    
    console.log('✅ PDF uploaded successfully:', pdfUrl);
    return pdfUrl;
  } catch (error) {
    console.error('❌ Error in generateAndUploadPDF:', error);
    throw error;
  }
};

/**
 * Update request with PDF URL and generate customer token
 * @param {string} tableName - Database table name
 * @param {string} requestCode - Request code
 * @param {string} pdfUrl - PDF URL
 * @returns {Promise<string>} - Customer form token
 */
export const updateRequestWithPDF = async (tableName, requestCode, pdfUrl) => {
  try {
    const token = generateToken();
    
    const { error } = await supabase
      .from(tableName)
      .update({
        pdf_url: pdfUrl,
        pdf_generated_at: new Date().toISOString(),
        customer_form_token: token
      })
      .eq('request_code', requestCode);
    
    if (error) {
      console.error('Error updating request with PDF:', error);
      throw error;
    }
    
    console.log('✅ Request updated with PDF and token');
    return token;
  } catch (error) {
    console.error('❌ Error updating request:', error);
    throw error;
  }
};

/**
 * Get customer form URL
 * @param {string} token - Customer form token
 * @returns {string} - Full customer form URL
 */
export const getCustomerFormURL = (token) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/customer-form/${token}`;
};

/**
 * Create new customer measurements form and return the token URL
 * @param {string} customerName - Optional customer name (optional)
 * @returns {Promise<string>} - Customer measurements form URL
 */
export const createCustomerMeasurementsForm = async (customerName = '') => {
  try {
    const token = generateToken();
    
    const { error } = await supabase
      .from('customer_measurements')
      .insert([{
        measurements_token: token,
        customer_name: customerName,
        is_submitted: false,
        payload: {
          createdAt: new Date().toISOString()
        }
      }]);
    
    if (error) {
      console.error('Error creating measurements form:', error);
      throw error;
    }
    
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/customer-measurements/${token}`;
    
    console.log('✅ Customer measurements form created:', url);
    return url;
  } catch (error) {
    console.error('❌ Error creating measurements form:', error);
    throw error;
  }
};

/**
 * Get customer measurements form URL
 * @param {string} token - Measurements form token
 * @returns {string} - Full measurements form URL
 */
export const getCustomerMeasurementsURL = (token) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/customer-measurements/${token}`;
};

/**
 * Fetch submitted customer measurements by customer name
 * @param {string} customerName - Customer name to search for
 * @returns {Promise<Object|null>} - Measurements data or null if not found
 */
export const fetchCustomerMeasurements = async (customerName) => {
  try {
    if (!customerName || !customerName.trim()) {
      return null;
    }

    const { data, error } = await supabase
      .from('customer_measurements')
      .select('*')
      .eq('customer_name', customerName.trim())
      .eq('is_submitted', true)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching customer measurements:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error in fetchCustomerMeasurements:', error);
    return null;
  }
};

/**
 * Create new public customer form and return the token URL
 * @param {string} generatedByEmail - Admin email who generated the link
 * @param {string} notes - Optional notes
 * @returns {Promise<string>} - Customer form public URL
 */
export const createCustomerFormPublic = async (generatedByEmail = '', notes = '') => {
  try {
    const token = generateToken();
    
    const { error } = await supabase
      .from('customer_forms_public')
      .insert([{
        form_token: token,
        generated_by_email: generatedByEmail,
        notes: notes,
        is_submitted: false,
        payload: {
          createdAt: new Date().toISOString(),
          generatedBy: generatedByEmail
        }
      }]);
    
    if (error) {
      console.error('Error creating customer form:', error);
      throw error;
    }
    
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/customer-form-public/${token}`;
    
    console.log('✅ Customer form public created:', url);
    return url;
  } catch (error) {
    console.error('❌ Error creating customer form:', error);
    throw error;
  }
};

/**
 * Get customer form public URL
 * @param {string} token - Customer form token
 * @returns {string} - Full customer form URL
 */
export const getCustomerFormPublicURL = (token) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/customer-form-public/${token}`;
};

/**
 * Fetch all submitted customer forms
 * @returns {Promise<Array>} - Array of submitted customer forms
 */
export const fetchSubmittedCustomerForms = async () => {
  try {
    const { data, error } = await supabase
      .from('customer_forms_public')
      .select('*')
      .eq('is_submitted', true)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer forms:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in fetchSubmittedCustomerForms:', error);
    return [];
  }
};
