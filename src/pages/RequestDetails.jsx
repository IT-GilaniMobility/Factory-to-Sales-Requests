import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import QualityControlInspection from '../components/QualityControlInspection';
import DeliveryWorkSection from '../components/DeliveryWorkSection';
import wheelchairSide from '../assets/wheelchair_sideview.png';
import wheelchairFront from '../assets/wheelchair_front.webp';
import vehicleMeasurements from '../assets/vehicle_measurements.png';
import gmHeader from '../assets/gm-header.png';
import g24Layout from '../assets/g24_layout.png';
import drivingSol from '../assets/driving-sol.png';
import manHeight from '../assets/man-height.png';
import womenHeight from '../assets/women-height.png';
import turneySeat from '../assets/turney-seat.png';

const Field = ({ label, value }) => (
  <div className="text-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-0.5">{label}</p>
    <p className="font-semibold text-gray-900 break-words">{value || '—'}</p>
  </div>
);

const Section = ({ title, children }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">{title}</h3>
    {children}
  </div>
);

const SignatureBlock = ({ signature, customerSignature }) => {
  console.log('🖊️ SignatureBlock received:', { 
    signature: signature ? 'exists' : 'missing', 
    customerSignature: customerSignature ? customerSignature.substring(0, 50) + '...' : 'missing' 
  });
  
  return (
  <div className="space-y-4">
    {/* Salesperson/Initial Signature */}
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Initial Request Signature</p>
      <div className="border border-gray-200 rounded bg-white p-2">
        {signature?.dataUrl ? (
          <img src={signature.dataUrl} alt="Signature" className="w-full h-auto max-h-32 object-contain" />
        ) : (
          <div className="text-center py-8 text-gray-400 text-sm italic">No signature</div>
        )}
      </div>
    </div>
    
    {/* Customer Signature (if submitted via customer form) */}
    {customerSignature && (
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Customer Confirmation Signature</p>
        <div className="border border-green-200 rounded bg-green-50 p-2">
          <img src={customerSignature} alt="Customer Signature" className="w-full h-auto max-h-32 object-contain" />
        </div>
      </div>
    )}
  </div>
);};

const TrainingList = ({ training = {} }) => {
  const items = [
    { key: 'operateDevice', label: 'Operate Device' },
    { key: 'emergencyProcedure', label: 'Emergency Procedure' },
    { key: 'locateMainFuse', label: 'Main Fuse Location' },
    { key: 'tieDownTraining', label: 'Tie Down & Seatbelts' },
  ];

  return (
    <ul className="text-sm text-gray-700 space-y-1">
      {items.map(item => (
        <li key={item.key} className="flex items-center gap-2">
          <span className={training[item.key] ? 'text-green-700' : 'text-gray-400'}>
            {training[item.key] ? '✓' : '—'}
          </span>
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
};

const AttachmentsSection = ({ attachments = [] }) => {
  if (!attachments || attachments.length === 0) {
    return (
      <Section title="Attached Files">
        <p className="text-sm text-gray-500 italic">No attachments</p>
      </Section>
    );
  }

  const getFileIcon = (filename) => {
    if (!filename || typeof filename !== 'string') return '📎';
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📄';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['doc', 'docx'].includes(ext)) return '📝';
    if (['xls', 'xlsx'].includes(ext)) return '📊';
    if (['dwg', 'dxf'].includes(ext)) return '📐';
    return '📎';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Section title="Attached Files">
      <div className="space-y-3">
        {attachments.map((attachment, index) => {
          if (!attachment || !attachment.url) return null;
          const displayName = attachment.name || attachment.filename || 'Attachment';
          const sizeValue = attachment.size || attachment.fileSize;
          return (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition">
              <span className="text-2xl">{getFileIcon(displayName)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-500">{formatFileSize(sizeValue)}</p>
              </div>
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition screen-only"
              >
                View
              </a>
            </div>
          );
        })}
      </div>
    </Section>
  );
};

const WheelchairLayout = ({ request }) => {
  const measurements = request.userInfo?.measurements || {};
  const vehicleMeasure = request.vehicleMeasurements || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print-container">
      <div className="lg:col-span-2 space-y-6">
        <Section title="Customer & Vehicle">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Customer</h4>
              <Field label="Name" value={request.customer?.name} />
              <Field label="Mobile" value={request.customer?.mobile} />
              <Field label="Address" value={request.customer?.address} />
              <Field label="Quote Ref" value={request.customer?.quoteRef} />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Vehicle</h4>
              <Field label="Make" value={request.job?.vehicle?.make} />
              <Field label="Model" value={request.job?.vehicle?.model} />
              <Field label="Year" value={request.job?.vehicle?.year} />
            </div>
          </div>
        </Section>

        <Section title="User & Wheelchair">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Field label="User Weight (kg)" value={request.userInfo?.userWeightKg} />
              <Field label="Wheelchair Weight (kg)" value={request.userInfo?.wheelchairWeightKg} />
              <Field label="Wheelchair Type" value={request.userInfo?.wheelchairType} />
              <Field label="Situation" value={request.userInfo?.situation} />
            </div>
            <div className="space-y-3">
              <div className="relative border rounded p-2 bg-gray-50">
                <p className="text-xs text-gray-500 mb-1 text-center">Side View</p>
                <div className="relative inline-block w-full">
                  <img src={wheelchairSide} alt="Wheelchair Side" className="w-full h-auto object-contain max-h-40" />
                  <div className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                    A: {measurements.A || '—'}
                  </div>
                </div>
              </div>

              <div className="relative border rounded p-2 bg-gray-50">
                <p className="text-xs text-gray-500 mb-1 text-center">Front View</p>
                <div className="relative inline-block w-full">
                  <img src={wheelchairFront} alt="Wheelchair Front" className="w-full h-auto object-contain max-h-40" />
                  <div className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                    B: {measurements.B || '—'}
                  </div>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                    C: {measurements.C || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Vehicle Measurements">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Field label="Measure D" value={vehicleMeasure.D} />
              <Field label="Measure H" value={vehicleMeasure.H} />
              <Field label="Floor to Ground" value={vehicleMeasure.floorToGround} />
            </div>
            <div className="relative border rounded p-2 bg-gray-50">
              <p className="text-xs text-gray-500 mb-1 text-center">Rear View</p>
              <div className="relative inline-block w-full">
                <img src={vehicleMeasurements} alt="Vehicle Measurements" className="w-full h-auto object-contain max-h-40" />
                <div className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                  D: {vehicleMeasure.D || '—'}
                </div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                  H: {vehicleMeasure.H || '—'}
                </div>
              </div>
            </div>
          </div>
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Product & Config">
          <div className="space-y-4">
            <div>
              <Field label="Product Model" value={request.productModel?.selection} />
              {request.productModel?.commentsIfOthers && (
                <p className="text-sm text-gray-600 mt-1 italic">"{request.productModel.commentsIfOthers}"</p>
              )}
            </div>
            <hr className="border-gray-100" />
            <div>
              <Field label="2nd Row Position" value={request.secondRowSeatPosition?.selection} />
              {request.secondRowSeatPosition?.commentsIfOthers && (
                <p className="text-sm text-gray-600 mt-1 italic">"{request.secondRowSeatPosition.commentsIfOthers}"</p>
              )}
            </div>
            <hr className="border-gray-100" />
            <div>
              <Field label="Tie Down" value={request.tieDown?.selection} />
              {request.tieDown?.commentsIfOthers && (
                <p className="text-sm text-gray-600 mt-1 italic">"{request.tieDown.commentsIfOthers}"</p>
              )}
            </div>
            <hr className="border-gray-100" />
            <div>
              <Field label="Flooring" value={request.floorAddOns?.selection} />
              {request.floorAddOns?.commentsIfOthers && (
                <p className="text-sm text-gray-600 mt-1 italic">"{request.floorAddOns.commentsIfOthers}"</p>
              )}
            </div>
          </div>
        </Section>

        <Section title="Extra Seats">
          <Field label="Type" value={request.optionalExtraSeats?.seatType} />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Field label="Row" value={request.optionalExtraSeats?.rowLocation} />
            <Field label="Side" value={request.optionalExtraSeats?.sideLocation} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Field label="Before" value={request.optionalExtraSeats?.seatsBefore} />
            <Field label="After" value={request.optionalExtraSeats?.seatsAfter} />
          </div>
        </Section>

        <Section title="Training & Signature">
          <div className="mb-4">
            <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Training Checklist</span>
            <TrainingList training={request.training} />
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Customer Signature</span>
            <SignatureBlock 
              signature={request.signature} 
              customerSignature={request.customerFilledData?.signature}
            />
          </div>
        </Section>

        <AttachmentsSection attachments={request.requestAttachments} />
      </div>
    </div>
  );
};

const G24Layout = ({ request }) => {
  const g24LayoutSrc = g24Layout || require('../assets/g24_layout.png');

  return (
    <div className="space-y-6 print-container">
      <Section title="Customer & Vehicle">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Customer</h4>
            <Field label="Name" value={request.customer?.name} />
            <Field label="Mobile" value={request.customer?.mobile} />
            <Field label="Address" value={request.customer?.address} />
            <Field label="Quote Ref" value={request.customer?.quoteRef} />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Vehicle</h4>
            <Field label="Make" value={request.job?.vehicle?.make} />
            <Field label="Model" value={request.job?.vehicle?.model} />
            <Field label="Year" value={request.job?.vehicle?.year} />
          </div>
        </div>
      </Section>

      <Section title="G24 Layout">
        <div className="flex justify-center">
          <img src={g24LayoutSrc} alt="G24 Layout" className="w-full max-w-2xl h-auto rounded border border-gray-200" />
        </div>
      </Section>

      <Section title="Product & Configuration">
        <div className="space-y-4">
          <div>
            <Field label="Product Model" value={request.productModel?.selection} />
            {request.productModel?.commentsIfOthers && (
              <p className="text-sm text-gray-600 mt-1 italic">"{request.productModel.commentsIfOthers}"</p>
            )}
          </div>
          <hr className="border-gray-100" />
          <div>
            <Field label="Second Row Seat" value={request.secondRowSeatPosition?.selection} />
            {request.secondRowSeatPosition?.commentsIfOthers && (
              <p className="text-sm text-gray-600 mt-1 italic">"{request.secondRowSeatPosition.commentsIfOthers}"</p>
            )}
          </div>
          <hr className="border-gray-100" />
          <div>
            <Field label="Tie Down" value={request.tieDown?.selection} />
            {request.tieDown?.commentsIfOthers && (
              <p className="text-sm text-gray-600 mt-1 italic">"{request.tieDown.commentsIfOthers}"</p>
            )}
          </div>
          <hr className="border-gray-100" />
          <div>
            <Field label="Floor Add-ons" value={request.floorAddOns?.selection} />
            {request.floorAddOns?.commentsIfOthers && (
              <p className="text-sm text-gray-600 mt-1 italic">"{request.floorAddOns.commentsIfOthers}"</p>
            )}
          </div>
        </div>
      </Section>

      <Section title="Signature">
        <SignatureBlock 
          signature={request.signature} 
          customerSignature={request.customerFilledData?.signature}
        />
      </Section>

      <AttachmentsSection attachments={request.requestAttachments} />
    </div>
  );
};

const DivingLayout = ({ request }) => {
  const drivingLayoutSrc = drivingSol || require('../assets/driving-sol.png');

  return (
    <div className="space-y-6 print-container">
      <Section title="Customer & Vehicle">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Customer</h4>
            <Field label="Name" value={request.customer?.name} />
            <Field label="Mobile" value={request.customer?.mobile} />
            <Field label="Address" value={request.customer?.address} />
            <Field label="Quote Ref" value={request.customer?.quoteRef} />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Vehicle</h4>
            <Field label="Make" value={request.job?.vehicle?.make} />
            <Field label="Model" value={request.job?.vehicle?.model} />
            <Field label="Year" value={request.job?.vehicle?.year} />
          </div>
        </div>
      </Section>

      <Section title="Driving Solution Layout">
        <div className="flex justify-center">
          <img src={drivingLayoutSrc} alt="Driving Solution" className="w-full max-w-2xl h-auto rounded border border-gray-200" />
        </div>
      </Section>

      <Section title="Installation Details">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Device Model" value={request.divingSolution?.deviceModel} />
          <Field label="Installation Location" value={request.divingSolution?.installationLocation} />
          <Field label="Driver Seat Position" value={request.divingSolution?.driverSeatPosition} />
          <Field label="Steering Wheel Position" value={request.divingSolution?.steeringWheelPosition} />
        </div>
      </Section>

      <Section title="Product & Configuration">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Device Model" value={request.divingSolution?.deviceModel || request.productModel?.selection} />
          <Field label="Install Location" value={request.divingSolution?.installationLocation} />
          <Field label="Driver Seat Position" value={request.divingSolution?.driverSeatPosition} />
          <Field label="Steering Wheel Position" value={request.divingSolution?.steeringWheelPosition} />
          <Field label="Tie Down" value={request.tieDown?.selection} />
          <Field label="Floor Add-ons" value={request.floorAddOns?.selection} />
        </div>
        {request.productModel?.commentsIfOthers && (
          <p className="text-sm text-gray-600 mt-3 italic">"{request.productModel.commentsIfOthers}"</p>
        )}
        {request.tieDown?.commentsIfOthers && (
          <p className="text-sm text-gray-600 mt-1 italic">"{request.tieDown.commentsIfOthers}"</p>
        )}
        {request.floorAddOns?.commentsIfOthers && (
          <p className="text-sm text-gray-600 mt-1 italic">"{request.floorAddOns.commentsIfOthers}"</p>
        )}
      </Section>

      <Section title="Signature">
        <SignatureBlock 
          signature={request.signature} 
          customerSignature={request.customerFilledData?.signature}
        />
      </Section>

      <AttachmentsSection attachments={request.requestAttachments} />
    </div>
  );
};

const TurneyLayout = ({ request }) => {
  const turneyLayoutSrc = turneySeat || require('../assets/turney-seat.png');
  const manHeightSrc = manHeight || require('../assets/man-height.png');
  const womenHeightSrc = womenHeight || require('../assets/women-height.png');

  return (
    <div className="space-y-6 print-container">
      <Section title="Customer & Vehicle">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Customer</h4>
            <Field label="Name" value={request.customer?.name} />
            <Field label="Mobile" value={request.customer?.mobile} />
            <Field label="Address" value={request.customer?.address} />
            <Field label="Quote Ref" value={request.customer?.quoteRef} />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Vehicle</h4>
            <Field label="Make" value={request.job?.vehicle?.make} />
            <Field label="Model" value={request.job?.vehicle?.model} />
            <Field label="Year" value={request.job?.vehicle?.year} />
          </div>
        </div>
      </Section>

      <Section title="User Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Field label="User Weight (kg)" value={request.turneySeat?.userWeight} />
            <Field label="User Height 1 (cm)" value={request.turneySeat?.userHeight1} />
            <Field label="User Height 2 (cm)" value={request.turneySeat?.userHeight2} />
            <Field label="User Situation" value={request.userInfo?.situation} />
          </div>

          <div className="space-y-6">
            <div className="relative border rounded p-2 bg-gray-50">
              <p className="text-xs text-gray-500 mb-1 text-center">Man Height View</p>
              <div className="relative inline-block w-full">
                <img src={manHeightSrc} alt="Man Height" className="w-full h-auto object-contain max-h-48" />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                  H1: {request.turneySeat?.userHeight1 || '—'}
                </div>
              </div>
            </div>

            <div className="relative border rounded p-2 bg-gray-50">
              <p className="text-xs text-gray-500 mb-1 text-center">Woman Height View</p>
              <div className="relative inline-block w-full">
                <img src={womenHeightSrc} alt="Woman Height" className="w-full h-auto object-contain max-h-48" />
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                  H2: {request.turneySeat?.userHeight2 || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Vehicle Measurements">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3 text-sm">
            <Field label="Misura A (Min. 970mm)" value={request.turneySeat?.misuaA} />
            <Field label="Misura B (Min. 950mm)" value={request.turneySeat?.misuaB} />
            <Field label="Misura C (Min. 620mm)" value={request.turneySeat?.misuaC} />
            <Field label="Misura D (Min. 620mm)" value={request.turneySeat?.misuaD} />
            <Field label="Misura E (Min. 400mm)" value={request.turneySeat?.misuaE} />
            <Field label="Seat Base to Roof" value={request.turneySeat?.seatBaseMeasurement} />
            <Field label="Seat Bracket to Roof" value={request.turneySeat?.seatBracketMeasurement} />
          </div>

          <div className="flex justify-center items-start">
            <div className="relative border rounded p-2 bg-gray-50 w-full">
              <p className="text-xs text-gray-500 mb-2 text-center">Turney Seat Measurements</p>
              <div className="relative inline-block w-full">
                <img src={turneyLayoutSrc} alt="Turney Seat" className="w-full h-auto object-contain max-h-64" />
                {/* Misura A - Top Left */}
                <div className="absolute top-8 left-4 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                  A: {request.turneySeat?.misuaA || '—'}
                </div>
                {/* Misura B - Top Middle */}
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                  B: {request.turneySeat?.misuaB || '—'}
                </div>
                {/* Misura C - Right Middle */}
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                  C: {request.turneySeat?.misuaC || '—'}
                </div>
                {/* Misura D - Right Bottom Middle */}
                <div className="absolute bottom-16 right-4 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                  D: {request.turneySeat?.misuaD || '—'}
                </div>
                {/* Misura E - Bottom Right */}
                <div className="absolute bottom-4 right-4 bg-white/90 px-1.5 py-0.5 text-xs font-bold border border-gray-300 rounded shadow-sm">
                  E: {request.turneySeat?.misuaE || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Product & Configuration">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Product" value={request.turneySeat?.productModel || request.productModel?.selection} />
          <Field label="Special Request" value={request.turneySeat?.specialRequest} />
          <Field label="Optional Extra Add-ons" value={request.turneySeat?.optionalExtraAddOns} />
          <Field label="Product Location" value={request.turneySeat?.productLocation} />
        </div>
      </Section>

      <Section title="Training Acknowledgement">
        <ul className="text-sm text-gray-700 space-y-1">
          <li className="flex items-center gap-2">
            <span className="text-green-700">✓</span>
            <span>Fully operate the device</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-700">✓</span>
            <span>Emergency Procedure</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-700">✓</span>
            <span>Locate the main fuse</span>
          </li>
        </ul>
      </Section>

      <Section title="Signature">
        <SignatureBlock 
          signature={request.signature} 
          customerSignature={request.customerFilledData?.signature}
        />
      </Section>

      <AttachmentsSection attachments={request.requestAttachments} />
    </div>
  );
};

const normalizeRequest = (row, fallbackType, idHint) => {
  if (!row) return null;
  const payload = row.payload || row;
  const jobRequest = payload.job?.requestType || payload.jobRequest || fallbackType || 'Wheelchair Lifter Installation';

  return {
    ...payload,
    id: row.request_code || payload.id || idHint,
    status: row.status || payload.status || 'Requested to factory',
    createdAt: row.created_at || payload.createdAt || new Date().toISOString(),
    job: payload.job || { requestType: jobRequest },
    customer: payload.customer || {},
    userInfo: payload.userInfo || { measurements: {} },
    vehicleMeasurements: payload.vehicleMeasurements || {},
    productModel: payload.productModel || {},
    secondRowSeatPosition: payload.secondRowSeatPosition || {},
    optionalExtraSeats: payload.optionalExtraSeats || {},
    tieDown: payload.tieDown || {},
    floorAddOns: payload.floorAddOns || {},
    training: payload.training || {},
    signature: payload.signature || {},
    divingSolution: payload.divingSolution || payload.diving_solution || {},
    turneySeat: payload.turneySeat || {},
    requestAttachments: row.request_attachments || payload.requestAttachments || [],
    customerFilledData: row.customer_filled_data || payload.customerFilledData || null,
    jobRequest,
  };
};

const RequestDetails = () => {
  const { id } = useParams();
  const { isFactoryAdmin } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQCModal, setShowQCModal] = useState(false);
  const [showQCSelector, setShowQCSelector] = useState(false);
  const [selectedQCType, setSelectedQCType] = useState('Hand Control (Push/Pull)');
  const [qcStatus, setQCStatus] = useState(null);

  const loadQCStatus = useCallback(async () => {
    if (!supabase || !id) return;
    try {
      const { data, error } = await supabase
        .from('qc_inspections')
        .select('inspection_status, inspector_name, completed_at, job_type')
        .eq('request_code', id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is normal; ignore it
        console.warn('QC load warning:', error.code);
      }
      setQCStatus(data || null);
    } catch (err) {
      // No QC inspection yet or table doesn't exist
      console.debug('QC not available:', err?.message);
      setQCStatus(null);
    }
  }, [id]);

  useEffect(() => {
    loadQCStatus();
  }, [loadQCStatus]);

  const handleQCComplete = (status) => {
    setQCStatus(prev => ({ ...prev, inspection_status: status }));
    setShowQCModal(false);
  };

  useEffect(() => {
    const loadRequest = async () => {
      setLoading(true);
      try {
        let found = null;

        if (supabase) {
          const tables = [
            { name: 'requests', type: 'Wheelchair Lifter Installation' },
            { name: 'g24_requests', type: 'The Ultimate G24' },
            { name: 'diving_solution_requests', type: 'Diving Solution Installation' },
            { name: 'turney_seat_requests', type: 'Turney Seat Installation' },
          ];

          for (const table of tables) {
            const { data, error } = await supabase
              .from(table.name)
              .select('request_code, status, created_at, payload, request_attachments, customer_filled_data')
              .eq('request_code', id)
              .limit(1);

            if (!error && data && data.length > 0) {
              console.log('📎 Raw request data from Supabase:', data[0]);
              console.log('📎 request_attachments column:', data[0].request_attachments);
              console.log('🖊️ customer_filled_data column:', data[0].customer_filled_data);
              found = normalizeRequest(data[0], table.type, id);
              console.log('📎 Normalized request:', found);
              console.log('📎 requestAttachments in normalized:', found.requestAttachments);
              console.log('🖊️ customerFilledData in normalized:', found.customerFilledData);
              break;
            }
          }
        }

        if (!found) {
          const stored = localStorage.getItem('wheelchair_lifter_requests_v1');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              const localHit = parsed.find(r => r.id === id || r.request_code === id);
              if (localHit) {
                found = normalizeRequest(localHit, localHit.jobRequest, id);
              }
            } catch (err) {
              console.error('Failed to parse local requests', err);
            }
          }
        }

        setRequest(found);
      } catch (err) {
        console.error('Failed to load request', err);
      } finally {
        setLoading(false);
      }
    };

    loadRequest();
  }, [id]);

  // Subscribe to realtime updates for this specific request
  useEffect(() => {
    if (!supabase || !request) return;

    const jobType = request?.job?.requestType || request?.jobRequest || 'Wheelchair Lifter Installation';
    const isWheelchair = jobType === 'Wheelchair Lifter Installation';
    const isG24 = jobType === 'The Ultimate G24';
    const isDiving = jobType === 'Diving Solution Installation';
    
    const table = isWheelchair ? 'requests' : isG24 ? 'g24_requests' : isDiving ? 'diving_solution_requests' : 'turney_seat_requests';
    
    console.log(`Setting up realtime listener for ${table}:${request.id}`);

    const channel = supabase.channel(`request-${request.id}`);

    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table, filter: `request_code=eq.${request.id}` },
      (payload) => {
        console.log(`Request ${request.id} updated in database:`, payload.new);
        const updated = normalizeRequest(payload.new, jobType, request.id);
        setRequest(updated);
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [request]);

  const jobType = request?.job?.requestType || request?.jobRequest || 'Wheelchair Lifter Installation';
  const isWheelchair = jobType === 'Wheelchair Lifter Installation';
  const isG24 = jobType === 'The Ultimate G24';
  const isDiving = jobType === 'Diving Solution Installation';
  const isTurney = jobType === 'Turney Seat Installation';
  const qcTemplates = [
    { label: 'Hand Control (Push/Pull)', available: true, note: 'Template ready to use.' },
    { label: 'Dual Control', available: true, note: 'Template ready to use.' },
    { label: 'Left Foot Acceleration', available: true, note: 'Template ready to use.' },
    { label: 'Remote Light and Indicators', available: true, note: 'Template ready to use.' },
    { label: 'G24 Conversions', available: true, note: 'Template ready to use.' },
    { label: 'Turney Seat Installation', available: true, note: 'Template ready to use.' },
    { label: 'Baby Lift - Light - Lifter Model (106008 - 106008 - 106004 )', available: false, note: 'Not added yet.' }
  ];

  useEffect(() => {
    if (qcStatus?.job_type) {
      setSelectedQCType(qcStatus.job_type);
    } else if (jobType) {
      setSelectedQCType(jobType === 'Diving Solution Installation' ? 'Hand Control (Push/Pull)' : jobType);
    }
  }, [jobType, qcStatus]);

  const openQCModal = () => {
    if (qcStatus?.job_type) {
      setSelectedQCType(qcStatus.job_type);
      setShowQCSelector(false);
      setShowQCModal(true);
    } else {
      setShowQCSelector(true);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!request || !isFactoryAdmin()) {
      console.warn('Cannot change status:', { hasRequest: !!request, isAdmin: isFactoryAdmin() });
      return;
    }
    
    if (!supabase) {
      console.error('Supabase not available');
      alert('Database connection not available');
      return;
    }

    try {
      console.log(`Updating status from "${request.status}" to "${newStatus}" for request ${request.id}`);
      
      const table = isWheelchair ? 'requests' : isG24 ? 'g24_requests' : isDiving ? 'diving_solution_requests' : 'turney_seat_requests';
      console.log(`Using table: ${table}`);
      
      const { data, error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq('request_code', request.id)
        .select();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Status successfully updated in Supabase:', data);
      
      // Only update local state AFTER successful Supabase update
      setRequest(prev => ({ ...prev, status: newStatus }));
      
      // Update the cached list in RequestJobs
      const stored = localStorage.getItem('wheelchair_lifter_requests_v1');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const updated = parsed.map(r => (r.id === request.id || r.request_code === request.id)
            ? { ...r, status: newStatus }
            : r
          );
          localStorage.setItem('wheelchair_lifter_requests_v1', JSON.stringify(updated));
          console.log('Local cache updated');
        } catch (err) {
          console.error('Failed to update local cache', err);
        }
      }
      
      // Show success message
      console.log(`✅ Status changed to "${newStatus}" - refresh the page to verify it persists`);
      
      // Force reload the request from database after a short delay
      setTimeout(async () => {
        try {
          const { data: refreshedData } = await supabase
            .from(table)
            .select('request_code, status, created_at, payload')
            .eq('request_code', request.id)
            .single();
          
          if (refreshedData) {
            console.log('Verified status in database:', refreshedData.status);
            if (refreshedData.status !== newStatus) {
              console.error('⚠️ Status mismatch! Database has:', refreshedData.status, 'Expected:', newStatus);
              alert('Status update may have failed. Please check your permissions.');
            }
          }
        } catch (verifyErr) {
          console.error('Could not verify status update:', verifyErr);
        }
      }, 1000);
    } catch (err) {
      console.error('Failed to update status in Supabase:', err);
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const copySummary = async () => {
    if (!request) return;
    const summaryLines = [
      `Request: ${request.id}`,
      `Type: ${jobType}`,
      `Status: ${request.status}`,
      `Customer: ${request.customer?.name || '—'} (${request.customer?.mobile || '—'})`,
      `Vehicle: ${request.job?.vehicle?.make || '—'} ${request.job?.vehicle?.model || ''} ${request.job?.vehicle?.year || ''}`.trim(),
    ];

    if (isWheelchair) {
      summaryLines.push(
        `Measurements A/B/C: ${request.userInfo?.measurements?.A || '—'}/${request.userInfo?.measurements?.B || '—'}/${request.userInfo?.measurements?.C || '—'}`,
        `Product Model: ${request.productModel?.selection || '—'}`
      );
    }

    if (isG24) {
      summaryLines.push(
        `Product Model: ${request.productModel?.selection || '—'}`,
        `Seat: ${request.secondRowSeatPosition?.selection || '—'}`
      );
    }

    if (isDiving) {
      summaryLines.push(
        `Device Model: ${request.divingSolution?.deviceModel || '—'}`,
        `Install Location: ${request.divingSolution?.installationLocation || '—'}`
      );
    }

    if (isTurney) {
      summaryLines.push(
        `User Weight: ${request.turneySeat?.userWeight || '—'} kg`,
        `Product: ${request.turneySeat?.productModel || '—'}`,
        `Product Location: ${request.turneySeat?.productLocation || '—'}`
      );
    }

    try {
      await navigator.clipboard.writeText(summaryLines.join('\n'));
    } catch (err) {
      console.error('Clipboard copy failed', err);
    }
  };

  const downloadJson = () => {
    if (!request) return;
    const blob = new Blob([JSON.stringify(request, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${request.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
        Loading request...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-700 p-6">
        <p className="mb-4 text-lg">Request not found.</p>
        <Link to="/requests" className="text-blue-600 hover:underline">Back to requests</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <style>{`
        @media print {
          .screen-only { display: none !important; }
          body { 
            background: white; 
            margin: 0;
            padding: 0;
          }
          .min-h-screen {
            min-height: auto !important;
          }
          .print-container { 
            box-shadow: none !important; 
            border: 1px solid #e5e7eb !important;
            page-break-inside: avoid;
          }
          .print-header {
            display: none !important;
          }
          .print-footer {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
        @media screen {
          .print-only { display: none !important; }
          .print-header, .print-footer { display: none !important; }
        }
      `}</style>

      {/* Print Header - Hidden */}
      <div className="print-header max-w-6xl mx-auto px-4 py-2 border-b border-gray-200" style={{ display: 'none' }}>
        <div className="flex items-center gap-4">
          <img src={gmHeader} alt="Gilani Mobility" className="h-12 w-auto object-contain" />
          <div className="flex-1 text-center">
            <h2 className="text-lg font-bold text-gray-900 tracking-wide">GILANI MOBILITY TRADING CO. LLC</h2>
            <p className="text-xs text-gray-600">Mobility solution specialist</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30 screen-only">
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
              <p className="text-sm text-gray-500">{jobType}</p>
            </div>
            <div className="flex items-center gap-3">
              {isFactoryAdmin() ? (
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
              ) : (
                <span className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-gray-700">
                  {request.status}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 print-container screen-only" style={{ pageBreakInside: 'avoid' }}>
          <div className="flex items-center gap-4">
            <img src={gmHeader} alt="Gilani Mobility" className="h-16 w-auto object-contain" />
            <div className="flex-1 text-center">
              <h2 className="text-xl font-bold text-gray-900 tracking-wide">GILANI MOBILITY TRADING CO. LLC</h2>
              <p className="text-sm text-gray-600 mt-1">Mobility solution specialist</p>
            </div>
            <div className="w-16" aria-hidden="true"></div>
          </div>
          <hr className="mt-4 border-gray-300" />
        </div>

        {isFactoryAdmin() && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-8 flex flex-wrap gap-4 items-center justify-between screen-only">
            <div>
              <h3 className="text-blue-900 font-semibold">Factory Actions</h3>
              <p className="text-blue-700 text-sm">Tools for processing this request.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button onClick={copySummary} className="px-4 py-2 bg-white text-blue-700 border border-blue-200 rounded hover:bg-blue-50 font-medium text-sm shadow-sm">
                Copy Factory Summary
              </button>
              <button onClick={downloadJson} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm shadow-sm">
                Download JSON
              </button>
              <button onClick={handlePrint} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium text-sm shadow-sm">
                Export PDF
              </button>
              {request?.status === 'Completed' && !qcStatus && (
                <button
                  onClick={openQCModal}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium text-sm shadow-sm"
                >
                  Inspect
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quality Control Status */}
        {qcStatus && (
          <div className={`rounded-lg p-4 mb-8 flex items-center justify-between ${
            qcStatus.inspection_status === 'passed' 
              ? 'bg-green-100 border border-green-300' 
              : qcStatus.inspection_status === 'failed'
              ? 'bg-yellow-100 border border-yellow-300'
              : 'bg-gray-100 border border-gray-300'
          }`}>
            <div className="flex items-center gap-3">
              <div>
                <p className={`font-semibold ${
                  qcStatus.inspection_status === 'passed' ? 'text-green-800' :
                  qcStatus.inspection_status === 'failed' ? 'text-yellow-800' : 'text-gray-800'
                }`}>
                  {qcStatus.inspection_status === 'passed' ? 'Inspection Passed' :
                   qcStatus.inspection_status === 'failed' ? 'Inspection Failed' : 'Inspection Pending'}
                </p>
                {qcStatus.inspector_name && (
                  <p className="text-sm text-gray-600">Inspector: {qcStatus.inspector_name}</p>
                )}
              </div>
            </div>
            {isFactoryAdmin() && request?.status === 'Completed' && qcStatus && (
              <button
                onClick={openQCModal}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm"
              >
                Edit
              </button>
            )}
          </div>
        )}

        {isWheelchair && <WheelchairLayout request={request} />}
        {isG24 && <G24Layout request={request} />}
        {isDiving && <DivingLayout request={request} />}
        {isTurney && <TurneyLayout request={request} />}

        {/* Delivery Notes and Work Hours Tracking */}
        <DeliveryWorkSection 
          requestId={request.id} 
          requestType={
            isWheelchair ? 'wheelchair' : 
            isG24 ? 'g24' : 
            isDiving ? 'diving_solution' : 
            'turney_seat'
          }
        />
      </div>

      {/* Print Footer - Hidden */}
      <div className="print-footer max-w-6xl mx-auto px-4 py-2 border-t border-gray-200" style={{ display: 'none' }}>
        <div className="text-center text-xs text-gray-700 leading-relaxed">
          <p>Warehouse #5-17th St., 917th St. Umm Ramool, Dubai, United Arab Emirates</p>
          <p className="mt-1">Tel. No. +97148818426 | Mob. +97154320067 | sales@gilanimobility.ae | www.gilanimobility.ae</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-10 screen-only">
        <hr className="border-gray-300 mb-4" />
        <div className="text-center text-sm text-gray-700 leading-relaxed">
          <p>Warehouse #5-17th St., 917th St. Umm Ramool, Dubai, United Arab Emirates</p>
          <p className="mt-1">Tel. No. +97148818426 | Mob. +97154320067 | sales@gilanimobility.ae | www.gilanimobility.ae</p>
        </div>
      </div>

      {showQCModal && (
        <QualityControlInspection
          requestCode={request?.id}
          jobType={selectedQCType}
          onClose={() => setShowQCModal(false)}
          onInspectionComplete={handleQCComplete}
        />
      )}

      {showQCSelector && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Choose QC Template</h3>
                <p className="text-sm text-gray-600 mt-1">Select the inspection template before continuing.</p>
              </div>
              <button
                onClick={() => setShowQCSelector(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close selector"
              >
                ✕
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {qcTemplates.map(template => {
                const isSelected = selectedQCType === template.label;
                return (
                  <button
                    key={template.label}
                    onClick={() => template.available && setSelectedQCType(template.label)}
                    disabled={!template.available}
                    className={`text-left border rounded-lg p-4 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'
                    } ${template.available ? 'hover:shadow-md cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 text-lg ${isSelected ? 'text-purple-600' : 'text-gray-400'}`}>
                        {isSelected ? '●' : '○'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{template.label}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            template.available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {template.available ? 'Ready' : 'Not added yet'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{template.note}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowQCSelector(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowQCSelector(false);
                  setShowQCModal(true);
                }}
                disabled={!qcTemplates.find(t => t.label === selectedQCType)?.available}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-medium text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestDetails;
