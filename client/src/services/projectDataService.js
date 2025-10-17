// 🎯 SERVICIO CENTRALIZADO DE DATOS - SINCRONIZACIÓN AUTOMÁTICA
// Maneja la sincronización entre ProyectoDetalle y ExcelGrid con fórmulas automáticas

class ProjectDataService {
  constructor() {
    this.listeners = [];
    this.projects = this.loadFromLocalStorage();
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
      localStorage.setItem('ksamati_projects', JSON.stringify(this.projects));
    } catch (error) {
      console.warn('Error saving projects to localStorage:', error);
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
          { id: 4, nombre: 'Puertas Alu Vidrios', tipo: '', presupuestoDelProyecto: 0, contratoProvedYServ: 0, registroEgresos: 0, saldosPorCancelar: 0 },
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

  // Obtener todos los proyectos
  getAllProjects() {
    return this.projects;
  }

  // Obtener un proyecto específico
  getProject(projectId) {
    return this.projects[projectId];
  }

  // 🔄 ACTUALIZACIÓN CON FÓRMULAS AUTOMÁTICAS
  updateProject(projectId, updates) {
    if (!this.projects[projectId]) {
      console.warn(`Project ${projectId} not found`);
      return;
    }

    // Actualizar datos básicos
    this.projects[projectId] = {
      ...this.projects[projectId],
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    // 🧮 APLICAR FÓRMULAS AUTOMÁTICAS
    this.calculateFormulas(projectId);

    // 💾 Guardar automáticamente
    this.saveToLocalStorage();

    // 📢 Notificar a todos los listeners
    this.notifyListeners();
  }

  // 🧮 FÓRMULAS AUTOMÁTICAS (Excel-like)
  calculateFormulas(projectId) {
    const project = this.projects[projectId];
    if (!project) return;

    console.log('🧮 Calculando fórmulas para proyecto:', projectId, project);

    // FÓRMULA 1: Total de categorías → Total Contrato Proveedores
    if (project.categorias && project.categorias.length > 0) {
      project.totalContratoProveedores = project.categorias.reduce((sum, cat) => {
        return sum + (parseFloat(cat.contratoProvedYServ) || 0);
      }, 0);

      // FÓRMULA 2: Total Egresos → Total Saldo Por Pagar
      project.totalSaldoPorPagarProveedores = project.categorias.reduce((sum, cat) => {
        return sum + (parseFloat(cat.registroEgresos) || 0);
      }, 0);

      // FÓRMULA 3: Presupuesto del Proyecto (suma de categorías)
      project.presupuestoProyecto = project.categorias.reduce((sum, cat) => {
        return sum + (parseFloat(cat.presupuestoDelProyecto) || 0);
      }, 0);
    }

    // FÓRMULA 4: Balance = Presupuesto - Egresos
    project.balanceDeComprasDelProyecto = (parseFloat(project.presupuestoProyecto) || 0) - 
                                         (project.totalSaldoPorPagarProveedores || 0);

    // FÓRMULA 5: Saldo por Cobrar = Monto Contrato - Adelantos
    project.saldoXCobrar = (parseFloat(project.montoContrato) || 0) - 
                          (parseFloat(project.adelantos) || 0);

    // FÓRMULA 6: Utilidad Real Sin Factura = Utilidad Estimada Sin Factura - Gastos Reales
    project.utilidadRealSinFactura = (parseFloat(project.utilidadEstimadaSinFactura) || 0) - 
                                    (project.totalSaldoPorPagarProveedores || 0);

    // FÓRMULA 7: Balance de Utilidad Sin Factura
    project.balanceUtilidadSinFactura = project.utilidadRealSinFactura;

    // FÓRMULA 8: Utilidad Real Con Factura = Utilidad Estimada Con Factura - Gastos Reales
    project.utilidadRealConFactura = (parseFloat(project.utilidadEstimadaConFactura) || 0) - 
                                    (project.totalSaldoPorPagarProveedores || 0);

    // FÓRMULA 9: Balance de Utilidad Con Factura
    project.balanceUtilidadConFactura = project.utilidadRealConFactura;

    // FÓRMULA 10: Total Egresos del Proyecto
    project.totalEgresosProyecto = project.totalSaldoPorPagarProveedores || 0;

    // FÓRMULA 11: Balance del Presupuesto
    project.balanceDelPresupuesto = (parseFloat(project.presupuestoProyecto) || 0) - 
                                   (parseFloat(project.montoContrato) || 0);

    // 🎯 NUEVA FÓRMULA: Calcular total de cobranzas (suma de montos)
    if (project.cobranzas && Array.isArray(project.cobranzas)) {
      project.totalCobranzasDelProyecto = project.cobranzas.reduce((sum, cobranza) => {
        return sum + (parseFloat(cobranza.monto) || 0);
      }, 0);
    }

    console.log('✅ Fórmulas calculadas:', {
      projectId,
      totalContratoProveedores: project.totalContratoProveedores,
      totalSaldoPorPagarProveedores: project.totalSaldoPorPagarProveedores,
      saldoXCobrar: project.saldoXCobrar,
      balanceDeComprasDelProyecto: project.balanceDeComprasDelProyecto,
      utilidadRealSinFactura: project.utilidadRealSinFactura,
      totalCobranzasDelProyecto: project.totalCobranzasDelProyecto
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

  // 🆕 CREAR NUEVO PROYECTO
  createProject(projectData) {
    const newId = Math.max(...Object.keys(this.projects).map(Number)) + 1;
    const newProject = {
      id: newId,
      nombreProyecto: projectData.nombreProyecto || `Proyecto ${newId}`,
      nombreCliente: projectData.nombreCliente || '',
      estadoProyecto: 'Ejecucion',
      tipoProyecto: 'Recibo',
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
      lastUpdated: new Date().toISOString(),
      ...projectData
    };

    this.projects[newId] = newProject;
    this.saveToLocalStorage();
    this.notifyListeners();
    return newProject;
  }

  // ❌ ELIMINAR PROYECTO
  deleteProject(projectId) {
    if (this.projects[projectId]) {
      delete this.projects[projectId];
      this.saveToLocalStorage();
      this.notifyListeners();
    }
  }

  // 🔄 ACTUALIZAR CATEGORÍA (con recálculo automático)
  updateProjectCategory(projectId, categoryId, updates) {
    const project = this.projects[projectId];
    if (!project || !project.categorias) return;

    const categoryIndex = project.categorias.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) return;

    // Actualizar categoría
    project.categorias[categoryIndex] = {
      ...project.categorias[categoryIndex],
      ...updates
    };

    // Recalcular fórmulas automáticamente
    this.calculateFormulas(projectId);
    this.saveToLocalStorage();
    this.notifyListeners();
  }
}

// 🎯 SINGLETON INSTANCE
const projectDataService = new ProjectDataService();

export default projectDataService;
