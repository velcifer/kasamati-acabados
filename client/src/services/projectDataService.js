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

      // FÓRMULA 3: Presupuesto del Proyecto (suma de categorías, EXCLUYENDO filas marcadas en rojo)
      project.presupuestoProyecto = project.categorias.reduce((sum, cat) => {
        const presupuesto = toNumber(cat.presupuestoDelProyecto);
        const debeExcluir = debeExcluirseDeTotales(cat);
        
        if (debeExcluir && presupuesto > 0) {
          console.log(`🔴 SERVICIO: Excluyendo "${cat.nombre}" de presupuestoProyecto. Presupuesto=${presupuesto}`);
        }
        
        if (debeExcluir) {
          return sum; // Excluir esta fila
        }
        return sum + presupuesto;
      }, 0);
    }

    // FÓRMULA 4: Balance De Compras Del Proyecto = Σ Presupuesto − Σ Registro de Egresos
    project.balanceDeComprasDelProyecto = (parseFloat(project.presupuestoProyecto) || 0) -
                                          (parseFloat(project.totalRegistroEgresos) || 0);

    // FÓRMULA 5: Saldo por Cobrar = Monto Contrato - Adelantos
    project.saldoXCobrar = (parseFloat(project.montoContrato) || 0) -
                           (parseFloat(project.adelantos) || 0);

    // FÓRMULA 5.1: Utilidad Estimada Sin Factura = Monto del Contrato - Presupuesto del Proyecto
    project.utilidadEstimadaSinFactura = (parseFloat(project.montoContrato) || 0) -
                                         (parseFloat(project.presupuestoProyecto) || 0);

    // FÓRMULA 6: Utilidad Real Sin Factura = Monto del Contrato - Total Registro Egresos (excluyendo filas marcadas)
    project.utilidadRealSinFactura = (parseFloat(project.montoContrato) || 0) -
                                     (project.totalRegistroEgresos || 0);

    // FÓRMULA 7: Balance de Utilidad +/- = Utilidad Estimada Sin Factura - Utilidad Real Sin Factura
    project.balanceUtilidadSinFactura = (parseFloat(project.utilidadEstimadaSinFactura) || 0) -
                                        (parseFloat(project.utilidadRealSinFactura) || 0);

    // FÓRMULA 8: Utilidad Estimada Con Factura = Monto del Contrato - (Presupuesto del Proyecto + Impuesto Estimado del Proyecto)
    project.utilidadEstimadaConFactura = (parseFloat(project.montoContrato) || 0) -
                                         ((parseFloat(project.presupuestoProyecto) || 0) +
                                          (parseFloat(project.impuestoEstimadoDelProyecto) || 0));

    // FÓRMULA 9: Utilidad Real Con Factura = Monto del Contrato - (Total Registro Egresos + Crédito Fiscal Real)
    // Usar totalRegistroEgresos (que excluye filas marcadas) en lugar de totalSaldoPorPagarProveedores
    project.utilidadRealConFactura = (parseFloat(project.montoContrato) || 0) -
                                     ((project.totalRegistroEgresos || 0) +
                                      (parseFloat(project.creditoFiscalReal) || 0));

    // FÓRMULA 10: Balance de Utilidad Con Factura = Utilidad Estimada Con Factura - Utilidad Real Con Factura
    project.balanceUtilidadConFactura = (parseFloat(project.utilidadEstimadaConFactura) || 0) -
                                        (parseFloat(project.utilidadRealConFactura) || 0);

    // FÓRMULA 11: Total de Egresos del Proyecto = Σ Registro de Egresos
    project.totalEgresosProyecto = project.totalRegistroEgresos || 0;

    // FÓRMULA 12: Balance del Presupuesto = Presupuesto − Total Egresos del Proyecto
    project.balanceDelPresupuesto = (parseFloat(project.presupuestoProyecto) || 0) - 
                                   (parseFloat(project.totalEgresosProyecto) || 0);

    // 🎯 NUEVA FÓRMULA: Calcular total de cobranzas (suma de montos)
    if (project.cobranzas && Array.isArray(project.cobranzas)) {
      project.totalCobranzasDelProyecto = project.cobranzas.reduce((sum, c) => {
        const m = parseFloat(String(c.monto).replace(/[^0-9.-]/g, '')) || 0;
        return sum + m;
      }, 0);
      // Adelantos = suma de las cobranzas
      project.adelantos = project.totalCobranzasDelProyecto;
      // Recalcular saldo por cobrar con base en adelantos
      project.saldoXCobrar = (parseFloat(project.montoContrato) || 0) - (project.adelantos || 0);
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
      project.creditoFiscalEstimado = totalPresupuestosConFactura * 0.18 / 1.18;
      
      // FÓRMULA 14: Crédito Fiscal Real = (Suma de Contratos con F) / 1.18 × 0.18
      // Es equivalente a: totalContratosConFactura × 0.18 / 1.18
      project.creditoFiscalReal = totalContratosConFactura * 0.18 / 1.18;
      
      // 🧾 FÓRMULA 16: Impuesto Estimado del Proyecto = (Suma de Contratos con F) / 1.18 × 0.18
      // Es equivalente a: totalContratosConFactura × 0.18 / 1.18
      // Misma fórmula que Crédito Fiscal Real
      project.impuestoEstimadoDelProyecto = totalContratosConFactura * 0.18 / 1.18;

      console.log('🧾 ===== IGV - SUNAT 18% =====');
      console.log(`   📊 Total contratos con factura (F): S/ ${totalContratosConFactura.toFixed(2)}`);
      console.log(`   📐 Fórmula: ${totalContratosConFactura.toFixed(2)} × 0.18 / 1.18`);
      console.log(`   💰 Crédito Fiscal (IGV): S/ ${project.creditoFiscal.toFixed(2)}`);
      console.log(`   💰 Crédito Fiscal Real: S/ ${project.creditoFiscalReal.toFixed(2)} (Suma F × 0.18 / 1.18)`);
      console.log(`   💰 Impuesto Estimado del Proyecto: S/ ${project.impuestoEstimadoDelProyecto.toFixed(2)} (Suma F × 0.18 / 1.18)`);
      console.log('🧾 ============================');
    } else {
      // Si no hay categorías, inicializar en 0
      project.impuestoEstimadoDelProyecto = 0;
    }

    // 🧾 FÓRMULA 15: Impuesto Real del Proyecto (IGV del monto del contrato)
    // Si el proyecto tiene factura, calcular IGV del monto del contrato
    const montoContrato = parseFloat(project.montoContrato) || 0;
    if (montoContrato > 0) {
      const igvContrato = montoContrato * 0.18 / 1.18;
      project.impuestoRealDelProyecto = igvContrato;
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
