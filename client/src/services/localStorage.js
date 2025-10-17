// 💾 SERVICIO LOCALSTORAGE - FALLBACK PARA PERSISTENCIA
const STORAGE_KEYS = {
  PROYECTOS: 'ksamti_proyectos',
  TABS: 'ksamti_tabs',
  NEXT_PROJECT_NUMBER: 'ksamti_next_project_number',
  SETTINGS: 'ksamti_settings'
};

// 🔧 Utilidades de localStorage
const safeParseJSON = (data, fallback = null) => {
  try {
    return data ? JSON.parse(data) : fallback;
  } catch (error) {
    console.warn('⚠️ Error parsing JSON from localStorage:', error);
    return fallback;
  }
};

const safeStringify = (data) => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('❌ Error stringifying data for localStorage:', error);
    return null;
  }
};

// 📊 SERVICIOS PARA PROYECTOS EN LOCALSTORAGE
export const localStorageAPI = {
  // Obtener todos los proyectos
  getAll: () => {
    try {
      const projects = safeParseJSON(localStorage.getItem(STORAGE_KEYS.PROYECTOS), {});
      
      // Convertir objeto a array con formato API
      const projectArray = Object.keys(projects).map(key => ({
        id: parseInt(key),
        numero_proyecto: parseInt(key),
        nombre_proyecto: projects[key].nombreProyecto,
        nombre_cliente: projects[key].nombreCliente,
        estado_proyecto: projects[key].estadoProyecto,
        tipo_proyecto: projects[key].tipoProyecto,
        monto_contrato: projects[key].montoContrato,
        presupuesto_proyecto: projects[key].presupuestoProyecto,
        balance_proyecto: projects[key].balanceProyecto,
        utilidad_estimada_sin_factura: projects[key].utilidadEstimadaSinFactura,
        utilidad_real_sin_factura: projects[key].utilidadRealSinFactura,
        balance_utilidad_sin_factura: projects[key].balanceUtilidadSinFactura,
        utilidad_estimada_facturado: projects[key].utilidadEstimadaFacturado,
        utilidad_real_facturado: projects[key].utilidadRealFacturado,
        balance_utilidad_con_factura: projects[key].balanceUtilidadConFactura,
        total_contrato_proveedores: projects[key].totalContratoProveedores,
        saldo_pagar_proveedores: projects[key].saldoPagarProveedores,
        adelantos_cliente: projects[key].adelantosCliente,
        saldos_reales_proyecto: projects[key].saldosRealesProyecto,
        saldos_cobrar_proyecto: projects[key].saldosCobrarProyecto,
        credito_fiscal: projects[key].creditoFiscal,
        impuesto_real_proyecto: projects[key].impuestoRealProyecto,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      return {
        success: true,
        data: projectArray,
        total: projectArray.length,
        source: 'localStorage'
      };
    } catch (error) {
      console.error('❌ Error obteniendo proyectos de localStorage:', error);
      return { success: false, error: error.message, source: 'localStorage' };
    }
  },
  
  // Obtener proyecto por ID
  getById: (id) => {
    try {
      const projects = safeParseJSON(localStorage.getItem(STORAGE_KEYS.PROYECTOS), {});
      const tabs = safeParseJSON(localStorage.getItem(STORAGE_KEYS.TABS), []);
      
      const project = projects[id];
      const tab = tabs.find(t => t.rowIndex === parseInt(id));
      
      if (!project) {
        return { success: false, error: 'Proyecto no encontrado', source: 'localStorage' };
      }
      
      return {
        success: true,
        data: {
          proyecto: {
            id: parseInt(id),
            ...project
          },
          detalle: tab?.data || {},
          categorias: tab?.data?.categorias || []
        },
        source: 'localStorage'
      };
    } catch (error) {
      console.error('❌ Error obteniendo proyecto por ID de localStorage:', error);
      return { success: false, error: error.message, source: 'localStorage' };
    }
  },
  
  // Crear nuevo proyecto
  create: (projectData) => {
    try {
      const projects = safeParseJSON(localStorage.getItem(STORAGE_KEYS.PROYECTOS), {});
      const nextNumber = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_PROJECT_NUMBER) || '1');
      
      console.log('🔍 DEBUG localStorage.create:', {
        existingKeys: Object.keys(projects),
        nextNumber,
        typeOfNextNumber: typeof nextNumber
      });
      
      // Crear nuevo proyecto con valores por defecto
      const newProject = {
        nombreProyecto: projectData.nombreProyecto || `Proyecto ${nextNumber}`,
        nombreCliente: projectData.nombreCliente || '',
        estadoProyecto: projectData.estadoProyecto || 'Ejecucion',
        tipoProyecto: projectData.tipoProyecto || 'Recibo',
        montoContrato: projectData.montoContrato || '$/0.00',
        presupuestoProyecto: projectData.presupuestoProyecto || '$/0.00',
        balanceProyecto: '$/0.00',
        utilidadEstimadaSinFactura: '$/0.00',
        utilidadRealSinFactura: '$/0.00',
        balanceUtilidadSinFactura: '$/0.00',
        utilidadEstimadaFacturado: '$/0.00',
        utilidadRealFacturado: '$/0.00',
        balanceUtilidadConFactura: '$/0.00',
        totalContratoProveedores: '$/0.00',
        saldoPagarProveedores: '$/0.00',
        adelantosCliente: '$/0.00',
        saldosRealesProyecto: '$/0.00',
        saldosCobrarProyecto: '$/0.00',
        creditoFiscal: '$/0.00',
        impuestoRealProyecto: '$/0.00'
      };
      
      // Guardar proyecto
      projects[nextNumber] = newProject;
      console.log('✅ DEBUG Proyecto guardado en localStorage con clave:', nextNumber);
      console.log('📊 DEBUG Estado final de projects:', Object.keys(projects));
      
      localStorage.setItem(STORAGE_KEYS.PROYECTOS, safeStringify(projects));
      
      // Actualizar contador
      localStorage.setItem(STORAGE_KEYS.NEXT_PROJECT_NUMBER, String(nextNumber + 1));
      
      return {
        success: true,
        data: {
          id: nextNumber,
          numeroProyecto: nextNumber,
          message: 'Proyecto creado exitosamente en localStorage'
        },
        source: 'localStorage'
      };
    } catch (error) {
      console.error('❌ Error creando proyecto en localStorage:', error);
      return { success: false, error: error.message, source: 'localStorage' };
    }
  },
  
  // Actualizar proyecto
  update: (id, projectData) => {
    try {
      const projects = safeParseJSON(localStorage.getItem(STORAGE_KEYS.PROYECTOS), {});
      
      console.log('🔍 DEBUG localStorage.update:', {
        id,
        typeOfId: typeof id,
        availableKeys: Object.keys(projects),
        projectsData: projects
      });
      
      if (!projects[id]) {
        console.error('❌ Proyecto no encontrado:', {
          searchingFor: id,
          available: Object.keys(projects),
          projectsCount: Object.keys(projects).length
        });
        return { success: false, error: 'Proyecto no encontrado', source: 'localStorage' };
      }
      
      // 🧮 Aplicar fórmulas automáticas
      const updatedData = { ...projects[id], ...projectData };
      
      // Lógica de cálculo similar al backend
      const parseAmount = (value) => {
        if (!value) return 0;
        const cleanValue = value.toString().replace(/[$/,\s]/g, '');
        return parseFloat(cleanValue) || 0;
      };
      
      const formatAmount = (value) => `$/${value.toFixed(2)}`;
      
      // Calcular balances
      const montoContrato = parseAmount(updatedData.montoContrato);
      const adelantos = parseAmount(updatedData.adelantosCliente || updatedData.adelantos);
      const utilEstSin = parseAmount(updatedData.utilidadEstimadaSinFactura);
      const utilRealSin = parseAmount(updatedData.utilidadRealSinFactura);
      const utilEstCon = parseAmount(updatedData.utilidadEstimadaFacturado || updatedData.utilidadEstimadaConFactura);
      const utilRealCon = parseAmount(updatedData.utilidadRealFacturado || updatedData.utilidadRealConFactura);
      
      // Aplicar cálculos automáticos
      updatedData.balanceUtilidadSinFactura = formatAmount(utilEstSin - utilRealSin);
      updatedData.balanceUtilidadConFactura = formatAmount(utilEstCon - utilRealCon);
      updatedData.saldosCobrarProyecto = formatAmount(montoContrato - adelantos);
      
      // Guardar proyecto actualizado
      projects[id] = updatedData;
      localStorage.setItem(STORAGE_KEYS.PROYECTOS, safeStringify(projects));
      
      return {
        success: true,
        message: 'Proyecto actualizado exitosamente en localStorage',
        source: 'localStorage'
      };
    } catch (error) {
      console.error('❌ Error actualizando proyecto en localStorage:', error);
      return { success: false, error: error.message, source: 'localStorage' };
    }
  },
  
  // Eliminar proyectos
  delete: (ids) => {
    try {
      const projects = safeParseJSON(localStorage.getItem(STORAGE_KEYS.PROYECTOS), {});
      const tabs = safeParseJSON(localStorage.getItem(STORAGE_KEYS.TABS), []);
      
      let deletedCount = 0;
      
      // Eliminar proyectos
      ids.forEach(id => {
        if (projects[id]) {
          delete projects[id];
          deletedCount++;
        }
      });
      
      // Filtrar tabs correspondientes
      const filteredTabs = tabs.filter(tab => !ids.includes(tab.rowIndex));
      
      // Guardar cambios
      localStorage.setItem(STORAGE_KEYS.PROYECTOS, safeStringify(projects));
      localStorage.setItem(STORAGE_KEYS.TABS, safeStringify(filteredTabs));
      
      return {
        success: true,
        message: `${deletedCount} proyecto(s) eliminado(s) exitosamente de localStorage`,
        source: 'localStorage'
      };
    } catch (error) {
      console.error('❌ Error eliminando proyectos de localStorage:', error);
      return { success: false, error: error.message, source: 'localStorage' };
    }
  },
  
  // Sincronizar tabs
  syncTabs: (tabs) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TABS, safeStringify(tabs));
      return { success: true, source: 'localStorage' };
    } catch (error) {
      console.error('❌ Error sincronizando tabs:', error);
      return { success: false, error: error.message, source: 'localStorage' };
    }
  },
  
  // Obtener tabs
  getTabs: () => {
    try {
      const tabs = safeParseJSON(localStorage.getItem(STORAGE_KEYS.TABS), []);
      return { success: true, data: tabs, source: 'localStorage' };
    } catch (error) {
      console.error('❌ Error obteniendo tabs:', error);
      return { success: false, error: error.message, source: 'localStorage' };
    }
  }
};

// 🔄 UTILIDADES ADICIONALES
export const clearAllData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  console.log('🧹 Todos los datos locales han sido eliminados');
};

export const exportData = () => {
  const data = {};
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    data[name] = safeParseJSON(localStorage.getItem(key));
  });
  return data;
};

export const importData = (data) => {
  try {
    Object.entries(data).forEach(([name, value]) => {
      const key = STORAGE_KEYS[name];
      if (key && value !== null) {
        localStorage.setItem(key, safeStringify(value));
      }
    });
    return { success: true, message: 'Datos importados exitosamente' };
  } catch (error) {
    console.error('❌ Error importando datos:', error);
    return { success: false, error: error.message };
  }
};

export default {
  localStorageAPI,
  clearAllData,
  exportData,
  importData,
  STORAGE_KEYS
};
