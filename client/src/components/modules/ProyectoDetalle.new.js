import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, CheckIcon, DocumentIcon } from '@heroicons/react/24/outline';

const ProyectoDetalle = ({ proyecto, onBack, onSave, projectNumber }) => {
  // 🚀 Auto-save timer reference
  const autoSaveTimer = useRef(null);
  
  const [projectData, setProjectData] = useState({
    // Datos básicos del proyecto
    estado: 'Ejecucion',
    nombreProyecto: proyecto?.nombreProyecto || `Proyecto ${projectNumber}`,
    tipo: 'Recibo',
    nombreCliente: proyecto?.nombreCliente || '',
    telefono: '',
    
    // Análisis Financiero del Proyecto
    utilidadEstimadaSinFactura: '-S/ 1,580.00',
    utilidadRealSinFactura: '-S/ 100.00',
    balanceUtilidadSinFactura: 'S/ 1,480.00',
    utilidadEstimadaConFactura: '-S/ 1,412.20',
    utilidadRealConFactura: '-S/ 100.00',
    balanceUtilidadConFactura: 'S/ 1,312.20',
    
    // Cobranzas del Proyecto
    montoContrato: 'S/ 0.00',
    adelantos: 'S/ 0.00',
    saldoXCobrar: 'S/ 0.00',
    
    // Observaciones
    observacionesDelProyecto: '',
    
    // Categorías
    categorias: [
      { id: 1, nombre: 'Melamina y Servicios', tipo: 'F', presupuestoDelProyecto: 'S/ 600.00', contratoProvedYServ: '', registroEgresos: '', saldosPorCancelar: '600.00' },
      { id: 2, nombre: 'Melamina High Gloss', tipo: 'F', presupuestoDelProyecto: '', contratoProvedYServ: '', registroEgresos: '', saldosPorCancelar: '0.00' },
      { id: 3, nombre: 'Accesorios y Ferretería', tipo: 'F', presupuestoDelProyecto: 'S/ 500.00', contratoProvedYServ: '', registroEgresos: '', saldosPorCancelar: '500.00' },
      // ... más categorías como en tu imagen
    ]
  });

  // Sincronizar datos cuando cambia el proyecto
  useEffect(() => {
    if (proyecto && Object.keys(proyecto).length > 0) {
      setProjectData(prev => ({
        ...prev,
        nombreProyecto: proyecto.nombreProyecto || `Proyecto ${projectNumber}`,
        nombreCliente: proyecto.nombreCliente || prev.nombreCliente,
        estado: proyecto.estadoProyecto || prev.estado,
        tipo: proyecto.tipoProyecto || prev.tipo,
        montoContrato: proyecto.montoContrato || prev.montoContrato,
      }));
    }
  }, [proyecto, projectNumber]);

  const handleInputChange = (field, value) => {
    setProjectData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoriaChange = (id, field, value) => {
    setProjectData(prev => ({
      ...prev,
      categorias: prev.categorias.map(cat => 
        cat.id === id ? { ...cat, [field]: value } : cat
      )
    }));
  };

  const calculateTotals = () => {
    const totals = {
      presupuesto: 0,
      contrato: 0,
      egresos: 0,
      saldos: 0
    };

    projectData.categorias.forEach(cat => {
      const getValue = (str) => {
        if (!str) return 0;
        return parseFloat(str.replace(/[S/,\s]/g, '')) || 0;
      };

      totals.presupuesto += getValue(cat.presupuestoDelProyecto);
      totals.contrato += getValue(cat.contratoProvedYServ);
      totals.egresos += getValue(cat.registroEgresos);
      totals.saldos += getValue(cat.saldosPorCancelar);
    });

    return {
      presupuesto: `S/ ${totals.presupuesto.toFixed(2)}`,
      contrato: `S/ ${totals.contrato.toFixed(2)}`,
      egresos: `S/ ${totals.egresos.toFixed(2)}`,
      saldos: `S/ ${totals.saldos.toFixed(2)}`
    };
  };

  return (
    <div className="h-screen w-full bg-white flex flex-col">
      {/* Header con tabla de información básica */}
      <div className="border-b border-gray-300">
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="border border-gray-300 p-1 w-[150px] text-center font-bold bg-gray-100">ESTADO</td>
              <td className="border border-gray-300 p-1 w-[150px]">
                <select
                  value={projectData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  className="w-full border-none focus:ring-0"
                >
                  <option>Ejecucion</option>
                  <option>Recibo</option>
                </select>
              </td>
              <td className="border border-gray-300 p-1 w-[150px] text-center font-bold bg-gray-100">PROYECTO</td>
              <td className="border border-gray-300 p-1">
                <input
                  type="text"
                  value={projectData.nombreProyecto}
                  onChange={(e) => handleInputChange('nombreProyecto', e.target.value)}
                  className="w-full border-none focus:ring-0"
                  placeholder="nombre del proyecto"
                />
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 p-1 text-center font-bold bg-gray-100">TIPO</td>
              <td className="border border-gray-300 p-1">
                <select
                  value={projectData.tipo}
                  onChange={(e) => handleInputChange('tipo', e.target.value)}
                  className="w-full border-none focus:ring-0"
                >
                  <option>Recibo</option>
                  <option>Contrato</option>
                </select>
              </td>
              <td className="border border-gray-300 p-1 text-center font-bold bg-gray-100">CLIENTE</td>
              <td className="border border-gray-300 p-1">
                <input
                  type="text"
                  value={projectData.nombreCliente}
                  onChange={(e) => handleInputChange('nombreCliente', e.target.value)}
                  className="w-full border-none focus:ring-0"
                  placeholder="nombre cliente"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Contenido principal con tabla y paneles laterales */}
      <div className="flex-1 flex">
        {/* Tabla principal */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-white text-left p-1 w-[300px]">
                  Categoria Del Proveedor y/o el sevicio
                </th>
                <th className="border border-gray-300 bg-green-500 text-white p-1 w-[150px] text-center">
                  Presupuesto Del Proyecto
                </th>
                <th className="border border-gray-300 bg-blue-600 text-white p-1 w-[150px] text-center">
                  Contrato Proveed. Y Serv.
                </th>
                <th className="border border-gray-300 bg-red-600 text-white p-1 w-[150px] text-center">
                  Registro de Egresos
                </th>
                <th className="border border-gray-300 bg-gray-500 text-white p-1 w-[150px] text-center">
                  Saldos por cancelar
                </th>
              </tr>
            </thead>
            <tbody>
              {projectData.categorias.map((categoria) => (
                <tr key={categoria.id}>
                  <td className="border border-gray-300 p-1">
                    {categoria.tipo && (
                      <span className="bg-red-500 text-white px-1 rounded text-xs mr-1">F</span>
                    )}
                    {categoria.nombre}
                  </td>
                  <td className="border border-gray-300 p-0">
                    <input
                      type="text"
                      value={categoria.presupuestoDelProyecto}
                      onChange={(e) => handleCategoriaChange(categoria.id, 'presupuestoDelProyecto', e.target.value)}
                      className="w-full p-1 border-none focus:ring-0 text-right"
                    />
                  </td>
                  <td className="border border-gray-300 p-0">
                    <input
                      type="text"
                      value={categoria.contratoProvedYServ}
                      onChange={(e) => handleCategoriaChange(categoria.id, 'contratoProvedYServ', e.target.value)}
                      className="w-full p-1 border-none focus:ring-0 text-right"
                    />
                  </td>
                  <td className="border border-gray-300 p-0">
                    <input
                      type="text"
                      value={categoria.registroEgresos}
                      onChange={(e) => handleCategoriaChange(categoria.id, 'registroEgresos', e.target.value)}
                      className="w-full p-1 border-none focus:ring-0 text-right"
                    />
                  </td>
                  <td className="border border-gray-300 p-0">
                    <input
                      type="text"
                      value={categoria.saldosPorCancelar}
                      onChange={(e) => handleCategoriaChange(categoria.id, 'saldosPorCancelar', e.target.value)}
                      className="w-full p-1 border-none focus:ring-0 text-right"
                    />
                  </td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="border border-gray-300 p-1 bg-gray-100">TOTALES</td>
                <td className="border border-gray-300 p-1 text-right bg-green-100">{calculateTotals().presupuesto}</td>
                <td className="border border-gray-300 p-1 text-right bg-blue-100">{calculateTotals().contrato}</td>
                <td className="border border-gray-300 p-1 text-right bg-red-100">{calculateTotals().egresos}</td>
                <td className="border border-gray-300 p-1 text-right bg-gray-100">{calculateTotals().saldos}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Paneles laterales */}
        <div className="w-[400px] flex-shrink-0 border-l border-gray-300">
          {/* Análisis Financiero */}
          <div className="border-b border-gray-300">
            <div className="bg-red-600 p-2">
              <h3 className="text-white font-bold text-center">
                ANALISIS FINANCIERO DEL PROYECTO
              </h3>
            </div>
            <div className="p-2">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-1">Utilidad Estimada Sin Factura</td>
                    <td className="border border-gray-300 p-1 text-right">-S/ 1,580.00</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-1">Utilidad Real Sin Factura</td>
                    <td className="border border-gray-300 p-1 text-right">-S/ 100.00</td>
                  </tr>
                  <tr className="bg-gray-100">
                    <td className="border border-gray-300 p-1">Balance de Utilidad +/-</td>
                    <td className="border border-gray-300 p-1 text-right font-bold">S/ 1,480.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Cobranzas */}
          <div className="border-b border-gray-300">
            <div className="bg-green-600 p-2">
              <h3 className="text-white font-bold text-center">
                COBRANZAS DEL PROYECTO
              </h3>
            </div>
            <div className="p-2">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-1">MONTO DEL CONTRATO</td>
                    <td className="border border-gray-300 p-1 w-[100px]">
                      <input
                        type="text"
                        value={projectData.montoContrato}
                        onChange={(e) => handleInputChange('montoContrato', e.target.value)}
                        className="w-full border-none focus:ring-0 text-right"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <div className="bg-gray-200 p-2">
              <h3 className="text-gray-800 font-bold">
                OBSERVACIONES DEL PROYECTO
              </h3>
            </div>
            <textarea
              value={projectData.observacionesDelProyecto}
              onChange={(e) => handleInputChange('observacionesDelProyecto', e.target.value)}
              className="w-full p-2 border-none focus:ring-0"
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProyectoDetalle;
