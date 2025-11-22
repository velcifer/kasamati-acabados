import React, { useState, useEffect } from 'react';

const ContratoServicioModal = ({ open, onClose, data = {}, onSave }) => {
  if (!open) return null;

  const [proveedor, setProveedor] = useState(data.proveedor || '');
  const [descripcion, setDescripcion] = useState(data.descripcion || '');
  const [monto, setMonto] = useState(data.monto || 0);
  const initialRows = Array.isArray(data.rows) && data.rows.length > 0
    ? data.rows.map(r => ({ fecha: r.fecha || '', monto: r.monto || 0 }))
    : Array.from({ length: 5 }).map(() => ({ fecha: '', monto: 0 }));
  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    setProveedor(data.proveedor || '');
    setDescripcion(data.descripcion || '');
    setMonto(data.monto || 0);
    setRows(initialRows);
  }, [open, initialRows, data.proveedor, data.descripcion, data.monto]);

  const handleRowChange = (index, field, value) => {
    setRows(prev => prev.map((r, i) => i === index ? { ...r, [field]: field === 'monto' ? parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0 : value } : r));
  };

  const handleSave = () => {
    const totalAbonos = rows.reduce((s, r) => s + (parseFloat(r.monto) || 0), 0);
    if (typeof onSave === 'function') onSave({ proveedor, descripcion, monto, rows, totalAbonos });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-orange-500 text-white">
          <h3 className="font-bold text-sm">Contrato de Servicio</h3>
          <button onClick={onClose} className="text-white/90">✕</button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700">Proveedor / Empresa</label>
            <input className="w-full border rounded px-2 py-1 text-sm" placeholder="Nombre del proveedor" value={proveedor} onChange={(e) => setProveedor(e.target.value)} />

            <label className="block text-sm text-gray-700 mt-3">Descripción del Servicio</label>
            <textarea className="w-full border rounded px-2 py-1 text-sm" rows={6} placeholder="Descripción breve del servicio" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}></textarea>
          </div>

          <div>
            <label className="block text-sm text-gray-700">Monto del Contrato</label>
            <div className="flex items-center">
              <span className="text-sm mr-2">S/</span>
              <input className="w-full border rounded px-2 py-1 text-sm text-right" value={monto} onChange={(e) => setMonto(parseFloat(String(e.target.value).replace(/[^0-9.-]/g, '')) || 0)} />
            </div>

            <div className="mt-3 border rounded overflow-hidden">
              <div className="bg-gray-800 text-white text-sm p-2">Abonos al Servicio (máx. 5)</div>
              <div className="p-3 space-y-2">
                {rows.map((r, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 items-center">
                    <div className="flex items-center gap-2">
                      <input className="border rounded px-2 py-1 text-sm w-full" placeholder="dd/mm/aaaa" value={r.fecha} onChange={(e) => handleRowChange(i, 'fecha', e.target.value)} />
                      <button className="text-gray-500">📅</button>
                    </div>
                    <input className="border rounded px-2 py-1 text-sm text-right" value={r.monto} onChange={(e) => handleRowChange(i, 'monto', e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 flex items-center justify-end gap-2">
          <button className="px-3 py-1 rounded bg-gray-200" onClick={onClose}>Cancelar</button>
          <button className="px-3 py-1 rounded bg-orange-600 text-white" onClick={handleSave}>Guardar</button>
        </div>
      </div>
    </div>
  );
};

export default ContratoServicioModal;
