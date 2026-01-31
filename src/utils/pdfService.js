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
export const generatePDFFromElement = async (element, filename = 'request.pdf', { singlePage = false, pageSize = 'a4' } = {}) => {
  try {
    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      width: element.scrollWidth,
      height: element.scrollHeight,
      x: 0,
      y: 0
    });

    const imgData = canvas.toDataURL('image/png');
    if (singlePage) {
      // Fit entire image to a single page
      const pdf = new jsPDF('p', 'mm', pageSize);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pxToMm = 25.4 / 96; // 96 DPI
      const imgWidthMm = canvas.width * pxToMm;
      const imgHeightMm = canvas.height * pxToMm;
      const scale = Math.min(pageWidth / imgWidthMm, pageHeight / imgHeightMm);
      const renderWidth = imgWidthMm * scale;
      const renderHeight = imgHeightMm * scale;
      const marginX = (pageWidth - renderWidth) / 2;
      const marginY = (pageHeight - renderHeight) / 2;
      pdf.addImage(imgData, 'PNG', marginX, marginY, renderWidth, renderHeight);
      return pdf.output('blob');
    } else {
      // Calculate PDF dimensions and paginate
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      const pdf = new jsPDF('p', 'mm', pageSize);
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      return pdf.output('blob');
    }
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
    const { error } = await supabase.storage
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
    const { error } = await supabase.storage
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
    const pdfBlob = await generatePDFFromElement(element, `${requestCode}.pdf`, { singlePage: true, pageSize: 'a4' });
    
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
 * Generate single-page customer form PDF as data URL
 * @param {HTMLElement} element - Element to capture
 * @param {string} token - Customer form token
 * @returns {Promise<string>} - Data URL of PDF
 */
export const generateAndUploadCustomerFormPDF = async (element, token) => {
  try {
    console.log('🎨 Generating single-page customer form PDF...');
    const pdfBlob = await generatePDFFromElement(element, `customerform_${token}.pdf`, { singlePage: true, pageSize: 'a4' });
    
    // Convert blob to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        console.log('✅ Customer form PDF generated as data URL');
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });
  } catch (error) {
    console.error('❌ Error generating customer form PDF:', error);
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
    const { error } = await supabase
      .from(tableName)
      .update({
        pdf_url: pdfUrl,
        pdf_generated_at: new Date().toISOString(),
        customer_form_token: null
      })
      .eq('request_code', requestCode);
    
    if (error) {
      console.error('Error updating request with PDF:', error);
      throw error;
    }
    
    console.log('✅ Request updated with PDF (no customer token)');
  } catch (error) {
    console.error('❌ Error updating request:', error);
    throw error;
  }
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
// Customer public forms and measurements flows have been removed.

/**
 * Upload request attachment file to Supabase Storage
 * @param {File} file - File to upload
 * @param {string} requestCode - Request code
 * @returns {Promise<Object>} - Object with filename and URL
 */
export const uploadRequestAttachment = async (file, requestCode) => {
  try {
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const filename = `${requestCode}_${timestamp}.${fileExt}`;
    const filepath = `request-attachments/${filename}`;
    
    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('request-attachments')
      .upload(filepath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Supabase attachment upload error:', error);
      throw error;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('request-attachments')
      .getPublicUrl(filepath);
    
    return {
      filename: file.name,
      url: urlData.publicUrl,
      uploadedAt: new Date().toISOString(),
      size: file.size
    };
  } catch (error) {
    console.error('Error uploading request attachment:', error);
    throw error;
  }
};

/**
 * Delete request attachment from storage
 * @param {string} fileUrl - URL of the file to delete
 * @returns {Promise<void>}
 */
export const deleteRequestAttachment = async (fileUrl) => {
  try {
    // Extract filename from URL
    const urlParts = fileUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const filepath = `request-attachments/${filename}`;
    
    const { error } = await supabase.storage
      .from('request-attachments')
      .remove([filepath]);
    
    if (error) throw error;
    console.log('✅ Attachment deleted:', filename);
  } catch (error) {
    console.error('Error deleting attachment:', error);
    throw error;
  }
};
