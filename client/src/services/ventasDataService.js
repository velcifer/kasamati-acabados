// 🎯 SERVICIO CENTRALIZADO DE DATOS DE VENTAS - SINCRONIZACIÓN AUTOMÁTICA
// Maneja la sincronización entre GestorVentas y VentaDetalle con fórmulas automáticas

class VentasDataService {
  constructor() {
    this.listeners = [];
    this.ventas = this.loadFromLocalStorage();
  }

  // 💾 PERSISTENCIA LOCAL
  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('ksamati_ventas');
      if (saved) {
        const ventas = JSON.parse(saved);
        return ventas;
      }
      return this.getInitialVentas();
    } catch (error) {
      console.warn('Error loading ventas from localStorage:', error);
      return this.getInitialVentas();
    }
  }

  saveToLocalStorage() {
    try {
      localStorage.setItem('ksamati_ventas', JSON.stringify(this.ventas));
      console.log('✅ Ventas guardadas en localStorage:', Object.keys(this.ventas).length);
    } catch (error) {
      console.warn('Error saving ventas to localStorage:', error);
    }
  }

  // 📊 DATOS INICIALES
  getInitialVentas() {
    return {
      1: {
        id: 1,
        estado: 'Cotizando',
        cliente: 'Cliente ABC',
        requerimiento: 'Mobiliario de oficina',
        telefono: '999-888-777',
        proyecto: 'Oficinas Modernas',
        utilidad: '$/ 2,500.00',
        
        // Datos completos de la venta (para VentaDetalle)
        datosCompletos: {
          informacionGeneral: {
            nombreCliente: 'Cliente ABC',
            telefono: '999-888-777',
            email: '',
            direccion: '',
            fechaCotizacion: new Date().toISOString().split('T')[0]
          },
          productos: [],
          observaciones: '',
          total: 2500.00
        },
        
        lastUpdated: new Date().toISOString()
      },
      2: {
        id: 2,
        estado: 'Enviado',
        cliente: 'Cliente XYZ',
        requerimiento: 'Muebles de cocina',
        telefono: '111-222-333',
        proyecto: 'Casa Familiar',
        utilidad: '$/ 4,200.00',
        
        datosCompletos: {
          informacionGeneral: {
            nombreCliente: 'Cliente XYZ',
            telefono: '111-222-333',
            email: '',
            direccion: '',
            fechaCotizacion: new Date().toISOString().split('T')[0]
          },
          productos: [],
          observaciones: '',
          total: 4200.00
        },
        
        lastUpdated: new Date().toISOString()
      }
    };
  }

  // 🎯 MÉTODOS DE GESTIÓN DE DATOS

  // Obtener todas las ventas
  getAllVentas() {
    return this.ventas;
  }

  // Obtener una venta específica
  getVenta(ventaId) {
    return this.ventas[ventaId];
  }

  // 🔄 ACTUALIZACIÓN CON FÓRMULAS AUTOMÁTICAS
  updateVenta(ventaId, updates) {
    if (!this.ventas[ventaId]) {
      console.warn(`Venta ${ventaId} not found`);
      return;
    }

    // Actualizar datos básicos
    this.ventas[ventaId] = {
      ...this.ventas[ventaId],
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    // 💾 Guardar automáticamente
    this.saveToLocalStorage();

    // 📢 Notificar a todos los listeners
    this.notifyListeners();

    console.log(`✅ Venta ${ventaId} actualizada:`, updates);
  }

  // 🆕 CREAR NUEVA VENTA
  createVenta(ventaData = {}) {
    // Encontrar el próximo ID disponible
    const existingIds = Object.keys(this.ventas).map(Number);
    const newId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    
    const newVenta = {
      id: newId,
      estado: ventaData.estado || 'Cotizando',
      cliente: ventaData.cliente || '',
      requerimiento: ventaData.requerimiento || '',
      telefono: ventaData.telefono || '',
      proyecto: ventaData.proyecto || `Venta ${newId}`,
      utilidad: ventaData.utilidad || '$/ 0.00',
      
      datosCompletos: {
        informacionGeneral: {
          nombreCliente: ventaData.cliente || '',
          telefono: ventaData.telefono || '',
          email: '',
          direccion: '',
          fechaCotizacion: new Date().toISOString().split('T')[0]
        },
        productos: [],
        observaciones: '',
        total: 0
      },
      
      lastUpdated: new Date().toISOString(),
      ...ventaData
    };

    this.ventas[newId] = newVenta;
    this.saveToLocalStorage();
    this.notifyListeners();
    
    console.log(`✅ Nueva venta creada:`, newVenta);
    return newVenta;
  }

  // ❌ ELIMINAR VENTA
  deleteVenta(ventaId) {
    if (this.ventas[ventaId]) {
      delete this.ventas[ventaId];
      this.saveToLocalStorage();
      this.notifyListeners();
      console.log(`✅ Venta ${ventaId} eliminada`);
    }
  }

  // ❌ ELIMINAR MÚLTIPLES VENTAS
  deleteMultipleVentas(ventaIds) {
    ventaIds.forEach(ventaId => {
      if (this.ventas[ventaId]) {
        delete this.ventas[ventaId];
      }
    });
    
    this.saveToLocalStorage();
    this.notifyListeners();
    console.log(`✅ ${ventaIds.length} ventas eliminadas`);
  }

  // 📢 SISTEMA DE LISTENERS (para React components)
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.ventas));
  }

  // 📊 OBTENER ESTADÍSTICAS
  getEstadisticas() {
    const ventas = Object.values(this.ventas);
    const estadisticas = {
      total: ventas.length,
      porEstado: {},
      utilidadTotal: 0
    };

    ventas.forEach(venta => {
      // Contar por estado
      if (!estadisticas.porEstado[venta.estado]) {
        estadisticas.porEstado[venta.estado] = 0;
      }
      estadisticas.porEstado[venta.estado]++;

      // Sumar utilidad
      const utilidadNumerica = parseFloat(venta.utilidad.replace(/[^0-9.-]/g, '')) || 0;
      estadisticas.utilidadTotal += utilidadNumerica;
    });

    return estadisticas;
  }

  // 🔍 BÚSQUEDA Y FILTROS
  searchVentas(filters = {}) {
    const ventas = Object.values(this.ventas);
    
    return ventas.filter(venta => {
      if (filters.estado && venta.estado !== filters.estado) return false;
      if (filters.cliente && !venta.cliente.toLowerCase().includes(filters.cliente.toLowerCase())) return false;
      if (filters.requerimiento && !venta.requerimiento.toLowerCase().includes(filters.requerimiento.toLowerCase())) return false;
      return true;
    });
  }

  // 🔄 SINCRONIZAR CON SERVIDOR (para futuro)
  async syncWithServer() {
    // TODO: Implementar sincronización con MySQL/API
    console.log('🔄 Sincronización con servidor pendiente...');
  }
}

// 🎯 SINGLETON INSTANCE
const ventasDataService = new VentasDataService();

export default ventasDataService;



