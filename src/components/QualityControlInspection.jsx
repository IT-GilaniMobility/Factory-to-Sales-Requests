import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const QualityControlInspection = ({ requestCode, jobType, onClose, onInspectionComplete }) => {
  const [inspection, setInspection] = useState(null);
  const [inspectionItems, setInspectionItems] = useState([]);
  const [activeJobType, setActiveJobType] = useState(jobType);
  const [inspectorName, setInspectorName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const inspectors = ['Hasan', 'Jay Jay'];

  const createNewInspection = useCallback(async (templateName = jobType) => {
    try {
      if (!supabase) return;

      const { data: newInspection, error: inspError } = await supabase
        .from('qc_inspections')
        .upsert([{
          request_code: requestCode,
          job_type: templateName,
          inspection_status: 'pending',
          payload: {}
        }], { onConflict: 'request_code' })
        .select()
        .single();

      if (inspError) throw inspError;
      setActiveJobType(newInspection.job_type || templateName);
      setInspection(newInspection);

      // Fetch categories with items
      const { data: categoriesWithItems, error: itemsError } = await supabase
        .from('qc_checklist_items')
        .select('id, item_name, item_description, category_id, sequence_order')
        .eq('template_name', templateName)
        .order('sequence_order');

      if (itemsError) {
        console.error('Error fetching checklist items:', itemsError);
      }

      // Get category names
      const { data: cats, error: catsError } = await supabase
        .from('qc_categories')
        .select('id, category_name')
        .eq('template_name', templateName);

      if (catsError) {
        console.error('Error fetching categories:', catsError);
      }

      console.log('Categories found:', cats?.length || 0);
      console.log('Checklist items found:', categoriesWithItems?.length || 0);

      const categoryMap = {};
      cats?.forEach(cat => {
        categoryMap[cat.id] = cat.category_name;
      });

      // Create inspection items for all checklist items
      if (categoriesWithItems && categoriesWithItems.length > 0) {
        const itemsToInsert = categoriesWithItems.map(item => ({
          inspection_id: newInspection.id,
          checklist_item_id: item.id,
          category_id: item.category_id,
          item_name: item.item_name,
          category_name: categoryMap[item.category_id] || 'Other',
          status: 'pending',
          comments: ''
        }));

        const { data: newItems, error: itemsError } = await supabase
          .from('qc_inspection_items')
          .insert(itemsToInsert)
          .select();

        if (itemsError) throw itemsError;
        setInspectionItems(newItems || []);
      } else {
        console.warn('No checklist items found in database. Please run QUALITY_CONTROL_SETUP.sql');
        alert('No QC checklist items found. Please run QUALITY_CONTROL_SETUP.sql in Supabase SQL Editor.');
        setInspectionItems([]);
      }
    } catch (error) {
      console.error('Failed to create new inspection:', error);
      alert('Error creating inspection: ' + error.message);
    }
  }, [jobType, requestCode]);

  const loadInspectionData = useCallback(async () => {
    setLoading(true);
    try {
      // Check if inspection exists (unique by request_code per schema)
      let existingInspection = null;
      let templateName = jobType;
      if (supabase) {
        const { data } = await supabase
          .from('qc_inspections')
          .select('*')
          .eq('request_code', requestCode)
          .single();
        existingInspection = data;
      }

      if (existingInspection) {
        templateName = existingInspection.job_type || jobType;
        setActiveJobType(templateName);
        setInspection(existingInspection);
        setInspectorName(existingInspection.inspector_name || '');

        // Load inspection items
        if (supabase) {
          const { data: items } = await supabase
            .from('qc_inspection_items')
            .select('*')
            .eq('inspection_id', existingInspection.id)
            .order('category_name, id');
          setInspectionItems(items || []);

          // If inspection exists but has no items (likely seeded after creation), backfill now
          if (!items || items.length === 0) {
            await backfillInspectionItems(existingInspection.id, templateName);
          }
        }
      } else {
        // Create new inspection
        templateName = jobType;
        setActiveJobType(templateName);
        await createNewInspection(templateName);
      }
    } catch (error) {
      console.error('Failed to load inspection data:', error);
    } finally {
      setLoading(false);
    }
  }, [jobType, requestCode, createNewInspection]);

  useEffect(() => {
    loadInspectionData();
  }, [loadInspectionData]);

  // Backfill inspection items for an existing inspection when DB was seeded later
  const backfillInspectionItems = async (inspectionId, templateName) => {
    try {
      if (!supabase || !inspectionId || !templateName) return;

      // Fetch checklist items for template
      const { data: checklistItems, error: checklistErr } = await supabase
        .from('qc_checklist_items')
        .select('id, item_name, item_description, category_id, sequence_order')
        .eq('template_name', templateName)
        .order('sequence_order');
      if (checklistErr) throw checklistErr;

      if (!checklistItems || checklistItems.length === 0) {
        console.warn('No checklist items available to backfill for template:', templateName);
        return;
      }

      // Fetch category names for mapping
      const { data: cats, error: catsErr } = await supabase
        .from('qc_categories')
        .select('id, category_name')
        .eq('template_name', templateName);
      if (catsErr) throw catsErr;

      const categoryMap = {};
      (cats || []).forEach(cat => { categoryMap[cat.id] = cat.category_name; });

      const itemsToInsert = checklistItems.map(item => ({
        inspection_id: inspectionId,
        checklist_item_id: item.id,
        category_id: item.category_id,
        item_name: item.item_name,
        category_name: categoryMap[item.category_id] || 'Other',
        status: 'pending',
        comments: ''
      }));

      const { data: newItems, error: insertErr } = await supabase
        .from('qc_inspection_items')
        .insert(itemsToInsert)
        .select();
      if (insertErr) throw insertErr;

      setInspectionItems(newItems || []);
    } catch (err) {
      console.error('Failed to backfill inspection items:', err);
    }
  };

  const handleStatusChange = (itemId, newStatus) => {
    setInspectionItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, status: newStatus } : item
      )
    );
  };

  const handleCommentChange = (itemId, comment) => {
    setInspectionItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, comments: comment } : item
      )
    );
  };

  const handleSaveInspection = async () => {
    setSaving(true);
    try {
      if (!supabase || !inspection) return;

      // Update inspection items
      for (const item of inspectionItems) {
        await supabase
          .from('qc_inspection_items')
          .update({
            status: item.status,
            comments: item.comments,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);
      }

      // Calculate overall inspection status
      const hasFailures = inspectionItems.some(item => item.status === 'fail');
      const hasPending = inspectionItems.some(item => item.status === 'pending');
      const overallStatus = hasFailures ? 'failed' : hasPending ? 'in_progress' : 'passed';

      // Update inspection
      await supabase
        .from('qc_inspections')
        .update({
          inspector_name: inspectorName,
          inspection_status: overallStatus,
          completed_at: overallStatus !== 'in_progress' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', inspection.id);

      setInspection(prev => ({
        ...prev,
        inspector_name: inspectorName,
        inspection_status: overallStatus
      }));

      // Notify parent component
      if (onInspectionComplete) {
        onInspectionComplete(overallStatus);
      }
    } catch (error) {
      console.error('Failed to save inspection:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
          <p className="text-center text-gray-600">Loading inspection data...</p>
        </div>
      </div>
    );
  }

  const groupedItems = inspectionItems.reduce((acc, item) => {
    if (!acc[item.category_name]) acc[item.category_name] = [];
    acc[item.category_name].push(item);
    return acc;
  }, {});

  const hasFailures = inspectionItems.some(item => item.status === 'fail');
  const hasPending = inspectionItems.some(item => item.status === 'pending');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quality Control Inspection</h2>
            <div className="mt-1 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-blue-800">
              <span>Template:</span>
              <span className="font-mono">{activeJobType}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Request: {requestCode}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Inspector Selection */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-2">Inspector</label>
          <select
            value={inspectorName}
            onChange={(e) => setInspectorName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Inspector</option>
            {inspectors.map(inspector => (
              <option key={inspector} value={inspector}>{inspector}</option>
            ))}
          </select>
        </div>

        {/* Inspection Items by Category */}
        <div className="p-6 space-y-6">
          {inspectionItems.length === 0 ? (
            <div className="text-center py-12 bg-yellow-50 rounded-lg border-2 border-yellow-200">
              <p className="text-lg font-semibold text-yellow-800 mb-2">No Checklist Items Found</p>
              <p className="text-sm text-yellow-700 mb-4">
                Please run the <code className="bg-yellow-100 px-2 py-1 rounded">QUALITY_CONTROL_SETUP.sql</code> script in your Supabase SQL Editor.
              </p>
              <p className="text-xs text-yellow-600">
                This will create the QC categories and checklist items needed for inspections.
              </p>
            </div>
          ) : (
            Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">{category}</h3>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-gray-900">{item.item_name}</p>
                      <p className="text-sm text-gray-600 mt-1">{item.item_description || 'No description'}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        {[{ key: 'pass', label: 'OK', icon: '✔' }, { key: 'fail', label: 'Issue', icon: '✖' }].map(option => (
                          <button
                            key={option.key}
                            onClick={() => handleStatusChange(item.id, option.key)}
                            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition ${
                              item.status === option.key
                                ? option.key === 'pass'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {option.icon} {option.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Comments"
                        value={item.comments || ''}
                        onChange={(e) => handleCommentChange(item.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
          )}
        </div>

        {/* Overall Status */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className={`p-4 rounded-lg mb-4 text-center font-semibold ${
            hasFailures ? 'bg-yellow-100 text-yellow-800' : 
            hasPending ? 'bg-gray-100 text-gray-800' :
            'bg-green-100 text-green-800'
          }`}>
            {hasFailures ? 'INSPECTION FAILED' : 
             hasPending ? 'INSPECTION IN PROGRESS' :
             'INSPECTION PASSED'}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveInspection}
            disabled={saving || !inspectorName}
            className={`px-6 py-2 rounded-lg text-white font-medium transition ${
              saving || !inspectorName
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving...' : 'Save Inspection'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QualityControlInspection;
