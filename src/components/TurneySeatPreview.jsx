import React from 'react';

const TurneySeatPreview = ({ turneySeat }) => {
  if (!turneySeat) return null;
  // Support both .turneyModel and .model, and .sideHighlight and .sideLocation
  const model = turneySeat.turneyModel || turneySeat.model || '';
  const side = turneySeat.sideHighlight || turneySeat.sideLocation || '';
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Turney Seat Installation Preview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <p><strong>User Weight:</strong> {turneySeat.userWeight} kg</p>
          <p><strong>User Height 1:</strong> {turneySeat.userHeight1} cm</p>
          <p><strong>User Height 2:</strong> {turneySeat.userHeight2} cm</p>
          <p><strong>User Situation:</strong> {turneySeat.userSituation}</p>
          <p><strong>Misura A:</strong> {turneySeat.misuaA} mm</p>
          <p><strong>Misura B:</strong> {turneySeat.misuaB} mm</p>
          <p><strong>Misura C:</strong> {turneySeat.misuaC} mm</p>
          <p><strong>Misura D:</strong> {turneySeat.misuaD} mm</p>
          <p><strong>Misura E:</strong> {turneySeat.misuaE} mm</p>
          <p><strong>Seat Base Measurement:</strong> {turneySeat.seatBaseMeasurement}</p>
          <p><strong>Seat Bracket Measurement:</strong> {turneySeat.seatBracketMeasurement}</p>
          <p><strong>Side:</strong> {side}</p>
          <p><strong>Model:</strong> {model}</p>
          <p><strong>Product:</strong> {turneySeat.productModel}</p>
          <p><strong>Special Request:</strong> {turneySeat.specialRequest}</p>
          <p><strong>Optional Extra Add-ons:</strong> {turneySeat.optionalExtraAddOns}</p>
          <p><strong>Product Location:</strong> {turneySeat.productLocation}</p>
        </div>
        <div className="space-y-4">
          {/* Side image with highlight and label */}
          <div>
            <p className="text-xs text-gray-500 mb-1 text-center">Side Selection</p>
            <div className="relative w-full max-w-xs mx-auto">
              <img src={require('../assets/LR.png')} alt="Left/Right" className="w-full h-auto rounded border border-gray-300" />
              {side === 'Left' && (
                <div className="absolute top-0 left-0 h-full w-1/2 pointer-events-none" style={{ background: 'rgba(59,130,246,0.25)' }} />
              )}
              {side === 'Right' && (
                <div className="absolute top-0 right-0 h-full w-1/2 pointer-events-none" style={{ background: 'rgba(59,130,246,0.25)' }} />
              )}
              {/* Show side label on top of highlight */}
              {side && (
                <div className={`absolute top-2 ${side === 'Left' ? 'left-2' : 'right-2'} bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow`}>
                  {side}
                </div>
              )}
            </div>
            {/* Show selected side text below image */}
            {side && (
              <p className="text-center mt-2 text-sm font-semibold text-blue-700">Selected Side: {side}</p>
            )}
          </div>
          {/* Model image and name */}
          <div>
            <p className="text-xs text-gray-500 mb-1 text-center">Model Selection</p>
            <div className="flex flex-col items-center gap-2">
              {model === 'C400' && (
                <>
                  <img src={require('../assets/C400.png')} alt="C400" className="h-24 w-auto object-contain border rounded" />
                  <span className="text-sm font-semibold text-blue-700">Model: C400</span>
                </>
              )}
              {model === 'EC400/480' && (
                <>
                  <img src={require('../assets/EC400:480.png')} alt="EC400/480" className="h-24 w-auto object-contain border rounded" />
                  <span className="text-sm font-semibold text-blue-700">Model: EC400/480</span>
                </>
              )}
              {/* If model is not C400 or EC400/480, show the model name as text */}
              {model && model !== 'C400' && model !== 'EC400/480' && (
                <span className="text-sm font-semibold text-blue-700">Model: {model}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurneySeatPreview;
