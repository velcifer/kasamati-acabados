import React from 'react';

const PublicLanding = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">KSAMATI - Vista pública</h1>
      <p className="mb-4">Esta es una página pública de demostración. No requiere inicio de sesión.</p>
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold">Qué puedes ver</h2>
        <ul className="list-disc pl-5">
          <li>Resumen informativo del sistema.</li>
          <li>Vista de ejemplo de proyectos (datos de muestra).</li>
          <li>Contenido estático que puedes compartir públicamente.</li>
        </ul>
      </div>
    </div>
  );
};

export default PublicLanding;
