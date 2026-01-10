import React from 'react';

/**
 * PDF Generator Component
 * This component renders the form data in a printable PDF format
 */
const PDFGenerator = React.forwardRef(({ formData }, ref) => {
  const formatMm = (value) => {
    return value === null || value === '' ? '—' : `${value} mm`;
  };

  return (
    <div ref={ref} className="bg-white p-8 text-black" style={{ width: '210mm', minHeight: '297mm' }}>
      {/* Header */}
      <div className="border-b-4 border-blue-600 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">
          {formData.jobRequest || 'Wheelchair Lifter Installation'} Request
        </h1>
        <div className="text-sm text-gray-600">
          <p>Request Code: <span className="font-mono font-bold">{formData.requestCode || 'N/A'}</span></p>
          <p>Generated: {new Date().toLocaleString()}</p>
        </div>
      </div>

      {/* Salesperson Information */}
      {formData.salespersonName && (
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <h2 className="text-lg font-bold mb-2 text-blue-700">Sales Information</h2>
          <p><strong>Salesperson:</strong> {formData.salespersonName}</p>
        </div>
      )}

      {/* Customer Information */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 text-gray-800 border-b pb-2">Customer Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-semibold">{formData.customer?.name || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Mobile</p>
            <p className="font-semibold">{formData.customer?.mobile || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-semibold">{formData.customer?.email || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Quote Reference</p>
            <p className="font-semibold">{formData.customer?.quoteRef || '—'}</p>
          </div>
        </div>
        {formData.customer?.address && (
          <div className="mt-3">
            <p className="text-sm text-gray-600">Address</p>
            <p className="font-semibold">{formData.customer.address}</p>
          </div>
        )}
      </div>

      {/* Vehicle Information */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 text-gray-800 border-b pb-2">Vehicle Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Make</p>
            <p className="font-semibold">{formData.job?.vehicle?.make || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Model</p>
            <p className="font-semibold">{formData.job?.vehicle?.model || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Year</p>
            <p className="font-semibold">{formData.job?.vehicle?.year || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">VIN</p>
            <p className="font-semibold font-mono text-xs">{formData.job?.vehicle?.vin || '—'}</p>
          </div>
        </div>
      </div>

      {/* Job Specific Information */}
      {formData.jobRequest === 'Wheelchair Lifter Installation' && (
        <>
          {/* User Information */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 text-gray-800 border-b pb-2">User Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Weight (kg)</p>
                <p className="font-semibold">{formData.userInfo?.userWeightKg || '—'} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Wheelchair Type</p>
                <p className="font-semibold">{formData.userInfo?.wheelchairType || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Wheelchair Weight (kg)</p>
                <p className="font-semibold">{formData.userInfo?.wheelchairWeightKg || '—'} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lifter Type</p>
                <p className="font-semibold">{formData.lifterType?.selection || '—'}</p>
              </div>
            </div>
          </div>

          {/* Measurements */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 text-gray-800 border-b pb-2">Measurements</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Measure A</p>
                <p className="font-semibold">{formatMm(formData.measureA)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Measure B</p>
                <p className="font-semibold">{formatMm(formData.measureB)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Measure C</p>
                <p className="font-semibold">{formatMm(formData.measureC)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Measure D</p>
                <p className="font-semibold">{formatMm(formData.measureD)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Measure H</p>
                <p className="font-semibold">{formatMm(formData.measureH)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Misura A</p>
                <p className="font-semibold">{formatMm(formData.misuaA)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Misura B</p>
                <p className="font-semibold">{formatMm(formData.misuaB)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Misura C</p>
                <p className="font-semibold">{formatMm(formData.misuaC)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Misura D</p>
                <p className="font-semibold">{formatMm(formData.misuaD)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Misura E</p>
                <p className="font-semibold">{formatMm(formData.misuaE)}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {formData.jobRequest === 'The Ultimate G24' && (
        <>
          {/* G24 Specific Information */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 text-gray-800 border-b pb-2">G24 Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Product Model</p>
                <p className="font-semibold">{formData.productModel?.selection || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Second Row Seat Position</p>
                <p className="font-semibold">{formData.secondRowSeatPosition?.selection || '—'}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {formData.jobRequest === 'Diving Solution Installation' && (
        <>
          {/* Diving Solution Specific Information */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 text-gray-800 border-b pb-2">Diving Solution Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Device Model</p>
                <p className="font-semibold">{formData.divingSolution?.deviceModel || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Installation Location</p>
                <p className="font-semibold">{formData.divingSolution?.installationLocation || '—'}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {formData.jobRequest === 'Turney Seat Installation' && (
        <>
          {/* Turney Seat Specific Information */}
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-3 text-gray-800 border-b pb-2">Turney Seat Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Seat Type</p>
                <p className="font-semibold">{formData.turneySeats?.seatType || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Installation Position</p>
                <p className="font-semibold">{formData.turneySeats?.position || '—'}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Additional Notes */}
      {formData.notes && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 text-gray-800 border-b pb-2">Additional Notes</h2>
          <p className="whitespace-pre-wrap">{formData.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-xs text-gray-600">
        <p>This document is a work request generated by the sales team.</p>
        <p>Customer will be asked to provide vehicle photos to complete this request.</p>
      </div>
    </div>
  );
});

PDFGenerator.displayName = 'PDFGenerator';

export default PDFGenerator;
