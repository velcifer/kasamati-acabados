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

    // 📢 Notificar a todos los listeners
    this.notifyListeners();
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

  // 🆕 CREAR NUEVO PROYECTO
  createProject(projectData) {
    // Calcular un ID numérico válido y creciente incluso cuando no hay proyectos
    const numericIds = Object.keys(this.projects)
      .map((id) => Number(id))
      .filter((n) => Number.isFinite(n) && n > 0);
    const newId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
    // Asegurar categorías por defecto si no se proporcionan
    const defaultCategories = this.getInitialProjects()[1].categorias;
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
      creditoFiscalEstimado: 0,
      creditoFiscalReal: 0,
      impuestoRealDelProyecto: 0,
      impuestoEstimadoDelProyecto: 0,
      categorias: (projectData.categorias && projectData.categorias.length > 0) ? projectData.categorias : [...defaultCategories],
      lastUpdated: new Date().toISOString(),
      ...projectData
    };

    this.projects[newId] = newProject;

    // Calcular fórmulas iniciales para que los totales se muestren inmediatamente
    this.calculateFormulas(newId);

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

    // Recalcular fórmulas automáticamente (excluye filas marcadas en rojo)
    // Esto asegura que los totales horizontales no incluyan las filas marcadas
    this.calculateFormulas(projectId);
    
    console.log(`💾 SERVICIO: Categoría "${project.categorias[categoryIndex].nombre}" actualizada. Total Contrato=${project.totalContratoProveedores}, Total Egresos=${project.totalRegistroEgresos}`);
    
    this.saveToLocalStorage();
    this.notifyListeners();
  }
}

// 🎯 SINGLETON INSTANCE
const projectDataService = new ProjectDataService();

export default projectDataService;
