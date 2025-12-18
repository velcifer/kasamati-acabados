import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Actualizar el estado para que la siguiente renderización muestre la UI de respaldo
    // Solo capturar errores que no sean timeouts o errores de red esperados
    const errorMessage = error?.message || String(error || '');
    const errorName = error?.name || '';
    
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
      (error && error.silent === true);
    
    if (isExpectedError) {
      // No mostrar error para errores esperados (timeouts, red, etc.)
      return { hasError: false, error: null };
    }
    
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Solo loguear errores que no sean esperados
    const errorMessage = error?.message || String(error || '');
    const errorName = error?.name || '';
    
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
      (error && error.silent === true);
    
    if (!isExpectedError) {
      console.error('Error capturado por ErrorBoundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Solo mostrar UI de error para errores críticos reales
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold mb-4">Algo salió mal</h1>
            <p className="text-gray-400 mb-4">
              Ha ocurrido un error inesperado. Por favor, recarga la página.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

