import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { FiFileText, FiExternalLink, FiLoader } from 'react-icons/fi';

const CustomerPDFs = () => {
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('customer_forms_public')
          .select('id, customer_name, submitted_at, payload')
          .eq('is_submitted', true)
          .order('submitted_at', { ascending: false });
        if (error) throw error;
        const withPdf = (data || []).filter(r => r?.payload && r.payload.pdfUrl);
        setForms(withPdf);
      } catch (e) {
        console.error('Error loading PDFs:', e);
        setForms([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <FiFileText className="text-blue-600" size={24} />
          <h1 className="text-2xl font-bold text-gray-800">Customer PDFs</h1>
          {!loading && (
            <span className="ml-auto text-sm text-gray-500">{forms.length} PDFs</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-600">
            <FiLoader className="animate-spin" /> Loading...
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">No customer PDFs found yet.</p>
            <p className="text-gray-500 text-sm">Customer forms will appear here after they are submitted.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {forms.map((f) => {
              const hasPdf = f?.payload && f.payload.pdfUrl;
              return (
                <div key={f.id} className="bg-white border rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{f.customer_name || 'Unnamed Customer'}</p>
                      <p className="text-xs text-gray-500">{f.submitted_at ? new Date(f.submitted_at).toLocaleString() : ''}</p>
                    </div>
                    {hasPdf && (
                      <a
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline text-sm"
                        href={f.payload.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        download={`${f.customer_name || 'form'}.pdf`}
                      >
                        Download <FiExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  {hasPdf ? (
                    <div className="border rounded overflow-hidden bg-gray-100" style={{height: 280}}>
                      <iframe title={`pdf-${f.id}`} src={f.payload.pdfUrl} className="w-full h-full" />
                    </div>
                  ) : (
                    <div className="border rounded overflow-hidden bg-gray-100 flex items-center justify-center" style={{height: 280}}>
                      <p className="text-gray-500 text-sm">PDF generating...</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPDFs;
