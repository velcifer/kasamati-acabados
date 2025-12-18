// 🔌 SERVICIO API PRINCIPAL - KSAMATI
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ⏱️ TIMEOUT CONFIGURACIÓN (10 segundos por defecto - más tiempo para conexiones lentas)
const DEFAULT_TIMEOUT = 10000;

// 🔧 Función helper para crear timeout promise - NO RECHAZA, retorna objeto especial
const createTimeoutPromise = (timeoutMs) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // ⚡ NO RECHAZAR - retornar objeto especial que indica timeout
      resolve({ 
        __timeout: true, 
        success: false, 
        error: 'Timeout',
        message: `Timeout: La petición excedió ${timeoutMs}ms`
      });
    }, timeoutMs);
  });
};

// 🔧 Configuración base de fetch con timeout
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const timeoutMs = options.timeout || DEFAULT_TIMEOUT;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  // Remover timeout de options para evitar pasarlo a fetch
  const { timeout, ...fetchOptions } = options;
  
  const config = {
    ...defaultOptions,
    ...fetchOptions
  };
  
  try {
    // Crear promise de fetch con timeout
    const fetchPromise = fetch(url, config).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    });
    
    // Usar Promise.race para aplicar timeout
    const response = await Promise.race([
      fetchPromise,
      createTimeoutPromise(timeoutMs)
    ]);
    
    // ⚡ Verificar si es timeout (objeto especial retornado por createTimeoutPromise)
    if (response && response.__timeout === true) {
      // Retornar objeto de error silencioso en lugar de lanzar excepción
      const timeoutError = new Error('Timeout');
      timeoutError.silent = true;
      throw timeoutError;
    }
    
    return response;
  } catch (error) {
    // ⚡ SILENCIAR completamente errores de timeout - son esperados cuando el servidor no está disponible
    if (error.message && (
      error.message.includes('Timeout') || 
      error.message.includes('timeout') ||
      error.message.includes('TIMEOUT')
    )) {
      // Crear un error silencioso que será capturado por los handlers globales
      const silentError = new Error('Timeout');
      silentError.silent = true; // Marcar como silencioso
      throw silentError;
    }
    // Solo loguear otros errores que no sean de red
    if (error.name !== 'AbortError' && 
        !error.message.includes('Failed to fetch') &&
        !error.message.includes('NetworkError')) {
      console.error(`❌ API Error [${endpoint}]:`, error);
    }
    throw error;
  }
};

// 🧪 Verificar conectividad del servidor
export const checkServerHealth = async () => {
  try {
    // Timeout más corto para health check (2 segundos)
    const response = await apiRequest('/health', { timeout: 2000 });
    return response;
  } catch (error) {
    // Retornar respuesta de error sin lanzar excepción
    return {
      status: 'ERROR',
      database: 'Disconnected',
      message: 'Sin conexión al servidor',
      error: error.message || 'Timeout o servidor no disponible'
    };
  }
};

// 📊 SERVICIOS PARA PROYECTOS
export const proyectosAPI = {
  // Obtener todos los proyectos (para Excel principal)
  getAll: async () => {
    try {
      // Timeout de 3 segundos para obtener proyectos
      const response = await apiRequest('/proyectos', { timeout: 3000 });
      return response;
    } catch (error) {
      // No loguear timeout como error crítico
      if (!error.message || !error.message.includes('Timeout')) {
        console.warn('⚠️ Error obteniendo proyectos de API, usando localStorage...');
      }
      return { success: false, error: error.message || 'Timeout' };
    }
  },
  
  // Obtener proyecto por ID con detalles
  getById: async (id) => {
    try {
      const response = await apiRequest(`/proyectos/${id}`, { timeout: 3000 });
      return response;
    } catch (error) {
      if (!error.message || !error.message.includes('Timeout')) {
        console.warn('⚠️ Error obteniendo proyecto de API, usando localStorage...');
      }
      return { success: false, error: error.message || 'Timeout' };
    }
  },
  
  // Crear nuevo proyecto
  create: async (projectData) => {
    try {
      const response = await apiRequest('/proyectos', {
        method: 'POST',
        body: JSON.stringify(projectData),
        timeout: 5000 // 5 segundos para crear
      });
      return response;
    } catch (error) {
      if (!error.message || !error.message.includes('Timeout')) {
        console.warn('⚠️ Error creando proyecto en API, usando localStorage...');
      }
      return { success: false, error: error.message || 'Timeout' };
    }
  },
  
  // Actualizar proyecto
  update: async (id, projectData) => {
    try {
      const response = await apiRequest(`/proyectos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(projectData),
        timeout: 5000 // 5 segundos para actualizar
      });
      return response;
    } catch (error) {
      if (!error.message || !error.message.includes('Timeout')) {
        console.warn('⚠️ Error actualizando proyecto en API, usando localStorage...');
      }
      return { success: false, error: error.message || 'Timeout' };
    }
  },
  
  // Eliminar proyectos
  delete: async (ids) => {
    try {
      const response = await apiRequest('/proyectos', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
        timeout: 5000 // 5 segundos para eliminar
      });
      return response;
    } catch (error) {
      if (!error.message || !error.message.includes('Timeout')) {
        console.warn('⚠️ Error eliminando proyectos de API, usando localStorage...');
      }
      return { success: false, error: error.message || 'Timeout' };
    }
  },
  
  // Obtener estadísticas
  getStats: async () => {
    try {
      const response = await apiRequest('/proyectos/stats/dashboard', { timeout: 3000 });
      return response;
    } catch (error) {
      if (!error.message || !error.message.includes('Timeout')) {
        console.warn('⚠️ Error obteniendo estadísticas de API...');
      }
      return { success: false, error: error.message || 'Timeout' };
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

// 🔧 Objeto API con métodos HTTP (para syncService y otros)
export const api = {
  get: async (endpoint, options = {}) => {
    return apiRequest(endpoint, { ...options, method: 'GET', timeout: options.timeout || 3000 });
  },
  post: async (endpoint, data, options = {}) => {
    try {
      return await apiRequest(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(data),
        timeout: options.timeout || 5000
      });
    } catch (error) {
      // ⚡ NUNCA lanzar errores de timeout - retornar objeto con error silencioso
      if (error.silent || (error.message && error.message.includes('Timeout'))) {
        return { success: false, error: 'Timeout', data: null };
      }
      throw error;
    }
  },
  put: async (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
      timeout: options.timeout || 5000
    });
  },
  delete: async (endpoint, data, options = {}) => {
    return apiRequest(endpoint, {
      ...options,
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
      timeout: options.timeout || 5000
    });
  }
};

export default {
  checkServerHealth,
  proyectosAPI,
  handleApiError,
  api
};
