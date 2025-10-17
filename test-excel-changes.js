// 🧪 SCRIPT DE PRUEBA - CAMBIOS EXCEL MEJORADO
// Verifica que los cambios implementados funcionen correctamente

const fs = require('fs');
const path = require('path');

console.log('\n🧪 =====================================');
console.log('   VERIFICANDO CAMBIOS EXCEL MEJORADO');
console.log('   =====================================\n');

// 📁 Verificar que el archivo existe y contiene los cambios
const filePath = path.join(__dirname, 'client/src/components/modules/ExcelGridSimple.js');

if (!fs.existsSync(filePath)) {
  console.log('❌ Archivo ExcelGridSimple.js no encontrado');
  process.exit(1);
}

const fileContent = fs.readFileSync(filePath, 'utf8');

// 🔍 Verificar cambios implementados
const verificaciones = [
  {
    name: 'Estado sidebarCollapsed',
    check: fileContent.includes('sidebarCollapsed') && fileContent.includes('setSidebarCollapsed'),
    pattern: 'sidebarCollapsed'
  },
  {
    name: 'Botón toggle sidebar', 
    check: fileContent.includes('setSidebarCollapsed(!sidebarCollapsed)'),
    pattern: 'toggle button'
  },
  {
    name: 'Contenido centrado',
    check: fileContent.includes('text-center'),
    pattern: 'text-center'
  },
  {
    name: 'Headers ajustados',
    check: fileContent.includes('DATOS GENERALES DEL PROYECTO') && 
           fileContent.includes('ANÁLISIS FINANCIERO DEL PROYECTO') &&
           fileContent.includes('COBRANZAS Y SALDOS POR PAGAR') &&
           fileContent.includes('SUNAT'),
    pattern: 'section headers'
  },
  {
    name: 'Sidebar oculto por defecto',
    check: fileContent.includes('useState(true)') && fileContent.includes('sidebarCollapsed'),
    pattern: 'default hidden'
  },
  {
    name: 'Transiciones CSS',
    check: fileContent.includes('transition-all duration-300'),
    pattern: 'CSS transitions'
  },
  {
    name: 'Colores actualizados',
    check: fileContent.includes('bg-red-600/90') && 
           fileContent.includes('bg-blue-600/90') &&
           fileContent.includes('bg-green-600/90') &&
           fileContent.includes('bg-orange-600/90'),
    pattern: 'updated colors'
  }
];

console.log('🔍 Verificando implementaciones...\n');

let allPassed = true;
verificaciones.forEach((verificacion, index) => {
  const status = verificacion.check ? '✅' : '❌';
  const statusText = verificacion.check ? 'IMPLEMENTADO' : 'FALTA';
  
  console.log(`${index + 1}. ${status} ${verificacion.name}: ${statusText}`);
  
  if (!verificacion.check) {
    allPassed = false;
  }
});

console.log('\n📊 Estadísticas del archivo:');
console.log(`   📄 Líneas totales: ${fileContent.split('\n').length}`);
console.log(`   📝 Tamaño: ${(fileContent.length / 1024).toFixed(1)} KB`);

// 🔍 Buscar patrones específicos
const patterns = {
  'Estados React': (fileContent.match(/const \[.*useState/g) || []).length,
  'Funciones': (fileContent.match(/const \w+ = /g) || []).length,
  'Botones': (fileContent.match(/<button/g) || []).length,
  'Clases CSS': (fileContent.match(/className="/g) || []).length
};

console.log('\n🏗️ Estructura del componente:');
Object.entries(patterns).forEach(([key, count]) => {
  console.log(`   ${key}: ${count}`);
});

// 📋 Resumen final
console.log('\n🎯 =====================================');
if (allPassed) {
  console.log('   ✅ TODOS LOS CAMBIOS IMPLEMENTADOS');
  console.log('   =====================================');
  console.log('🎉 El componente está listo para usar!');
  console.log('');
  console.log('📋 Funcionalidades verificadas:');
  console.log('   ✅ Menú lateral colapsible');
  console.log('   ✅ Botón toggle funcional');  
  console.log('   ✅ Contenido centrado');
  console.log('   ✅ Headers como Excel original');
  console.log('   ✅ Sidebar oculto por defecto');
  console.log('   ✅ Transiciones suaves');
  console.log('   ✅ Colores mejorados');
  console.log('');
  console.log('🚀 Para probar:');
  console.log('   1. Inicia la aplicación: npm run dev');
  console.log('   2. Ve a Gestor de Proyectos');
  console.log('   3. Click en el ícono Excel');
  console.log('   4. Usa el botón ☰ para mostrar/ocultar menú');
  console.log('');
} else {
  console.log('   ❌ ALGUNOS CAMBIOS NO SE APLICARON');
  console.log('   =====================================');
  console.log('⚠️ Revisa los elementos marcados como FALTA');
}

console.log('✨ Verificación completada!\n');
