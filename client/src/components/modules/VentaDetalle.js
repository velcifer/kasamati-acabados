import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useVentaDetail } from '../../hooks/useVentasData';
import projectDataService from '../../services/projectDataService';

const VentaDetalle = ({ venta = {}, ventaNumber = 1, onBack, onSave }) => {
  
  // 🎯 USAR HOOK DE AUTO-SYNC PARA PERSISTENCIA AUTOMÁTICA
  const { venta: ventaFromService, loading, updateField, updateDatosCompletos, calcularTotales } = useVentaDetail(ventaNumber);
  
  // Colores de texto por categoría para asemejar al Excel
  const getCategoryTextClass = (nombre) => {
    const n = (nombre || '').toUpperCase();
    if (['FLETE Y/O CAMIONETA', 'LOGISTICA OPERATIVA'].includes(n)) return 'text-green-400';
    if (['MANO DE OBRA', 'DESPIECE', 'INCENTIVOS', 'COMISION DIRECTORIO', 'OF-ESCP', 'UTILIDAD'].includes(n)) return 'text-red-400';
    if (['MELAMINA Y SERVICIOS', 'MELAMINA HIGH GLOSS', 'ACCESORIOS Y FERRETERIA', 'PUERTAS ALU Y VIDRIOS', 'LED Y ELECTRICIDAD'].includes(n)) return 'text-blue-300';
    // Por defecto, usar texto negro para que sea legible en fondo blanco
    return 'text-black';
  };

  // Indicador "F" solo para ciertas filas (como en el Excel de referencia)
  const categoriesWithF = new Set([
    'MELAMINA Y SERVICIOS',
    'MELAMINA HIGH GLOSS',
    'ACCESORIOS Y FERRETERIA',
    'PUERTAS ALU Y VIDRIOS',
    'LED Y ELECTRICIDAD',
    'GRANITO Y/O CUARZO',
    'TERCIALIZACION 1 FACT.'
  ]);
  const showFIndicator = (nombre) => categoriesWithF.has((nombre || '').toUpperCase());
  
  const [ventaData, setVentaData] = useState({
    // 📋 Datos básicos de la venta
    cliente: venta.cliente || '',
    telefono: venta.telefono || '',
    requerimiento: venta.requerimiento || '',
    proyecto: venta.proyecto || `Venta ${ventaNumber}`,
    estado: venta.estado || 'Cotizando',
    
    // 💰 Totales principales
    totalUtilidad: 'S/0.00',
    totalRecibo: 'S/0.00',
    totalFacturado: '0.00',
    totalDobleModoCon: '0.00',
    totalDobleModeSin: '0.00',
    
    // 🏠 COTIZADOR MOBILIARIOS DE MELAMINA
    cotizadorMelamina: [
      { id: 1, categoria: 'MELAMINA Y SERVICIOS', monto: 'S/0.00', proyecto: 'S/0.00', editable: true },
      { id: 2, categoria: 'MELAMINA HIGH GLOSS', monto: 'S/0.00', proyecto: 'S/0.00', editable: true },
      { id: 3, categoria: 'ACCESORIOS Y FERRETERIA', monto: 'S/0.00', proyecto: 'S/0.00', editable: true },
      { id: 4, categoria: 'PUERTAS ALU Y VIDRIOS', monto: 'S/0.00', proyecto: 'S/0.00', editable: true },
      { id: 5, categoria: 'LED Y ELECTRICIDAD', monto: 'S/0.00', proyecto: 'S/0.00', editable: true },
      { id: 6, categoria: 'RIELE Y/O CAMIONETA', monto: 'S/0.00', proyecto: 'S/0.00', editable: true },
      { id: 7, categoria: 'LOGISTICA OPERATIVA', monto: 'S/0.00', proyecto: 'S/0.00', editable: true },
      { id: 8, categoria: 'EXTRAS Y/O EVENTOS', monto: 'S/0.00', proyecto: 'S/0.00', editable: true },
      { id: 9, categoria: 'MANO DE OBRA', monto: 'S/0.00', proyecto: 'S/0.00', editable: true },
      { id: 10, categoria: 'DESPIECE', monto: 'S/0.00', proyecto: 'S/0.00', editable: true },
      { id: 11, categoria: 'INCENTIVOS', monto: 'S/0.00', proyecto: 'S/0.00', editable: true },
      { id: 12, categoria: 'COMISION DIRECTORIO', monto: 'S/0.00', proyecto: 'S/0.00', editable: true },
      { id: 13, categoria: 'OF-ESCP', monto: 'S/0.00', proyecto: 'S/0.00', editable: true },
      { id: 14, categoria: 'UTILIDAD', monto: 'S/0.00', proyecto: 'S/0.00', editable: true }
    ],
    
    // 🧮 Totales Melamina
    reciboInternoMelamina: 'S/0.00',
    montoFacturadoMelamina: 'S/0.00', 
    montoConReciboMelamina: 'S/0.00',
    montoConReciboMelaminaProyecto: 'S/0.00',
    facturaTotalMelamina: 'S/0.00',
    
    // 🪨 COTIZADOR DE TABLEROS DE GRANITO
    cotizadorGranito: [
      { id: 1, categoria: 'GRANITO Y/O CUARZO', monto: 'S/0.00', proyecto: 'S/0.00', observaciones: '', editable: true },
      { id: 2, categoria: 'UTILIDAD', monto: 'S/0.00', proyecto: 'S/0.00', observaciones: '', editable: true }
    ],
    
    // 🧮 Totales Granito
    reciboInternoGranito: 'S/0.00',
    montoFacturadoGranito: 'S/0.00',
    montoConReciboGranito: 'S/0.00',
    montoConReciboGranitoProyecto: 'S/0.00',
    facturaTotalGranito: 'S/0.00',
    
    // 🔧 COTIZADOR DE TERCIALIZACIONES
    cotizadorTercializaciones: [
      { id: 1, categoria: 'TERCIALIZACION 1 FACT.', monto: 'S/0.00', proyecto: 'S/0.00', observaciones: '', editable: true },
      { id: 2, categoria: 'UTILIDAD', monto: 'S/0.00', proyecto: 'S/0.00', observaciones: '', editable: true }
    ],
    
    // 🧮 Totales Tercializaciones
    reciboInternoTercializaciones: 'S/0.00',
    montoFacturadoTercializaciones: 'S/0.00',
    montoConReciboTercializaciones: 'S/0.00',
    montoConReciboTercializacionesProyecto: 'S/0.00',
    facturaTotalTercializaciones: 'S/0.00',
    
    // 📄 Observaciones y archivos
    observaciones: '',
    archivosAdjuntos: '',
    // 📎 Archivo del botón COTIZACION
    cotizacionArchivo: null,
    cotizacionArchivoUrl: '',
    cotizacionArchivoBase64: '',
    cotizacionTexto: ''
  });

  const [cotizacionPopupOpen, setCotizacionPopupOpen] = useState(false);

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
      const cleanValue = value.toString().replace(/[S$\/,\\s]/g, '');
      return parseFloat(cleanValue) || 0;
    };

    const formatAmount = (value) => {
      return `S/${value.toFixed(2)}`;
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

    // Calcular UTILIDAD de cada cotizador (solo filas "UTILIDAD")
    const getUtilidadFrom = (items) => {
      const util = (items || []).find(it => (it.categoria || '').toUpperCase().includes('UTILIDAD'));
      return util ? parseAmount(util.monto) : 0;
    };
    const utilidadMelamina = getUtilidadFrom(data.cotizadorMelamina);
    const utilidadGranito = getUtilidadFrom(data.cotizadorGranito);
    const utilidadTercializaciones = getUtilidadFrom(data.cotizadorTercializaciones);

    // Obtener montos específicos por categoría
    const getMontoFrom = (items, nombreCategoria) => {
      const item = (items || []).find(it => (it.categoria || '').toUpperCase().includes(nombreCategoria));
      return item ? parseAmount(item.monto) : 0;
    };
    const melaminaServicios = getMontoFrom(data.cotizadorMelamina, 'MELAMINA Y SERVICIOS');

    // Calcular totales generales
    const totalUtilidad = utilidadMelamina + utilidadGranito + utilidadTercializaciones;

    // Sincronizar columna PROYECTO (no editable): refleja el monto de la columna S/
    // Para "MELAMINA Y SERVICIOS", "ACCESORIOS Y FERRETERIA" y "LED Y ELECTRICIDAD": proyecto = monto / 1.18
    const melaminaProyectoSync = (data.cotizadorMelamina || []).map(it => {
      const monto = parseAmount(it.monto);
      let proyectoValue = monto;
      
      const categoriaUpper = (it.categoria || '').toUpperCase();
      // Si es "MELAMINA Y SERVICIOS", "ACCESORIOS Y FERRETERIA" o "LED Y ELECTRICIDAD", dividir por 1.18
      if (categoriaUpper.includes('MELAMINA Y SERVICIOS') || categoriaUpper.includes('ACCESORIOS Y FERRETERIA') || categoriaUpper.includes('LED Y ELECTRICIDAD')) {
        proyectoValue = monto / 1.18;
      }
      
      return {
        ...it,
        proyecto: formatAmount(proyectoValue)
      };
    });

    // Calcular MONTO FACTURADO: suma de las celdas PROYECTO con indicador "F" rojo * 1.18
    const categoriesWithFMelamina = ['MELAMINA Y SERVICIOS', 'MELAMINA HIGH GLOSS', 'ACCESORIOS Y FERRETERIA', 'PUERTAS ALU Y VIDRIOS', 'LED Y ELECTRICIDAD'];
    const sumaProyectoF = melaminaProyectoSync
      .filter(it => categoriesWithFMelamina.some(cat => (it.categoria || '').toUpperCase().includes(cat)))
      .reduce((sum, it) => sum + parseAmount(it.proyecto), 0);
    const totalMontoFacturadoMelamina = sumaProyectoF * 1.18;

    // Calcular MONTO CON RECIBO INTERNO (S/): suma de las celdas PROYECTO desde "RIELE Y/O CAMIONETA" hasta "UTILIDAD" (id 6 a 14)
    const categoriasMontoConRecibo = ['RIELE Y/O CAMIONETA', 'LOGISTICA OPERATIVA', 'EXTRAS Y/O EVENTOS', 'MANO DE OBRA', 'DESPIECE', 'INCENTIVOS', 'COMISION DIRECTORIO', 'OF-ESCP', 'UTILIDAD'];
    const totalMontoConReciboMelamina = melaminaProyectoSync
      .filter(it => categoriasMontoConRecibo.some(cat => (it.categoria || '').toUpperCase().includes(cat)))
      .reduce((sum, it) => sum + parseAmount(it.proyecto), 0);

    // Calcular RECIBO INTERNO: suma de todas las celdas S/ del cotizador de Melamina
    const totalReciboInternoMelamina = (data.cotizadorMelamina || []).reduce((sum, it) => sum + parseAmount(it.monto), 0);

    // Calcular MONTO CON RECIBO INTERNO (PROYECTO): MONTO FACTURADO (S/) + MONTO CON RECIBO INTERNO (S/)
    const montoConReciboMelaminaProyecto = totalMontoFacturadoMelamina + totalMontoConReciboMelamina;

    // Calcular FACTURA TOTAL: suma de todas las celdas PROYECTO * 1.18
    const totalProyectoMelamina = melaminaProyectoSync.reduce((sum, it) => sum + parseAmount(it.proyecto), 0);
    const totalFacturaTotalMelamina = totalProyectoMelamina * 1.18;

    // Sincronizar columna PROYECTO para Granito (no editable): refleja el monto de la columna S/
    // Para "GRANITO Y/O CUARZO": proyecto = monto / 1.18
    const granitoProyectoSync = (data.cotizadorGranito || []).map(it => {
      const monto = parseAmount(it.monto);
      let proyectoValue = monto;
      
      const categoriaUpper = (it.categoria || '').toUpperCase();
      // Si es "GRANITO Y/O CUARZO", dividir por 1.18
      if (categoriaUpper.includes('GRANITO Y/O CUARZO')) {
        proyectoValue = monto / 1.18;
      }
      
      return {
        ...it,
        proyecto: formatAmount(proyectoValue)
      };
    });

    // Calcular RECIBO INTERNO para Granito: GRANITO Y/O CUARZO + UTILIDAD
    const granitoCuarzo = getMontoFrom(data.cotizadorGranito, 'GRANITO Y/O CUARZO');
    const reciboInternoGranitoValue = granitoCuarzo + utilidadGranito;

    // Calcular MONTO FACTURADO para Granito: PROYECTO de GRANITO Y/O CUARZO * 1.18
    const granitoCuarzoProyecto = granitoProyectoSync.find(it => (it.categoria || '').toUpperCase().includes('GRANITO Y/O CUARZO'));
    const montoFacturadoGranitoValue = granitoCuarzoProyecto ? parseAmount(granitoCuarzoProyecto.proyecto) * 1.18 : 0;

    // Calcular FACTURA TOTAL para Granito: suma de PROYECTO de GRANITO Y/O CUARZO + PROYECTO de UTILIDAD * 1.18
    const utilidadGranitoProyecto = granitoProyectoSync.find(it => (it.categoria || '').toUpperCase().includes('UTILIDAD'));
    const sumaProyectoGranito = (granitoCuarzoProyecto ? parseAmount(granitoCuarzoProyecto.proyecto) : 0) + (utilidadGranitoProyecto ? parseAmount(utilidadGranitoProyecto.proyecto) : 0);
    const facturaTotalGranitoValue = sumaProyectoGranito * 1.18;

    // Sincronizar columna PROYECTO para Tercializaciones (no editable): refleja el monto de la columna S/
    // Para "TERCIALIZACION 1 FACT.": proyecto = monto / 1.18
    const tercializacionesProyectoSync = (data.cotizadorTercializaciones || []).map(it => {
      const monto = parseAmount(it.monto);
      let proyectoValue = monto;
      
      const categoriaUpper = (it.categoria || '').toUpperCase();
      // Si es "TERCIALIZACION 1 FACT.", dividir por 1.18
      if (categoriaUpper.includes('TERCIALIZACION 1 FACT.')) {
        proyectoValue = monto / 1.18;
      }
      
      return {
        ...it,
        proyecto: formatAmount(proyectoValue)
      };
    });

    // Calcular MONTO FACTURADO para Tercializaciones: PROYECTO de TERCIALIZACION 1 FACT. * 1.18
    const tercializacion1FactProyecto = tercializacionesProyectoSync.find(it => (it.categoria || '').toUpperCase().includes('TERCIALIZACION 1 FACT.'));
    const montoFacturadoTercializacionesValue = tercializacion1FactProyecto ? parseAmount(tercializacion1FactProyecto.proyecto) * 1.18 : 0;

    // Calcular FACTURA TOTAL para Tercializaciones: suma de PROYECTO de TERCIALIZACION 1 FACT. + PROYECTO de UTILIDAD * 1.18
    const utilidadTercializacionesProyecto = tercializacionesProyectoSync.find(it => (it.categoria || '').toUpperCase().includes('UTILIDAD'));
    const sumaProyectoTercializaciones = (tercializacion1FactProyecto ? parseAmount(tercializacion1FactProyecto.proyecto) : 0) + (utilidadTercializacionesProyecto ? parseAmount(utilidadTercializacionesProyecto.proyecto) : 0);
    const facturaTotalTercializacionesValue = sumaProyectoTercializaciones * 1.18;

    return {
      ...data,
      cotizadorMelamina: melaminaProyectoSync,
      cotizadorGranito: granitoProyectoSync,
      cotizadorTercializaciones: tercializacionesProyectoSync,
      // Totales por sección (usar cálculo por defecto solo si no hay valor manual)
      // RECIBO INTERNO = suma de todas las celdas S/
      reciboInternoMelamina: formatAmount(totalReciboInternoMelamina),
      montoFacturadoMelamina: formatAmount(totalMontoFacturadoMelamina),
      montoConReciboMelamina: formatAmount(totalMontoConReciboMelamina),
      montoConReciboMelaminaProyecto: formatAmount(montoConReciboMelaminaProyecto),
      facturaTotalMelamina: formatAmount(totalFacturaTotalMelamina),

      reciboInternoGranito: formatAmount(reciboInternoGranitoValue),
      montoFacturadoGranito: formatAmount(montoFacturadoGranitoValue),
      montoConReciboGranito: formatAmount(utilidadGranito),
      // MONTO CON RECIBO INTERNO (PROYECTO) para Granito: suma de PROYECTO de GRANITO Y/O CUARZO + PROYECTO de UTILIDAD
      montoConReciboGranitoProyecto: formatAmount(sumaProyectoGranito),
      facturaTotalGranito: formatAmount(facturaTotalGranitoValue),

      // Calcular RECIBO INTERNO para Tercializaciones: TERCIALIZACION 1 FACT. + UTILIDAD
      reciboInternoTercializaciones: (() => {
        const tercializacion1Fact = getMontoFrom(data.cotizadorTercializaciones, 'TERCIALIZACION 1 FACT.');
        const utilidadTercializacionesValue = utilidadTercializaciones;
        return formatAmount(tercializacion1Fact + utilidadTercializacionesValue);
      })(),
      montoFacturadoTercializaciones: formatAmount(montoFacturadoTercializacionesValue),
      montoConReciboTercializaciones: formatAmount(utilidadTercializaciones),
      montoConReciboTercializacionesProyecto: formatAmount(montoFacturadoTercializacionesValue + utilidadTercializaciones),
      facturaTotalTercializaciones: formatAmount(facturaTotalTercializacionesValue),

      // Totales principales
      totalUtilidad: formatAmount(totalUtilidad),
      // Total Recibo Interno: suma de RECIBO INTERNO de Melamina + Granito + Tercializaciones
      totalRecibo: (() => {
        const tercializacion1Fact = getMontoFrom(data.cotizadorTercializaciones, 'TERCIALIZACION 1 FACT.');
        const reciboTercializaciones = tercializacion1Fact + utilidadTercializaciones;
        const totalReciboInterno = totalReciboInternoMelamina + reciboInternoGranitoValue + reciboTercializaciones;
        return formatAmount(totalReciboInterno);
      })(),
      // Total Facturado: suma de FACTURA TOTAL de Melamina + Granito + Tercializaciones
      totalFacturado: formatAmount(totalFacturaTotalMelamina + facturaTotalGranitoValue + facturaTotalTercializacionesValue),
      // Total Doble Modo (Con): suma de MONTO CON RECIBO INTERNO (PROYECTO) de Melamina + Granito + Tercializaciones
      totalDobleModoCon: formatAmount(montoConReciboMelaminaProyecto + sumaProyectoGranito + (montoFacturadoTercializacionesValue + utilidadTercializaciones)),
      totalDobleModeSin: formatAmount(totalUtilidad * 0.85)
    };
  };

  // ---- ADICIÓN: normalizar montos y sincronizar con servicio ----
  const normalizeMonto = (value) => {
    if (value === undefined || value === null) return 'S/0.00';
    const clean = value.toString().replace(/[^0-9.-]/g, '');
    const n = parseFloat(clean) || 0;
    return `S/${n.toFixed(2)}`;
  };

  // Forzar prefijo S/ para valores que puedan venir con $/
  const toSoles = (val) => {
    if (typeof val !== 'string') return val;
    return val.replace(/^\$\//, 'S/');
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
      setVentaData(prev => {
        const newData = {
        ...prev,
        cliente: ventaFromService.cliente || prev.cliente,
        telefono: ventaFromService.telefono || prev.telefono,
        requerimiento: ventaFromService.requerimiento || prev.requerimiento,
        proyecto: ventaFromService.proyecto || prev.proyecto,
        estado: ventaFromService.estado || prev.estado,
          cotizadorMelamina: (ventaFromService.datosCompletos?.cotizadorMelamina || ventaFromService.cotizadorMelamina || prev.cotizadorMelamina)
            .map((it) => ({ ...it, monto: toSoles(it.monto) })),
          cotizadorGranito: (ventaFromService.datosCompletos?.cotizadorGranito || ventaFromService.cotizadorGranito || prev.cotizadorGranito)
            .map((it) => ({ ...it, monto: toSoles(it.monto) })),
          cotizadorTercializaciones: (ventaFromService.datosCompletos?.cotizadorTercializaciones || ventaFromService.cotizadorTercializaciones || prev.cotizadorTercializaciones)
            .map((it) => ({ ...it, monto: toSoles(it.monto) })),
          reciboInternoMelamina: toSoles(ventaFromService.reciboInternoMelamina) || prev.reciboInternoMelamina,
          montoFacturadoMelamina: toSoles(ventaFromService.montoFacturadoMelamina) || prev.montoFacturadoMelamina,
          facturaTotalMelamina: toSoles(ventaFromService.facturaTotalMelamina) || prev.facturaTotalMelamina,
          reciboInternoGranito: toSoles(ventaFromService.reciboInternoGranito) || prev.reciboInternoGranito,
          facturaTotalGranito: toSoles(ventaFromService.facturaTotalGranito) || prev.facturaTotalGranito,
          reciboInternoTercializaciones: toSoles(ventaFromService.reciboInternoTercializaciones) || prev.reciboInternoTercializaciones,
          facturaTotalTercializaciones: toSoles(ventaFromService.facturaTotalTercializaciones) || prev.facturaTotalTercializaciones,
          totalUtilidad: toSoles(ventaFromService.totalUtilidad) || prev.totalUtilidad,
          totalRecibo: toSoles(ventaFromService.totalRecibo) || prev.totalRecibo,
          totalFacturado: toSoles(ventaFromService.totalFacturado) || prev.totalFacturado,
          cotizacionArchivoBase64: ventaFromService.datosCompletos?.cotizacionArchivoBase64 || ventaFromService.cotizacionArchivoBase64 || prev.cotizacionArchivoBase64,
          cotizacionArchivoUrl: ventaFromService.datosCompletos?.cotizacionArchivoBase64 || ventaFromService.cotizacionArchivoBase64 || ventaFromService.datosCompletos?.cotizacionArchivoUrl || ventaFromService.cotizacionArchivoUrl || prev.cotizacionArchivoUrl,
          cotizacionTexto: ventaFromService.datosCompletos?.cotizacionTexto || ventaFromService.cotizacionTexto || prev.cotizacionTexto
        };
        // Ejecutar calculateFormulas para calcular correctamente el proyecto de MELAMINA Y SERVICIOS
        return calculateFormulas(newData);
      });
    }
  }, [ventaFromService]);

  // Reemplazar implementación de handleCotizadorChange para normalizar montos
  const handleCotizadorChange = (cotizador, id, field, value) => {
    // 🔄 AUTO-SYNC: Guardar automáticamente usando el hook
    if (updateField) {
      const updatedCotizador = ventaData[cotizador].map(item => {
        if (item.id !== id) return item;
        const newVal = (field === 'monto' || field === 'proyecto') ? normalizeMonto(value) : value;
        return { ...item, [field]: newVal };
      });
      updateField(cotizador, updatedCotizador);
    }

    setVentaData(prev => {
      const newData = {
        ...prev,
        [cotizador]: prev[cotizador].map(item =>
          item.id === id ? { ...item, [field]: (field === 'monto' || field === 'proyecto') ? normalizeMonto(value) : value } : item
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

  const parseMoney = (m) => {
    if (!m) return 0;
    const n = parseFloat(String(m).replace(/[^0-9.-]/g, '')) || 0;
    return n;
  };

  const syncToProyectoPrincipal = (updatedData) => {
    try {
      const all = projectDataService.getAllProjects();
      // Buscar por nombre del proyecto
      const key = Object.keys(all).find(
        (id) => (all[id]?.nombreProyecto || '').toLowerCase() === (updatedData.proyecto || '').toLowerCase()
      );
      if (!key) return; // no encontrado, no sincronizamos

      // Mapeo rápido: total facturado y utilidad -> proyecto
      const montoContrato = parseMoney(updatedData.totalFacturado);
      const utilidad = parseMoney(updatedData.totalUtilidad);

      projectDataService.updateProject(key, {
        montoContrato,
        utilidadEstimadaSinFactura: utilidad,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('No se pudo sincronizar con proyecto principal:', e);
    }
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
    
    // Sincronizar con Excel principal (si existe proyecto con ese nombre)
    syncToProyectoPrincipal(updatedData);
    
    onSave(ventaSummary, updatedData);
  };

  // Manejar archivo del popup COTIZACION
  const handleCotizacionFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      // Convertir archivo a base64 para persistencia
      const reader = new FileReader();
      reader.onloadend = () => {
        setVentaData(prev => ({
          ...prev,
          cotizacionArchivo: file,
          cotizacionArchivoUrl: fileUrl,
          cotizacionArchivoBase64: reader.result // Guardar como base64 para persistencia
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCotizacionTextoChange = (e) => {
    setVentaData(prev => ({
      ...prev,
      cotizacionTexto: e.target.value
    }));
  };

  const handleVerCotizacionArchivo = () => {
    if (ventaData.cotizacionArchivoUrl) {
      window.open(ventaData.cotizacionArchivoUrl, '_blank');
    }
  };

  const handleEliminarCotizacionArchivo = () => {
    if (ventaData.cotizacionArchivoUrl && ventaData.cotizacionArchivoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(ventaData.cotizacionArchivoUrl);
    }
    setVentaData(prev => ({
      ...prev,
      cotizacionArchivo: null,
      cotizacionArchivoUrl: '',
      cotizacionArchivoBase64: ''
    }));
  };

  return (
    <div className="min-h-screen w-full bg-[#0f0f0f] p-1 lg:p-3">
      <div className="bg-transparent rounded-xl border-2 border-gray-700 shadow-2xl h-full overflow-hidden">
        
        {/* Header Compacto */}
        <div className="bg-black p-2 border-b border-white/20 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-white/80 hover:text-white transition-all duration-200 bg-white/10 px-2 py-1.5 rounded border border-white/20 text-xs"
          >
            <ArrowLeftIcon className="h-3 w-3 mr-1" />
            Volver
          </button>
          <h1 className="text-lg font-bold text-white tracking-wide">
            Venta {ventaNumber} - Cotización Detallada
          </h1>
          <button
            onClick={handleSave}
            className="flex items-center bg-green-600/20 hover:bg-green-600/30 text-green-300 px-3 py-1.5 rounded border border-green-400/30 transition-all duration-200 text-xs"
          >
            <CheckIcon className="h-3 w-3 mr-1" />
            Guardar
          </button>
        </div>

        {/* Contenido principal - Layout tipo Excel */}
        <div className="flex-1 overflow-auto p-2">
          {/* Fila superior: Total Utilidad y Proyecto */}
        <div className="bg-black border-2 border-gray-600 rounded mb-2">
            <div className="grid grid-cols-3 gap-0 text-white text-xs">
              <div className="flex items-center border-r border-white/20 p-1">
                <span className="font-bold mr-2">TOTAL UTILIDAD</span>
                <input
                  readOnly
                  value={ventaData.totalUtilidad}
                  className="bg-white text-green-700 border border-gray-300 rounded px-2 py-1 w-28 font-bold"
                />
              </div>
              <div className="col-span-2 flex items-center p-1">
                <span className="font-bold mr-2">PROYECTO</span>
                <input
                  type="text"
                  value={ventaData.proyecto}
                  onChange={(e) => handleInputChange('proyecto', e.target.value)}
                  className="flex-1 bg-white text-black border border-gray-300 rounded px-2 py-1"
                  placeholder="Nombre del proyecto"
                />
              </div>
            </div>
          </div>

          {/* Dos columnas: izquierda contenido, derecha panel lateral */}
          <div className="grid grid-cols-12 gap-3">
            {/* Columna izquierda (8/12) */}
            <div className="col-span-12 xl:col-span-8 space-y-3">
              {/* MELAMINA */}
              <div className="bg-black rounded border-2 border-gray-600">
                <div className="grid grid-cols-12 bg-[#ff6a00] text-white text-xs font-bold">
                  <div className="px-2 py-1 border-r border-orange-700 col-span-3">COTIZADOR MOBILIARIOS DE MELAMINA</div>
                  <div className="px-2 py-1 border-r border-orange-700 text-center col-span-2">S/</div>
                  <div className="px-2 py-1 border-r border-orange-700 text-center col-span-2">PROYECTO</div>
                  <div className="px-2 py-1 text-center col-span-5">OBSERVACIONES</div>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-white/10">
                  {ventaData.cotizadorMelamina.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-0">
                      <div className={`col-span-3 text-xs flex items-center px-2 py-1 bg-white border border-gray-300 ${getCategoryTextClass(item.categoria)}`}>
                        {showFIndicator(item.categoria) && (
                          <span className="inline-block w-4 h-4 leading-4 text-[10px] text-black bg-red-600 font-bold text-center rounded-sm mr-1">F</span>
                        )}
                        {item.categoria}
                      </div>
                      <div className="px-2 py-1 col-span-2">
                        <input
                          type="text"
                          value={item.monto}
                          onChange={(e) => handleCotizadorChange('cotizadorMelamina', item.id, 'monto', e.target.value)}
                          disabled={!item.editable}
                          className="w-full text-xs bg-white text-black border border-gray-300 rounded-none px-2 h-8 focus:outline-none"
                          placeholder="S/0.00"
                        />
                      </div>
                      <div className="px-2 py-1 col-span-2">
                        <div className="w-full text-xs bg-white text-black border border-gray-300 rounded-none px-2 h-8 flex items-center">
                          {(() => {
                            const categoriaUpper = (item.categoria || '').toUpperCase();
                            // Para "MELAMINA Y SERVICIOS", "ACCESORIOS Y FERRETERIA" y "LED Y ELECTRICIDAD": calcular proyecto = monto / 1.18
                            if (categoriaUpper.includes('MELAMINA Y SERVICIOS') || categoriaUpper.includes('ACCESORIOS Y FERRETERIA') || categoriaUpper.includes('LED Y ELECTRICIDAD')) {
                              const parseAmount = (value) => {
                                if (!value) return 0;
                                const cleanValue = value.toString().replace(/[S$\/,\s]/g, '');
                                return parseFloat(cleanValue) || 0;
                              };
                              const formatAmount = (value) => {
                                return `S/${value.toFixed(2)}`;
                              };
                              const monto = parseAmount(item.monto);
                              const proyectoValue = monto / 1.18;
                              return formatAmount(proyectoValue);
                            }
                            return item.proyecto || 'S/0.00';
                          })()}
                        </div>
                      </div>
                      <div className="px-2 py-1 col-span-5">
                        <input
                          type="text"
                          value={item.observaciones || ''}
                          onChange={(e) => handleCotizadorChange('cotizadorMelamina', item.id, 'observaciones', e.target.value)}
                          className="w-full text-xs bg-white text-black border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-orange-500"
                          placeholder="Observaciones"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bloque de totales Melamina y botón COTIZACION - replicando cuadricula Excel (12 columnas) */}
                <div className="p-2 pr-[17px] border-t border-white/10 divide-y divide-white/10">
                  {/* Fila: RECIBO INTERNO */}
                  <div className="grid grid-cols-12 gap-x-2 mb-2">
                    <div className="col-span-3 text-xs bg-white text-black border border-gray-300 rounded-none px-1 h-8 flex items-center">RECIBO INTERNO</div>
                    <div className="col-span-2 bg-white text-black text-xs font-bold px-2 h-8 border border-gray-300 rounded-none flex items-center">
                      {ventaData.reciboInternoMelamina || 'S/0.00'}
                    </div>
                    <div className="col-span-2 h-8"></div>
                    <div className="col-span-5 h-8"></div>
                  </div>
                  {/* Fila: MONTO FACTURADO */}
                  <div className="grid grid-cols-12 gap-x-2 mb-2">
                    <div className="col-span-3 text-xs bg-white text-black border border-gray-300 rounded-none px-1 h-8 flex items-center">MONTO FACTURADO</div>
                    <input
                      type="text"
                      value={ventaData.montoFacturadoMelamina || 'S/0.00'}
                      onChange={(e) => handleInputChange('montoFacturadoMelamina', normalizeMonto(e.target.value))}
                      className="col-span-2 bg-white text-black text-xs font-bold px-2 h-8 border border-gray-300 rounded-none focus:outline-none"
                      placeholder="S/0.00"
                    />
                    <div className="col-span-2 h-8"></div>
                    <div className="col-span-5 h-8"></div>
                  </div>
                  {/* Fila: MONTO CON RECIBO INTERNO */}
                  <div className="grid grid-cols-12 gap-x-2 mb-2">
                    <div className="col-span-3 text-xs bg-white text-black border border-gray-300 rounded-none px-1 h-8 flex items_center">MONTO CON RECIBO INTERNO</div>
                    <div className="col-span-2 bg-white text-black text-xs font-bold px-2 h-8 border border-gray-300 rounded-none flex items-center">
                      {ventaData.montoConReciboMelamina || 'S/0.00'}
                      </div>
                    <div className="col-span-2 bg-white text-black text-xs font-bold px-2 h-8 border border-gray-300 rounded-none flex items-center">
                      {ventaData.montoConReciboMelaminaProyecto || 'S/0.00'}
                    </div>
                    <div className="col-span-5 h-8"></div>
                      </div>
                  {/* Fila: FACTURA TOTAL */}
                  <div className="grid grid-cols-12 gap-x-2">
                    <div className="col-span-3 text-xs bg-white text-black border border-gray-300 rounded-none px-1 h-8 flex items-center">FACTURA TOTAL</div>
                    <div className="col-span-2 bg-white text-black text-xs font-bold px-2 h-8 border border-gray-300 rounded-none flex items-center">
                      {ventaData.facturaTotalMelamina || 'S/0.00'}
                    </div>
                    <div className="col-span-2 h-8"></div>
                    <div className="col-span-5 flex justify-end">
                      <button 
                        onClick={() => setCotizacionPopupOpen(true)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-black text-xs font-bold px-4 py-2 rounded"
                      >
                        COTIZACION
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* GRANITO */}
              <div className="bg-black rounded border-2 border-gray-600">
                <div className="grid grid-cols-12 bg-[#7a3cff] text-white text-xs font-bold">
                  <div className="col-span-3 px-2 py-1 border-r border-purple-700">COTIZADOR DE TABLEROS DE GRANITO</div>
                  <div className="col-span-2 px-2 py-1 border-r border-purple-700 text-center">S/</div>
                  <div className="col-span-2 px-2 py-1 border-r border-purple-700 text-center"></div>
                  <div className="col-span-5 px-2 py-1 text-center">OBSERVACIONES</div>
                </div>
                <div className="p-2 pr-[17px] divide-y divide-white/10">
                  {ventaData.cotizadorGranito.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-x-2 py-1">
                    <div className={`col-span-3 text-xs flex items-center px-2 h-8 bg-white border border-gray-300 rounded-none ${getCategoryTextClass(item.categoria)}`}>
                      {showFIndicator(item.categoria) && (
                        <span className="inline-block w-4 h-4 leading-4 text-[10px] text-black bg-red-600 font-bold text-center rounded-sm mr-1">F</span>
                      )}
                        {item.categoria}
                      </div>
                      <div className="px-0 col-span-2">
                        <input
                          type="text"
                          value={item.monto}
                          onChange={(e) => handleCotizadorChange('cotizadorGranito', item.id, 'monto', e.target.value)}
                        className="w-full text-xs bg-white text-black border border-gray-300 rounded-none px-2 h-8 focus:outline-none"
                          placeholder="S/0.00"
                        />
                      </div>
                      <div className="px-0 col-span-2">
                          <div className="w-full text-xs bg-white text-black border border-gray-300 rounded-none px-2 h-8 flex items-center">
                            {(() => {
                              const categoriaUpper = (item.categoria || '').toUpperCase();
                              // Para "GRANITO Y/O CUARZO": calcular proyecto = monto / 1.18
                              if (categoriaUpper.includes('GRANITO Y/O CUARZO')) {
                                const parseAmount = (value) => {
                                  if (!value) return 0;
                                  const cleanValue = value.toString().replace(/[S$\/,\s]/g, '');
                                  return parseFloat(cleanValue) || 0;
                                };
                                const formatAmount = (value) => {
                                  return `S/${value.toFixed(2)}`;
                                };
                                const monto = parseAmount(item.monto);
                                const proyectoValue = monto / 1.18;
                                return formatAmount(proyectoValue);
                              }
                              return item.proyecto || 'S/0.00';
                            })()}
                          </div>
                        </div>
                      <div className="px-0 col-span-5">
                        <input
                          type="text"
                          value={item.observaciones || ''}
                          onChange={(e) => handleCotizadorChange('cotizadorGranito', item.id, 'observaciones', e.target.value)}
                        className="w-full text-xs bg-white text-black border border-gray-300 rounded-none px-2 h-8 focus:outline-none"
                          placeholder="Observaciones"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Totales Granito - mismo layout (12 columnas): Etiqueta 3, S/ 2, Observaciones 7 */}
                <div className="p-2 pr-[17px] border-t border-white/10 divide-y divide-white/10">
                  {/* Recibo interno */}
                  <div className="grid grid-cols-12 gap-x-2 mb-2">
                    <div className="col-span-3 text-xs bg-white text-black border border-gray-300 rounded-none px-1 h-8 flex items-center">RECIBO INTERNO</div>
                    <div className="col-span-2 bg-white text-black text-xs font-bold px-2 h-8 border border-gray-300 rounded-none flex items-center">
                      {ventaData.reciboInternoGranito || 'S/0.00'}
                    </div>
                    <div className="col-span-7"></div>
                  </div>
                  {/* Monto Facturado */}
                  <div className="grid grid-cols-12 gap-x-2 mb-2">
                    <div className="col-span-3 text-xs bg-white text-black border border-gray-300 rounded-none px-1 h-8 flex items-center">MONTO FACTURADO</div>
                    <div className="col-span-2 bg-white text-black text-xs font-bold px-2 h-8 border border-gray-300 rounded-none flex items-center">
                      {ventaData.montoFacturadoGranito || 'S/0.00'}
                    </div>
                    <div className="col-span-7"></div>
                  </div>
                  {/* Monto con recibo interno */}
                  <div className="grid grid-cols-12 gap-x-2 mb-2">
                    <div className="col-span-3 text-xs bg-white text-black border border-gray-300 rounded-none px-1 h-8 flex items-center">MONTO CON RECIBO INTERNO</div>
                    <div className="col-span-2 bg-white text-black text-xs font-bold px-2 h-8 border border-gray-300 rounded-none flex items-center">
                      {ventaData.montoConReciboGranito || 'S/0.00'}
                    </div>
                    <div className="col-span-2 bg-white text-black text-xs font-bold px-2 h-8 border border-gray-300 rounded-none flex items-center">
                      {ventaData.montoConReciboGranitoProyecto || 'S/0.00'}
                    </div>
                    <div className="col-span-5"></div>
                      </div>
                  {/* Factura total */}
                  <div className="grid grid-cols-12 gap-x-2">
                    <div className="col-span-3 text-xs bg-white text-black border border-gray-300 rounded-none px-1 h-8 flex items-center">FACTURA TOTAL</div>
                    <div className="col-span-2 bg-white text-black text-xs font-bold px-2 h-8 border border-gray-300 rounded-none flex items-center">
                      {ventaData.facturaTotalGranito || 'S/0.00'}
                    </div>
                    <div className="col-span-7"></div>
                  </div>
                </div>
              </div>

              {/* TERCIALIZACIONES */}
              <div className="bg-black rounded border-2 border-gray-600">
                <div className="grid grid-cols-12 bg-[#0fb8b8] text-white text-xs font-bold">
                  <div className="col-span-3 px-2 py-1 border-r border-teal-700">COTIZADOR DE TERCIALIZACIONES</div>
                  <div className="col-span-2 px-2 py-1 border-r border-teal-700 text-center">S/</div>
                  <div className="col-span-2 px-2 py-1 border-r border-teal-700 text-center"></div>
                  <div className="col-span-5 px-2 py-1 text-center">OBSERVACIONES</div>
                </div>
                <div className="p-2 pr-[17px] divide-y divide-white/10">
                  {ventaData.cotizadorTercializaciones.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-x-2 py-1">
                    <div className={`col-span-3 text-xs flex items-center px-2 h-8 bg-white border border-gray-300 rounded-none ${getCategoryTextClass(item.categoria)}`}>
                      {showFIndicator(item.categoria) && (
                        <span className="inline-block w-4 h-4 leading-4 text-[10px] text-black bg-red-600 font-bold text-center rounded-sm mr-1">F</span>
                      )}
                        {item.categoria}
                      </div>
                      <div className="px-0 col-span-2">
                        <input
                          type="text"
                          value={item.monto}
                          onChange={(e) => handleCotizadorChange('cotizadorTercializaciones', item.id, 'monto', e.target.value)}
                        className="w-full text-xs bg-white text-black border border-gray-300 rounded-none px-2 h-8 focus:outline-none"
                          placeholder="S/0.00"
                        />
                      </div>
                      <div className="px-0 col-span-2">
                        <div className="w-full text-xs bg-white text-black border border-gray-300 rounded-none px-2 h-8 flex items-center">
                          {(() => {
                            const categoriaUpper = (item.categoria || '').toUpperCase();
                            // Para "TERCIALIZACION 1 FACT.": calcular proyecto = monto / 1.18
                            if (categoriaUpper.includes('TERCIALIZACION 1 FACT.')) {
                              const parseAmount = (value) => {
                                if (!value) return 0;
                                const cleanValue = value.toString().replace(/[S$\/,\s]/g, '');
                                return parseFloat(cleanValue) || 0;
                              };
                              const formatAmount = (value) => {
                                return `S/${value.toFixed(2)}`;
                              };
                              const monto = parseAmount(item.monto);
                              const proyectoValue = monto / 1.18;
                              return formatAmount(proyectoValue);
                            }
                            return item.proyecto || 'S/0.00';
                          })()}
                        </div>
                      </div>
                      <div className="px-0 col-span-5">
                        <input
                          type="text"
                          value={item.observaciones || ''}
                          onChange={(e) => handleCotizadorChange('cotizadorTercializaciones', item.id, 'observaciones', e.target.value)}
                        className="w-full text-xs bg-white text-black border border-gray-300 rounded-none px-2 h-8 focus:outline-none"
                          placeholder="Observaciones"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Totales Tercializaciones - 12 columnas: Etiqueta 3, S/ 2, Observaciones 7 */}
                <div className="p-2 pr-[17px] border-t border-white/10 divide-y divide-white/10">
                  <div className="grid grid-cols-12 gap-x-2 mb-2">
                    <div className="col-span-3 text-xs bg-white text-black border border-gray-300 rounded-none px-1 h-8 flex items-center">RECIBO INTERNO</div>
                    <div className="col-span-2 bg-white text-black text-xs font-bold px-2 h-8 border border-gray-300 rounded-none flex items-center">
                      {ventaData.reciboInternoTercializaciones || 'S/0.00'}
              </div>
                    <div className="col-span-7"></div>
            </div>
                  <div className="grid grid-cols-12 gap-x-2 mb-2">
                    <div className="col-span-3 text-xs bg-white text-black border border-gray-300 rounded-none px-1 h-8 flex items-center">MONTO FACTURADO</div>
                    <div className="col-span-2 bg-white text-black text-xs font-bold px-2 h-8 border border-gray-300 rounded-none flex items-center">
                      {ventaData.montoFacturadoTercializaciones || 'S/0.00'}
                    </div>
                    <div className="col-span-7"></div>
                  </div>
                  <div className="grid grid-cols-12 gap-x-2 mb-2">
                    <div className="col-span-3 text-xs bg-white text-black border border-gray-300 rounded-none px-1 h-8 flex items-center">MONTO CON RECIBO INTERNO</div>
                    <div className="col-span-2 bg-white text-black text-xs font-bold px-2 h-8 border border-gray-300 rounded-none flex items-center">
                      {ventaData.montoConReciboTercializaciones || 'S/0.00'}
                    </div>
                    <div className="col-span-2 bg-white text-black text-xs font-bold px-2 h-8 border border-gray-300 rounded-none flex items-center">
                      {ventaData.montoConReciboTercializacionesProyecto || 'S/0.00'}
                    </div>
                    <div className="col-span-5"></div>
                  </div>
                  <div className="grid grid-cols-12 gap-x-2">
                    <div className="col-span-3 text-xs bg-white text-black border border-gray-300 rounded-none px-1 h-8 flex items-center">FACTURA TOTAL</div>
                    <div className="col-span-2 bg-white text-black text-xs font-bold px-2 h-8 border border-gray-300 rounded-none flex items-center">
                      {ventaData.facturaTotalTercializaciones || 'S/0.00'}
                    </div>
                    <div className="col-span-7"></div>
                  </div>
                </div>
              </div>

              {/* Tarjetas rojas de totales a la derecha */}
              <div className="flex flex-col items-end gap-2">
                <div className="bg-red-700 text-white rounded px-4 py-2 shadow border border-red-800 w-64 text-center">
                  <div className="text-xs font-semibold">Total Recibo Interno</div>
                  <div className="text-sm font-bold">{ventaData.totalRecibo}</div>
                </div>
                <div className="bg-red-700 text-white rounded px-4 py-2 shadow border border-red-800 w-64 text-center">
                  <div className="text-xs font-semibold">Total Facturado</div>
                  <div className="text-sm font-bold">{ventaData.totalFacturado}</div>
                </div>
                <div className="bg-red-700 text-white rounded px-4 py-2 shadow border border-red-800 w-64 text-center">
                  <div className="text-xs font-semibold">Total Doble Modo (Con)</div>
                  <div className="text-sm font-bold">{ventaData.totalDobleModoCon}</div>
                </div>
              </div>
            </div>

            {/* Columna derecha (4/12): Cliente, Teléfono, Requerimiento, Estado, Observaciones, Adjuntos */}
            <div className="col-span-12 xl:col-span-4">
              <div className="bg-black rounded border-2 border-gray-600">
                <div className="grid grid-cols-2 gap-0 text-white text-xs">
                  <div className="px-2 py-1 border-b border-white/20">CLIENTE</div>
                  <div className="px-2 py-1 border-b border-white/20">
                    <input type="text" value={ventaData.cliente} onChange={(e)=>handleInputChange('cliente', e.target.value)} className="w-full bg-white text-black border border-gray-300 rounded px-2 py-1" />
                  </div>
                  <div className="px-2 py-1 border-b border-white/20">TELEFONO</div>
                  <div className="px-2 py-1 border-b border-white/20">
                    <input type="text" value={ventaData.telefono} onChange={(e)=>handleInputChange('telefono', e.target.value)} className="w-full bg-white text-black border border-gray-300 rounded px-2 py-1" />
                  </div>
                  <div className="px-2 py-1 border-b border-white/20">REQUERIMIENTO</div>
                  <div className="px-2 py-1 border-b border-white/20">
                    <input type="text" value={ventaData.requerimiento} onChange={(e)=>handleInputChange('requerimiento', e.target.value)} className="w-full bg-white text-black border border-gray-300 rounded px-2 py-1" />
                  </div>
                  <div className="px-2 py-1 border-b border-white/20">ESTADO</div>
                  <div className="px-2 py-1 border-b border-white/20">
                    <select value={ventaData.estado} onChange={(e)=>handleInputChange('estado', e.target.value)} className="w-full bg-white text-black border border-gray-300 rounded px-2 py-1">
                      <option value="Cotizando" className="bg-gray-800 text-white">Cotizando</option>
                      <option value="Enviado" className="bg-gray-800 text-white">Enviado</option>
                      <option value="Aprobado" className="bg-gray-800 text-white">Aprobado</option>
                      <option value="Rechazado" className="bg-gray-800 text-white">Rechazado</option>
                      <option value="Facturado" className="bg-gray-800 text-white">Facturado</option>
                    </select>
                  </div>
                </div>
                {/* Barra ROJA: ARCHIVOS ADJUNTOS */}
                <div className="bg-red-700 text-white text-xs font-bold px-2 py-1 border-t border-red-800">ARCHIVOS ADJUNTOS</div>
                {/* Observaciones área grande */}
                <div className="text-white text-xs px-2 pt-2">OBSERVACIONES:</div>
                <div className="p-2">
                  <textarea rows="16" value={ventaData.observaciones} onChange={(e)=>handleInputChange('observaciones', e.target.value)} className="w-full bg-white text-black border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-blue-500 text-xs"/>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Popup COTIZACION */}
      {cotizacionPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setCotizacionPopupOpen(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-yellow-500 rounded-t-lg -m-6 mb-4 p-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-black">Contrato de Servicio</h2>
                <button
                  onClick={() => setCotizacionPopupOpen(false)}
                  className="text-black hover:text-gray-800 text-2xl font-bold leading-none"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Campo de texto */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del Servicio
              </label>
              <textarea
                value={ventaData.cotizacionTexto || ''}
                onChange={handleCotizacionTextoChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-black resize-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
                rows="4"
                placeholder="Descripción breve del servicio"
              />
            </div>

            {/* Adjuntar archivo */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjuntar Archivo (PDF, Imagen o Excel)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                onChange={handleCotizacionFileChange}
                className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600 cursor-pointer"
              />
            </div>

            {/* Botones de acción */}
            {ventaData.cotizacionArchivoUrl && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={handleVerCotizacionArchivo}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded transition-colors"
                >
                  Ver Archivo
                </button>
                <button
                  onClick={handleEliminarCotizacionArchivo}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2 rounded transition-colors"
                >
                  Eliminar
                </button>
              </div>
            )}

            {/* Botón cerrar */}
            <div className="flex justify-end">
              <button
                onClick={() => setCotizacionPopupOpen(false)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-bold px-6 py-2 rounded transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VentaDetalle;








