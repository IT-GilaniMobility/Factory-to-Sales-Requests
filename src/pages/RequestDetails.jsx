import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import wheelchairSide from '../assets/wheelchair_sideview.png';
import wheelchairFront from '../assets/wheelchair_front.webp';
import vehicleMeasurements from '../assets/vehicle_measurements.png';

const RequestDetails = () => {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRequest = () => {
      const stored = localStorage.getItem('wheelchair_lifter_requests_v1');
      if (stored) {
        const requests = JSON.parse(stored);
        const found = requests.find(r => r.id === id);
        setRequest(found || null);
      }
      setLoading(false);
    };
    loadRequest();
  }, [id]);

  const handleStatusChange = (newStatus) => {
    const stored = JSON.parse(localStorage.getItem('wheelchair_lifter_requests_v1') || '[]');
    const updated = stored.map(r => r.id === id ? { ...r, status: newStatus } : r);
    localStorage.setItem('wheelchair_lifter_requests_v1', JSON.stringify(updated));
    setRequest(prev => ({ ...prev, status: newStatus }));
  };

  const copySummary = () => {
    if (!request) return;
    const summary = `
FACTORY REQUEST SUMMARY
ID: ${request.id}
Date: ${new Date(request.createdAt).toLocaleString()}
Status: ${request.status}

CUSTOMER
Name: ${request.customer.name}
Mobile: ${request.customer.mobile}
Address: ${request.customer.address}
Quote Ref: ${request.customer.quoteRef}

VEHICLE
${request.job.vehicle.make} ${request.job.vehicle.model} (${request.job.vehicle.year})

USER INFO
User Weight: ${request.userInfo.userWeightKg}kg
Wheelchair Weight: ${request.userInfo.wheelchairWeightKg}kg
Type: ${request.userInfo.wheelchairType}
Measurements: A=${request.userInfo.measurements.A}, B=${request.userInfo.measurements.B}, C=${request.userInfo.measurements.C}
Situation: ${request.userInfo.situation || 'N/A'}

VEHICLE MEASUREMENTS
D=${request.vehicleMeasurements.D}, H=${request.vehicleMeasurements.H}, FloorToGround=${request.vehicleMeasurements.floorToGround}

SPECS
Model: ${request.productModel.selection} ${request.productModel.commentsIfOthers ? `(${request.productModel.commentsIfOthers})` : ''}
2nd Row: ${request.secondRowSeatPosition.selection} ${request.secondRowSeatPosition.commentsIfOthers ? `(${request.secondRowSeatPosition.commentsIfOthers})` : ''}
Tie Down: ${request.tieDown.selection} ${request.tieDown.commentsIfOthers ? `(${request.tieDown.commentsIfOthers})` : ''}
Flooring: ${request.floorAddOns.selection} ${request.floorAddOns.commentsIfOthers ? `(${request.floorAddOns.commentsIfOthers})` : ''}

EXTRA SEATS
Type: ${request.optionalExtraSeats.seatType || 'None'}
Location: ${request.optionalExtraSeats.rowLocation || '-'} / ${request.optionalExtraSeats.sideLocation || '-'}
Seats: ${request.optionalExtraSeats.seatsBefore} -> ${request.optionalExtraSeats.seatsAfter}
    `.trim();
    
    navigator.clipboard.writeText(summary);
    alert("Summary copied to clipboard!");
  };

  const downloadJson = () => {
    if (!request) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(request, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${request.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!request) return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Request Not Found</h2>
      <Link to="/requests" className="text-blue-600 hover:underline">Back to Requests</Link>
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">{title}</h3>
      {children}
    </div>
  );

  const Field = ({ label, value }) => (
    <div className="mb-3">
      <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="block text-gray-900 font-medium mt-1">{value || '—'}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link to="/requests" className="text-gray-500 hover:text-gray-700">
                  &larr; Back
                </Link>
                <span className="text-gray-300">|</span>
                <h1 className="text-xl font-bold text-gray-900">{request.id}</h1>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-mono">
                  {new Date(request.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-500">{request.job.requestType}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={request.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="Requested to factory">Requested to factory</option>
                <option value="In review">In review</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Factory Actions */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 flex flex-wrap gap-4 items-center justify-between">
          <div>
            <h3 className="text-blue-900 font-semibold">Factory Actions</h3>
            <p className="text-blue-700 text-sm">Tools for processing this request.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={copySummary} className="px-4 py-2 bg-white text-blue-700 border border-blue-200 rounded hover:bg-blue-50 font-medium text-sm shadow-sm">
              Copy Factory Summary
            </button>
            <button onClick={downloadJson} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm shadow-sm">
              Download JSON
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Section title="Customer & Vehicle">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Customer</h4>
                  <Field label="Name" value={request.customer.name} />
                  <Field label="Mobile" value={request.customer.mobile} />
                  <Field label="Address" value={request.customer.address} />
                  <Field label="Quote Ref" value={request.customer.quoteRef} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Vehicle</h4>
                  <Field label="Make" value={request.job.vehicle.make} />
                  <Field label="Model" value={request.job.vehicle.model} />
                  <Field label="Year" value={request.job.vehicle.year} />
                </div>
              </div>
            </Section>

            <Section title="User Information">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="User Weight" value={`${request.userInfo.userWeightKg} kg`} />
                <Field label="Wheelchair Weight" value={`${request.userInfo.wheelchairWeightKg} kg`} />
                <Field label="Wheelchair Type" value={request.userInfo.wheelchairType} />
              </div>
              <Field label="Situation" value={request.userInfo.situation} />
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative border rounded p-2 bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1 text-center">Side View</p>
                  <div className="relative inline-block w-full">
                    <img src={wheelchairSide} alt="Wheelchair Side" className="w-full h-auto object-contain max-h-40" />
                    <div className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                      A: {request.userInfo.measurements.A || '—'}
                    </div>
                  </div>
                </div>
                <div className="relative border rounded p-2 bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1 text-center">Front View</p>
                  <div className="relative inline-block w-full">
                    <img src={wheelchairFront} alt="Wheelchair Front" className="w-full h-auto object-contain max-h-40" />
                    <div className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                      B: {request.userInfo.measurements.B || '—'}
                    </div>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                      C: {request.userInfo.measurements.C || '—'}
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Vehicle Measurements">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Field label="Measure D" value={request.vehicleMeasurements.D} />
                  <Field label="Measure H" value={request.vehicleMeasurements.H} />
                  <Field label="Floor to Ground" value={request.vehicleMeasurements.floorToGround} />
                </div>
                <div className="relative border rounded p-2 bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1 text-center">Rear View</p>
                  <div className="relative inline-block w-full">
                    <img src={vehicleMeasurements} alt="Vehicle Measurements" className="w-full h-auto object-contain max-h-40" />
                    <div className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                      D: {request.vehicleMeasurements.D || '—'}
                    </div>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                      H: {request.vehicleMeasurements.H || '—'}
                    </div>
                  </div>
                </div>
              </div>
            </Section>
          </div>

          {/* Right Column: Specs & Signature */}
          <div className="space-y-6">
            <Section title="Product & Config">
              <div className="space-y-4">
                <div>
                  <Field label="Product Model" value={request.productModel.selection} />
                  {request.productModel.commentsIfOthers && <p className="text-sm text-gray-600 mt-1 italic">"{request.productModel.commentsIfOthers}"</p>}
                </div>
                <hr className="border-gray-100" />
                <div>
                  <Field label="2nd Row Position" value={request.secondRowSeatPosition.selection} />
                  {request.secondRowSeatPosition.commentsIfOthers && <p className="text-sm text-gray-600 mt-1 italic">"{request.secondRowSeatPosition.commentsIfOthers}"</p>}
                </div>
                <hr className="border-gray-100" />
                <div>
                  <Field label="Tie Down" value={request.tieDown.selection} />
                  {request.tieDown.commentsIfOthers && <p className="text-sm text-gray-600 mt-1 italic">"{request.tieDown.commentsIfOthers}"</p>}
                </div>
                <hr className="border-gray-100" />
                <div>
                  <Field label="Flooring" value={request.floorAddOns.selection} />
                  {request.floorAddOns.commentsIfOthers && <p className="text-sm text-gray-600 mt-1 italic">"{request.floorAddOns.commentsIfOthers}"</p>}
                </div>
              </div>
            </Section>

            <Section title="Extra Seats">
              <Field label="Type" value={request.optionalExtraSeats.seatType} />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Field label="Row" value={request.optionalExtraSeats.rowLocation} />
                <Field label="Side" value={request.optionalExtraSeats.sideLocation} />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Field label="Before" value={request.optionalExtraSeats.seatsBefore} />
                <Field label="After" value={request.optionalExtraSeats.seatsAfter} />
              </div>
            </Section>

            <Section title="Training & Signature">
              <div className="mb-4">
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Training Checklist</span>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center text-green-700">
                    <span className="mr-2">✓</span> Operate Device
                  </li>
                  <li className="flex items-center text-green-700">
                    <span className="mr-2">✓</span> Emergency Procedure
                  </li>
                  <li className="flex items-center text-green-700">
                    <span className="mr-2">✓</span> Main Fuse Location
                  </li>
                  <li className="flex items-center text-green-700">
                    <span className="mr-2">✓</span> Tie Down & Seatbelts
                  </li>
                </ul>
              </div>
              
              <div>
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Customer Signature</span>
                <div className="border border-gray-200 rounded bg-white p-2">
                  {request.signature.dataUrl ? (
                    <img src={request.signature.dataUrl} alt="Signature" className="w-full h-auto max-h-32 object-contain" />
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm italic">No signature</div>
                  )}
                </div>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;
