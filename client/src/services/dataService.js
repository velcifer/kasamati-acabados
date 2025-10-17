// 🔗 SERVICIO HÍBRIDO - API + LOCALSTORAGE FALLBACK
import { proyectosAPI, checkServerHealth } from './api';
import { localStorageAPI } from './localStorage';

// 🧪 Estado de conectividad
let isServerOnline = true;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // 30 segundos

// 🔍 Verificar estado del servidor
const checkServerStatus = async () => {
  const now = Date.now();
  
  // Solo verificar si ha pasado el intervalo
  if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return isServerOnline;
  }
  
  try {
    const health = await checkServerHealth();
    isServerOnline = health.status === 'OK' && health.database === 'Connected';
    lastHealthCheck = now;
    
    if (isServerOnline) {
      console.log('✅ Servidor y base de datos disponibles');
    } else {
      console.warn('⚠️ Servidor disponible pero base de datos desconectada, usando localStorage');
    }
    
    return isServerOnline;
  } catch (error) {
    console.warn('⚠️ Servidor no disponible, usando localStorage como fallback');
    isServerOnline = false;
    lastHealthCheck = now;
    return false;
  }
};

// 🔄 Servicio híbrido principal
export const dataService = {
  
  // 📊 Obtener todos los proyectos
  getAllProjects: async () => {
    const serverOnline = await checkServerStatus();
    
    if (serverOnline) {
      try {
        const result = await proyectosAPI.getAll();
        if (result.success) {
          // 💾 Sincronizar con localStorage como backup
          result.data.forEach(project => {
            const projectForStorage = {
              nombreProyecto: project.nombre_proyecto,
              nombreCliente: project.nombre_cliente,
              estadoProyecto: project.estado_proyecto,
              tipoProyecto: project.tipo_proyecto,
              montoContrato: project.monto_contrato,
              presupuestoProyecto: project.presupuesto_proyecto,
              balanceProyecto: project.balance_proyecto,
              utilidadEstimadaSinFactura: project.utilidad_estimada_sin_factura,
              utilidadRealSinFactura: project.utilidad_real_sin_factura,
              balanceUtilidadSinFactura: project.balance_utilidad_sin_factura,
              utilidadEstimadaFacturado: project.utilidad_estimada_facturado,
              utilidadRealFacturado: project.utilidad_real_facturado,
              balanceUtilidadConFactura: project.balance_utilidad_con_factura,
              totalContratoProveedores: project.total_contrato_proveedores,
              saldoPagarProveedores: project.saldo_pagar_proveedores,
              adelantosCliente: project.adelantos_cliente,
              saldosRealesProyecto: project.saldos_reales_proyecto,
              saldosCobrarProyecto: project.saldos_cobrar_proyecto,
              creditoFiscal: project.credito_fiscal,
              impuestoRealProyecto: project.impuesto_real_proyecto
            };
            
            // Actualizar localStorage sin sobreescribir
            const projects = JSON.parse(localStorage.getItem('ksamti_proyectos') || '{}');
            projects[project.numero_proyecto] = projectForStorage;
            localStorage.setItem('ksamti_proyectos', JSON.stringify(projects));
          });
          
          return { ...result, source: 'API + localStorage backup' };
        }
      } catch (error) {
        console.warn('⚠️ Error en API, fallback a localStorage');
      }
    }
    
    // Fallback a localStorage
    return localStorageAPI.getAll();
  },
  
  // 🔍 Obtener proyecto por ID
  getProjectById: async (id) => {
    const serverOnline = await checkServerStatus();
    
    if (serverOnline) {
      try {
        const result = await proyectosAPI.getById(id);
        if (result.success) {
          return { ...result, source: 'API' };
        }
      } catch (error) {
        console.warn('⚠️ Error en API, fallback a localStorage');
      }
    }
    
    // Fallback a localStorage
    return localStorageAPI.getById(id);
  },
  
  // ➕ Crear proyecto
  createProject: async (projectData) => {
    const serverOnline = await checkServerStatus();
    
    if (serverOnline) {
      try {
        const result = await proyectosAPI.create(projectData);
        if (result.success) {
          // También crear en localStorage como backup
          await localStorageAPI.create(projectData);
          return { ...result, source: 'API + localStorage backup' };
        }
      } catch (error) {
        console.warn('⚠️ Error en API, fallback a localStorage');
      }
    }
    
    // Fallback a localStorage
    return localStorageAPI.create(projectData);
  },
  
  // 🔄 Actualizar proyecto
  updateProject: async (id, projectData) => {
    const serverOnline = await checkServerStatus();
    
    if (serverOnline) {
      try {
        const result = await proyectosAPI.update(id, projectData);
        if (result.success) {
          // También actualizar en localStorage
          await localStorageAPI.update(id, projectData);
          return { ...result, source: 'API + localStorage sync' };
        }
      } catch (error) {
        console.warn('⚠️ Error en API, fallback a localStorage');
      }
    }
    
    // Fallback a localStorage
    return localStorageAPI.update(id, projectData);
  },
  
  // 🗑️ Eliminar proyectos
  deleteProjects: async (ids) => {
    const serverOnline = await checkServerStatus();
    
    if (serverOnline) {
      try {
        const result = await proyectosAPI.delete(ids);
        if (result.success) {
          // También eliminar de localStorage
          await localStorageAPI.delete(ids);
          return { ...result, source: 'API + localStorage sync' };
        }
      } catch (error) {
        console.warn('⚠️ Error en API, fallback a localStorage');
      }
    }
    
    // Fallback a localStorage
    return localStorageAPI.delete(ids);
  },
  
  // 📊 Obtener estadísticas
  getStats: async () => {
    const serverOnline = await checkServerStatus();
    
    if (serverOnline) {
      try {
        const result = await proyectosAPI.getStats();
        if (result.success) {
          return { ...result, source: 'API' };
        }
      } catch (error) {
        console.warn('⚠️ Error obteniendo estadísticas de API');
      }
    }
    
    // Fallback: calcular estadísticas localmente
    try {
      const projects = await localStorageAPI.getAll();
      if (projects.success) {
        const totalProyectos = projects.data.length;
        const estadisticas = {};
        const totalContratos = projects.data.reduce((sum, p) => {
          const amount = parseFloat(p.monto_contrato?.replace(/[$/,\s]/g, '') || 0);
          return sum + amount;
        }, 0);
        
        return {
          success: true,
          data: {
            totalProyectos,
            estadisticas,
            totalContratos,
            totalPorCobrar: 0
          },
          source: 'localStorage calculation'
        };
      }
    } catch (error) {
      console.error('❌ Error calculando estadísticas locales');
    }
    
    return { success: false, error: 'No se pudieron obtener estadísticas' };
  },
  
  // 🔄 Sincronizar datos entre API y localStorage
  syncData: async () => {
    try {
      const serverOnline = await checkServerStatus();
      
      if (!serverOnline) {
        return { success: false, message: 'Servidor no disponible para sincronización' };
      }
      
      // Obtener datos de ambas fuentes
      const [apiData, localData] = await Promise.all([
        proyectosAPI.getAll(),
        localStorageAPI.getAll()
      ]);
      
      if (apiData.success && localData.success) {
        // Lógica de sincronización (prioridad a API)
        console.log('🔄 Sincronizando datos API ↔ localStorage...');
        
        // Actualizar localStorage con datos de API
        const projects = {};
        apiData.data.forEach(project => {
          projects[project.numero_proyecto] = {
            nombreProyecto: project.nombre_proyecto,
            nombreCliente: project.nombre_cliente,
            // ... otros campos
          };
        });
        
        localStorage.setItem('ksamti_proyectos', JSON.stringify(projects));
        
        return { 
          success: true, 
          message: `Sincronizados ${apiData.data.length} proyectos`,
          apiCount: apiData.data.length,
          localCount: localData.data.length
        };
      }
      
      return { success: false, message: 'Error en sincronización de datos' };
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      return { success: false, error: error.message };
    }
  },
  
  // 🔍 Obtener estado de conectividad
  getConnectionStatus: () => ({
    isOnline: isServerOnline,
    lastCheck: lastHealthCheck,
    source: isServerOnline ? 'API + MySQL' : 'localStorage'
  })
};

// 🎯 Hook personalizado para React (opcional)
export const useDataService = () => {
  return {
    ...dataService,
    isOnline: isServerOnline,
    checkConnection: checkServerStatus
  };
};

export default dataService;
