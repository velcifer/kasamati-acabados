import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Manejar errores no capturados globalmente
window.addEventListener('error', (event) => {
  // Suprimir errores de timeout y red esperados
  const errorMessage = event.error?.message || event.message || '';
  const errorName = event.error?.name || '';
  
  // ⚡ Capturar TODOS los errores de timeout y red - son esperados cuando el servidor no está disponible
  const isExpectedError = 
    errorMessage.includes('Timeout') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('TIMEOUT') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Network request failed') ||
    errorMessage.includes('de sincronización') ||
    errorMessage.includes('sincronización') ||
    errorMessage.includes('MySQL') ||
    errorMessage.includes('sync') ||
    errorMessage.includes('syncService') ||
    errorMessage.includes('chunk.js') ||
    errorName === 'AbortError' ||
    (errorName === 'TypeError' && errorMessage.includes('fetch')) ||
    (errorName === 'Error' && (errorMessage.includes('Timeout') || errorMessage.includes('timeout'))) ||
    // También verificar si el error tiene la propiedad silent
    (event.error && event.error.silent === true) ||
    // Verificar si el stack trace incluye syncService
    (event.error && event.error.stack && event.error.stack.includes('syncService'));
  
  if (isExpectedError) {
    event.preventDefault(); // Prevenir que se muestre el error
    event.stopPropagation(); // Detener propagación
    return false;
  }
}, true); // Usar capture phase para capturar antes que React

// Manejar promesas rechazadas no capturadas
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || String(event.reason || '');
  const errorName = event.reason?.name || '';
  
  // ⚡ Capturar TODOS los errores de timeout y red - son esperados cuando el servidor no está disponible
  const isExpectedError = 
    errorMessage.includes('Timeout') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('TIMEOUT') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('Network request failed') ||
    errorMessage.includes('de sincronización') ||
    errorMessage.includes('MySQL') ||
    errorMessage.includes('sync') ||
    errorName === 'AbortError' ||
    (errorName === 'TypeError' && errorMessage.includes('fetch')) ||
    (errorName === 'Error' && errorMessage.includes('Timeout')) ||
    // También verificar si el error tiene la propiedad silent
    (event.reason && event.reason.silent === true);
  
  if (isExpectedError) {
    event.preventDefault(); // Prevenir que se muestre el error
    event.stopPropagation(); // Detener propagación
    return false;
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));

// ⚡ Optimización: Deshabilitar StrictMode en desarrollo para evitar renderizados dobles
// (Solo afecta el tiempo de desarrollo, no producción)
const isDevelopment = process.env.NODE_ENV === 'development';

root.render(
  isDevelopment ? (
    <App />
  ) : (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
);

