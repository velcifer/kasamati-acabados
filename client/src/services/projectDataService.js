// 🎯 SERVICIO CENTRALIZADO DE DATOS - SINCRONIZACIÓN AUTOMÁTICA
// Maneja la sincronización entre ProyectoDetalle y ExcelGrid con fórmulas automáticas
// 🔄 AHORA TAMBIÉN SINCRONIZA CON MYSQL CUANDO LA API ESTÉ DISPONIBLE

import { proyectosAPI } from './api';

class ProjectDataService {
  constructor() {
    this.listeners = [];
    // ⚡ Cargar desde localStorage de forma diferida para no bloquear el inicio
    this.projects = null;
    this._projectsLoaded = false;
    this.apiAvailable = false; // Flag para saber si la API está disponible
    this._isLoadingFromMySQL = false; // Bandera para evitar múltiples cargas simultáneas
    this._syncingProjects = new Set(); // Set de proyectos que están siendo sincronizados
    
    // ⚡ Cargar datos de forma diferida usando requestIdleCallback o setTimeout
    if (typeof window !== 'undefined') {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          this.projects = this.loadFromLocalStorage();
          this._projectsLoaded = true;
          this.checkApiAvailability().catch(() => {});
        }, { timeout: 1000 });
      } else {
        setTimeout(() => {
          this.projects = this.loadFromLocalStorage();
          this._projectsLoaded = true;
          this.checkApiAvailability().catch(() => {});
        }, 50);
      }
    } else {
      // Fallback para SSR
      this.projects = this.loadFromLocalStorage();
      this._projectsLoaded = true;
    }
  }
  
  // 🔍 Método para obtener proyectos (con carga lazy si es necesario)
  _ensureProjectsLoaded() {
    if (!this._projectsLoaded) {
      this.projects = this.loadFromLocalStorage();
      this._projectsLoaded = true;
    }
    return this.projects;
  }

  // 🔍 Verificar si la API está disponible (no bloqueante, con timeout corto)
  async checkApiAvailability() {
    try {
      console.log('🔍 Verificando disponibilidad de API...');
      const { checkServerHealth } = await import('./api');
      // ⚡ Timeout aumentado a 3 segundos para dar más tiempo
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );
      
      const health = await Promise.race([
        checkServerHealth(),
        timeoutPromise
      ]);
      
      const wasAvailable = this.apiAvailable;
      this.apiAvailable = health.status === 'OK' && health.database === 'Connected';
      
      if (this.apiAvailable) {
        if (!wasAvailable) {
          console.log('✅ API MySQL ahora disponible (cambió de estado)');
        } else {
          console.log('✅ API MySQL disponible');
        }
        console.log('   Health check:', JSON.stringify(health, null, 2));
      } else {
        console.warn('⚠️ API MySQL no disponible');
        console.warn('   Health check:', JSON.stringify(health, null, 2));
      }
    } catch (error) {
      const wasAvailable = this.apiAvailable;
      this.apiAvailable = false;
      if (wasAvailable) {
        console.warn(`⚠️ API MySQL dejó de estar disponible:`, error.message);
      } else {
        console.log(`⏸️ API MySQL no disponible (${error.message})`);
      }
    }
  }

  // 💾 PERSISTENCIA LOCAL
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('ksamati_projects');
      if (saved) {
        const projects = JSON.parse(saved);
        // 🔧 AUTO-REPARAR: Si faltan categorías, agregarlas automáticamente
        return this.ensureAllCategoriesExist(projects);
      }
      return this.getInitialProjects();
    } catch (error) {
      console.warn('Error loading projects from localStorage:', error);
      return this.getInitialProjects();
    }
  }

  // 🔧 AUTO-REPARACIÓN: Asegurar que todos los proyectos tengan las 24 categorías
  ensureAllCategoriesExist(projects) {
    const defaultCategories = this.getInitialProjects()[1].categorias; // Tomar las categorías del proyecto inicial
    
    Object.keys(projects).forEach(projectId => {
      const project = projects[projectId];
      if (!project.categorias || project.categorias.length < 24) {
        console.log(`🔧 Restaurando categorías faltantes para Proyecto ${projectId}`);
        projects[projectId].categorias = [...defaultCategories]; // Restaurar todas las categorías
      }
    });
    
    return projects;
  }

  saveToLocalStorage() {
    try {
      // ⚡ Asegurar que los proyectos estén cargados antes de guardar
      this._ensureProjectsLoaded();
      // Guardar en la clave principal
      localStorage.setItem('ksamati_projects', JSON.stringify(this.projects));
      // También guardar en la clave cliente/legacy para compatibilidad
      try {
        localStorage.setItem('ksamti_proyectos', JSON.stringify(this.projects));
      } catch (e) {
        // ignore per-key error
      }
    } catch (error) {
      console.warn('Error saving projects to localStorage:', error);
    }
  }

  // Forzar recarga desde localStorage (útil si otra pestaña o flujo modificó los datos)
  reloadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('ksamati_projects') || localStorage.getItem('ksamti_proyectos');
      if (saved) {
        const projects = JSON.parse(saved);
        this.projects = this.ensureAllCategoriesExist(projects);
        this.notifyListeners();
      }
    } catch (e) {
      console.warn('Error reloading projects from localStorage:', e);
    }
  }

  // 📊 DATOS INICIALES
  getInitialProjects() {
    return {
      1: {
        id: 1,
        nombreProyecto: 'Proyecto 1',
        nombreCliente: 'IBK',
        estadoProyecto: 'Ejecucion',
        tipoProyecto: 'Recibo',
        
        // 💰 MONTOS PRINCIPALES
        montoContrato: 0,
        presupuestoProyecto: 0,
        utilidadEstimadaSinFactura: 0,
        utilidadRealSinFactura: 0,
        utilidadEstimadaConFactura: 0,
        utilidadRealConFactura: 0,
        
        // 📈 TOTALES CALCULADOS (FÓRMULAS AUTOMÁTICAS)
        totalContratoProveedores: 0,
        totalSaldoPorPagarProveedores: 0,
        balanceDeComprasDelProyecto: 0,
        adelantos: 0,
        saldoXCobrar: 0,
        creditoFiscal: 0,

        // 🗂️ CATEGORÍAS DEL PROYECTO (para tabla detallada) - TODAS LAS FILAS ORIGINALES
        categorias: [
          { id: 1, nombre: 'Melamina y Servicios', tipo: 'F', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 2, nombre: 'Melamina High Gloss', tipo: 'F', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 3, nombre: 'Accesorios y Ferretería', tipo: 'F', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 4, nombre: 'Puertas Alu Vidrios', tipo: 'F', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 5, nombre: 'Led Y Electricidad', tipo: 'F', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 6, nombre: 'Flete y/o Camioneta', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 7, nombre: 'Logística Operativa', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 8, nombre: 'Extras y/o Eventos', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 9, nombre: 'Despecie', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 10, nombre: 'Mano de Obra', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 11, nombre: 'Mano de Obra', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 12, nombre: 'Mano de Obra', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 13, nombre: 'Mano de Obra', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 14, nombre: 'OF - ESCP', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 15, nombre: 'Granito Y/O Cuarzo', tipo: 'F', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 16, nombre: 'Extras Y/O Eventos GyC', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 17, nombre: 'Tercializacion 1 Facturada', tipo: 'F', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 18, nombre: 'Extras Y/O Eventos Terc. 1', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 19, nombre: 'Tercializacion 2 Facturada', tipo: 'F', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 20, nombre: 'Extras Y/O Eventos Terc. 2', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 21, nombre: 'Tercializacion 1 NO Facturada', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 22, nombre: 'Extras Y/O Eventos Terc. 1 NF', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 23, nombre: 'Tercializacion 2 NO Facturada', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
          { id: 24, nombre: 'Extras Y/O Eventos Terc. 2 NF', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 }
        ],

        // 📅 ÚLTIMA ACTUALIZACIÓN
        lastUpdated: new Date().toISOString()
      },
      2: {
        id: 2,
        nombreProyecto: 'Proyecto 2',
        nombreCliente: 'IMG',
        estadoProyecto: 'Ejecucion',
        tipoProyecto: 'Servicio',
        montoContrato: 0,
        presupuestoProyecto: 0,
        utilidadEstimadaSinFactura: 0,
        utilidadRealSinFactura: 0,
        utilidadEstimadaConFactura: 0,
        utilidadRealConFactura: 0,
        totalContratoProveedores: 0,
        totalSaldoPorPagarProveedores: 0,
        balanceDeComprasDelProyecto: 0,
        adelantos: 0,
        saldoXCobrar: 0,
        creditoFiscal: 0,
        categorias: [],
        lastUpdated: new Date().toISOString()
      },
      3: {
        id: 3,
        nombreProyecto: 'Proyecto 3',
        nombreCliente: 'Google',
        estadoProyecto: 'Ejecucion',
        tipoProyecto: 'Recibo',
        montoContrato: 0,
        presupuestoProyecto: 1580,
        utilidadEstimadaSinFactura: 1580,
        utilidadRealSinFactura: 100,
        utilidadEstimadaConFactura: 1480,
        utilidadRealConFactura: 1412.20,
        totalContratoProveedores: 100,
        totalSaldoPorPagarProveedores: 1312.20,
        balanceDeComprasDelProyecto: 0,
        adelantos: 0,
        saldoXCobrar: 15780,
        creditoFiscal: 0,
        categorias: [],
        lastUpdated: new Date().toISOString()
      }
    };
  }

  // 🎯 MÉTODOS DE GESTIÓN DE DATOS

  // Obtener todos los proyectos (con carga desde MySQL si está disponible)
  async getAllProjects() {
    // ⚡ Asegurar que los proyectos estén cargados
    this._ensureProjectsLoaded();
    // ⚡ BANDERA para evitar múltiples llamadas simultáneas
    if (this._isLoadingFromMySQL) {
      console.log('⏸️ Ya hay una carga desde MySQL en curso, retornando datos locales');
      return this.projects;
    }
    
    // Si la API está disponible, intentar cargar desde MySQL (con timeout corto)
    if (this.apiAvailable) {
      this._isLoadingFromMySQL = true;
      try {
        // Timeout de 10 segundos para dar más tiempo al servidor
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve({ timeout: true, success: false, error: 'Timeout MySQL' }), 10000)
        );
        
        let result;
        try {
          result = await Promise.race([
            proyectosAPI.getAll(),
            timeoutPromise
          ]);
        } catch (error) {
          // Si es timeout o cualquier error, usar localStorage inmediatamente
          if (error.message && (error.message === 'Timeout MySQL' || error.message.includes('Timeout'))) {
            console.warn('⚠️ Timeout cargando desde MySQL (10s), usando localStorage');
          }
          this._isLoadingFromMySQL = false;
          return this.projects;
        }
        
        // ⚡ Verificar si es timeout (objeto especial retornado por timeoutPromise)
        if (result && result.timeout === true) {
          console.warn('⚠️ Timeout cargando desde MySQL (10s), usando localStorage');
          this._isLoadingFromMySQL = false;
          return this.projects;
        }
        
        // Si hay proyectos o la respuesta es exitosa, cargarlos
        if (result && result.success && result.data && Array.isArray(result.data)) {
          // ⚡ PRESERVAR categorías guardadas en localStorage antes de sobrescribir
          const localProjects = { ...this.projects };
          
          // Convertir proyectos de API al formato interno
          const projectsFromAPI = {};
          result.data.forEach(project => {
            const projectId = project.id || project.numero_proyecto;
            
            // ⚡ PRESERVAR categorías guardadas localmente si las categorías desde MySQL están vacías
            const localProject = localProjects[projectId];
            const categoriasFromMySQL = project.categorias && Array.isArray(project.categorias) && project.categorias.length === 24 
              ? project.categorias 
              : null;
            
            // Si hay categorías guardadas localmente y MySQL no tiene categorías completas, preservar las locales
            let categoriasFinales;
            if (categoriasFromMySQL) {
              // MySQL tiene categorías completas, usarlas
              categoriasFinales = categoriasFromMySQL;
            } else if (localProject && localProject.categorias && Array.isArray(localProject.categorias) && localProject.categorias.length === 24) {
              // MySQL no tiene categorías, pero localStorage sí, preservar las locales
              console.log(`💾 Preservando categorías guardadas localmente para Proyecto ${projectId} (MySQL no tiene categorías)`);
              categoriasFinales = localProject.categorias;
            } else {
              // No hay categorías en ningún lado, usar las por defecto
              categoriasFinales = [...this.getInitialProjects()[1].categorias];
            }
            
            projectsFromAPI[projectId] = {
              id: projectId,
              numeroProyecto: project.numero_proyecto || projectId,
              nombreProyecto: project.nombre_proyecto || project.nombreProyecto,
              nombreCliente: project.nombre_cliente || project.nombreCliente,
              estadoProyecto: project.estado_proyecto || project.estadoProyecto,
              tipoProyecto: project.tipo_proyecto || project.tipoProyecto,
              montoContrato: parseFloat(String(project.monto_contrato || project.montoContrato).replace(/[$/,\s]/g, '')) || 0,
              presupuestoProyecto: parseFloat(String(project.presupuesto_proyecto || project.presupuestoProyecto).replace(/[$/,\s]/g, '')) || 0,
              balanceDelPresupuesto: parseFloat(String(project.balance_del_presupuesto || project.balanceDelPresupuesto).replace(/[$/,\s]/g, '')) || 0,
              utilidadEstimadaSinFactura: parseFloat(String(project.utilidad_estimada_sin_factura || project.utilidadEstimadaSinFactura).replace(/[$/,\s]/g, '')) || 0,
              utilidadRealSinFactura: parseFloat(String(project.utilidad_real_sin_factura || project.utilidadRealSinFactura).replace(/[$/,\s]/g, '')) || 0,
              utilidadEstimadaConFactura: parseFloat(String(project.utilidad_estimada_facturado || project.utilidadEstimadaConFactura).replace(/[$/,\s]/g, '')) || 0,
              utilidadRealConFactura: parseFloat(String(project.utilidad_real_facturado || project.utilidadRealConFactura).replace(/[$/,\s]/g, '')) || 0,
              totalContratoProveedores: parseFloat(String(project.total_contrato_proveedores || project.totalContratoProveedores).replace(/[$/,\s]/g, '')) || 0,
              totalSaldoPorPagarProveedores: parseFloat(String(project.saldo_pagar_proveedores || project.totalSaldoPorPagarProveedores).replace(/[$/,\s]/g, '')) || 0,
              adelantos: parseFloat(String(project.adelantos_cliente || project.adelantos).replace(/[$/,\s]/g, '')) || 0,
              saldoXCobrar: parseFloat(String(project.saldos_cobrar_proyecto || project.saldoXCobrar).replace(/[$/,\s]/g, '')) || 0,
              creditoFiscal: parseFloat(String(project.credito_fiscal || project.creditoFiscal).replace(/[$/,\s]/g, '')) || 0,
              creditoFiscalEstimado: parseFloat(String(project.credito_fiscal_estimado || project.creditoFiscalEstimado).replace(/[$/,\s]/g, '')) || 0,
              creditoFiscalReal: parseFloat(String(project.credito_fiscal_real || project.creditoFiscalReal).replace(/[$/,\s]/g, '')) || 0,
              impuestoRealDelProyecto: parseFloat(String(project.impuesto_real_del_proyecto || project.impuestoRealDelProyecto).replace(/[$/,\s]/g, '')) || 0,
              categorias: categoriasFinales,
              lastUpdated: new Date().toISOString()
            };
            
            // ⚡ Preservar otros campos importantes de localStorage si existen
            if (localProject) {
              // Preservar cobranzas y otros campos que MySQL podría no tener
              if (localProject.cobranzas && Array.isArray(localProject.cobranzas)) {
                projectsFromAPI[projectId].cobranzas = localProject.cobranzas;
              }
              if (localProject.observacionesDelProyecto) {
                projectsFromAPI[projectId].observacionesDelProyecto = localProject.observacionesDelProyecto;
              }
            }
          });
          
          // ⚡ Asegurar que todos los proyectos tengan las 24 categorías (solo si realmente faltan)
          Object.keys(projectsFromAPI).forEach(projectId => {
            const project = projectsFromAPI[projectId];
            if (!project.categorias || project.categorias.length !== 24) {
              // Intentar obtener del proyecto local primero
              const localProject = localProjects[projectId];
              if (localProject && localProject.categorias && Array.isArray(localProject.categorias) && localProject.categorias.length === 24) {
                console.log(`💾 Preservando categorías guardadas localmente para Proyecto ${projectId} (faltaban en MySQL)`);
                project.categorias = localProject.categorias;
              } else {
                console.log(`🔧 Inicializando categorías faltantes para Proyecto ${projectId} desde MySQL`);
                project.categorias = [...this.getInitialProjects()[1].categorias];
              }
            }
          });
          
          // Actualizar proyectos locales con datos de MySQL (SIEMPRE, incluso si está vacío)
          // ⚡ Solo notificar listeners si hay cambios reales para evitar bucles infinitos
          const projectsChanged = JSON.stringify(this.projects) !== JSON.stringify(projectsFromAPI);
          this.projects = projectsFromAPI;
          this.saveToLocalStorage();
          
          // Solo notificar si hubo cambios reales
          if (projectsChanged) {
            this.notifyListeners();
          }
          
          console.log(`✅ ${Object.keys(projectsFromAPI).length} proyectos cargados desde MySQL`);
          this._isLoadingFromMySQL = false;
          return this.projects;
        } else {
          // Si la respuesta es exitosa pero no hay proyectos, limpiar localStorage también
          // ⚡ Solo notificar si había proyectos antes (evitar notificaciones innecesarias)
          const hadProjects = Object.keys(this.projects).length > 0;
          console.log('📭 No hay proyectos en MySQL, limpiando datos locales');
          this.projects = {};
          this.saveToLocalStorage();
          
          // Solo notificar si había proyectos antes
          if (hadProjects) {
            this.notifyListeners();
          }
          
          this._isLoadingFromMySQL = false;
          return this.projects;
        }
      } catch (error) {
        // Si es timeout o error, usar localStorage inmediatamente
        // No loguear errores de timeout, son esperados cuando el servidor no está disponible
        if (error.message !== 'Timeout MySQL' && !error.message.includes('Timeout')) {
          console.warn('⚠️ Error cargando proyectos desde MySQL, usando localStorage:', error.message);
        }
        // Continuar con localStorage sin esperar más
        this._isLoadingFromMySQL = false;
      }
    }
    
    // Retornar proyectos de localStorage (siempre rápido, no async)
    return this.projects;
  }
  
  // Método síncrono para obtener proyectos rápidamente (sin esperar API)
  getAllProjectsSync() {
    this._ensureProjectsLoaded();
    return this.projects;
  }

  // Obtener un proyecto específico
  getProject(projectId) {
    this._ensureProjectsLoaded();
    return this.projects[projectId];
  }

  // 🔄 ACTUALIZACIÓN CON FÓRMULAS AUTOMÁTICAS
  updateProject(projectId, updates) {
    this._ensureProjectsLoaded();
    if (!this.projects[projectId]) {
      console.warn(`Project ${projectId} not found`);
      return;
    }

    // 🔧 NORMALIZAR: Si vienen cobranzas en los updates, asegurar que cada fila tenga un id
    if (updates && Array.isArray(updates.cobranzas)) {
      const now = Date.now();
      updates.cobranzas = updates.cobranzas.map((c, i) => ({
        // preservar campos existentes y asignar fallback para id/fecha/monto
        ...c,
  id: c && c.id ? c.id : `tmp-${now}-${i}`,
  fecha: (c && c.fecha) ? c.fecha : (c && c.fecha === '' ? '' : ''),
  // Dejar monto como string vacío por defecto para que la UI muestre celda vacía
  monto: (c && c.monto !== undefined && c.monto !== null && c.monto !== '') ? c.monto : ''
      }));
      try { console.debug('projectDataService.normalize cobranzas for update:', updates.cobranzas.map(x=>({id:x.id, fecha:x.fecha, monto:x.monto}))); } catch(e){}
    }

    // Guardar los valores que vienen desde ProyectoDetalle (con totales completos)
    const presupuestoDesdeDetalle = updates.presupuestoProyecto;
    const balanceDelPresupuestoDesdeDetalle = updates.balanceDelPresupuesto;
    const utilidadRealSinFacturaDesdeDetalle = updates.utilidadRealSinFactura;
    const utilidadRealConFacturaDesdeDetalle = updates.utilidadRealConFactura;
    const creditoFiscalEstimadoDesdeDetalle = updates.creditoFiscalEstimado;
    const totalContratoProveedoresDesdeDetalle = updates.totalContratoProveedores;
    const saldoXCobrarDesdeDetalle = updates.saldoXCobrar;
    
    // 🔍 DEBUG: Log específico para saldoXCobrar
    if (saldoXCobrarDesdeDetalle !== undefined) {
      console.log(`🔍 projectDataService.updateProject: Recibiendo saldoXCobrar desde updates:`, {
        valorRaw: saldoXCobrarDesdeDetalle,
        tipo: typeof saldoXCobrarDesdeDetalle,
        projectId: projectId,
        todasLasKeys: Object.keys(updates)
      });
    }
    
    // Convertir valores monetarios a números si vienen como strings formateados
    const parseMonetaryValue = (v) => {
      if (v === undefined || v === null) return undefined;
      if (typeof v === 'number') return v;
      const cleaned = String(v).replace(/[S$\/,\s]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? undefined : num;
    };
    
    const presupuestoNumero = presupuestoDesdeDetalle !== undefined ? parseMonetaryValue(presupuestoDesdeDetalle) : undefined;
    const balanceNumero = balanceDelPresupuestoDesdeDetalle !== undefined ? parseMonetaryValue(balanceDelPresupuestoDesdeDetalle) : undefined;
    const utilidadRealSinFacturaNumero = utilidadRealSinFacturaDesdeDetalle !== undefined ? parseMonetaryValue(utilidadRealSinFacturaDesdeDetalle) : undefined;
    const utilidadRealConFacturaNumero = utilidadRealConFacturaDesdeDetalle !== undefined ? parseMonetaryValue(utilidadRealConFacturaDesdeDetalle) : undefined;
    const creditoFiscalEstimadoNumero = creditoFiscalEstimadoDesdeDetalle !== undefined ? parseMonetaryValue(creditoFiscalEstimadoDesdeDetalle) : undefined;
    const totalContratoProveedoresNumero = totalContratoProveedoresDesdeDetalle !== undefined ? parseMonetaryValue(totalContratoProveedoresDesdeDetalle) : undefined;
    const saldoXCobrarNumero = saldoXCobrarDesdeDetalle !== undefined ? parseMonetaryValue(saldoXCobrarDesdeDetalle) : undefined;
    
    // 🔍 DEBUG: Log después de parsear
    if (saldoXCobrarNumero !== undefined) {
      console.log(`🔍 projectDataService.updateProject: saldoXCobrar parseado:`, {
        valorOriginal: saldoXCobrarDesdeDetalle,
        valorParseado: saldoXCobrarNumero,
        tipoParseado: typeof saldoXCobrarNumero
      });
    }

    // Actualizar datos básicos
    this.projects[projectId] = {
      ...this.projects[projectId],
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    // Si balanceDelPresupuesto viene desde ProyectoDetalle, establecerlo ANTES de calculateFormulas
    // para que calculateFormulas lo detecte y no lo recalcule
    if (balanceNumero !== undefined) {
      this.projects[projectId].balanceDelPresupuesto = balanceNumero;
      console.log(`📊 SERVICIO: Balance Del Presupuesto establecido desde ProyectoDetalle ANTES de calculateFormulas = ${balanceNumero}`);
    }
    
    // Si presupuestoProyecto viene desde ProyectoDetalle, establecerlo ANTES de calculateFormulas
    if (presupuestoNumero !== undefined) {
      this.projects[projectId].presupuestoProyecto = presupuestoNumero;
      console.log(`📊 SERVICIO: Presupuesto del Proyecto establecido desde ProyectoDetalle ANTES de calculateFormulas = ${presupuestoNumero}`);
    }
    
    // Si utilidadRealSinFactura viene desde ProyectoDetalle, establecerlo ANTES de calculateFormulas
    // para que calculateFormulas lo detecte y no lo recalcule
    if (utilidadRealSinFacturaNumero !== undefined) {
      this.projects[projectId].utilidadRealSinFactura = utilidadRealSinFacturaNumero;
      console.log(`📊 SERVICIO: Utilidad Real Sin Factura establecida desde ProyectoDetalle ANTES de calculateFormulas = ${utilidadRealSinFacturaNumero}`);
    }
    
    // Si creditoFiscalEstimado viene desde ProyectoDetalle, establecerlo ANTES de calculateFormulas
    if (creditoFiscalEstimadoNumero !== undefined) {
      this.projects[projectId].creditoFiscalEstimado = creditoFiscalEstimadoNumero;
      console.log(`📊 SERVICIO: Crédito Fiscal Estimado establecido desde ProyectoDetalle ANTES de calculateFormulas = ${creditoFiscalEstimadoNumero}`);
    }
    
    // Si totalContratoProveedores viene desde ProyectoDetalle, establecerlo ANTES de calculateFormulas
    if (totalContratoProveedoresNumero !== undefined) {
      this.projects[projectId].totalContratoProveedores = totalContratoProveedoresNumero;
      console.log(`📊 SERVICIO: Total Contrato Proveedores establecido desde ProyectoDetalle ANTES de calculateFormulas = ${totalContratoProveedoresNumero}`);
    }
    
    // Si utilidadRealConFactura viene desde ProyectoDetalle, establecerlo ANTES de calculateFormulas
    if (utilidadRealConFacturaNumero !== undefined) {
      this.projects[projectId].utilidadRealConFactura = utilidadRealConFacturaNumero;
      console.log(`📊 SERVICIO: Utilidad Real Con Factura establecida desde ProyectoDetalle ANTES de calculateFormulas = ${utilidadRealConFacturaNumero}`);
    }
    
    // Si saldoXCobrar viene desde ProyectoDetalle, establecerlo ANTES de calculateFormulas
    // Marcar que viene de ProyectoDetalle para que calculateFormulas NO lo recalcule
    if (saldoXCobrarNumero !== undefined && saldoXCobrarNumero !== null) {
      this.projects[projectId].saldoXCobrar = saldoXCobrarNumero;
      // Marcar que este valor viene de ProyectoDetalle (flag interno)
      this.projects[projectId]._saldoXCobrarFromDetalle = true;
      console.log(`📊 SERVICIO: Saldo X Cobrar establecido desde ProyectoDetalle ANTES de calculateFormulas = ${saldoXCobrarNumero}`);
    }

    // 🧮 APLICAR FÓRMULAS AUTOMÁTICAS
    this.calculateFormulas(projectId);
    
    // Restaurar valores después de calculateFormulas por si acaso fueron recalculados
    if (presupuestoNumero !== undefined) {
      this.projects[projectId].presupuestoProyecto = presupuestoNumero;
      console.log(`📊 SERVICIO: Presupuesto del Proyecto restaurado desde ProyectoDetalle DESPUÉS de calculateFormulas = ${presupuestoNumero}`);
    }
    
    if (balanceNumero !== undefined) {
      this.projects[projectId].balanceDelPresupuesto = balanceNumero;
      console.log(`📊 SERVICIO: Balance Del Presupuesto restaurado desde ProyectoDetalle DESPUÉS de calculateFormulas = ${balanceNumero}`);
    }
    
    if (utilidadRealSinFacturaNumero !== undefined) {
      this.projects[projectId].utilidadRealSinFactura = utilidadRealSinFacturaNumero;
      console.log(`📊 SERVICIO: Utilidad Real Sin Factura restaurada desde ProyectoDetalle DESPUÉS de calculateFormulas = ${utilidadRealSinFacturaNumero}`);
    }
    
    if (creditoFiscalEstimadoNumero !== undefined) {
      this.projects[projectId].creditoFiscalEstimado = creditoFiscalEstimadoNumero;
      console.log(`📊 SERVICIO: Crédito Fiscal Estimado restaurado desde ProyectoDetalle DESPUÉS de calculateFormulas = ${creditoFiscalEstimadoNumero}`);
    }
    
    if (totalContratoProveedoresNumero !== undefined) {
      this.projects[projectId].totalContratoProveedores = totalContratoProveedoresNumero;
      console.log(`📊 SERVICIO: Total Contrato Proveedores restaurado desde ProyectoDetalle DESPUÉS de calculateFormulas = ${totalContratoProveedoresNumero}`);
    }
    
    if (utilidadRealConFacturaNumero !== undefined) {
      this.projects[projectId].utilidadRealConFactura = utilidadRealConFacturaNumero;
      console.log(`📊 SERVICIO: Utilidad Real Con Factura restaurada desde ProyectoDetalle DESPUÉS de calculateFormulas = ${utilidadRealConFacturaNumero}`);
    }
    
    if (saldoXCobrarNumero !== undefined) {
      this.projects[projectId].saldoXCobrar = saldoXCobrarNumero;
      console.log(`📊 SERVICIO: Saldo X Cobrar restaurado desde ProyectoDetalle DESPUÉS de calculateFormulas = ${saldoXCobrarNumero}`);
    }

    // 💾 Guardar automáticamente
    this.saveToLocalStorage();

    // 📢 Notificar a todos los listeners PRIMERO (para actualizar UI inmediatamente)
    this.notifyListeners();

    // 🔄 SINCRONIZAR CON MYSQL SIEMPRE (en segundo plano, no bloquea)
    // ⚡ PROTECCIÓN CONTRA BUCLE INFINITO: Solo sincronizar si han pasado al menos 2 segundos desde la última sincronización
    const syncKey = `sync_${projectId}`;
    const lastSync = this[syncKey] || 0;
    const now = Date.now();
    const timeSinceLastSync = now - lastSync;
    
    if (timeSinceLastSync < 2000) {
      console.log(`⏸️ Omitiendo sincronización: se sincronizó hace ${timeSinceLastSync}ms (mínimo 2000ms)`);
      return;
    }
    
    this[syncKey] = now;
    
    setTimeout(() => {
      console.log(`🔄 Intentando sincronizar proyecto ${projectId} con MySQL...`);
      this.syncToMySQL(projectId, this.projects[projectId]).catch(err => {
        console.error(`❌ Error sincronizando proyecto ${projectId} con MySQL:`, err.message);
        // NO reintentar automáticamente para evitar bucles infinitos
      });
    }, 1000); // Delay aumentado a 1 segundo para evitar bucles
  }

  // 🔄 SINCRONIZAR PROYECTO CON MYSQL
  async syncToMySQL(projectId, projectData) {
    if (!projectId) {
      console.warn(`⏸️ Omitiendo sincronización: projectId inválido (${projectId})`);
      return;
    }
    
    // Verificar disponibilidad de API si no está verificada
    if (!this.apiAvailable) {
      console.log(`🔄 API no marcada como disponible. Verificando...`);
      await this.checkApiAvailability();
    }
    
    if (!this.apiAvailable) {
      console.warn(`⏸️ API no disponible. Omitiendo sincronización para proyecto ${projectId}`);
      console.warn(`   Los datos se guardaron en localStorage y se sincronizarán cuando la API esté disponible.`);
      return;
    }
    
    console.log(`✅ API disponible. Sincronizando proyecto ${projectId}...`);

    // ⚡ PROTECCIÓN: Evitar múltiples sincronizaciones simultáneas del mismo proyecto
    if (this._syncingProjects.has(projectId)) {
      console.log(`⏸️ Proyecto ${projectId} ya está siendo sincronizado, omitiendo...`);
      return;
    }

    // ⚡ PROTECCIÓN ADICIONAL: Verificar si acabamos de sincronizar este proyecto (últimos 3 segundos)
    const lastSyncKey = `lastSync_${projectId}`;
    const lastSyncTime = this[lastSyncKey] || 0;
    const now = Date.now();
    if (now - lastSyncTime < 3000) { // 3 segundos de cooldown
      console.log(`⏸️ Proyecto ${projectId} se sincronizó hace menos de 3 segundos, omitiendo...`);
      return;
    }
    this[lastSyncKey] = now;

    // Marcar como sincronizando
    this._syncingProjects.add(projectId);

    try {
      // Timeout de 10 segundos para dar más tiempo al servidor
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve({ timeout: true, success: false, error: 'Timeout' }), 10000)
      );

      // 💰 Parsear valores monetarios correctamente (pueden venir como "S/0.00" o números)
      const parseMonetaryValue = (value) => {
        if (!value && value !== 0) return 0;
        if (typeof value === 'number') return value;
        // Si es string, limpiar formato monetario
        const cleanValue = String(value).replace(/[S$\/,\s]/g, '');
        const parsed = parseFloat(cleanValue);
        return isNaN(par) ? 0 : parsed;
      };

      // Preparar datos para la API (formato esperado por el backend) - ENVIAR TODOS LOS CAMPOS NUMÉRICOS
      const apiData = {
        // ⚠️ IMPORTANTE: Incluir numeroProyecto para que el backend pueda encontrar el proyecto si el ID no coincide
        numeroProyecto: projectData.numeroProyecto || projectData.numero_proyecto || projectId,
        nombreProyecto: projectData.nombreProyecto || '',
        nombreCliente: projectData.nombreCliente || '',
        estadoProyecto: projectData.estadoProyecto || 'Ejecucion',
        tipoProyecto: projectData.tipoProyecto || 'Recibo',
        // 💰 TODOS LOS CAMPOS MONETARIOS (asegurar que nunca sean NULL)
        montoContrato: parseMonetaryValue(projectData.montoContrato),
        presupuestoProyecto: parseMonetaryValue(projectData.presupuestoProyecto),
        balanceProyecto: parseMonetaryValue(projectData.balanceDeComprasDelProyecto || projectData.balanceProyecto),
        utilidadEstimadaSinFactura: parseMonetaryValue(projectData.utilidadEstimadaSinFactura),
        utilidadRealSinFactura: parseMonetaryValue(projectData.utilidadRealSinFactura),
        balanceUtilidadSinFactura: parseMonetaryValue(projectData.balanceUtilidadSinFactura),
        utilidadEstimadaFacturado: parseMonetaryValue(projectData.utilidadEstimadaConFactura),
        utilidadRealFacturado: parseMonetaryValue(projectData.utilidadRealConFactura),
        balanceUtilidadConFactura: parseMonetaryValue(projectData.balanceUtilidadConFactura),
        adelantosCliente: parseMonetaryValue(projectData.adelantos),
        creditoFiscal: parseMonetaryValue(projectData.creditoFiscalReal || projectData.creditoFiscalEstimado || projectData.creditoFiscal),
        impuestoRealProyecto: parseMonetaryValue(projectData.impuestoRealDelProyecto),
        // Campos adicionales importantes
        totalContratoProveedores: parseMonetaryValue(projectData.totalContratoProveedores),
        saldoPagarProveedores: parseMonetaryValue(projectData.totalSaldoPorPagarProveedores),
        saldosCobrarProyecto: parseMonetaryValue(projectData.saldoXCobrar),
        // 📊 CAMPOS PARA proyecto_detalles (TODOS LOS CAMPOS DEL ESQUEMA)
        descripcionProyecto: projectData.descripcionProyecto || null,
        ubicacionProyecto: projectData.ubicacionProyecto || null,
        fechaInicio: projectData.fechaInicio || null,
        fechaEstimadaFin: projectData.fechaEstimadaFin || null,
        presupuestoDelProyecto: parseMonetaryValue(projectData.presupuestoProyecto),
        totalEgresosProyecto: parseMonetaryValue(projectData.totalEgresosProyecto || projectData.totalRegistroEgresos),
        balanceDelPresupuesto: parseMonetaryValue(projectData.balanceDelPresupuesto),
        // ⚠️ IMPORTANTE: igvSunat es un porcentaje (18.00, 19.00), NO un monto
        // Si viene un valor muy alto, es porque se confundió con impuestoRealProyecto
        igvSunat: (() => {
          const igvValue = parseMonetaryValue(projectData.igvSunat);
          // Si el valor es mayor a 100, probablemente es un monto, no un porcentaje
          if (igvValue > 100) {
            console.warn(`⚠️ Valor de igvSunat muy alto (${igvValue}), usando valor por defecto 18.00`);
            return 18.00;
          }
          return igvValue || 18.00;
        })(),
        creditoFiscalEstimado: parseMonetaryValue(projectData.creditoFiscalEstimado),
        impuestoEstimadoDelProyecto: parseMonetaryValue(projectData.impuestoEstimadoDelProyecto),
        creditoFiscalReal: parseMonetaryValue(projectData.creditoFiscalReal),
        impuestoRealDelProyecto: parseMonetaryValue(projectData.impuestoRealDelProyecto),
        saldoXCobrar: parseMonetaryValue(projectData.saldoXCobrar),
        balanceDeComprasDelProyecto: parseMonetaryValue(projectData.balanceDeComprasDelProyecto),
        observacionesDelProyecto: projectData.observacionesDelProyecto || null,
        // 📅 FECHAS ADICIONALES (fecha_1 a fecha_13)
        fecha1: projectData.fecha1 || projectData.fecha_1 || null,
        fecha2: projectData.fecha2 || projectData.fecha_2 || null,
        fecha3: projectData.fecha3 || projectData.fecha_3 || null,
        fecha4: projectData.fecha4 || projectData.fecha_4 || null,
        fecha5: projectData.fecha5 || projectData.fecha_5 || null,
        fecha6: projectData.fecha6 || projectData.fecha_6 || null,
        fecha7: projectData.fecha7 || projectData.fecha_7 || null,
        fecha8: projectData.fecha8 || projectData.fecha_8 || null,
        fecha9: projectData.fecha9 || projectData.fecha_9 || null,
        fecha10: projectData.fecha10 || projectData.fecha_10 || null,
        fecha11: projectData.fecha11 || projectData.fecha_11 || null,
        fecha12: projectData.fecha12 || projectData.fecha_12 || null,
        fecha13: projectData.fecha13 || projectData.fecha_13 || null,
        // 🔄 INCLUIR CATEGORÍAS PARA SINCRONIZAR CON MYSQL
        categorias: projectData.categorias && Array.isArray(projectData.categorias) ? projectData.categorias.map(cat => ({
          id: cat.id,
          nombre: cat.nombre || '',
          tipo: cat.tipo || '',
          presupuestoDelProyecto: parseMonetaryValue(cat.presupuestoDelProyecto),
          contratoProvedYServ: parseMonetaryValue(cat.contratoProvedYServ),
          registroEgresos: parseMonetaryValue(cat.registroEgresos),
          saldosPorCancelar: parseMonetaryValue(cat.saldosPorCancelar)
        })) : []
      };
      
      console.log(`💾 Sincronizando proyecto ${projectId} con MySQL:`, {
        montoContrato: apiData.montoContrato,
        presupuestoProyecto: apiData.presupuestoProyecto,
        totalContratoProveedores: apiData.totalContratoProveedores
      });

      // Intentar actualizar en MySQL con timeout
      let result;
      try {
        result = await Promise.race([
          proyectosAPI.update(projectId, apiData),
          timeoutPromise
        ]);
        
        // ⚡ Verificar si es timeout (objeto especial retornado por timeoutPromise)
        if (result && result.timeout === true) {
          // Timeout silencioso - agregar a cola offline
          try {
            const syncService = await import('./syncService');
            syncService.default.addOfflineOperation({
              type: 'update',
              entityType: 'proyecto',
              entityId: projectId,
              data: apiData,
              priority: 2
            });
            console.log(`📋 Operación agregada a cola offline (timeout) para proyecto ${projectId}`);
          } catch (importError) {}
          return;
        }
      } catch (error) {
        // Si es timeout o error de red, agregar a cola offline para sincronizar después
        const isNetworkError = error.message && (
          error.message.includes('Timeout') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError')
        );
        
        if (isNetworkError) {
          // 🔄 Agregar a cola offline para sincronizar cuando vuelva la conexión
          try {
            const syncService = await import('./syncService');
            syncService.default.addOfflineOperation({
              type: 'update',
              entityType: 'proyecto',
              entityId: projectId,
              data: apiData,
              priority: 2 // Prioridad media-alta para actualizaciones
            });
            console.log(`📋 Operación agregada a cola offline para proyecto ${projectId}`);
          } catch (importError) {
            // Si no se puede importar syncService, continuar sin agregar a cola
          }
        } else if (error.message !== 'Timeout' && !error.message.includes('Timeout')) {
          console.warn(`⚠️ Error sincronizando proyecto ${projectId} con MySQL:`, error.message);
        }
        return;
      }
      
      if (result && result.success) {
        console.log(`✅ Proyecto ${projectId} sincronizado con MySQL exitosamente`);
        console.log(`   Respuesta del servidor:`, JSON.stringify(result, null, 2));
      } else if (result && !result.success) {
        console.error(`❌ Error sincronizando proyecto ${projectId} con MySQL:`, result.error || result.message);
        console.error(`   Respuesta completa:`, JSON.stringify(result, null, 2));
      } else {
        console.warn(`⚠️ Respuesta inesperada del servidor para proyecto ${projectId}:`, result);
      }
    } catch (error) {
      // Si es timeout o error de red, agregar a cola offline para sincronizar después
      const isNetworkError = error.message && (
        error.message.includes('Timeout') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      );
      
      if (isNetworkError) {
        // 🔄 Agregar a cola offline para sincronizar cuando vuelva la conexión
        try {
          import('./syncService').then(syncService => {
            syncService.default.addOfflineOperation({
              type: 'update',
              entityType: 'proyecto',
              entityId: projectId,
              data: projectData,
              priority: 2
            });
          }).catch(() => {
            // Si no se puede importar, continuar sin agregar a cola
          });
        } catch (importError) {
          // Continuar sin agregar a cola
        }
      } else if (error.message !== 'Timeout' && !error.message.includes('Timeout')) {
        console.warn(`⚠️ Error sincronizando proyecto ${projectId} con MySQL:`, error.message);
      }
    } finally {
      // ⚡ IMPORTANTE: Siempre remover de la lista de sincronización después de un delay
      // para evitar sincronizaciones muy rápidas que causen bucles
      setTimeout(() => {
        this._syncingProjects.delete(projectId);
      }, 1000); // 1 segundo de delay antes de permitir otra sincronización
    }
  }

  // 🔍 Helper: Identificar categorías que deben sumarse en el total de "Saldos por cancelar"
  // Solo las celdas marcadas en rojo (NO las de fondo gris)
  shouldSumInTotalSaldos(categoriaNombre) {
    if (!categoriaNombre) return false;
    const nombre = categoriaNombre.toString().toLowerCase().trim();
    
    // Solo estas categorías específicas se suman en el total (las marcadas en rojo)
    const categoriasParaSumar = [
      'despecie',
      'mano de obra',
      'of - escp',
      'of escp',
      'granito y/o cuarzo',
      'granito y/o cuarz',
      'extras y/o eventos gyc',
      'extras y/o eventos g y c',
      'tercializacion 1 facturada',
      'tercialización 1 facturada',
      'extras y/o eventos terc. 1',
      'extras y/o eventos tercializacion 1',
      'tercializacion 2 facturada',
      'tercialización 2 facturada',
      'extras y/o eventos terc. 2',
      'extras y/o eventos tercializacion 2',
      'tercializacion 1 no facturada',
      'tercialización 1 no facturada',
      'extras y/o eventos terc. 1 nf',
      'extras y/o eventos tercializacion 1 nf',
      'tercializacion 2 no facturada',
      'tercialización 2 no facturada',
      'extras y/o eventos terc. 2 nf',
      'extras y/o eventos tercializacion 2 nf'
    ];
    
    // Verificar coincidencia exacta o parcial para "Mano de Obra" (puede tener variaciones)
    if (nombre.includes('mano de obra')) {
      return true;
    }
    
    return categoriasParaSumar.some(cat => nombre === cat || nombre.includes(cat));
  }

  // 🔍 Helper: Identificar categorías con fondo gris (las primeras 8 filas)
  shouldHaveGrayBackground(categoriaNombre) {
    if (!categoriaNombre) return false;
    const nombre = categoriaNombre.toString().toLowerCase().trim();
    
    // Solo estas categorías específicas deben tener fondo plomo (las primeras 8 filas exactas)
    const categoriasPlomo = [
      'melamina y servicios',
      'melamina high gloss',
      'accesorios y ferretería',
      'accesorios y ferreteria',
      'puertas alu vidrios',
      'puertas alu y vidrios',
      'led y electricidad',
      'flete y/o camioneta',
      'logística operativa',
      'logistica operativa'
    ];
    
    // Para "Extras y/o Eventos", solo si es exactamente esa categoría (no las variantes GyC, Terc., etc.)
    if (nombre === 'extras y/o eventos' || nombre === 'extras y/o evento') {
      return true;
    }
    
    return categoriasPlomo.some(cat => nombre === cat);
  }

  // 🧮 FÓRMULAS AUTOMÁTICAS (Excel-like)
  calculateFormulas(projectId) {
    const project = this.projects[projectId];
    if (!project) return;

    console.log('🧮 Calculando fórmulas para proyecto:', projectId, project);

    // FÓRMULA 1: Total de categorías → Total Contrato Proveedores
    if (project.categorias && project.categorias.length > 0) {
      // Normalizar valores que vienen como "S/0.00"
      const toNumber = (v) => {
        const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
        return isNaN(n) ? 0 : n;
      };

      // 🔴 EXCLUIR SOLO LAS FILAS MARCADAS EN ROJO de los totales horizontales
      // Helper para verificar si una fila debe excluirse
      // Solo las filas identificadas por shouldSumInTotalSaldos (marcadas en el cuadro rojo)
      // Las otras filas con presupuesto > 0 deben sumarse normalmente
      const debeExcluirseDeTotales = (cat) => {
        const esFilaMarcada = this.shouldSumInTotalSaldos(cat.nombre);
        return esFilaMarcada; // Solo excluir las filas marcadas específicamente
      };

      // FÓRMULA 1: Total de categorías → Total Contrato Proveedores
      // Si el valor ya fue establecido manualmente desde ProyectoDetalle (con el total completo de la tabla),
      // NO recalcularlo automáticamente. Solo recalcular si no existe.
      const totalContratoProveedoresRaw = project.totalContratoProveedores;
      const parseTotalContratoValue = (v) => {
        if (v === undefined || v === null) return null;
        const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
        return isNaN(n) ? null : n;
      };
      const totalContratoProveedoresActual = parseTotalContratoValue(totalContratoProveedoresRaw);
      
      if (totalContratoProveedoresActual === null) {
        // Solo recalcular si no hay valor establecido o es inválido
        // EXCLUIR filas marcadas en rojo (con Presup. Del Proy. > 0 o identificadas por shouldSumInTotalSaldos)
        project.totalContratoProveedores = project.categorias.reduce((sum, cat) => {
          const contrato = toNumber(cat.contratoProvedYServ);
          const debeExcluir = debeExcluirseDeTotales(cat);
          
          if (debeExcluir && contrato > 0) {
            console.log(`🔴 SERVICIO: Excluyendo "${cat.nombre}" de totalContratoProveedores. Contrato=${contrato}`);
          }
          
          if (debeExcluir) {
            return sum; // Excluir esta fila
          }
          return sum + contrato;
        }, 0);
        console.log(`📊 SERVICIO: Total Contrato Proveedores calculado automáticamente = ${project.totalContratoProveedores}`);
      } else {
        // Mantener el valor establecido desde ProyectoDetalle (total completo de la tabla)
        project.totalContratoProveedores = totalContratoProveedoresActual;
        console.log(`📊 SERVICIO: Total Contrato Proveedores MANTENIDO desde ProyectoDetalle = ${totalContratoProveedoresActual} (NO RECALCULADO)`);
      }

      // FÓRMULA 2: Total Saldo Por Pagar Proveedores = Σ(Saldos por cancelar)
      // Solo sumar las categorías específicas marcadas
      project.totalSaldoPorPagarProveedores = project.categorias.reduce((sum, cat) => {
        if (this.shouldSumInTotalSaldos(cat.nombre)) {
          return sum + toNumber(cat.saldosPorCancelar);
        }
        return sum;
      }, 0);

      // FÓRMULA 2.1: Total Registro de Egresos = Σ(Registro Egresos)
      // EXCLUIR filas marcadas en rojo (con Presup. Del Proy. > 0 o identificadas por shouldSumInTotalSaldos)
      project.totalRegistroEgresos = project.categorias.reduce((sum, cat) => {
        const egresos = toNumber(cat?.registroEgresos ?? 0);
        const debeExcluir = debeExcluirseDeTotales(cat);
        
        if (debeExcluir && egresos > 0) {
          console.log(`🔴 SERVICIO: Excluyendo "${cat.nombre}" de totalRegistroEgresos. Egresos=${egresos}`);
        }
        
        if (debeExcluir) {
          return sum; // Excluir esta fila
        }
        return sum + egresos;
      }, 0);
      
      console.log(`📊 SERVICIO: Total Contrato Proveedores (excluyendo filas marcadas) = ${project.totalContratoProveedores}`);
      console.log(`📊 SERVICIO: Total Registro Egresos (excluyendo filas marcadas) = ${project.totalRegistroEgresos}`);

      // FÓRMULA 3: Presupuesto del Proyecto
      // Si el valor ya fue establecido manualmente desde ProyectoDetalle (con el total completo),
      // NO recalcularlo automáticamente. Solo recalcular si no existe o es 0.
      // El valor desde ProyectoDetalle viene como el total completo de todas las categorías (totalesCalculadosTabla.presupuesto)
      const presupuestoActual = toNumber(project.presupuestoProyecto);
      if (!presupuestoActual || presupuestoActual === 0) {
        // Solo recalcular si no hay valor establecido
        // Calcular como suma de TODAS las categorías (total completo, igual que en ProyectoDetalle)
        project.presupuestoProyecto = project.categorias.reduce((sum, cat) => {
          const presupuesto = toNumber(cat.presupuestoDelProyecto);
          return sum + presupuesto; // Sumar TODAS las categorías (total completo)
        }, 0);
        console.log(`📊 SERVICIO: Presupuesto del Proyecto calculado automáticamente = ${project.presupuestoProyecto}`);
      } else {
        // Mantener el valor establecido desde ProyectoDetalle (total completo)
        console.log(`📊 SERVICIO: Presupuesto del Proyecto mantenido desde ProyectoDetalle = ${presupuestoActual}`);
      }
    }

    // FÓRMULA 4: Balance De Compras Del Proyecto = Σ Presupuesto − Σ Registro de Egresos
    project.balanceDeComprasDelProyecto = (parseFloat(project.presupuestoProyecto) || 0) -
                                          (parseFloat(project.totalRegistroEgresos) || 0);

    // FÓRMULA 5: Saldo por Cobrar = Monto Contrato - Adelantos
    // ⚠️ IMPORTANTE: NO recalcular si el valor ya fue establecido desde ProyectoDetalle
    // Verificar si viene de ProyectoDetalle usando el flag interno
    if (project._saldoXCobrarFromDetalle === true) {
      // El valor viene de ProyectoDetalle, NO recalcular
      console.log(`📊 SERVICIO: Saldo X Cobrar viene de ProyectoDetalle, NO RECALCULADO = ${project.saldoXCobrar}`);
      // Limpiar el flag después de usarlo
      delete project._saldoXCobrarFromDetalle;
    } else {
      // ⚡ CAMBIO: SIEMPRE recalcular Saldo X Cobrar si no viene explícitamente de ProyectoDetalle
      // Esto asegura que se actualice si cambian montoContrato o adelantos
      const montoContratoNum = parseFloat(project.montoContrato) || 0;
      const adelantosNum = parseFloat(project.adelantos) || 0;
      const saldoCalculado = montoContratoNum - adelantosNum;
      
      project.saldoXCobrar = saldoCalculado;
      console.log(`📊 SERVICIO: Saldo X Cobrar RECALCULADO automáticamente = ${saldoCalculado} (montoContrato=${montoContratoNum}, adelantos=${adelantosNum})`);
    }

    // FÓRMULA 5.1: Utilidad Estimada Sin Factura = Monto del Contrato - Presupuesto del Proyecto
    project.utilidadEstimadaSinFactura = (parseFloat(project.montoContrato) || 0) -
                                         (parseFloat(project.presupuestoProyecto) || 0);

    // FÓRMULA 6: Utilidad Real Sin Factura = Monto del Contrato - Total Registro Egresos (excluyendo filas marcadas)
    // Si el valor ya fue establecido manualmente desde ProyectoDetalle (con el total completo de egresos),
    // NO recalcularlo automáticamente. Solo recalcular si no existe.
    // El valor desde ProyectoDetalle viene como: montoContrato - totalesCalculadosTabla.egresos (total completo)
    const utilidadRealSinFacturaRaw = project.utilidadRealSinFactura;
    const parseUtilidadValue = (v) => {
      if (v === undefined || v === null) return null;
      const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
      return isNaN(n) ? null : n;
    };
    const utilidadRealSinFacturaActual = parseUtilidadValue(utilidadRealSinFacturaRaw);
    
    if (utilidadRealSinFacturaActual === null) {
      // Solo recalcular si no hay valor establecido
      project.utilidadRealSinFactura = (parseFloat(project.montoContrato) || 0) -
                                       (project.totalRegistroEgresos || 0);
      console.log(`📊 SERVICIO: Utilidad Real Sin Factura calculada automáticamente = ${project.utilidadRealSinFactura}`);
    } else {
      // Mantener el valor establecido desde ProyectoDetalle (total completo)
      project.utilidadRealSinFactura = utilidadRealSinFacturaActual;
      console.log(`📊 SERVICIO: Utilidad Real Sin Factura MANTENIDA desde ProyectoDetalle = ${utilidadRealSinFacturaActual} (NO RECALCULADA)`);
    }

    // FÓRMULA 7: Balance de Utilidad +/- = Utilidad Estimada Sin Factura - Utilidad Real Sin Factura
    project.balanceUtilidadSinFactura = (parseFloat(project.utilidadEstimadaSinFactura) || 0) -
                                        (parseFloat(project.utilidadRealSinFactura) || 0);

    // FÓRMULA 8: Utilidad Estimada Con Factura = Monto del Contrato - (Presupuesto del Proyecto + Impuesto Estimado del Proyecto)
    project.utilidadEstimadaConFactura = (parseFloat(project.montoContrato) || 0) -
                                         ((parseFloat(project.presupuestoProyecto) || 0) +
                                          (parseFloat(project.impuestoEstimadoDelProyecto) || 0));

    // FÓRMULA 9: Utilidad Real Con Factura = Monto del Contrato - (Total Registro Egresos + Crédito Fiscal Real)
    // Utilidad Real Con Factura = Monto del Contrato - (Total Registro de Egresos + Crédito Fiscal Real)
    // Si el valor ya fue establecido manualmente desde ProyectoDetalle, NO recalcularlo automáticamente.
    const utilidadRealConFacturaRaw = project.utilidadRealConFactura;
    const parseUtilidadRealCFValue = (v) => {
      if (v === undefined || v === null) return null;
      const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
      return isNaN(n) ? null : n;
    };
    const utilidadRealConFacturaActual = parseUtilidadRealCFValue(utilidadRealConFacturaRaw);
    
    if (utilidadRealConFacturaActual === null) {
      // Solo recalcular si no hay valor establecido o es inválido
      project.utilidadRealConFactura = (parseFloat(project.montoContrato) || 0) -
                                       ((project.totalRegistroEgresos || 0) +
                                        (parseFloat(project.creditoFiscalReal) || 0));
      console.log(`📊 SERVICIO: Utilidad Real Con Factura calculada automáticamente = ${project.utilidadRealConFactura}`);
    } else {
      // Mantener el valor establecido desde ProyectoDetalle
      project.utilidadRealConFactura = utilidadRealConFacturaActual;
      console.log(`📊 SERVICIO: Utilidad Real Con Factura MANTENIDA desde ProyectoDetalle = ${utilidadRealConFacturaActual} (NO RECALCULADA)`);
    }

    // FÓRMULA 10: Balance de Utilidad Con Factura = Utilidad Estimada Con Factura - Utilidad Real Con Factura
    project.balanceUtilidadConFactura = (parseFloat(project.utilidadEstimadaConFactura) || 0) -
                                        (parseFloat(project.utilidadRealConFactura) || 0);

    // FÓRMULA 11: Total de Egresos del Proyecto = Σ Registro de Egresos
    project.totalEgresosProyecto = project.totalRegistroEgresos || 0;

    // FÓRMULA 12: Balance del Presupuesto = Presupuesto − Total Egresos del Proyecto
    // Si el valor ya fue establecido manualmente desde ProyectoDetalle (con los totales completos),
    // NO recalcularlo automáticamente. Solo recalcular si no existe.
    // El valor desde ProyectoDetalle viene como: totalesCalculadosTabla.presupuesto - totalesCalculadosTabla.egresos
    // Verificar si el valor existe y es un número válido antes de decidir si recalcular
    const balanceDelPresupuestoRaw = project.balanceDelPresupuesto;
    // Usar parseFloat directamente ya que toNumber solo está disponible dentro del bloque de categorías
    const parseBalanceValue = (v) => {
      if (v === undefined || v === null) return null;
      const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
      return isNaN(n) ? null : n;
    };
    const balanceDelPresupuestoActual = parseBalanceValue(balanceDelPresupuestoRaw);
    
    if (balanceDelPresupuestoActual === null) {
      // Solo recalcular si no hay valor establecido o es inválido
      const presupuesto = parseFloat(project.presupuestoProyecto) || 0;
      const egresos = parseFloat(project.totalEgresosProyecto) || 0;
      project.balanceDelPresupuesto = presupuesto - egresos;
      console.log(`📊 SERVICIO: Balance Del Presupuesto calculado automáticamente = ${project.balanceDelPresupuesto} (${presupuesto} - ${egresos})`);
    } else {
      // Mantener el valor establecido desde ProyectoDetalle (total completo)
      // NO recalcular, solo mantener el valor existente
      project.balanceDelPresupuesto = balanceDelPresupuestoActual; // Asegurar que se mantenga como número
      console.log(`📊 SERVICIO: Balance Del Presupuesto MANTENIDO desde ProyectoDetalle = ${balanceDelPresupuestoActual} (NO RECALCULADO)`);
    }

    // 🎯 NUEVA FÓRMULA: Calcular total de cobranzas (suma de montos)
    if (project.cobranzas && Array.isArray(project.cobranzas)) {
      project.totalCobranzasDelProyecto = project.cobranzas.reduce((sum, c) => {
        const m = parseFloat(String(c.monto).replace(/[^0-9.-]/g, '')) || 0;
        return sum + m;
      }, 0);
      // Adelantos = suma de las cobranzas
      project.adelantos = project.totalCobranzasDelProyecto;
      // NO recalcular saldo por cobrar automáticamente aquí
      // El saldoXCobrar debe venir desde ProyectoDetalle y se preserva en updateProject
      // Solo recalcular si no hay valor establecido (se maneja en calculateFormulas)
    }

    // 🧾 FÓRMULAS IGV - SUNAT 18%
    // Sumar solo las categorías que tienen factura (tipo === 'F')
    if (project.categorias && project.categorias.length > 0) {
      const toNumber = (v) => {
        const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
        return isNaN(n) ? 0 : n;
      };
      const totalContratosConFactura = project.categorias.reduce((sum, cat) => {
        // Verificar si la categoría tiene factura (tipo === 'F')
        const tieneFactura = cat.tipo === 'F' || cat.tipo === 'f';
        if (tieneFactura) {
          const monto = toNumber(cat.contratoProvedYServ);
          console.log(`   📌 Categoría con F: "${cat.nombre}" = S/ ${monto.toFixed(2)}`);
          return sum + monto;
        }
        return sum;
      }, 0);

      // FÓRMULA 12: Crédito Fiscal (IGV) = (Suma de contratos con F) × 0.18 / 1.18
      project.creditoFiscal = totalContratosConFactura * 0.18 / 1.18;
      
      // FÓRMULA 13: Crédito Fiscal Estimado = (Suma de PRESUPUESTOS con F) × 0.18 / 1.18
      const totalPresupuestosConFactura = project.categorias.reduce((sum, cat) => {
        const tieneFactura = cat.tipo === 'F' || cat.tipo === 'f';
        if (!tieneFactura) return sum;
        const bruto = cat.presupuestoDelProyecto ?? 0;
        const valor = parseFloat(String(bruto).replace(/[^0-9.-]/g, '')) || 0;
        return sum + valor;
      }, 0);
      // Crédito Fiscal Estimado = Suma de PRESUPUESTOS con F × 0.18 / 1.18
      // Si el valor ya fue establecido manualmente desde ProyectoDetalle, NO recalcularlo automáticamente
      const creditoFiscalEstimadoRaw = project.creditoFiscalEstimado;
      const parseCreditoValue = (v) => {
        if (v === undefined || v === null) return null;
        const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
        return isNaN(n) ? null : n;
      };
      const creditoFiscalEstimadoActual = parseCreditoValue(creditoFiscalEstimadoRaw);
      
      if (creditoFiscalEstimadoActual === null) {
        // Solo recalcular si no hay valor establecido
        project.creditoFiscalEstimado = totalPresupuestosConFactura * 0.18 / 1.18;
        console.log(`📊 SERVICIO: Crédito Fiscal Estimado calculado automáticamente = ${project.creditoFiscalEstimado}`);
      } else {
        // Mantener el valor establecido desde ProyectoDetalle
        project.creditoFiscalEstimado = creditoFiscalEstimadoActual;
        console.log(`📊 SERVICIO: Crédito Fiscal Estimado MANTENIDO desde ProyectoDetalle = ${creditoFiscalEstimadoActual} (NO RECALCULADO)`);
      }
      
      // FÓRMULA 14: Crédito Fiscal Real = (Suma de Registro Egresos con F) / 1.18 × 18%
      // Sumar solo los egresos de categorías con factura (tipo === 'F')
      const totalEgresosConFactura = project.categorias.reduce((sum, cat) => {
        const tieneFactura = cat.tipo === 'F' || cat.tipo === 'f';
        if (tieneFactura) {
          const egresos = parseFloat(String(cat.registroEgresos || 0).replace(/[^0-9.-]/g, '')) || 0;
          return sum + egresos;
        }
        return sum;
      }, 0);
      // Crédito Fiscal Real = (Suma de Registro Egresos con F) / 1.18 × 18%
      project.creditoFiscalReal = (totalEgresosConFactura / 1.18) * 0.18;
      
      // 🧾 FÓRMULA 16: Impuesto Estimado del Proyecto = (Suma de Contratos con F) / 1.18 × 0.18
      // Es equivalente a: totalContratosConFactura × 0.18 / 1.18
      // Misma fórmula que Crédito Fiscal Real
      project.impuestoEstimadoDelProyecto = totalContratosConFactura * 0.18 / 1.18;

      console.log('🧾 ===== IGV - SUNAT 18% =====');
      console.log(`   📊 Total contratos con factura (F): S/ ${totalContratosConFactura.toFixed(2)}`);
      console.log(`   📐 Fórmula: ${totalContratosConFactura.toFixed(2)} × 0.18 / 1.18`);
      console.log(`   💰 Crédito Fiscal (IGV): S/ ${project.creditoFiscal.toFixed(2)}`);
      console.log(`   💰 Crédito Fiscal Real: S/ ${project.creditoFiscalReal.toFixed(2)} (Suma Egresos F / 1.18 × 18%)`);
      console.log(`   💰 Impuesto Estimado del Proyecto: S/ ${project.impuestoEstimadoDelProyecto.toFixed(2)} (Suma F × 0.18 / 1.18)`);
      console.log('🧾 ============================');
    } else {
      // Si no hay categorías, inicializar en 0
      project.impuestoEstimadoDelProyecto = 0;
    }

    // 🧾 FÓRMULA 15: Impuesto Real del Proyecto = IGV - SUNAT 18% - Crédito Fiscal Real
    // IGV = (Monto Contrato / 1.18) * 0.18
    // Crédito Fiscal Real = (Suma de Registro Egresos con F) / 1.18 * 18%
    // Impuesto Real = IGV - Crédito Fiscal Real
    const montoContrato = parseFloat(project.montoContrato) || 0;
    if (montoContrato > 0 && project.categorias && project.categorias.length > 0) {
      // Calcular IGV
      const igvSunat = (montoContrato / 1.18) * 0.18;
      
      // Calcular Crédito Fiscal Real (suma de Registro Egresos con F)
      const totalEgresosConFactura = project.categorias.reduce((sum, cat) => {
        const esTipoF = (cat?.tipo || '').toString().toUpperCase() === 'F';
        if (esTipoF) {
          const egresos = parseFloat(String(cat.registroEgresos || 0).replace(/[^0-9.-]/g, '')) || 0;
          return sum + egresos;
        }
        return sum;
      }, 0);
      
      // Crédito Fiscal Real = (Suma de Registro Egresos con F) / 1.18 * 18%
      const creditoFiscalRealCalculado = (totalEgresosConFactura / 1.18) * 0.18;
      
      // Impuesto Real del Proyecto = IGV - Crédito Fiscal Real
      project.impuestoRealDelProyecto = igvSunat - creditoFiscalRealCalculado;
      
      // Actualizar creditoFiscalReal con el valor calculado correctamente
      project.creditoFiscalReal = creditoFiscalRealCalculado;
      
      console.log('🧾 ===== IMPUESTO REAL DEL PROYECTO =====');
      console.log(`   📊 IGV - SUNAT 18%: S/ ${igvSunat.toFixed(2)}`);
      console.log(`   📊 Total Egresos con F: S/ ${totalEgresosConFactura.toFixed(2)}`);
      console.log(`   📊 Crédito Fiscal Real: S/ ${creditoFiscalRealCalculado.toFixed(2)}`);
      console.log(`   💰 Impuesto Real del Proyecto: S/ ${project.impuestoRealDelProyecto.toFixed(2)} (IGV - Crédito Fiscal Real)`);
      console.log('🧾 ======================================');
    } else {
      project.impuestoRealDelProyecto = 0;
    }

    console.log('✅ Fórmulas calculadas:', {
      projectId,
      totalContratoProveedores: project.totalContratoProveedores,
      totalSaldoPorPagarProveedores: project.totalSaldoPorPagarProveedores,
      saldoXCobrar: project.saldoXCobrar,
      balanceDeComprasDelProyecto: project.balanceDeComprasDelProyecto,
      utilidadRealSinFactura: project.utilidadRealSinFactura,
      totalCobranzasDelProyecto: project.totalCobranzasDelProyecto,
      creditoFiscal: project.creditoFiscal,
      creditoFiscalReal: project.creditoFiscalReal,
      impuestoRealDelProyecto: project.impuestoRealDelProyecto
    });
  }

  // 📢 SISTEMA DE LISTENERS (para React components)
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.projects));
  }

  // 🆕 CREAR NUEVO PROYECTO (primero local, luego sincroniza en segundo plano)
  async createProject(projectData) {
    // ⚡ CREAR PRIMERO EN LOCALSTORAGE (instantáneo)
    this._ensureProjectsLoaded();
    const numericIds = Object.keys(this.projects)
      .map((id) => Number(id))
      .filter((n) => Number.isFinite(n) && n > 0);
    const newId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
    const defaultCategories = this.getInitialProjects()[1].categorias;
    
    // ⚡ Asegurar que siempre tengamos las 24 categorías por defecto
    const categoriasFinales = (projectData.categorias && Array.isArray(projectData.categorias) && projectData.categorias.length === 24) 
      ? projectData.categorias 
      : [...defaultCategories];
    
    const newProject = {
      id: newId,
      nombreProyecto: projectData.nombreProyecto || `Proyecto ${newId}`,
      nombreCliente: projectData.nombreCliente || '',
      estadoProyecto: projectData.estadoProyecto || 'Ejecucion',
      tipoProyecto: projectData.tipoProyecto || 'Recibo',
      montoContrato: projectData.montoContrato || 0,
      presupuestoProyecto: projectData.presupuestoProyecto || 0,
      utilidadEstimadaSinFactura: 0,
      utilidadRealSinFactura: 0,
      utilidadEstimadaConFactura: 0,
      utilidadRealConFactura: 0,
      totalContratoProveedores: 0,
      totalSaldoPorPagarProveedores: 0,
      balanceDeComprasDelProyecto: 0,
      adelantos: projectData.adelantos || 0,
      saldoXCobrar: 0,
      creditoFiscal: 0,
      creditoFiscalEstimado: 0,
      creditoFiscalReal: 0,
      impuestoRealDelProyecto: 0,
      impuestoEstimadoDelProyecto: 0,
      categorias: categoriasFinales, // ⚡ SIEMPRE usar las 24 categorías por defecto
      lastUpdated: new Date().toISOString(),
      // ⚡ NO usar ...projectData aquí porque puede sobrescribir categorias
      // Solo usar campos específicos que no hayamos definido arriba
      cobranzas: projectData.cobranzas || [],
      observacionesDelProyecto: projectData.observacionesDelProyecto || ''
    };

    // Guardar inmediatamente en localStorage y notificar
    this.projects[newId] = newProject;
    this.calculateFormulas(newId);
    this.saveToLocalStorage();
    this.notifyListeners(); // ⚡ Notificar inmediatamente para que aparezca en la UI
    
    console.log(`✅ Proyecto ${newId} creado localmente`);

    // 🔄 SINCRONIZAR CON MYSQL EN SEGUNDO PLANO (no bloquea)
    // Intentar siempre, incluso si apiAvailable es false (puede haber cambiado)
    setTimeout(() => {
      console.log(`🔄 Intentando sincronizar creación de proyecto ${newId} con MySQL...`);
      this.syncCreateToMySQL(newId, newProject).catch(err => {
        console.error(`❌ Error sincronizando creación con MySQL:`, err.message);
        console.error(`   Stack:`, err.stack);
        // Verificar si es porque la API no está disponible
        if (!this.apiAvailable) {
          console.warn(`⚠️ API no disponible. Verificando disponibilidad...`);
          this.checkApiAvailability().then(() => {
            if (this.apiAvailable) {
              console.log(`✅ API ahora disponible. Reintentando sincronización...`);
              this.syncCreateToMySQL(newId, newProject).catch(retryErr => {
                console.error(`❌ Error en reintento de sincronización:`, retryErr.message);
              });
            }
          });
        }
      });
    }, 100);

    return newProject;
  }

  // 🔄 Sincronizar creación con MySQL en segundo plano
  async syncCreateToMySQL(projectId, projectData) {
    if (!this.apiAvailable || !projectId) {
      console.log('⚠️ API no disponible o projectId inválido, omitiendo sincronización MySQL');
      return;
    }
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );

      // 💰 Parsear valores monetarios correctamente (pueden venir como "S/0.00" o números)
      const parseMonetaryValue = (value) => {
        if (!value) return 0;
        if (typeof value === 'number') return value;
        // Si es string, limpiar formato monetario
        const cleanValue = String(value).replace(/[S$\/,\s]/g, '');
        return parseFloat(cleanValue) || 0;
      };

      const apiData = {
        nombreProyecto: projectData.nombreProyecto || 'Nuevo Proyecto',
        nombreCliente: projectData.nombreCliente || '',
        estadoProyecto: projectData.estadoProyecto || 'Ejecucion',
        tipoProyecto: projectData.tipoProyecto || 'Recibo',
        montoContrato: parseMonetaryValue(projectData.montoContrato),
        presupuestoProyecto: parseMonetaryValue(projectData.presupuestoProyecto),
        adelantosCliente: parseMonetaryValue(projectData.adelantos)
      };

      console.log(`📤 Enviando datos a API POST /api/proyectos:`, apiData);
      
      const result = await Promise.race([
        proyectosAPI.create(apiData),
        timeoutPromise
      ]);
      
      console.log(`📥 Respuesta recibida de API para creación:`, result);
      
      if (result.success && result.data) {
        // ⚠️ IMPORTANTE: Actualizar el ID local con el ID de MySQL
        const realId = result.data.id;
        if (realId && realId !== projectId) {
          console.log(`🔄 Actualizando ID local: ${projectId} -> ${realId}`);
          // Mover proyecto al nuevo ID
          const proyectoActualizado = { ...this.projects[projectId], id: realId };
          this.projects[realId] = proyectoActualizado;
          delete this.projects[projectId];
          this.saveToLocalStorage();
          this.notifyListeners();
          console.log(`✅ Proyecto movido de ID ${projectId} a ID ${realId} en localStorage`);
        } else if (realId) {
          // Si el ID es el mismo, asegurarse de que esté correcto
          this.projects[projectId].id = realId;
          this.saveToLocalStorage();
          console.log(`✅ Proyecto ${projectId} confirmado con ID ${realId} en MySQL`);
        } else {
          console.warn(`⚠️ La respuesta del servidor no incluye ID. Respuesta:`, result);
        }
      } else {
        console.warn(`⚠️ Respuesta del servidor no exitosa o sin data:`, result);
      }
    } catch (error) {
      // Si es timeout o error de red, agregar a cola offline para sincronizar después
      const isNetworkError = error.message && (
        error.message.includes('Timeout') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      );
      
      if (isNetworkError) {
        // 🔄 Agregar a cola offline para sincronizar cuando vuelva la conexión
        try {
          import('./syncService').then(syncService => {
            syncService.default.addOfflineOperation({
              type: 'create',
              entityType: 'proyecto',
              entityId: projectId,
              data: projectData,
              priority: 3 // Prioridad alta para creaciones
            });
            console.log(`📋 Creación agregada a cola offline para proyecto ${projectId}`);
          }).catch(() => {
            // Si no se puede importar, continuar sin agregar a cola
          });
        } catch (importError) {
          // Continuar sin agregar a cola
        }
      } else if (error.message !== 'Timeout' && !error.message.includes('Timeout')) {
        console.warn(`⚠️ Error sincronizando creación:`, error.message);
      }
    }
  }

  // ❌ ELIMINAR PROYECTO (primero local, luego sincroniza en segundo plano)
  async deleteProject(projectId) {
    this._ensureProjectsLoaded();
    if (!this.projects[projectId]) return;

    // ⚡ ELIMINAR PRIMERO DE LOCALSTORAGE (instantáneo)
    delete this.projects[projectId];
    this.saveToLocalStorage();
    this.notifyListeners(); // ⚡ Notificar inmediatamente para que desaparezca de la UI
    
    console.log(`✅ Proyecto ${projectId} eliminado localmente`);

    // 🔄 SINCRONIZAR CON MYSQL EN SEGUNDO PLANO (no bloquea)
    // Intentar siempre, incluso si apiAvailable es false (puede haber cambiado)
    setTimeout(() => {
      console.log(`🔄 Intentando sincronizar eliminación de proyecto ${projectId} con MySQL...`);
      this.syncDeleteToMySQL(projectId).catch(err => {
        console.error(`❌ Error sincronizando eliminación con MySQL:`, err.message);
        console.error(`   Stack:`, err.stack);
        // Verificar si es porque la API no está disponible
        if (!this.apiAvailable) {
          console.warn(`⚠️ API no disponible. Verificando disponibilidad...`);
          this.checkApiAvailability().then(() => {
            if (this.apiAvailable) {
              console.log(`✅ API ahora disponible. Reintentando sincronización...`);
              this.syncDeleteToMySQL(projectId).catch(retryErr => {
                console.error(`❌ Error en reintento de sincronización:`, retryErr.message);
              });
            }
          });
        }
      });
    }, 100);
  }

  // 🔄 Sincronizar eliminación con MySQL en segundo plano (MÁS ROBUSTO)
  async syncDeleteToMySQL(projectId) {
    if (!this.apiAvailable) {
      console.warn(`⚠️ API no disponible, proyecto ${projectId} eliminado solo localmente`);
      return;
    }
    
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout eliminación')), 5000) // 5 segundos para eliminación
      );

      console.log(`📤 Enviando DELETE a API /api/proyectos para proyecto ${projectId}`);
      
      const result = await Promise.race([
        proyectosAPI.delete([projectId]),
        timeoutPromise
      ]);
      
      console.log(`📥 Respuesta recibida de API para eliminación:`, result);
      
      if (result.success) {
        console.log(`✅ Proyecto ${projectId} eliminado de MySQL correctamente`);
        // ⚡ NO RECARGAR TODA LA LISTA - Ya está eliminado localmente y en MySQL
        // Solo notificar a los listeners para que actualicen la UI si es necesario
        // La recarga completa causa lentitud y problemas de sincronización
      } else {
        console.error(`❌ Error eliminando proyecto ${projectId} de MySQL:`, result.error);
      }
    } catch (error) {
      if (error.message === 'Timeout eliminación') {
        console.error(`❌ Timeout eliminando proyecto ${projectId} de MySQL (5s)`);
      } else {
        console.error(`❌ Error eliminando proyecto ${projectId} de MySQL:`, error.message);
      }
    }
  }

  // 🔄 ACTUALIZAR CATEGORÍA (con recálculo automático)
  updateProjectCategory(projectId, categoryId, updates) {
    this._ensureProjectsLoaded();
    const project = this.projects[projectId];
    if (!project || !project.categorias) return;

    const categoryIndex = project.categorias.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) return;

    // Actualizar categoría
    project.categorias[categoryIndex] = {
      ...project.categorias[categoryIndex],
      ...updates
    };

    // Recalcular fórmulas automáticamente (excluye filas marcadas en rojo)
    // Esto asegura que los totales horizontales no incluyan las filas marcadas
    this.calculateFormulas(projectId);
    
    console.log(`💾 SERVICIO: Categoría "${project.categorias[categoryIndex].nombre}" actualizada. Total Contrato=${project.totalContratoProveedores}, Total Egresos=${project.totalRegistroEgresos}`);
    
    // 💾 Guardar automáticamente en localStorage
    this.saveToLocalStorage();
    
    // 📢 Notificar a todos los listeners PRIMERO (para actualizar UI inmediatamente)
    this.notifyListeners();

    // 🔄 SINCRONIZAR CON MYSQL SIEMPRE (en segundo plano, no bloquea)
    // ⚡ IMPORTANTE: Sincronizar el proyecto completo con las categorías actualizadas
    setTimeout(() => {
      console.log(`🔄 Intentando sincronizar categoría del proyecto ${projectId} con MySQL...`);
      this.syncToMySQL(projectId, this.projects[projectId]).catch(err => {
        console.error(`❌ Error sincronizando categoría con MySQL:`, err.message);
        console.error(`   Stack:`, err.stack);
        // Verificar si es porque la API no está disponible
        if (!this.apiAvailable) {
          console.warn(`⚠️ API no disponible. Verificando disponibilidad...`);
          this.checkApiAvailability().then(() => {
            if (this.apiAvailable) {
              console.log(`✅ API ahora disponible. Reintentando sincronización...`);
              this.syncToMySQL(projectId, this.projects[projectId]).catch(retryErr => {
                console.error(`❌ Error en reintento de sincronización:`, retryErr.message);
              });
            }
          });
        }
      });
    }, 100); // Pequeño delay para evitar bucles
  }
}

// 🎯 SINGLETON INSTANCE
const projectDataService = new ProjectDataService();

export default projectDataService;
