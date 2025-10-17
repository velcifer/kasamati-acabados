// 🎯 HOOK PERSONALIZADO PARA GESTIÓN DE DATOS DE PROYECTOS
// Proporciona auto-sync, fórmulas automáticas y persistencia

import { useState, useEffect, useCallback } from 'react';
import projectDataService from '../services/projectDataService';

// 📊 HOOK PRINCIPAL: useProjectData
export const useProjectData = () => {
  const [projects, setProjects] = useState(projectDataService.getAllProjects());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 📢 Suscribirse a cambios automáticos
    const unsubscribe = projectDataService.addListener((updatedProjects) => {
      setProjects(updatedProjects);
    });

    return unsubscribe; // Cleanup
  }, []);

  // 🔄 MÉTODOS DE ACTUALIZACIÓN
  const updateProject = useCallback((projectId, updates) => {
    setLoading(true);
    projectDataService.updateProject(projectId, updates);
    setLoading(false);
  }, []);

  const createProject = useCallback((projectData) => {
    setLoading(true);
    const newProject = projectDataService.createProject(projectData);
    setLoading(false);
    return newProject;
  }, []);

  const deleteProject = useCallback((projectId) => {
    setLoading(true);
    projectDataService.deleteProject(projectId);
    setLoading(false);
  }, []);

  const updateCategory = useCallback((projectId, categoryId, updates) => {
    projectDataService.updateProjectCategory(projectId, categoryId, updates);
  }, []);

  // 📋 OBTENER DATOS
  const getProject = useCallback((projectId) => {
    return projectDataService.getProject(projectId);
  }, []);

  const getProjectsArray = useCallback(() => {
    return Object.values(projects);
  }, [projects]);

  return {
    projects,
    projectsArray: getProjectsArray(),
    loading,
    updateProject,
    createProject,
    deleteProject,
    updateCategory,
    getProject
  };
};

// 📊 HOOK ESPECÍFICO: useProjectDetail (para ProyectoDetalle.js)
export const useProjectDetail = (projectId) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar proyecto inicial
    const projectData = projectDataService.getProject(projectId);
    setProject(projectData);
    setLoading(false);

    // 📢 Suscribirse a cambios de este proyecto específico
    const unsubscribe = projectDataService.addListener((allProjects) => {
      const updatedProject = allProjects[projectId];
      if (updatedProject) {
        setProject(updatedProject);
      }
    });

    return unsubscribe; // Cleanup
  }, [projectId]);

  // 🔄 AUTO-SAVE: Actualizar cualquier campo del proyecto
  const updateField = useCallback((fieldName, value) => {
    if (!project) return;

    // Convertir valores monetarios automáticamente
    const processedValue = fieldName.includes('monto') || 
                          fieldName.includes('presupuesto') || 
                          fieldName.includes('utilidad') || 
                          fieldName.includes('saldo') || 
                          fieldName.includes('balance') || 
                          fieldName.includes('adelantos') || 
                          fieldName.includes('credito') ? 
                          parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0 : 
                          value;

    const updates = { [fieldName]: processedValue };
    projectDataService.updateProject(projectId, updates);
  }, [projectId, project]);

  // 🔄 AUTO-SAVE: Actualizar categoría del proyecto
  const updateCategory = useCallback((categoryId, updates) => {
    if (!project) return;

    // Convertir valores monetarios en las categorías
    const processedUpdates = {};
    Object.keys(updates).forEach(key => {
      if (key.includes('presupuesto') || key.includes('contrato') || key.includes('registro') || key.includes('saldo')) {
        processedUpdates[key] = parseFloat(updates[key].toString().replace(/[^0-9.-]/g, '')) || 0;
      } else {
        processedUpdates[key] = updates[key];
      }
    });

    projectDataService.updateProjectCategory(projectId, categoryId, processedUpdates);
  }, [projectId, project]);

  // 📊 CALCULADOS: Totales automáticos del proyecto
  const totales = useCallback(() => {
    if (!project || !project.categorias) return { presupuesto: 0, contrato: 0, egresos: 0, saldos: 0 };

    return project.categorias.reduce((acc, categoria) => ({
      presupuesto: acc.presupuesto + (parseFloat(categoria.presupuestoDelProyecto) || 0),
      contrato: acc.contrato + (parseFloat(categoria.contratoProvedYServ) || 0),
      egresos: acc.egresos + (parseFloat(categoria.registroEgresos) || 0),
      saldos: acc.saldos + (parseFloat(categoria.saldosPorCancelar) || 0)
    }), { presupuesto: 0, contrato: 0, egresos: 0, saldos: 0 });
  }, [project]);

  // 🆕 AGREGAR NUEVA CATEGORÍA
  const addCategory = useCallback(() => {
    if (!project) return;

    const newCategory = {
      id: (project.categorias?.length || 0) + 1,
      nombre: '',
      tipo: '',
      presupuestoDelProyecto: 0,
      contratoProvedYServ: 0,
      registroEgresos: 0,
      saldosPorCancelar: 0
    };

    const updatedCategorias = [...(project.categorias || []), newCategory];
    projectDataService.updateProject(projectId, { categorias: updatedCategorias });
  }, [projectId, project]);

  return {
    project,
    loading,
    updateField,      // 🔄 Auto-save campo del proyecto
    updateCategory,   // 🔄 Auto-save categoría
    addCategory,      // 🆕 Agregar categoría
    totales: totales() // 📊 Totales calculados
  };
};

// 📊 HOOK ESPECÍFICO: useExcelGrid (para ExcelGrid.js)
export const useExcelGrid = () => {
  const { projects, updateProject, createProject, deleteProject } = useProjectData();
  
  // 📋 Convertir a formato compatible con ExcelGrid
  const excelData = useCallback(() => {
    const result = {};
    Object.keys(projects).forEach(projectId => {
      const project = projects[projectId];
      result[projectId] = {
        // 🔴 DATOS GENERALES DEL PROYECTO
        nombreProyecto: project.nombreProyecto || '',
        nombreCliente: project.nombreCliente || '',
        estadoProyecto: project.estadoProyecto || 'Ejecucion',
        tipoProyecto: project.tipoProyecto || 'Recibo',
        
        // 🔵 ANÁLISIS FINANCIERO DEL PROYECTO
        montoContrato: `$/${project.montoContrato || 0}`,
        presupuestoProyecto: `$/${project.presupuestoProyecto || 0}`,
        balanceProyecto: `$/${(project.presupuestoProyecto || 0) - (project.totalSaldoPorPagarProveedores || 0)}`,
        utilidadEstimadaSinFactura: `$/${project.utilidadEstimadaSinFactura || 0}`,
        utilidadRealSinFactura: `$/${project.utilidadRealSinFactura || 0}`,
        balanceUtilidadSinFactura: `$/${project.balanceUtilidadSinFactura || 0}`,
        utilidadEstimadaFacturado: `$/${project.utilidadEstimadaConFactura || 0}`,
        utilidadRealFacturado: `$/${project.utilidadRealConFactura || 0}`,
        balanceUtilidadConFactura: `$/${project.balanceUtilidadConFactura || 0}`,
        
        // 🟢 COBRANZAS Y SALDOS POR PAGAR
        totalContratoProveedores: `$/${project.totalContratoProveedores || 0}`,
        saldoPagarProveedores: `$/${project.totalSaldoPorPagarProveedores || 0}`,
        adelantosCliente: `$/${project.adelantos || 0}`,
        saldosRealesProyecto: `$/${project.saldoXCobrar || 0}`,
        saldosCobrarProyecto: `$/${project.balanceDeComprasDelProyecto || 0}`,
        
        // 🟠 SUNAT
        creditoFiscal: `$/${project.creditoFiscal || project.creditoFiscalReal || 0}`,
        impuestoRealProyecto: `$/${project.impuestoRealDelProyecto || 0}`,
        
        // 📊 CAMPOS ADICIONALES CALCULADOS
        totalEgresosProyecto: `$/${project.totalEgresosProyecto || project.totalSaldoPorPagarProveedores || 0}`,
        balanceDelPresupuesto: `$/${project.balanceDelPresupuesto || 0}`,
        
        // 📅 TOTAL DE COBRANZAS (suma de la nueva funcionalidad)
        totalCobranzas: project.cobranzas ? 
          `$/${project.cobranzas.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0)}` : 
          '$/ 0'
      };
    });
    return result;
  }, [projects]);

  // 🔄 Actualizar celda del Excel
  const updateCell = useCallback((projectId, fieldName, value) => {
    // Mapeo de campos Excel → campos del servicio
    const fieldMapping = {
      // 🔴 DATOS GENERALES
      nombreProyecto: 'nombreProyecto',
      nombreCliente: 'nombreCliente', 
      estadoProyecto: 'estadoProyecto',
      tipoProyecto: 'tipoProyecto',
      
      // 🔵 ANÁLISIS FINANCIERO
      montoContrato: 'montoContrato',
      presupuestoProyecto: 'presupuestoProyecto',
      utilidadEstimadaSinFactura: 'utilidadEstimadaSinFactura',
      utilidadRealSinFactura: 'utilidadRealSinFactura',
      balanceUtilidadSinFactura: 'balanceUtilidadSinFactura',
      utilidadEstimadaFacturado: 'utilidadEstimadaConFactura',
      utilidadRealFacturado: 'utilidadRealConFactura',
      balanceUtilidadConFactura: 'balanceUtilidadConFactura',
      
      // 🟢 COBRANZAS Y SALDOS
      totalContratoProveedores: 'totalContratoProveedores',
      saldoPagarProveedores: 'totalSaldoPorPagarProveedores',
      adelantosCliente: 'adelantos',
      saldosRealesProyecto: 'saldoXCobrar',
      saldosCobrarProyecto: 'balanceDeComprasDelProyecto',
      
      // 🟠 SUNAT
      creditoFiscal: 'creditoFiscalReal',
      impuestoRealProyecto: 'impuestoRealDelProyecto',
      
      // 📊 CAMPOS ADICIONALES
      totalEgresosProyecto: 'totalEgresosProyecto',
      balanceDelPresupuesto: 'balanceDelPresupuesto',
      
      // ⚡ MAPEO LEGACY (para compatibilidad)
      montoProyecto: 'montoContrato',
      utilidadNominal: 'utilidadEstimadaSinFactura',
      utilidadReal: 'utilidadRealSinFactura',
      utilidadEstimada: 'utilidadEstimadaConFactura',
      totalContrato: 'totalContratoProveedores',
      saldoPagar: 'totalSaldoPorPagarProveedores',
      saldosReales: 'saldoXCobrar',
      saldosReales2: 'balanceDeComprasDelProyecto'
    };

    const mappedField = fieldMapping[fieldName] || fieldName;
    
    // Procesar valor monetario
    const processedValue = fieldName.includes('monto') || 
                          fieldName.includes('presupuesto') || 
                          fieldName.includes('utilidad') || 
                          fieldName.includes('adelantos') || 
                          fieldName.includes('credito') ? 
                          parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0 : 
                          value;

    updateProject(projectId, { [mappedField]: processedValue });
  }, [updateProject]);

  return {
    data: excelData(),
    updateCell,
    createProject,
    deleteProject
  };
};

export default useProjectData;
