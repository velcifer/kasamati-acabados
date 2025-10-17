import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeftIcon, 
  CheckIcon, 
  DocumentIcon,
  PaperClipIcon,
  EyeIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const ProyectoDetalle = ({ proyecto, onBack, onSave, projectNumber }) => {
  // 🚀 Auto-save timer reference
  const autoSaveTimer = useRef(null);
  
  // 📄 Estados para DOCUMENTOS DEL PROYECTO
  const [documentos, setDocumentos] = useState([
    { id: 1, proveedor: '', descripcion: '', fecha: '', monto: '$/0.00' },
    { id: 2, proveedor: '', descripcion: '', fecha: '', monto: '$/0.00' },
    { id: 3, proveedor: '', descripcion: '', fecha: '', monto: '$/0.00' },
    { id: 4, proveedor: '', descripcion: '', fecha: '', monto: '$/0.00' },
    { id: 5, proveedor: '', descripcion: '', fecha: '', monto: '$/0.00' }
  ]);
  
  // 📎 Estados para ARCHIVOS ADJUNTOS (1-4 archivos máximo)
  const [archivosAdjuntos, setArchivosAdjuntos] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const [documentosPopupOpen, setDocumentosPopupOpen] = useState(false);
  const fileInputRef = useRef(null);
  
  const [projectData, setProjectData] = useState({
    // Datos básicos del proyecto
    estado: 'Ejecucion',
    nombreProyecto: proyecto?.nombreProyecto || `Proyecto ${projectNumber}`,
    tipo: 'Recibo',
    nombreCliente: proyecto?.nombreCliente || '',
    telefono: '',
    
    // Análisis Financiero del Proyecto (6 campos como en el Excel)
    utilidadEstimadaSinFactura: '$/0.00',
    utilidadRealSinFactura: '$/0.00',
    balanceUtilidadSinFactura: '$/0.00',
    utilidadEstimadaConFactura: '$/0.00',
    utilidadRealConFactura: '$/0.00',
    balanceUtilidadConFactura: '$/0.00',
    
    // Cobranzas del Proyecto
    montoContrato: '$/0.00',
    adelantos: '$/0.00',
    saldoXCobrar: '$/0.00',
    presupuestoDelProyecto: '$/0.00',
    totalEgresosProyecto: '$/0.00',
    balanceDelPresupuesto: '$/0.00',
    
    // IGV - SUNAT 18%
    igvSunat: '$/0.00',
    creditoFiscalEstimado: '$/0.00',
    impuestoEstimadoDelProyecto: '$/0.00',
    creditoFiscalReal: '$/0.00',
    impuestoRealDelProyecto: '$/0.00',
    
    // Totales y Balance
    totalContratoProveedores: '$/0.00',
    totalSaldoPorPagarProveedores: '$/0.00',
    balanceDeComprasDelProyecto: '$/0.00',
    
    // Observaciones
    observacionesDelProyecto: '',
    
    // Categorías del Proveedor y/o el servicio - EXACTO como el Excel
    categorias: [
      { id: 1, nombre: 'Melamina y Servicios', tipo: 'F', 
        presupuestoDelProyecto: '0.00', contratoProvedYServ: '0.00', 
        registroEgresos: '0.00', saldosPorCancelar: '0.00', editable: true },
      { id: 2, nombre: 'Melamina High Glass', tipo: 'F',
        presupuestoDelProyecto: '0.00', contratoProvedYServ: '0.00', 
        registroEgresos: '0.00', saldosPorCancelar: '0.00', editable: true },
      { id: 3, nombre: 'Accesorios y Ferretería', tipo: 'F',
        presupuestoDelProyecto: '0.00', contratoProvedYServ: '0.00', 
        registroEgresos: '0.00', saldosPorCancelar: '0.00', editable: true },
      { id: 4, nombre: 'Puertas Alu Y Vidrios', tipo: 'F',
        presupuestoDelProyecto: '0.00', contratoProvedYServ: '0.00', 
        registroEgresos: '0.00', saldosPorCancelar: '0.00', editable: true },
      { id: 5, nombre: 'Led y Electricidad', tipo: 'F',
        presupuestoDelProyecto: '0.00', contratoProvedYServ: '0.00', 
        registroEgresos: '0.00', saldosPorCancelar: '0.00', editable: true },
      { id: 6, nombre: 'Flete Y/o Camioneta', tipo: '',
        presupuestoDelProyecto: '0.00', contratoProvedYServ: '0.00', 
        registroEgresos: '0.00', saldosPorCancelar: '0.00', editable: true },
      { id: 7, nombre: 'Logística Operativa', tipo: '',
        presupuestoDelProyecto: '0.00', contratoProvedYServ: '0.00', 
        registroEgresos: '0.00', saldosPorCancelar: '0.00', editable: true },
      { id: 8, nombre: 'Extras y/o Eventos', tipo: '',
        presupuestoDelProyecto: '0.00', contratoProvedYServ: '0.00', 
        registroEgresos: '0.00', saldosPorCancelar: '0.00', editable: true },
      { id: 9, nombre: 'Despecie', tipo: '',
        presupuestoDelProyecto: '$/0.00', contratoProvedYServ: '$/0.00', 
        registroEgresos: '$/0.00', saldosPorCancelar: '$/0.00', editable: true },
      { id: 10, nombre: 'Mano de Obra', tipo: '',
        presupuestoDelProyecto: '$/0.00', contratoProvedYServ: '$/0.00', 
        registroEgresos: '$/0.00', saldosPorCancelar: '$/0.00', editable: true },
      { id: 11, nombre: 'Mano de Obra', tipo: '',
        presupuestoDelProyecto: '$/0.00', contratoProvedYServ: '$/0.00', 
        registroEgresos: '$/0.00', saldosPorCancelar: '$/0.00', editable: true },
      { id: 12, nombre: 'Mano de Obra', tipo: '',
        presupuestoDelProyecto: '$/0.00', contratoProvedYServ: '$/0.00', 
        registroEgresos: '$/0.00', saldosPorCancelar: '$/0.00', editable: true },
      { id: 13, nombre: 'Mano de Obra', tipo: '',
        presupuestoDelProyecto: '$/0.00', contratoProvedYServ: '$/0.00', 
        registroEgresos: '$/0.00', saldosPorCancelar: '$/0.00', editable: true },
      { id: 14, nombre: 'OF - ESCP', tipo: '',
        presupuestoDelProyecto: '$/0.00', contratoProvedYServ: '$/0.00', 
        registroEgresos: '$/0.00', saldosPorCancelar: '$/0.00', editable: true },
      { id: 15, nombre: 'Granito Y/O Cuarzo', tipo: 'F',
        presupuestoDelProyecto: '$/0.00', contratoProvedYServ: '$/0.00', 
        registroEgresos: '$/0.00', saldosPorCancelar: '$/0.00', editable: true },
      { id: 16, nombre: 'Extras Y/O Eventos GyC', tipo: '',
        presupuestoDelProyecto: '$/0.00', contratoProvedYServ: '$/0.00', 
        registroEgresos: '$/0.00', saldosPorCancelar: '$/0.00', editable: true },
      { id: 17, nombre: 'Tercialization 1 Facturada', tipo: 'F',
        presupuestoDelProyecto: '$/0.00', contratoProvedYServ: '$/0.00', 
        registroEgresos: '$/0.00', saldosPorCancelar: '$/0.00', editable: true },
      { id: 18, nombre: 'Extras Y/O Eventos Terc. 1', tipo: '',
        presupuestoDelProyecto: '$/0.00', contratoProvedYServ: '$/0.00', 
        registroEgresos: '$/0.00', saldosPorCancelar: '$/0.00', editable: true },
      { id: 19, nombre: 'Tercialization 2 Facturada', tipo: 'F',
        presupuestoDelProyecto: '$/0.00', contratoProvedYServ: '$/0.00', 
        registroEgresos: '$/0.00', saldosPorCancelar: '$/0.00', editable: true },
      { id: 20, nombre: 'Extras Y/O Eventos Terc. 2', tipo: '',
        presupuestoDelProyecto: '$/0.00', contratoProvedYServ: '$/0.00', 
        registroEgresos: '$/0.00', saldosPorCancelar: '$/0.00', editable: true },
      { id: 21, nombre: 'Tercialization 1 NO Facturada', tipo: '',
        presupuestoDelProyecto: '$/0.00', contratoProvedYServ: '$/0.00', 
        registroEgresos: '$/0.00', saldosPorCancelar: '$/0.00', editable: true },
      { id: 22, nombre: 'Extras Y/O Eventos Terc. 1 NF', tipo: '',
        presupuestoDelProyecto: '$/0.00', contratoProvedYServ: '$/0.00', 
        registroEgresos: '$/0.00', saldosPorCancelar: '$/0.00', editable: true },
      { id: 23, nombre: 'Tercialization 2 NO Facturada', tipo: '',
        presupuestoDelProyecto: '$/0.00', contratoProvedYServ: '$/0.00', 
        registroEgresos: '$/0.00', saldosPorCancelar: '$/0.00', editable: true },
      { id: 24, nombre: 'Extras Y/O Eventos Terc. 2 NF', tipo: '',
        presupuestoDelProyecto: '$/0.00', contratoProvedYServ: '$/0.00', 
        registroEgresos: '$/0.00', saldosPorCancelar: '$/0.00', editable: true }
    ]
  });
}
