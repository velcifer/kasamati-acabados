import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  DocumentIcon,
  HomeIcon,
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

const ExcelGrid = () => {
  const navigate = useNavigate();
  const [selectedCell, setSelectedCell] = useState(null);
  const [data, setData] = useState(() => {
    // Inicializar con algunas filas vacías
    const initialData = {};
    for (let i = 1; i <= 20; i++) {
      initialData[i] = {
        nombreProyecto: '',
        nombreCliente: '',
        estadoProyecto: 'Ejecucion',
        tipoProyecto: 'Recibo',
        montoProyecto: 'S/0.00',
        presupuestoProyecto: 'S/0.00',
        utilidadNominal: 'S/0.00',
        utilidadReal: 'S/0.00',
        utilidadEstimada: 'S/0.00',
        utilidadRealFacturado: 'S/0.00',
        totalContrato: 'S/0.00',
        saldoPagar: 'S/0.00',
        adelantosCliente: 'S/0.00',
        saldosReales: 'S/0.00',
        creditoFiscal: 'S/0.00',
        saldosReales2: 'S/0.00'
      };
    }
    return initialData;
  });

  const columns = [
    { key: 'row', title: '#', width: '60px', type: 'row-number', section: 'general' },
    { key: 'nombreProyecto', title: 'Proyecto', width: '140px', type: 'text', section: 'general' },
    { key: 'nombreCliente', title: 'Cliente', width: '130px', type: 'text', section: 'general' },
    { key: 'estadoProyecto', title: 'Estado', width: '100px', type: 'select', options: ['Ejecucion', 'Recibo', 'Completado', 'Pausado'], section: 'general' },
    { key: 'tipoProyecto', title: 'Tipo', width: '90px', type: 'select', options: ['Recibo', 'Contrato', 'Servicio'], section: 'general' },
    { key: 'montoProyecto', title: 'Monto', width: '100px', type: 'currency', section: 'general' },
    { key: 'presupuestoProyecto', title: 'Presup.', width: '100px', type: 'currency', section: 'general' },
    { key: 'utilidadNominal', title: 'Util. Est. SF', width: '100px', type: 'currency', section: 'financiero' },
    { key: 'utilidadReal', title: 'Util. Real SF', width: '100px', type: 'currency', section: 'financiero' },
    { key: 'utilidadEstimada', title: 'Bal. +/-', width: '100px', type: 'currency', section: 'financiero' },
    { key: 'utilidadRealFacturado', title: 'Util. Est. CF', width: '110px', type: 'currency', section: 'financiero' },
    { key: 'totalContrato', title: 'Util. Real CF', width: '100px', type: 'currency', section: 'financiero' },
    { key: 'saldoPagar', title: 'Bal. SF', width: '100px', type: 'currency', section: 'financiero' },
    { key: 'adelantosCliente', title: 'Total Prov.', width: '100px', type: 'currency', section: 'cobranzas' },
    { key: 'saldosReales', title: 'Saldo Pagar', width: '100px', type: 'currency', section: 'cobranzas' },
    { key: 'creditoFiscal', title: 'Adelantos', width: '100px', type: 'currency', section: 'cobranzas' },
    { key: 'saldosReales2', title: 'Crédito Fiscal', width: '120px', type: 'currency', section: 'sunat' }
  ];

  const sectionColors = {
    general: 'bg-red-600',
    financiero: 'bg-blue-600', 
    cobranzas: 'bg-green-600',
    sunat: 'bg-orange-600'
  };

  const sectionTitles = {
    general: 'DATOS GENERALES DEL PROYECTO',
    financiero: 'ANÁLISIS FINANCIERO DEL PROYECTO',
    cobranzas: 'COBRANZAS Y SALDOS POR PAGAR',
    sunat: 'SUNAT'
  };

  const handleCellClick = (rowIndex, columnKey) => {
    setSelectedCell(`${rowIndex}-${columnKey}`);
  };

  const handleCellChange = (rowIndex, columnKey, value) => {
    setData(prev => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [columnKey]: value
      }
    }));
  };

  const handleGoBack = () => {
    navigate('/inicio');
  };

  const addNewRow = () => {
    const newRowIndex = Math.max(...Object.keys(data).map(Number)) + 1;
    setData(prev => ({
      ...prev,
      [newRowIndex]: {
        nombreProyecto: '',
        nombreCliente: '',
        estadoProyecto: 'Ejecucion',
        tipoProyecto: 'Recibo',
        montoProyecto: '$/0.00',
        presupuestoProyecto: '$/0.00',
        utilidadNominal: '$/0.00',
        utilidadReal: '$/0.00',
        utilidadEstimada: '$/0.00',
        utilidadRealFacturado: '$/0.00',
        totalContrato: '$/0.00',
        saldoPagar: '$/0.00',
        adelantosCliente: '$/0.00',
        saldosReales: '$/0.00',
        creditoFiscal: '$/0.00',
        saldosReales2: '$/0.00'
      }
    }));
  };

  const renderCell = (rowIndex, column) => {
    const cellKey = `${rowIndex}-${column.key}`;
    const isSelected = selectedCell === cellKey;
    const value = data[rowIndex]?.[column.key] || '';

    if (column.type === 'row-number') {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100 text-gray-700 font-semibold text-xs w-full">
          {rowIndex}
        </div>
      );
    }

    return (
      <div
        className={`h-full flex items-center px-1 cursor-cell ${
          isSelected ? 'ring-1 ring-blue-500 bg-blue-50' : 'bg-white hover:bg-gray-50'
        }`}
        onClick={() => handleCellClick(rowIndex, column.key)}
      >
        {column.type === 'select' ? (
          <select
            value={value}
            onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
            className="w-full h-full border-none outline-none bg-transparent text-xs px-1 text-center focus:bg-blue-50"
            onFocus={() => handleCellClick(rowIndex, column.key)}
            style={{ minHeight: '33px' }}
          >
            {column.options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => handleCellChange(rowIndex, column.key, e.target.value)}
            className="w-full h-full border-none outline-none bg-transparent text-xs px-1 text-center focus:bg-blue-50"
            onFocus={() => handleCellClick(rowIndex, column.key)}
            placeholder={column.type === 'currency' ? '$/0.00' : ''}
            style={{ minHeight: '33px' }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex flex-col lg:flex-row">
      
      {/* Menú Lateral */}
      <div className="w-full lg:w-64 bg-white/10 backdrop-blur-md border-b lg:border-r lg:border-b-0 border-white/20 p-3 sm:p-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:space-y-4 lg:gap-0">
          <button
            onClick={handleGoBack}
            className="flex items-center justify-center lg:justify-start text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm bg-white/10 px-2 lg:px-4 py-2 lg:py-3 rounded-xl border border-white/20 hover:bg-white/20 text-sm lg:text-base"
          >
            <ArrowLeftIcon className="h-4 w-4 lg:h-5 lg:w-5 lg:mr-3" />
            <span className="hidden lg:inline">Volver al Inicio</span>
          </button>

          <button
            className="flex items-center justify-center lg:justify-start text-white hover:text-white transition-all duration-200 bg-gradient-to-r from-blue-500 to-cyan-600 px-2 lg:px-4 py-2 lg:py-3 rounded-xl shadow-lg hover:shadow-blue-500/25 text-sm lg:text-base"
          >
            <HomeIcon className="h-4 w-4 lg:h-5 lg:w-5 lg:mr-3" />
            <span className="hidden lg:inline">Página Principal</span>
          </button>

          <button
            className="flex items-center justify-center lg:justify-start text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm bg-white/10 px-2 lg:px-4 py-2 lg:py-3 rounded-xl border border-white/20 hover:bg-white/20 text-sm lg:text-base"
          >
            <DocumentIcon className="h-4 w-4 lg:h-5 lg:w-5 lg:mr-3" />
            <span className="hidden lg:inline">Excel Principal</span>
          </button>

          <div className="col-span-2 lg:col-span-1 border-t lg:border-t border-white/20 pt-2 lg:pt-4 grid grid-cols-3 lg:grid-cols-1 gap-2 lg:gap-0 lg:space-y-2">
            <button
              onClick={addNewRow}
              className="flex items-center justify-center lg:justify-start text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm bg-green-500/20 px-2 lg:px-4 py-2 lg:py-3 rounded-xl border border-green-400/30 hover:bg-green-500/30 text-sm lg:text-base"
            >
              <PlusIcon className="h-4 w-4 lg:h-5 lg:w-5 lg:mr-3" />
              <span className="hidden lg:inline">Agregar Fila</span>
            </button>

            <button
              className="flex items-center justify-center lg:justify-start text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm bg-red-500/20 px-2 lg:px-4 py-2 lg:py-3 rounded-xl border border-red-400/30 hover:bg-red-500/30 text-sm lg:text-base"
            >
              <TrashIcon className="h-4 w-4 lg:h-5 lg:w-5 lg:mr-3" />
              <span className="hidden lg:inline">Eliminar Fila</span>
            </button>

            <button
              className="flex items-center justify-center lg:justify-start text-white/80 hover:text-white transition-all duration-200 backdrop-blur-sm bg-purple-500/20 px-2 lg:px-4 py-2 lg:py-3 rounded-xl border border-purple-400/30 hover:bg-purple-500/30 text-sm lg:text-base"
            >
              <DocumentDuplicateIcon className="h-4 w-4 lg:h-5 lg:w-5 lg:mr-3" />
              <span className="hidden lg:inline">Duplicar Fila</span>
            </button>
          </div>
        </div>
      </div>

      {/* Área Principal - Excel Grid */}
      <div className="flex-1 p-3 sm:p-6">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          
          {/* Header de la grilla */}
          <div className="bg-white/20 p-4 border-b border-white/20">
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Excel Principal - Proyectos
            </h1>
            <p className="text-white/70 text-xs sm:text-sm mt-2">
              3 de 3 proyectos • Desplázate horizontalmente para ver todas las columnas
            </p>
          </div>

          {/* Contenedor del Excel Responsive */}
          <div className="bg-white overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            
            {/* Container principal de la tabla */}
            <div className="min-w-max">
              
              {/* Headers de secciones */}
              <div className="flex sticky top-0 z-20">
                {/* Sección DATOS GENERALES DEL PROYECTO */}
                <div className="bg-red-600 text-white text-center font-bold text-xs py-2 px-1 flex items-center justify-center border border-gray-400" 
                     style={{width: '720px', minWidth: '720px'}}>
                  DATOS GENERALES DEL PROYECTO
                </div>
                
                {/* Sección ANÁLISIS FINANCIERO DEL PROYECTO */}
                <div className="bg-blue-600 text-white text-center font-bold text-xs py-2 px-1 flex items-center justify-center border border-gray-400" 
                     style={{width: '610px', minWidth: '610px'}}>
                  ANÁLISIS FINANCIERO DEL PROYECTO
                </div>
                
                {/* Sección COBRANZAS Y SALDOS POR PAGAR */}
                <div className="bg-green-600 text-white text-center font-bold text-xs py-2 px-1 flex items-center justify-center border border-gray-400" 
                     style={{width: '300px', minWidth: '300px'}}>
                  COBRANZAS Y SALDOS POR PAGAR
                </div>
                
                {/* Sección SUNAT */}
                <div className="bg-orange-600 text-white text-center font-bold text-xs py-2 px-1 flex items-center justify-center border border-gray-400" 
                     style={{width: '120px', minWidth: '120px'}}>
                  SUNAT
                </div>
              </div>

              {/* Headers de columnas */}
              <div className="flex sticky top-[32px] z-10 bg-gray-100">
                {columns.map((column) => {
                  // Determinar el color de fondo
                  let headerColorClass = 'bg-gray-200 text-black';
                  
                  // Solo las primeras 4 columnas deben ser rojas
                  const rojasColumns = ['row', 'nombreProyecto', 'nombreCliente', 'estadoProyecto'];
                  
                  // El resto de las columnas deben ser azul oscuro (excepto verdes y naranja)
                  if (rojasColumns.includes(column.key)) {
                    headerColorClass = 'bg-red-600 text-white'; // Primeras 4 columnas rojas
                  } else if (column.section === 'cobranzas') {
                    headerColorClass = 'bg-green-600 text-white'; // Columnas de cobranzas verdes
                  } else if (column.section === 'sunat') {
                    headerColorClass = 'bg-orange-600 text-white'; // Columnas SUNAT naranjas
                  } else {
                    headerColorClass = 'bg-blue-800 text-white'; // Todas las demás azul oscuro
                  }

                  return (
                    <div
                      key={column.key}
                      className={`border border-gray-400 px-1 py-2 font-semibold text-center text-xs ${headerColorClass} flex items-center justify-center`}
                      style={{ 
                        width: column.width, 
                        minWidth: column.width,
                        minHeight: '45px',
                        maxHeight: '45px'
                      }}
                    >
                      <span className="leading-tight">{column.title}</span>
                    </div>
                  );
                })}
              </div>

              {/* Filas de datos */}
              <div>
                {Object.keys(data).map((rowIndex) => (
                  <div key={rowIndex} className="flex hover:bg-gray-50">
                    {columns.map((column) => (
                      <div
                        key={`${rowIndex}-${column.key}`}
                        style={{ 
                          width: column.width, 
                          minWidth: column.width,
                          minHeight: '35px',
                          maxHeight: '35px'
                        }}
                        className="border-r border-b border-gray-300"
                      >
                        {renderCell(parseInt(rowIndex), column)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelGrid;
