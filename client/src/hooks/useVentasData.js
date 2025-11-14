// 🎯 HOOK PERSONALIZADO PARA GESTIÓN DE DATOS DE VENTAS
// Proporciona auto-sync, fórmulas automáticas y persistencia

import { useState, useEffect, useCallback } from 'react';
import ventasDataService from '../services/ventasDataService';

// 📊 HOOK PRINCIPAL: useVentasData
export const useVentasData = () => {
  const [ventas, setVentas] = useState(ventasDataService.getAllVentas());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 📢 Suscribirse a cambios automáticos
    const unsubscribe = ventasDataService.addListener((updatedVentas) => {
      setVentas(updatedVentas);
    });

    // Forzar recarga desde localStorage al montar
    try {
      ventasDataService.reloadFromLocalStorage();
    } catch (e) {
      // ignore
    }

    // Escuchar storage events (cross-tab sync)
    const onStorage = (e) => {
      if (e.key === 'ksamati_ventas' || e.key === 'ksamti_ventas') {
        try { ventasDataService.reloadFromLocalStorage(); } catch (err) { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorage);

    return unsubscribe; // Cleanup
  }, []);

  // 🔄 MÉTODOS DE ACTUALIZACIÓN
  const updateVenta = useCallback((ventaId, updates) => {
    setLoading(true);
    ventasDataService.updateVenta(ventaId, updates);
    setLoading(false);
  }, []);

  const createVenta = useCallback((ventaData) => {
    setLoading(true);
    const newVenta = ventasDataService.createVenta(ventaData);
    setLoading(false);
    return newVenta;
  }, []);

  const deleteVenta = useCallback((ventaId) => {
    setLoading(true);
    ventasDataService.deleteVenta(ventaId);
    setLoading(false);
  }, []);

  const deleteMultipleVentas = useCallback((ventaIds) => {
    setLoading(true);
    ventasDataService.deleteMultipleVentas(ventaIds);
    setLoading(false);
  }, []);

  // 📋 OBTENER DATOS
  const getVenta = useCallback((ventaId) => {
    return ventasDataService.getVenta(ventaId);
  }, []);

  const getVentasArray = useCallback(() => {
    return Object.values(ventas);
  }, [ventas]);

  const getEstadisticas = useCallback(() => {
    return ventasDataService.getEstadisticas();
  }, [ventas]);

  // 🔍 BÚSQUEDA Y FILTROS
  const searchVentas = useCallback((filters) => {
    return ventasDataService.searchVentas(filters);
  }, [ventas]);

  return {
    ventas,
    ventasArray: getVentasArray(),
    loading,
    updateVenta,
    createVenta,
    deleteVenta,
    deleteMultipleVentas,
    getVenta,
    getEstadisticas,
    searchVentas
  };
};

// 📊 HOOK ESPECÍFICO: useVentaDetail (para VentaDetalle.js)
export const useVentaDetail = (ventaId) => {
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar venta inicial
    const ventaData = ventasDataService.getVenta(ventaId);
    setVenta(ventaData);
    setLoading(false);

    // 📢 Suscribirse a cambios de esta venta específica
    const unsubscribe = ventasDataService.addListener((allVentas) => {
      const updatedVenta = allVentas[ventaId];
      if (updatedVenta) {
        setVenta(updatedVenta);
      }
    });

    return unsubscribe; // Cleanup
  }, [ventaId]);

  // 🔄 AUTO-SAVE: Actualizar cualquier campo de la venta
  const updateField = useCallback((fieldName, value) => {
    if (!venta) return;

    // Convertir valores monetarios automáticamente
    const processedValue = fieldName.includes('utilidad') || 
                          fieldName.includes('total') || 
                          fieldName.includes('precio') || 
                          fieldName.includes('monto') ? 
                          parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0 : 
                          value;

    const updates = { [fieldName]: processedValue };
    ventasDataService.updateVenta(ventaId, updates);
  }, [ventaId, venta]);

  // 🔄 AUTO-SAVE: Actualizar datos completos de la venta
  const updateDatosCompletos = useCallback((datosCompletos) => {
    if (!venta) return;

    const updates = { datosCompletos };
    ventasDataService.updateVenta(ventaId, updates);
  }, [ventaId, venta]);

  // 📊 CALCULADOS: Totales automáticos de la venta
  const calcularTotales = useCallback(() => {
    if (!venta?.datosCompletos?.productos) return { subtotal: 0, total: 0 };

    const subtotal = venta.datosCompletos.productos.reduce((acc, producto) => {
      const precio = parseFloat(producto.precio) || 0;
      const cantidad = parseFloat(producto.cantidad) || 0;
      return acc + (precio * cantidad);
    }, 0);

    return {
      subtotal,
      total: subtotal // Se puede agregar IGV u otros cálculos aquí
    };
  }, [venta]);

  return {
    venta,
    loading,
    updateField,           // 🔄 Auto-save campo de la venta
    updateDatosCompletos,  // 🔄 Auto-save datos completos
    calcularTotales: calcularTotales() // 📊 Totales calculados
  };
};

// 📊 HOOK ESPECÍFICO: useVentasGrid (para GestorVentas.js)
export const useVentasGrid = () => {
  const { ventas, updateVenta, createVenta, deleteVenta, deleteMultipleVentas } = useVentasData();
  
  // 📋 Convertir a formato compatible con GestorVentas
  const gridData = useCallback(() => {
    const result = {};
    Object.keys(ventas).forEach(ventaId => {
      const venta = ventas[ventaId];
      result[ventaId] = {
        estado: venta.estado || 'Cotizando',
        cliente: venta.cliente || '',
        requerimiento: venta.requerimiento || '',
        telefono: venta.telefono || '',
        proyecto: venta.proyecto || `Venta ${ventaId}`,
        utilidad: venta.utilidad || '$/ 0.00'
      };
    });
    return result;
  }, [ventas]);

  // 🔄 Actualizar celda del grid
  const updateCell = useCallback((ventaId, fieldName, value) => {
    // Procesar valor monetario
    const processedValue = fieldName === 'utilidad' ? 
                          `$/ ${parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0}.00` : 
                          value;

    updateVenta(ventaId, { [fieldName]: processedValue });
  }, [updateVenta]);

  // 🆕 CREAR NUEVA VENTA
  const createNewVenta = useCallback(() => {
    const newVenta = createVenta({
      estado: 'Cotizando',
      cliente: '',
      requerimiento: '',
      telefono: '',
      utilidad: '$/ 0.00'
    });
    
    return {
      id: newVenta.id,
      rowIndex: newVenta.id,
      tabId: `venta-${newVenta.id}`,
      name: newVenta.proyecto,
      data: newVenta
    };
  }, [createVenta]);

  return {
    data: gridData(),
    updateCell,
    createNewVenta,
    deleteVenta,
    deleteMultipleVentas
  };
};

export default useVentasData;



