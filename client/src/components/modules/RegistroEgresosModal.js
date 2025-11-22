import React, { useState, useEffect } from 'react';

const RegistroEgresosModal = ({ open, onClose, data = {}, onSave }) => {
  if (!open) return null;

  const initialRows = Array.isArray(data.rows) && data.rows.length > 0
    ? data.rows.map(r => ({ fecha: r.fecha || '', monto: r.monto || 0 }))
    : Array.from({ length: 5 }).map(() => ({ fecha: '', monto: 0 }));

  const [rows, setRows] = useState(initialRows);
  const [descripcion, setDescripcion] = useState(data.descripcion || '');

  useEffect(() => {
    setRows(initialRows);
    setDescripcion(data.descripcion || '');
  }, [open, initialRows, data.descripcion]);

  const handleRowChange = (index, field, value) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: field === 'monto' ? parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0 : value } : r));
  };

  const handleSave = () => {
    const total = rows.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0);
    if (typeof onSave === 'function') onSave({ rows, descripcion, total });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-red-600 text-white">
          <h3 className="font-bold text-sm">Registro de Egresos</h3>
          <button onClick={onClose} className="text-white/90">✕</button>
        </div>

        <div className="p-4">
          <div className="border rounded-md overflow-hidden">
            <div className="bg-gray-800 text-white text-sm p-2">Egresos del Servicio (máx. 5)</div>
            <div className="p-3 space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="grid grid-cols-2 gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <input className="border rounded px-2 py-1 text-sm w-full" placeholder="dd/mm/aaaa" value={r.fecha} onChange={(e) => handleRowChange(i, 'fecha', e.target.value)} />
                    <button className="text-gray-500">📅</button>
                  </div>
                  <input className="border rounded px-2 py-1 text-sm text-right" value={r.monto} onChange={(e) => handleRowChange(i, 'monto', e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm text-gray-700 mb-1">Descripción:</label>
            <textarea className="w-full border rounded px-2 py-1 text-sm" rows={3} placeholder="Descripción del egreso" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}></textarea>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button className="px-3 py-1 rounded bg-red-600 text-white">Adjuntar PDF</button>
            <button className="px-3 py-1 rounded bg-gray-200 text-gray-700">Ver PDF</button>
            <button className="px-3 py-1 rounded bg-gray-200 text-gray-700">Eliminar PDF</button>
            <div className="flex-1"></div>
            <button className="px-3 py-1 rounded bg-gray-200" onClick={onClose}>Cancelar</button>
            <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={handleSave}>Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistroEgresosModal;
