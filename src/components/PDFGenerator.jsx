import React from 'react';

/**
 * PDF Generator Component - Single Page Format
 * Clean, professional layout with customer info and signature space
 */
const PDFGenerator = React.forwardRef(({ formData }, ref) => {
  const formatMm = (value) => {
    return value === null || value === '' ? '—' : `${value} mm`;
  };

  return (
    <div ref={ref} style={{ width: '210mm', height: '297mm', fontSize: '11px', fontFamily: 'Arial, sans-serif', backgroundColor: 'white', padding: '24px', color: 'black' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid #1e40af' }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1e40af' }}>
          WORK REQUEST FORM
        </h1>
        <p style={{ margin: '4px 0', fontSize: '10px', color: '#666' }}>
          {formData.jobRequest || 'Wheelchair Lifter Installation'}
        </p>
      </div>

      {/* Request Code and Date */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '12px', fontSize: '10px' }}>
        <div>
          <p style={{ margin: '0 0 2px 0', fontWeight: 'bold' }}>Request Code:</p>
          <p style={{ margin: 0, fontFamily: 'monospace', fontWeight: 'bold' }}>{formData.requestCode || 'DRAFT'}</p>
        </div>
        <div>
          <p style={{ margin: '0 0 2px 0', fontWeight: 'bold' }}>Date:</p>
          <p style={{ margin: 0 }}>{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Customer Information Section */}
      <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
        <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', fontSize: '11px' }}>CUSTOMER INFORMATION</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '10px' }}>
          <div>
            <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#666' }}>Name:</p>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{formData.customer?.name || '—'}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#666' }}>Mobile:</p>
            <p style={{ margin: 0 }}>{formData.customer?.mobile || '—'}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#666' }}>Address:</p>
            <p style={{ margin: 0 }}>{formData.customer?.address || '—'}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#666' }}>Quote Ref:</p>
            <p style={{ margin: 0 }}>{formData.customer?.quoteRef || '—'}</p>
          </div>
        </div>
      </div>

      {/* Vehicle Information */}
      <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
        <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', fontSize: '11px' }}>VEHICLE INFORMATION</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '10px' }}>
          <div>
            <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#666' }}>Make:</p>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{formData.job?.vehicle?.make || '—'}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#666' }}>Model:</p>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{formData.job?.vehicle?.model || '—'}</p>
          </div>
          <div>
            <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#666' }}>Year:</p>
            <p style={{ margin: 0 }}>{formData.job?.vehicle?.year || '—'}</p>
          </div>
        </div>
      </div>

      {/* Job-Specific Details */}
      {formData.jobRequest === 'Wheelchair Lifter Installation' && (
        <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '10px' }}>
          <p style={{ margin: '0 0 6px 0', fontWeight: 'bold' }}>SPECIFICATIONS</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div>
              <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#666' }}>User Weight:</p>
              <p style={{ margin: 0 }}>{formData.userInfo?.userWeightKg || '—'} kg</p>
            </div>
            <div>
              <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#666' }}>Wheelchair:</p>
              <p style={{ margin: 0 }}>{formData.userInfo?.wheelchairType || '—'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#666' }}>Measure A:</p>
              <p style={{ margin: 0 }}>{formatMm(formData.measureA)}</p>
            </div>
          </div>
        </div>
      )}

      {formData.jobRequest === 'The Ultimate G24' && (
        <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '10px' }}>
          <p style={{ margin: '0 0 6px 0', fontWeight: 'bold' }}>SPECIFICATIONS</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#666' }}>Product Model:</p>
              <p style={{ margin: 0 }}>{formData.productModel?.selection || '—'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#666' }}>Seat Position:</p>
              <p style={{ margin: 0 }}>{formData.secondRowSeatPosition?.selection || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {formData.jobRequest === 'Diving Solution Installation' && (
        <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '10px' }}>
          <p style={{ margin: '0 0 6px 0', fontWeight: 'bold' }}>SPECIFICATIONS</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#666' }}>Device Model:</p>
              <p style={{ margin: 0 }}>{formData.divingSolution?.deviceModel || '—'}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#666' }}>Location:</p>
              <p style={{ margin: 0 }}>{formData.divingSolution?.installationLocation || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {formData.jobRequest === 'Turney Seat Installation' && (
        <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '10px' }}>
          <p style={{ margin: '0 0 6px 0', fontWeight: 'bold' }}>SPECIFICATIONS</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#666' }}>User Weight:</p>
              <p style={{ margin: 0 }}>{formData.userInfo?.userWeightKg || '—'} kg</p>
            </div>
            <div>
              <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#666' }}>Product:</p>
              <p style={{ margin: 0 }}>{formData.productModel?.selection || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Signature Section */}
      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
        <p style={{ margin: '0 0 4px 0', fontWeight: 'bold', fontSize: '10px' }}>CUSTOMER SIGNATURE:</p>
        <div style={{ 
          height: '40px', 
          border: '1px solid #999', 
          borderRadius: '2px',
          marginBottom: '4px',
          backgroundColor: '#fafafa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {formData?.signatureData ? (
            <img 
              src={formData.signatureData} 
              alt="Customer Signature" 
              style={{ 
                maxHeight: '40px',
                maxWidth: '100%',
                objectFit: 'contain'
              }}
            />
          ) : null}
        </div>
        <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#666' }}>Customer/Authority Name & Date</p>
      </div>
    </div>
  );
});

PDFGenerator.displayName = 'PDFGenerator';

export default PDFGenerator;
