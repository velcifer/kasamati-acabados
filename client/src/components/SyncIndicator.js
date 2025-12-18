// 🔄 COMPONENTE INDICADOR DE SINCRONIZACIÓN - KSAMATI
// Muestra estado de conexión, operaciones pendientes y conflictos

import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import './SyncIndicator.css';

const SyncIndicator = () => {
  const [syncState, setSyncState] = useState(dataService.getConnectionStatus());
  const [showDetails, setShowDetails] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);

  useEffect(() => {
    // Suscribirse a cambios de sincronización
    const unsubscribe = dataService.addSyncListener((event, data) => {
      setSyncState(dataService.getConnectionStatus());

      // Mostrar notificaciones para eventos importantes
      switch (event) {
        case 'sync':
          if (data.status === 'completed') {
            showNotification(`✅ Sincronización completada: ${data.uploaded}↑ ${data.downloaded}↓`, 'success');
          } else if (data.status === 'error') {
            showNotification(`❌ Error de sincronización: ${data.error}`, 'error');
          }
          break;
        case 'conflict':
          showNotification('⚠️ Conflicto de sincronización detectado', 'warning');
          break;
        case 'connection':
          showNotification(data.isOnline ? '📡 Conexión restaurada' : '📴 Conexión perdida', data.isOnline ? 'success' : 'warning');
          break;
      }
    });

    // Actualizar estado periódicamente
    const interval = setInterval(() => {
      setSyncState(dataService.getConnectionStatus());
    }, 5000); // Cada 5 segundos

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const showNotification = (message, type) => {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.className = `sync-notification sync-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);
  };

  const handleSyncNow = async () => {
    // ⚠️ DESHABILITADO: El botón de sincronización manual causa bucles infinitos
    // La sincronización ahora es automática en segundo plano cuando editas/creas/eliminas
    showNotification('ℹ️ La sincronización es automática. No es necesario sincronizar manualmente.', 'info');
    
    // Código anterior comentado para evitar bucles:
    // try {
    //   await dataService.forceSync();
    // } catch (error) {
    //   showNotification('❌ Error forzando sincronización', 'error');
    // }
  };

  const resolveConflict = async (conflictId, resolution) => {
    try {
      const success = await dataService.resolveConflict(conflictId, resolution);
      if (success) {
        showNotification('✅ Conflicto resuelto', 'success');
        setShowConflicts(false);
      } else {
        showNotification('❌ Error resolviendo conflicto', 'error');
      }
    } catch (error) {
      showNotification('❌ Error resolviendo conflicto', 'error');
    }
  };

  const getStatusIcon = () => {
    if (syncState.isSyncing) return '🔄';
    if (!syncState.isOnline) return '📴';
    if (syncState.conflicts > 0) return '⚠️';
    if (syncState.pendingOperations > 0) return '⏳';
    return '✅';
  };

  const getStatusText = () => {
    if (syncState.isSyncing) return 'Sincronizando...';
    if (!syncState.isOnline) return 'Sin conexión';
    if (syncState.conflicts > 0) return `${syncState.conflicts} conflicto(s)`;
    if (syncState.pendingOperations > 0) return `${syncState.pendingOperations} pendiente(s)`;
    return 'Sincronizado';
  };

  const getStatusClass = () => {
    if (syncState.isSyncing) return 'syncing';
    if (!syncState.isOnline) return 'offline';
    if (syncState.conflicts > 0) return 'conflict';
    if (syncState.pendingOperations > 0) return 'pending';
    return 'synced';
  };

  return (
    <>
      <div className={`sync-indicator ${getStatusClass()}`} onClick={() => setShowDetails(!showDetails)}>
        <span className="sync-icon">{getStatusIcon()}</span>
        <span className="sync-text">{getStatusText()}</span>
        <span className="sync-toggle">{showDetails ? '▲' : '▼'}</span>
      </div>

      {showDetails && (
        <div className="sync-details">
          <div className="sync-info">
            <div className="sync-row">
              <strong>Estado de conexión:</strong>
              <span className={syncState.isOnline ? 'online' : 'offline'}>
                {syncState.isOnline ? '🟢 Online' : '🔴 Offline'}
              </span>
            </div>

            <div className="sync-row">
              <strong>Servidor MySQL:</strong>
              <span className={syncState.isServerOnline ? 'online' : 'offline'}>
                {syncState.isServerOnline ? '🟢 Conectado' : '🔴 Desconectado'}
              </span>
            </div>

            <div className="sync-row">
              <strong>Última sincronización:</strong>
              <span>
                {syncState.lastSync
                  ? new Date(syncState.lastSync).toLocaleString()
                  : 'Nunca'
                }
              </span>
            </div>

            <div className="sync-row">
              <strong>Operaciones pendientes:</strong>
              <span className={syncState.pendingOperations > 0 ? 'warning' : ''}>
                {syncState.pendingOperations}
              </span>
            </div>

            <div className="sync-row">
              <strong>Conflictos:</strong>
              <span
                className={syncState.conflicts > 0 ? 'error clickable' : ''}
                onClick={() => syncState.conflicts > 0 && setShowConflicts(!showConflicts)}
              >
                {syncState.conflicts}
                {syncState.conflicts > 0 && ' (click para resolver)'}
              </span>
            </div>

            <div className="sync-row">
              <strong>Device ID:</strong>
              <span className="device-id">{syncState.deviceId}</span>
            </div>

            <div className="sync-actions">
              <button
                onClick={handleSyncNow}
                disabled={syncState.isSyncing || !syncState.isOnline}
                className="sync-button"
              >
                {syncState.isSyncing ? '🔄 Sincronizando...' : '🔄 Sincronizar ahora'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConflicts && syncState.conflicts > 0 && (
        <div className="sync-conflicts-modal">
          <div className="sync-conflicts-content">
            <h3>⚠️ Conflictos de Sincronización</h3>
            <p>Se encontraron diferencias entre los datos locales y del servidor. Selecciona cómo resolver cada conflicto:</p>

            {syncState.conflicts.map((conflict, index) => (
              <div key={conflict.id} className="conflict-item">
                <h4>Conflicto #{index + 1}</h4>
                <p><strong>Entidad:</strong> {conflict.entityType} #{conflict.entityId}</p>
                <p><strong>Versión local:</strong> {conflict.localVersion}</p>
                <p><strong>Versión remota:</strong> {conflict.remoteVersion}</p>

                <div className="conflict-actions">
                  <button onClick={() => resolveConflict(conflict.id, 'local')}>
                    📱 Usar versión LOCAL
                  </button>
                  <button onClick={() => resolveConflict(conflict.id, 'remote')}>
                    ☁️ Usar versión REMOTA
                  </button>
                  <button onClick={() => resolveConflict(conflict.id, 'merge')}>
                    🔀 Fusionar datos
                  </button>
                </div>
              </div>
            ))}

            <div className="conflict-actions">
              <button onClick={() => setShowConflicts(false)} className="cancel-button">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SyncIndicator;
