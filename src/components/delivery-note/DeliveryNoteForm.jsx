import React, { useState } from 'react';

export default function DeliveryNoteForm({ initial, onSubmit, loading }) {
  const [form, setForm] = useState(initial || {
    customer_name: '',
    customer_vin: '',
    customer_phone: '',
    customer_email: '',
    modifications: [{ description: '', quantity: 1, notes: '' }],
    notes: '',
    received_by: '',
    signature_data: '',
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleModChange(idx, field, value) {
    const mods = [...form.modifications];
    mods[idx][field] = value;
    setForm({ ...form, modifications: mods });
  }

  function addMod() {
    setForm({ ...form, modifications: [...form.modifications, { description: '', quantity: 1, notes: '' }] });
  }

  function removeMod(idx) {
    setForm({ ...form, modifications: form.modifications.filter((_, i) => i !== idx) });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Customer Name</label>
        <input name="customer_name" value={form.customer_name} onChange={handleChange} className="input" required />
      </div>
      <div>
        <label>VIN</label>
        <input name="customer_vin" value={form.customer_vin} onChange={handleChange} className="input" />
      </div>
      <div>
        <label>Phone</label>
        <input name="customer_phone" value={form.customer_phone} onChange={handleChange} className="input" />
      </div>
      <div>
        <label>Email</label>
        <input name="customer_email" value={form.customer_email} onChange={handleChange} className="input" />
      </div>
      <div>
        <label>Modifications</label>
        {form.modifications.map((mod, idx) => (
          <div key={idx} className="flex gap-2 mb-2">
            <input placeholder="Description" value={mod.description} onChange={e => handleModChange(idx, 'description', e.target.value)} className="input" required />
            <input type="number" min="1" value={mod.quantity} onChange={e => handleModChange(idx, 'quantity', e.target.value)} className="input w-16" required />
            <input placeholder="Notes" value={mod.notes} onChange={e => handleModChange(idx, 'notes', e.target.value)} className="input" />
            <button type="button" onClick={() => removeMod(idx)} className="btn btn-danger">Remove</button>
          </div>
        ))}
        <button type="button" onClick={addMod} className="btn btn-secondary">Add Modification</button>
      </div>
      <div>
        <label>Notes</label>
        <textarea name="notes" value={form.notes} onChange={handleChange} className="input" />
      </div>
      <div>
        <label>Received By</label>
        <input name="received_by" value={form.received_by} onChange={handleChange} className="input" />
      </div>
      {/* Signature and other fields can be added here */}
      <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Delivery Note'}</button>
    </form>
  );
}
