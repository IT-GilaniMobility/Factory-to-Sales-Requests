import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export function useDeliveryNote(request_code) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchNote() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('delivery_notes')
      .select('*')
      .eq('request_code', request_code)
      .single();
    setNote(data);
    setError(error);
    setLoading(false);
    return data;
  }

  async function saveNote(fields) {
    setLoading(true);
    setError(null);
    let { data, error } = await supabase
      .from('delivery_notes')
      .upsert({ ...fields, request_code }, { onConflict: ['request_code'] })
      .select()
      .single();
    setNote(data);
    setError(error);
    setLoading(false);
    return { data, error };
  }

  return { note, loading, error, fetchNote, saveNote };
}
