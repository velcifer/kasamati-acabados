import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useVentaDetail } from '../../hooks/useVentasData';

const VentaDetalle = ({ venta = {}, ventaNumber = 1, onBack, onSave }) => {
  
  // 🎯 USAR HOOK DE AUTO-SYNC PARA PERSISTENCIA AUTOMÁTICA
  const { venta: ventaFromService, loading, updateField, updateDatosCompletos, calcularTotales } = useVentaDetail(ventaNumber);
  
  const [ventaData, setVentaData] = useState({
    // 📋 Datos básicos de la venta
    cliente: venta.cliente || '',
    telefono: venta.telefono || '',
    requerimiento: venta.requerimiento || '',
    proyecto: venta.proyecto || `Venta ${ventaNumber}`,
    estado: venta.estado || 'Cotizando',
    
    // 💰 Totales principales
    totalUtilidad: '$/0.00',
    totalRecibo: '$/0.00',
    totalFacturado: '0.00',
    totalDobleModoCon: '0.00',
    totalDobleModeSin: '0.00',
    
    // 🏠 COTIZADOR MOBILIARIOS DE MELAMINA
    cotizadorMelamina: [
      { id: 1, categoria: 'MELAMINA Y SERVICIOS', monto: '$/0.00', editable: true },
      { id: 2, categoria: 'MELAMINA HIGH GLOSS', monto: '$/0.00', editable: true },
      { id: 3, categoria: 'ACCESORIOS Y FERRETERIA', monto: '$/0.00', editable: true },
      { id: 4, categoria: 'PUERTAS ALU Y VIDRIOS', monto: '$/0.00', editable: true },
      { id: 5, categoria: 'LED Y ELECTRICIDAD', monto: '$/0.00', editable: true },
      { id: 6, categoria: 'RIELE Y/O CAMIONETA', monto: '$/0.00', editable: true },
      { id: 7, categoria: 'LOGISTICA OPERATIVA', monto: '$/0.00', editable: true },
      { id: 8, categoria: 'EXTRAS Y/O EVENTOS', monto: '$/0.00', editable: true },
      { id: 9, categoria: 'MANO DE OBRA', monto: '$/0.00', editable: true },
      { id: 10, categoria: 'DESPIECE', monto: '$/0.00', editable: true },
      { id: 11, categoria: 'INCENTIVOS', monto: '$/0.00', editable: true },
      { id: 12, categoria: 'COMISION DIRECTORIO', monto: '$/0.00', editable: true },
      { id: 13, categoria: 'OF-ESCP', monto: '$/0.00', editable: true },
      { id: 14, categoria: 'UTILIDAD', monto: '$/0.00', editable: true }
    ],
    
    // 🧮 Totales Melamina
    reciboInternoMelamina: '$/0.00',
    montoFacturadoMelamina: '$/0.00', 
    montoConReciboMelamina: '$/0.00',
    facturaTotalMelamina: '$/0.00',
    
    // 🪨 COTIZADOR DE TABLEROS DE GRANITO
    cotizadorGranito: [
      { id: 1, categoria: 'GRANITO Y/O CUARZO', monto: '$/0.00', observaciones: '', editable: true },
      { id: 2, categoria: 'UTILIDAD', monto: '$/0.00', observaciones: '', editable: true }
    ],
    
    // 🧮 Totales Granito
    reciboInternoGranito: '$/0.00',
    montoFacturadoGranito: '$/0.00',
    montoConReciboGranito: '$/0.00', 
    facturaTotalGranito: '$/0.00',
    
    // 🔧 COTIZADOR DE TERCIALIZACIONES
    cotizadorTercializaciones: [
      { id: 1, categoria: 'TERCIALIZACION 1 FACT.', monto: '$/0.00', observaciones: '', editable: true },
      { id: 2, categoria: 'UTILIDAD', monto: '$/0.00', observaciones: '', editable: true }
    ],
    
    // 🧮 Totales Tercializaciones
    reciboInternoTercializaciones: '$/0.00',
    montoFacturadoTercializaciones: '$/0.00',
    montoConReciboTercializaciones: '$/0.00',
    facturaTotalTercializaciones: '$/0.00',
    
    // 📄 Observaciones y archivos
    observaciones: '',
    archivosAdjuntos: ''
  });

  // 🔄 Sincronizar con datos de prop
  useEffect(() => {
    if (venta && Object.keys(venta).length > 0) {
      setVentaData(prev => ({
        ...prev,
        cliente: venta.cliente || prev.cliente,
        telefono: venta.telefono || prev.telefono,
        requerimiento: venta.requerimiento || prev.requerimiento,
        proyecto: venta.proyecto || `Venta ${ventaNumber}`,
        estado: venta.estado || prev.estado
      }));
    } else {
      setVentaData(prev => ({
        ...prev,
        proyecto: prev.proyecto || `Venta ${ventaNumber}`
      }));
    }
  }, [venta, ventaNumber]);

  // 🧮 FUNCIÓN DE FÓRMULAS AUTOMÁTICAS
  const calculateFormulas = (data) => {
    const parseAmount = (value) => {
      if (!value) return 0;
      const cleanValue = value.toString().replace(/[$/,\\s]/g, '');
      return parseFloat(cleanValue) || 0;
    };

    const formatAmount = (value) => {
      return `$/${value.toFixed(2)}`;
    };

    // Calcular totales por cotizador
    let totalMelamina = 0;
    let totalGranito = 0;
    let totalTercializaciones = 0;

    data.cotizadorMelamina.forEach(item => {
      totalMelamina += parseAmount(item.monto);
    });

    data.cotizadorGranito.forEach(item => {
      totalGranito += parseAmount(item.monto);
    });

    data.cotizadorTercializaciones.forEach(item => {
      totalTercializaciones += parseAmount(item.monto);
    });

    // Calcular totales generales
    const totalUtilidad = totalMelamina + totalGranito + totalTercializaciones;
    const totalRecibo = totalUtilidad * 0.9; // Ejemplo: 90% del total
    const totalFacturado = totalUtilidad * 0.8; // Ejemplo: 80% del total

    return {
      ...data,
      // Totales por sección
      reciboInternoMelamina: formatAmount(totalMelamina * 0.9),
      montoFacturadoMelamina: formatAmount(totalMelamina * 0.8),
      montoConReciboMelamina: formatAmount(totalMelamina),
      facturaTotalMelamina: formatAmount(totalMelamina),

      reciboInternoGranito: formatAmount(totalGranito * 0.9),
      montoFacturadoGranito: formatAmount(totalGranito * 0.8),
      montoConReciboGranito: formatAmount(totalGranito),
      facturaTotalGranito: formatAmount(totalGranito),

      reciboInternoTercializaciones: formatAmount(totalTercializaciones * 0.9),
      montoFacturadoTercializaciones: formatAmount(totalTercializaciones * 0.8),
      montoConReciboTercializaciones: formatAmount(totalTercializaciones),
      facturaTotalTercializaciones: formatAmount(totalTercializaciones),

      // Totales principales
      totalUtilidad: formatAmount(totalUtilidad),
      totalRecibo: formatAmount(totalRecibo),
      totalFacturado: totalFacturado.toFixed(2),
      totalDobleModoCon: (totalUtilidad * 0.95).toFixed(2),
      totalDobleModeSin: (totalUtilidad * 0.85).toFixed(2)
    };
  };

  // ---- ADICIÓN: normalizar montos y sincronizar con servicio ----
  const normalizeMonto = (value) => {
    if (value === undefined || value === null) return '$/0.00';
    const clean = value.toString().replace(/[^0-9.-]/g, '');
    const n = parseFloat(clean) || 0;
    return `$/${n.toFixed(2)}`;
  };

  // 🔄 Sincronizar con datos de prop
  useEffect(() => {
    if (venta && Object.keys(venta).length > 0) {
      setVentaData(prev => ({
        ...prev,
        cliente: venta.cliente || prev.cliente,
        telefono: venta.telefono || prev.telefono,
        requerimiento: venta.requerimiento || prev.requerimiento,
        proyecto: venta.proyecto || `Venta ${ventaNumber}`,
        estado: venta.estado || prev.estado
      }));
    } else {
      setVentaData(prev => ({
        ...prev,
        proyecto: prev.proyecto || `Venta ${ventaNumber}`
      }));
    }
  }, [venta, ventaNumber]);

  // 📌 Sincronizar con la fuente de verdad del servicio cuando cambie
  useEffect(() => {
    if (ventaFromService) {
      setVentaData(prev => ({
        ...prev,
        cliente: ventaFromService.cliente || prev.cliente,
        telefono: ventaFromService.telefono || prev.telefono,
        requerimiento: ventaFromService.requerimiento || prev.requerimiento,
        proyecto: ventaFromService.proyecto || prev.proyecto,
        estado: ventaFromService.estado || prev.estado,
        cotizadorMelamina: ventaFromService.datosCompletos?.cotizadorMelamina || ventaFromService.cotizadorMelamina || prev.cotizadorMelamina,
        cotizadorGranito: ventaFromService.datosCompletos?.cotizadorGranito || ventaFromService.cotizadorGranito || prev.cotizadorGranito,
        cotizadorTercializaciones: ventaFromService.datosCompletos?.cotizadorTercializaciones || ventaFromService.cotizadorTercializaciones || prev.cotizadorTercializaciones,
        reciboInternoMelamina: ventaFromService.reciboInternoMelamina || prev.reciboInternoMelamina,
        montoFacturadoMelamina: ventaFromService.montoFacturadoMelamina || prev.montoFacturadoMelamina,
        facturaTotalMelamina: ventaFromService.facturaTotalMelamina || prev.facturaTotalMelamina,
        reciboInternoGranito: ventaFromService.reciboInternoGranito || prev.reciboInternoGranito,
        facturaTotalGranito: ventaFromService.facturaTotalGranito || prev.facturaTotalGranito,
        reciboInternoTercializaciones: ventaFromService.reciboInternoTercializaciones || prev.reciboInternoTercializaciones,
        facturaTotalTercializaciones: ventaFromService.facturaTotalTercializaciones || prev.facturaTotalTercializaciones,
        totalUtilidad: ventaFromService.totalUtilidad || prev.totalUtilidad,
        totalRecibo: ventaFromService.totalRecibo || prev.totalRecibo,
        totalFacturado: ventaFromService.totalFacturado || prev.totalFacturado
      }));
    }
  }, [ventaFromService]);

  // Reemplazar implementación de handleCotizadorChange para normalizar montos
  const handleCotizadorChange = (cotizador, id, field, value) => {
    // 🔄 AUTO-SYNC: Guardar automáticamente usando el hook
    if (updateField) {
      const updatedCotizador = ventaData[cotizador].map(item => {
        if (item.id !== id) return item;
        const newVal = field === 'monto' ? normalizeMonto(value) : value;
        return { ...item, [field]: newVal };
      });
      updateField(cotizador, updatedCotizador);
    }

    setVentaData(prev => {
      const newData = {
        ...prev,
        [cotizador]: prev[cotizador].map(item =>
          item.id === id ? { ...item, [field]: field === 'monto' ? normalizeMonto(value) : value } : item
        )
      };

      // 🧮 FÓRMULAS AUTOMÁTICAS para cotizadores
      return calculateFormulas(newData);
    });
  };

  const handleInputChange = (field, value) => {
    // 🔄 AUTO-SYNC: Guardar automáticamente usando el hook
    if (updateField) {
      updateField(field, value);
    }
    
    setVentaData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // 🧮 FÓRMULAS AUTOMÁTICAS
      return calculateFormulas(newData);
    });
  };

  const handleSave = () => {
    // 🧮 ASEGURAR QUE TODAS LAS FÓRMULAS ESTÉN CALCULADAS
    const updatedData = calculateFormulas(ventaData);
    
    // Convertir datos de la venta a formato de la hoja principal
    const ventaSummary = {
      estado: updatedData.estado,
      cliente: updatedData.cliente,
      requerimiento: updatedData.requerimiento,
      telefono: updatedData.telefono,
      proyecto: updatedData.proyecto,
      utilidad: updatedData.totalUtilidad
    };

    console.log('🔥 Datos COMPLETOS guardados de la venta:', ventaSummary);
    console.log('💰 Totales calculados:', {
      totalUtilidad: updatedData.totalUtilidad,
      totalRecibo: updatedData.totalRecibo,
      totalFacturado: updatedData.totalFacturado
    });
    
    onSave(ventaSummary, updatedData);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-1 lg:p-3">
      <div className="bg-transparent backdrop-blur-md rounded-xl border border-white/10 shadow-2xl h-full overflow-hidden">
        
        {/* Header Compacto */}
        <div className="bg-white/10 p-2 border-b border-white/20 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-white/80 hover:text-white transition-all duration-200 bg-white/10 px-2 py-1.5 rounded border border-white/20 text-xs"
          >
            <ArrowLeftIcon className="h-3 w-3 mr-1" />
            Volver
          </button>
          <h1 className="text-lg font-bold text-white">
            Venta {ventaNumber} - Cotización Detallada
          </h1>
          <button
            onClick={handleSave}
            className="flex items-center bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-1.5 rounded border border-green-400/30 transition-all duration-200 text-xs"
          >
            <CheckIcon className="h-3 w-3 mr-1" />
            Guardar
          </button>
        </div>

        {/* Contenido principal - Layout horizontal optimizado */}
        <div className="flex-1 overflow-auto p-2 space-y-3">
          
          {/* Información básica de la venta - COMPACTA */}
          <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 shadow-xl">
            <div className="bg-blue-600 p-2 border-b border-blue-500/50 text-center">
              <h3 className="text-white font-semibold text-xs">📋 INFORMACIÓN DE LA VENTA</h3>
            </div>
            <div className="p-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              <div>
                <label className="block text-white text-xs mb-0.5">Estado</label>
                <select
                  value={ventaData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  className="w-full bg-white/10 text-white border border-white/20 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 text-xs"
                >
                  <option value="Cotizando" className="bg-gray-800 text-white">Cotizando</option>
                  <option value="Enviado" className="bg-gray-800 text-white">Enviado</option>
                  <option value="Aprobado" className="bg-gray-800 text-white">Aprobado</option>
                  <option value="Rechazado" className="bg-gray-800 text-white">Rechazado</option>
                  <option value="Facturado" className="bg-gray-800 text-white">Facturado</option>
                </select>
              </div>
              <div>
                <label className="block text-white text-xs mb-0.5">Cliente</label>
                <input
                  type="text"
                  value={ventaData.cliente}
                  onChange={(e) => handleInputChange('cliente', e.target.value)}
                  className="w-full bg-white/10 text-white border border-white/20 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 text-xs"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <label className="block text-white text-xs mb-0.5">Teléfono</label>
                <input
                  type="text"
                  value={ventaData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  className="w-full bg-white/10 text-white border border-white/20 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 text-xs"
                  placeholder="Teléfono de contacto"
                />
              </div>
              <div>
                <label className="block text-white text-xs mb-0.5">Proyecto</label>
                <input
                  type="text"
                  value={ventaData.proyecto}
                  onChange={(e) => handleInputChange('proyecto', e.target.value)}
                  className="w-full bg-white/10 text-white border border-white/20 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 text-xs"
                  placeholder="Nombre del proyecto"
                />
              </div>
              <div>
                <label className="block text-white text-xs mb-0.5">Requerimiento</label>
                <input
                  type="text"
                  value={ventaData.requerimiento}
                  onChange={(e) => handleInputChange('requerimiento', e.target.value)}
                  className="w-full bg-white/10 text-white border border-white/20 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 text-xs"
                  placeholder="Descripción del requerimiento"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
            {/* 🏠 COTIZADOR MOBILIARIOS DE MELAMINA */}
            <div className="bg-orange-500/20 backdrop-blur-md rounded-lg border border-orange-400/30 shadow-xl">
                <div className="bg-orange-600 p-2 border-b border-orange-500/50 text-center">
                  <h3 className="text-white font-semibold text-xs">🏠 MELAMINA</h3>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                  {ventaData.cotizadorMelamina.map((item) => (
                    <div key={item.id} className="grid grid-cols-2 gap-1 py-0.5 border-b border-white/10 last:border-0">
                      <div className="text-white text-xs flex items-center">
                        {item.categoria}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={item.monto}
                          onChange={(e) => handleCotizadorChange('cotizadorMelamina', item.id, 'monto', e.target.value)}
                          disabled={!item.editable}
                          className="w-full text-xs bg-white/10 text-white border border-white/20 rounded px-1 py-0.5 focus:ring-1 focus:ring-orange-500"
                          placeholder="$/0.00"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {/* Totales Melamina AUTOMÁTICOS */}
                  <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-white text-xs">Recibo Interno:</span>
                      <div className="text-yellow-300 text-xs font-bold bg-gray-600/30 rounded px-2 py-1">
                        {ventaData.reciboInternoMelamina}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-white text-xs">Monto Facturado:</span>
                      <div className="text-blue-300 text-xs font-bold bg-gray-600/30 rounded px-2 py-1">
                        {ventaData.montoFacturadoMelamina}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-white text-xs">Factura Total:</span>
                      <div className="text-green-300 text-xs font-bold bg-gray-600/30 rounded px-2 py-1">
                        {ventaData.facturaTotalMelamina}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🪨 COTIZADOR DE TABLEROS DE GRANITO */}
              <div className="bg-purple-500/20 backdrop-blur-md rounded-lg border border-purple-400/30 shadow-xl">
                <div className="bg-purple-600 p-3 border-b border-purple-500/50 text-center">
                  <h3 className="text-white font-semibold text-sm">COTIZADOR DE TABLEROS DE GRANITO</h3>
                </div>
                <div className="p-4">
                  {ventaData.cotizadorGranito.map((item) => (
                    <div key={item.id} className="grid grid-cols-3 gap-2 py-2 border-b border-white/10 last:border-0">
                      <div className="text-white text-xs flex items-center">
                        {item.categoria}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={item.monto}
                          onChange={(e) => handleCotizadorChange('cotizadorGranito', item.id, 'monto', e.target.value)}
                          className="w-full text-xs bg-white/10 text-white border border-white/20 rounded px-2 py-1 focus:ring-1 focus:ring-purple-500"
                          placeholder="$/0.00"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={item.observaciones || ''}
                          onChange={(e) => handleCotizadorChange('cotizadorGranito', item.id, 'observaciones', e.target.value)}
                          className="w-full text-xs bg-white/10 text-white border border-white/20 rounded px-2 py-1 focus:ring-1 focus:ring-purple-500"
                          placeholder="Observaciones"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {/* Totales Granito AUTOMÁTICOS */}
                  <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-white text-xs">Total Granito:</span>
                      <div className="text-purple-300 text-xs font-bold bg-gray-600/30 rounded px-2 py-1">
                        {ventaData.facturaTotalGranito}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🔧 COTIZADOR DE TERCIALIZACIONES */}
              <div className="bg-teal-500/20 backdrop-blur-md rounded-lg border border-teal-400/30 shadow-xl">
                <div className="bg-teal-600 p-3 border-b border-teal-500/50 text-center">
                  <h3 className="text-white font-semibold text-sm">COTIZADOR DE TERCIALIZACIONES</h3>
                </div>
                <div className="p-4">
                  {ventaData.cotizadorTercializaciones.map((item) => (
                    <div key={item.id} className="grid grid-cols-3 gap-2 py-2 border-b border-white/10 last:border-0">
                      <div className="text-white text-xs flex items-center">
                        {item.categoria}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={item.monto}
                          onChange={(e) => handleCotizadorChange('cotizadorTercializaciones', item.id, 'monto', e.target.value)}
                          className="w-full text-xs bg-white/10 text-white border border-white/20 rounded px-2 py-1 focus:ring-1 focus:ring-teal-500"
                          placeholder="$/0.00"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={item.observaciones || ''}
                          onChange={(e) => handleCotizadorChange('cotizadorTercializaciones', item.id, 'observaciones', e.target.value)}
                          className="w-full text-xs bg-white/10 text-white border border-white/20 rounded px-2 py-1 focus:ring-1 focus:ring-teal-500"
                          placeholder="Observaciones"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Columna derecha: Totales y información adicional */}
            <div className="space-y-4">
              
              {/* 💰 TOTALES CALCULADOS AUTOMÁTICAMENTE */}
              <div className="bg-green-500/20 backdrop-blur-md rounded-lg border border-green-400/30 shadow-xl">
                <div className="bg-green-600 p-3 border-b border-green-500/50 text-center">
                  <h3 className="text-white font-semibold text-sm">TOTALES CALCULADOS AUTOMÁTICAMENTE</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white text-xs mb-1">Total Utilidad</label>
                      <input
                        type="text"
                        value={ventaData.totalUtilidad}
                        readOnly
                        className="w-full bg-gray-600/50 text-green-300 border border-green-400/50 rounded px-2 py-1 text-xs cursor-not-allowed font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-xs mb-1">Total Recibo Interno</label>
                      <input
                        type="text"
                        value={ventaData.totalRecibo}
                        readOnly
                        className="w-full bg-gray-600/50 text-yellow-300 border border-yellow-400/50 rounded px-2 py-1 text-xs cursor-not-allowed font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-xs mb-1">Total Facturado</label>
                      <input
                        type="text"
                        value={ventaData.totalFacturado}
                        readOnly
                        className="w-full bg-gray-600/50 text-blue-300 border border-blue-400/50 rounded px-2 py-1 text-xs cursor-not-allowed font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-white text-xs mb-1">Total Doble Modo (Con)</label>
                      <input
                        type="text"
                        value={ventaData.totalDobleModoCon}
                        readOnly
                        className="w-full bg-gray-600/50 text-purple-300 border border-purple-400/50 rounded px-2 py-1 text-xs cursor-not-allowed font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 📄 Observaciones y archivos */}
              <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 shadow-xl">
                <div className="bg-white/20 p-3 border-b border-white/20 text-center">
                  <h3 className="text-white font-semibold text-sm">OBSERVACIONES Y ARCHIVOS</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="block text-white text-xs mb-1">Observaciones</label>
                    <textarea
                      value={ventaData.observaciones}
                      onChange={(e) => handleInputChange('observaciones', e.target.value)}
                      rows="4"
                      className="w-full bg-white/10 text-white border border-white/20 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 text-xs resize-none"
                      placeholder="Observaciones adicionales de la cotización..."
                    />
                  </div>
                  <div>
                    <label className="block text-white text-xs mb-1">Archivos Adjuntos</label>
                    <input
                      type="text"
                      value={ventaData.archivosAdjuntos}
                      onChange={(e) => handleInputChange('archivosAdjuntos', e.target.value)}
                      className="w-full bg-white/10 text-white border border-white/20 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 text-xs"
                      placeholder="Enlaces o nombres de archivos adjuntos"
                    />
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentaDetalle;








