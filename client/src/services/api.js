// 🔌 SERVICIO API PRINCIPAL - KSAMATI
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// 🔧 Configuración base de fetch
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  const config = {
    ...defaultOptions,
    ...options
  };
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`❌ API Error [${endpoint}]:`, error);
    throw error;
  }
};

// 🧪 Verificar conectividad del servidor
export const checkServerHealth = async () => {
  try {
    const response = await apiRequest('/health');
    return response;
  } catch (error) {
    return {
      status: 'ERROR',
      database: 'Disconnected',
      message: 'Sin conexión al servidor',
      error: error.message
    };
  }
};

// 📊 SERVICIOS PARA PROYECTOS
export const proyectosAPI = {
  // Obtener todos los proyectos (para Excel principal)
  getAll: async () => {
    try {
      const response = await apiRequest('/proyectos');
      return response;
    } catch (error) {
      console.warn('⚠️ Error obteniendo proyectos de API, usando localStorage...');
      return { success: false, error: error.message };
    }
  },
  
  // Obtener proyecto por ID con detalles
  getById: async (id) => {
    try {
      const response = await apiRequest(`/proyectos/${id}`);
      return response;
    } catch (error) {
      console.warn('⚠️ Error obteniendo proyecto de API, usando localStorage...');
      return { success: false, error: error.message };
    }
  },
  
  // Crear nuevo proyecto
  create: async (projectData) => {
    try {
      const response = await apiRequest('/proyectos', {
        method: 'POST',
        body: JSON.stringify(projectData)
      });
      return response;
    } catch (error) {
      console.warn('⚠️ Error creando proyecto en API, usando localStorage...');
      return { success: false, error: error.message };
    }
  },
  
  // Actualizar proyecto
  update: async (id, projectData) => {
    try {
      const response = await apiRequest(`/proyectos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(projectData)
      });
      return response;
    } catch (error) {
      console.warn('⚠️ Error actualizando proyecto en API, usando localStorage...');
      return { success: false, error: error.message };
    }
  },
  
  // Eliminar proyectos
  delete: async (ids) => {
    try {
      const response = await apiRequest('/proyectos', {
        method: 'DELETE',
        body: JSON.stringify({ ids })
      });
      return response;
    } catch (error) {
      console.warn('⚠️ Error eliminando proyectos de API, usando localStorage...');
      return { success: false, error: error.message };
    }
  },
  
  // Obtener estadísticas
  getStats: async () => {
    try {
      const response = await apiRequest('/proyectos/stats/dashboard');
      return response;
    } catch (error) {
      console.warn('⚠️ Error obteniendo estadísticas de API...');
      return { success: false, error: error.message };
    }
  }
};

// 🔄 UTILIDADES PARA MANEJO DE ERRORES
export const handleApiError = (error, fallbackAction) => {
  console.error('API Error:', error);
  
  if (typeof fallbackAction === 'function') {
    console.log('🔄 Ejecutando acción de respaldo...');
    return fallbackAction();
  }
  
  return null;
};

export default {
  checkServerHealth,
  proyectosAPI,
  handleApiError
};
