// 🔄 SERVICIO DE SINCRONIZACIÓN OFFLINE/ONLINE - KSAMATI
// Funciona como Google Sheets: sincronización automática bidireccional

import { api } from './api';
import projectDataService from './projectDataService';
import { dataService } from './dataService';

// 🆔 Generar ID único para dispositivo
const generateDeviceId = () => {
  const stored = localStorage.getItem('ksamati_device_id');
  if (stored) return stored;

  const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('ksamati_device_id', deviceId);
  return deviceId;
};

// 📊 Estado de sincronización
let syncState = {
  isOnline: navigator.onLine,
  deviceId: generateDeviceId(),
  lastSync: null,
  pendingOperations: 0,
  isSyncing: false,
  conflicts: [],
  listeners: []
};

// 🔧 Utilidades de conectividad
const updateOnlineStatus = () => {
  const wasOnline = syncState.isOnline;
  syncState.isOnline = navigator.onLine;

  if (wasOnline !== syncState.isOnline) {
    console.log(`📡 Estado de conexión cambió: ${syncState.isOnline ? 'ONLINE' : 'OFFLINE'}`);
    notifyListeners('connection', { isOnline: syncState.isOnline });

    if (syncState.isOnline) {
      // 🔄 Intentar sincronizar cuando vuelva la conexión (silenciosamente, sin errores)
      // Esperar 2 segundos para asegurar que la conexión sea estable
      setTimeout(() => {
        syncService.sync().catch(() => {
          // Silenciar errores de sincronización (timeouts, etc.)
          // La app funciona perfectamente con localStorage
        });
        
        // 🔄 Intentar sincronizar nuevamente después de 5 segundos si hay operaciones pendientes
        setTimeout(() => {
          if (syncState.pendingOperations > 0) {
            syncService.sync().catch(() => {
              // Silenciar errores
            });
          }
        }, 5000);
      }, 2000);
    }
  }
};

// 📋 COLA DE OPERACIONES OFFLINE
class OfflineQueue {
  constructor() {
    this.queue = this.loadQueue();
    this.saveQueue();
  }

  // Cargar cola desde localStorage
  loadQueue() {
    try {
      const stored = localStorage.getItem('ksamati_offline_queue');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error cargando cola offline:', error);
      return [];
    }
  }

  // Guardar cola en localStorage
  saveQueue() {
    try {
      localStorage.setItem('ksamati_offline_queue', JSON.stringify(this.queue));
      syncState.pendingOperations = this.queue.length;
      notifyListeners('queue', { pendingOperations: this.queue.length });
    } catch (error) {
      console.error('❌ Error guardando cola offline:', error);
    }
  }

  // Agregar operación a la cola
  add(operation) {
    const queueItem = {
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation: operation.type,
      entityType: operation.entityType,
      entityId: operation.entityId,
      data: operation.data,
      timestamp: new Date().toISOString(),
      deviceId: syncState.deviceId,
      retryCount: 0,
      priority: operation.priority || 1
    };

    this.queue.push(queueItem);
    this.saveQueue();

    console.log(`📋 Operación agregada a cola offline: ${operation.type} ${operation.entityType}`, queueItem);
  }

  // Obtener operaciones pendientes
  getPending() {
    return this.queue.filter(op => op.retryCount < 3).sort((a, b) => {
      // Ordenar por prioridad (descendente) y luego por timestamp (ascendente)
      if (a.priority !== b.priority) return b.priority - a.priority;
      return new Date(a.timestamp) - new Date(b.timestamp);
    });
  }

  // Marcar operación como completada
  markCompleted(operationId) {
    this.queue = this.queue.filter(op => op.id !== operationId);
    this.saveQueue();
  }

  // Incrementar contador de reintentos
  incrementRetry(operationId, error) {
    const operation = this.queue.find(op => op.id === operationId);
    if (operation) {
      operation.retryCount++;
      operation.lastError = error;
      operation.lastRetry = new Date().toISOString();
      this.saveQueue();

      // Si excede máximo de reintentos, marcar como conflicto
      if (operation.retryCount >= 3) {
        console.warn(`⚠️ Operación ${operationId} excedió máximo de reintentos, convirtiendo en conflicto`);
        this.convertToConflict(operation);
      }
    }
  }

  // Convertir operación fallida en conflicto
  convertToConflict(operation) {
    const conflict = {
      id: `conflict_${Date.now()}`,
      entityType: operation.entityType,
      entityId: operation.entityId,
      localData: operation.data,
      remoteData: null,
      operation: operation.operation,
      timestamp: new Date().toISOString(),
      deviceId: syncState.deviceId
    };

    syncState.conflicts.push(conflict);
    saveConflicts();
    notifyListeners('conflict', conflict);

    // Remover de la cola
    this.markCompleted(operation.id);
  }

  // Limpiar operaciones antiguas (más de 30 días)
  cleanup() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const originalLength = this.queue.length;
    this.queue = this.queue.filter(op => new Date(op.timestamp) > thirtyDaysAgo);

    if (this.queue.length !== originalLength) {
      this.saveQueue();
      console.log(`🧹 Cola limpiada: ${originalLength - this.queue.length} operaciones antiguas eliminadas`);
    }
  }
}

// ⚖️ MANEJO DE CONFLICTOS
const loadConflicts = () => {
  try {
    const stored = localStorage.getItem('ksamati_conflicts');
    syncState.conflicts = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Error cargando conflictos:', error);
    syncState.conflicts = [];
  }
};

const saveConflicts = () => {
  try {
    localStorage.setItem('ksamati_conflicts', JSON.stringify(syncState.conflicts));
  } catch (error) {
    console.error('❌ Error guardando conflictos:', error);
  }
};

// 🔄 SISTEMA DE VERSIONES Y HASHES
class VersionManager {
  constructor() {
    this.versions = this.loadVersions();
  }

  loadVersions() {
    try {
      const stored = localStorage.getItem('ksamati_versions');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('❌ Error cargando versiones:', error);
      return {};
    }
  }

  saveVersions() {
    try {
      localStorage.setItem('ksamati_versions', JSON.stringify(this.versions));
    } catch (error) {
      console.error('❌ Error guardando versiones:', error);
    }
  }

  // Calcular hash MD5 de datos
  calculateHash(data) {
    // Implementación simple de hash para comparación
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32 bits
    }
    return hash.toString();
  }

  // Obtener versión actual de una entidad
  getVersion(entityType, entityId) {
    const key = `${entityType}_${entityId}`;
    return this.versions[key] || { version: 0, hash: null, lastModified: null };
  }

  // Actualizar versión de una entidad
  updateVersion(entityType, entityId, data) {
    const key = `${entityType}_${entityId}`;
    const hash = this.calculateHash(data);

    this.versions[key] = {
      version: (this.versions[key]?.version || 0) + 1,
      hash: hash,
      lastModified: new Date().toISOString(),
      data: data // Mantener copia de los datos
    };

    this.saveVersions();
    return this.versions[key];
  }

  // Verificar si datos han cambiado
  hasChanged(entityType, entityId, newData) {
    const current = this.getVersion(entityType, entityId);
    const newHash = this.calculateHash(newData);
    return current.hash !== newHash;
  }
}

// 🎯 SERVICIO PRINCIPAL DE SINCRONIZACIÓN
const syncService = {
  // Inicializar servicio
  init() {
    // Cargar estado guardado
    const savedState = localStorage.getItem('ksamati_sync_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        syncState.lastSync = parsed.lastSync;
        syncState.deviceId = parsed.deviceId || generateDeviceId();
      } catch (error) {
        console.warn('⚠️ Error cargando estado de sincronización:', error);
      }
    }

    // Inicializar componentes
    this.queue = new OfflineQueue();
    this.versionManager = new VersionManager();
    loadConflicts();

    // Configurar listeners de conectividad
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Verificar estado inicial
    updateOnlineStatus();

    // Limpiar datos antiguos periódicamente
    setInterval(() => {
      this.queue.cleanup();
    }, 24 * 60 * 60 * 1000); // Cada 24 horas

    console.log(`🔄 Servicio de sincronización inicializado. Device ID: ${syncState.deviceId}`);
  },

  // Obtener estado actual
  getState() {
    return {
      ...syncState,
      conflicts: syncState.conflicts,
      pendingOperations: syncState.pendingOperations
    };
  },

  // Agregar listener para cambios de estado
  addListener(callback) {
    syncState.listeners.push(callback);
    return () => {
      syncState.listeners = syncState.listeners.filter(listener => listener !== callback);
    };
  },

  // 🔄 SINCRONIZACIÓN PRINCIPAL
  async sync() {
    if (syncState.isSyncing) {
      console.log('🔄 Sincronización ya en progreso, omitiendo...');
      return;
    }

    if (!syncState.isOnline) {
      console.log('📴 Sin conexión, sincronización omitida');
      return;
    }

    syncState.isSyncing = true;
    notifyListeners('sync', { status: 'started' });

    try {
      console.log('🔄 Iniciando sincronización completa...');

      // 1. Preparar cambios locales
      const localChanges = this.prepareLocalChanges();

      // 2. Obtener operaciones offline pendientes
      const offlineOperations = this.queue.getPending();

      // 3. Sincronizar con servidor (nunca lanza errores, siempre retorna objeto)
      const syncResult = await this.performSync(localChanges, offlineOperations);

      // 4. Procesar cambios remotos solo si la sincronización fue exitosa
      if (syncResult.success && syncResult.remoteChanges) {
        await this.processRemoteChanges(syncResult.remoteChanges);
      }

      // 5. Actualizar estado solo si la sincronización fue exitosa
      if (syncResult.success) {
        syncState.lastSync = new Date().toISOString();
        this.saveState();

        notifyListeners('sync', {
          status: 'completed',
          uploaded: localChanges.length + offlineOperations.length,
          downloaded: syncResult.remoteChanges?.length || 0,
          conflicts: syncResult.conflicts?.length || 0
        });

        console.log(`✅ Sincronización completada: ${localChanges.length + offlineOperations.length} subidos, ${syncResult.remoteChanges?.length || 0} bajados`);
      } else {
        // Si falló silenciosamente (timeout, etc.), no notificar al usuario
        // Solo actualizar estado interno sin notificar errores de timeout
        const isSilentError = syncResult.error && (
          syncResult.error.includes('Timeout') || 
          syncResult.error.includes('NetworkError')
        );
        if (!isSilentError && syncResult.error) {
          notifyListeners('sync', { status: 'error', error: syncResult.error });
        }
      }

    } catch (error) {
      // ⚡ SILENCIAR errores de timeout - son esperados cuando el servidor no está disponible
      const isTimeout = error.message && (
        error.message.includes('Timeout') || 
        error.message.includes('timeout') ||
        error.message.includes('TIMEOUT')
      );
      
      if (!isTimeout) {
        // Solo loguear errores que NO sean de timeout
        console.error('❌ Error en sincronización:', error.message);
      }
      
      // ⚠️ Si es error de tabla faltante o timeout, no reintentar (evitar bucles)
      if (error.message && (
        error.message.includes('doesn\'t exist') || 
        isTimeout ||
        error.message.includes('Table')
      )) {
        // No notificar errores de timeout al usuario
        if (!isTimeout) {
          notifyListeners('sync', { status: 'error', error: 'Error de sincronización (omitido)' });
        }
      } else if (!isTimeout) {
        notifyListeners('sync', { status: 'error', error: error.message });
      }
    } finally {
      syncState.isSyncing = false;
      // Asegurar que siempre se desbloquee después de 6 segundos máximo
      setTimeout(() => {
        syncState.isSyncing = false;
      }, 6000);
    }
  },

  // Preparar cambios locales para sincronización
  prepareLocalChanges() {
    const changes = [];

    // Obtener proyectos modificados desde projectDataService
    const projects = projectDataService.getAllProjects();
    Object.keys(projects).forEach(projectId => {
      const project = projects[projectId];

      // Verificar si ha cambiado
      if (this.versionManager.hasChanged('proyecto', projectId, project)) {
        changes.push({
          operation: 'update',
          entityType: 'proyecto',
          entityId: parseInt(projectId),
          data: project,
          timestamp: new Date().toISOString()
        });

        // Actualizar versión local
        this.versionManager.updateVersion('proyecto', projectId, project);
      }
    });

    return changes;
  },

  // Ejecutar sincronización con servidor (con timeout y protección contra bucles)
  async performSync(localChanges, offlineOperations) {
    try {
      // ⚠️ PROTECCIÓN: Si no hay cambios, no hacer nada
      if ((!localChanges || localChanges.length === 0) && (!offlineOperations || offlineOperations.length === 0)) {
        return { success: true, data: { remoteChanges: [], conflicts: [] } };
      }

      // ⚡ Timeout de 10 segundos - dar más tiempo para que el servidor responda
      const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve({ timeout: true, success: false, error: 'Timeout' }), 10000)
      );

      const syncPromise = api.post(`/sync/sync/${syncState.deviceId}`, {
        localChanges: [...localChanges, ...offlineOperations.map(op => ({
          operation: op.operation,
          entityType: op.entityType,
          entityId: op.entityId,
          data: op.data
        }))],
        lastSyncTimestamp: syncState.lastSync,
        userId: 'user_' + syncState.deviceId,
        deviceId: syncState.deviceId
      }).catch(error => {
        // ⚡ Capturar cualquier error y retornar objeto en lugar de lanzar
        return { success: false, error: error.message || 'Error', timeout: error.message?.includes('Timeout') };
      });

      const response = await Promise.race([syncPromise, timeoutPromise]);

      // ⚡ Manejar respuesta - verificar si es timeout primero
      if (response && (response.timeout === true || response.success === false)) {
        // Si es timeout o error, retornar silenciosamente
        return { success: false, error: response.error || 'Timeout', data: { remoteChanges: [], conflicts: [] } };
      }

      // Si la respuesta tiene data.success, es una respuesta exitosa
      if (response && response.data && response.data.success) {
        // Marcar operaciones offline como completadas
        offlineOperations.forEach(op => {
          this.queue.markCompleted(op.id);
        });

        return response.data.data;
      }

      // Si llegamos aquí, retornar silenciosamente (no lanzar error)
      return { success: false, error: (response?.data?.error || response?.error || 'Error en sincronización'), data: { remoteChanges: [], conflicts: [] } };
    } catch (error) {
      // ⚡ SILENCIAR TODOS los errores - nunca lanzar errores que puedan aparecer en la UI
      const errorMessage = error?.message || String(error || '');
      const isTimeout = errorMessage.includes('Timeout') || 
                       errorMessage.includes('timeout') ||
                       errorMessage.includes('TIMEOUT');
      const isNetworkError = !navigator.onLine || 
                            error.code === 'NETWORK_ERROR' ||
                            errorMessage.includes('Failed to fetch') ||
                            errorMessage.includes('NetworkError');

      // Si es timeout o error de red, retornar silenciosamente
      if (isTimeout || isNetworkError) {
        // Agregar operaciones a cola offline si hay errores de red
        if (isNetworkError && offlineOperations.length > 0) {
          offlineOperations.forEach(op => {
            this.queue.incrementRetry(op.id, errorMessage);
          });
        }
        return { success: false, error: isTimeout ? 'Timeout' : 'NetworkError', data: { remoteChanges: [], conflicts: [] } };
      }

      // Para otros errores, también retornar silenciosamente (no lanzar)
      // Solo loguear si no es un error esperado
      if (!isTimeout && !isNetworkError) {
        console.error('❌ Error en sync con servidor:', errorMessage);
      }

      // NUNCA lanzar errores - siempre retornar objeto con success: false
      return { success: false, error: errorMessage, data: { remoteChanges: [], conflicts: [] } };
    }
  },

  // Procesar cambios remotos
  async processRemoteChanges(remoteChanges) {
    for (const change of remoteChanges) {
      try {
        // Verificar si hay conflicto
        const localVersion = this.versionManager.getVersion(change.entityType, change.entityId);

        if (localVersion.version > change.version) {
          // Conflicto: versión local es más nueva
          console.warn(`⚠️ Conflicto detectado en ${change.entityType} ${change.entityId}`);
          this.createConflict(change);
          continue;
        }

        // Aplicar cambio remoto
        await this.applyRemoteChange(change);

        // Actualizar versión local
        this.versionManager.updateVersion(change.entityType, change.entityId, change.data);

      } catch (error) {
        console.error(`❌ Error procesando cambio remoto ${change.entityType} ${change.entityId}:`, error);
      }
    }
  },

  // Aplicar cambio remoto
  async applyRemoteChange(change) {
    switch (change.entityType) {
      case 'proyecto':
        // Actualizar proyecto en projectDataService
        projectDataService.updateProject(change.entityId, change.data);
        break;

      case 'venta':
        // Para ventas (si se implementa después)
        console.log('📊 Cambio remoto en venta:', change);
        break;

      default:
        console.log('📋 Cambio remoto en entidad no manejada:', change.entityType);
    }
  },

  // Crear conflicto
  createConflict(remoteChange) {
    const localData = this.versionManager.getVersion(remoteChange.entityType, remoteChange.entityId).data;

    const conflict = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityType: remoteChange.entityType,
      entityId: remoteChange.entityId,
      localData: localData,
      remoteData: remoteChange.data,
      localVersion: this.versionManager.getVersion(remoteChange.entityType, remoteChange.entityId).version,
      remoteVersion: remoteChange.version,
      timestamp: new Date().toISOString(),
      deviceId: syncState.deviceId
    };

    syncState.conflicts.push(conflict);
    saveConflicts();
    notifyListeners('conflict', conflict);
  },

  // Resolver conflicto
  async resolveConflict(conflictId, resolution, mergedData = null) {
    const conflictIndex = syncState.conflicts.findIndex(c => c.id === conflictId);
    if (conflictIndex === -1) return false;

    const conflict = syncState.conflicts[conflictIndex];

    try {
      let resolvedData;
      switch (resolution) {
        case 'local':
          resolvedData = conflict.localData;
          break;
        case 'remote':
          resolvedData = conflict.remoteData;
          break;
        case 'merge':
          resolvedData = mergedData;
          break;
        default:
          throw new Error('Resolución no válida');
      }

      // Aplicar resolución
      await this.applyRemoteChange({
        entityType: conflict.entityType,
        entityId: conflict.entityId,
        data: resolvedData
      });

      // Actualizar versión
      this.versionManager.updateVersion(conflict.entityType, conflict.entityId, resolvedData);

      // Enviar resolución al servidor
      await api.post(`/sync/resolve-conflict/${conflictId}`, {
        resolution,
        selectedData: resolvedData,
        userId: 'user_' + syncState.deviceId,
        deviceId: syncState.deviceId
      });

      // Remover conflicto
      syncState.conflicts.splice(conflictIndex, 1);
      saveConflicts();

      notifyListeners('conflict-resolved', { conflictId, resolution });
      return true;

    } catch (error) {
      console.error('❌ Error resolviendo conflicto:', error);
      return false;
    }
  },

  // Agregar operación offline
  addOfflineOperation(operation) {
    this.queue.add(operation);
    notifyListeners('operation-added', operation);
  },

  // Forzar sincronización
  forceSync() {
    return this.sync();
  },

  // Guardar estado
  saveState() {
    try {
      localStorage.setItem('ksamati_sync_state', JSON.stringify({
        deviceId: syncState.deviceId,
        lastSync: syncState.lastSync
      }));
    } catch (error) {
      console.error('❌ Error guardando estado de sincronización:', error);
    }
  }
};

// 🔧 Función helper para notificar listeners
function notifyListeners(event, data) {
  syncState.listeners.forEach(listener => {
    try {
      listener(event, data);
    } catch (error) {
      console.error('❌ Error en listener de sincronización:', error);
    }
  });
}

// 🚀 Inicializar de forma diferida (no bloquea el inicio)
if (typeof window !== 'undefined') {
  // Usar requestIdleCallback o setTimeout para diferir la inicialización
  // Esto permite que la UI se renderice primero
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => {
      syncService.init();
    }, { timeout: 2000 });
  } else {
    // Fallback para navegadores sin requestIdleCallback
    setTimeout(() => {
      syncService.init();
    }, 100);
  }
}

export default syncService;
