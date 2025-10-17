// 🧪 SCRIPT DE VERIFICACIÓN - SIDEBAR COLAPSIBLE GESTOR VENTAS
// Verifica que los cambios del menú lateral colapsible funcionen correctamente

const fs = require('fs');
const path = require('path');

console.log('\n🧪 =====================================');
console.log('   VERIFICANDO SIDEBAR GESTOR VENTAS');
console.log('   =====================================\n');

// 📁 Verificar que el archivo existe y contiene los cambios
const filePath = path.join(__dirname, 'client/src/components/modules/GestorVentas.js');

if (!fs.existsSync(filePath)) {
  console.log('❌ Archivo GestorVentas.js no encontrado');
  process.exit(1);
}

const fileContent = fs.readFileSync(filePath, 'utf8');

// 🔍 Verificaciones específicas para GestorVentas
const verificaciones = [
  {
    name: 'Estado sidebarCollapsed agregado',
    check: fileContent.includes('sidebarCollapsed') && fileContent.includes('setSidebarCollapsed'),
    pattern: 'sidebarCollapsed state'
  },
  {
    name: 'Estado por defecto oculto (true)',
    check: fileContent.includes('useState(true)') && fileContent.includes('sidebarCollapsed'),
    pattern: 'default hidden state'
  },
  {
    name: 'Botón toggle implementado',
    check: fileContent.includes('setSidebarCollapsed(!sidebarCollapsed)'),
    pattern: 'toggle button functionality'
  },
  {
    name: 'Sidebar con transiciones CSS',
    check: fileContent.includes('transition-all duration-300') && fileContent.includes('w-0') && fileContent.includes('w-64'),
    pattern: 'collapsible sidebar with transitions'
  },
  {
    name: 'Ícono hamburger/close',
    check: fileContent.includes('☰') && fileContent.includes('✕'),
    pattern: 'hamburger and close icons'
  },
  {
    name: 'Tooltips informativos',
    check: fileContent.includes('Mostrar menú lateral') && fileContent.includes('Ocultar menú lateral'),
    pattern: 'informative tooltips'
  },
  {
    name: 'Estadísticas en sidebar',
    check: fileContent.includes('Total:') && fileContent.includes('ventas') && fileContent.includes('Filtradas:'),
    pattern: 'statistics in sidebar'
  },
  {
    name: 'Botón solo visible en desktop',
    check: fileContent.includes('hidden lg:flex'),
    pattern: 'desktop-only toggle button'
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

// 📊 Comparar con GestorProyectos para consistencia
const gestorProyectosPath = path.join(__dirname, 'client/src/components/modules/ExcelGridSimple.js');
let consistencyCheck = false;

if (fs.existsSync(gestorProyectosPath)) {
  const proyectosContent = fs.readFileSync(gestorProyectosPath, 'utf8');
  
  const ambosConSidebar = fileContent.includes('sidebarCollapsed') && proyectosContent.includes('sidebarCollapsed');
  const mismaTransicion = fileContent.includes('transition-all duration-300') && proyectosContent.includes('transition-all duration-300');
  const mismosIconos = fileContent.includes('☰') && proyectosContent.includes('☰');
  
  consistencyCheck = ambosConSidebar && mismaTransicion && mismosIconos;
  
  console.log('\n🔄 Verificando consistencia con GestorProyectos:');
  console.log(`   ${ambosConSidebar ? '✅' : '❌'} Ambos tienen sidebar colapsible`);
  console.log(`   ${mismaTransicion ? '✅' : '❌'} Mismas transiciones CSS`);
  console.log(`   ${mismosIconos ? '✅' : '❌'} Mismos íconos de toggle`);
}

console.log('\n📊 Estadísticas del archivo:');
console.log(`   📄 Líneas totales: ${fileContent.split('\n').length}`);
console.log(`   📝 Tamaño: ${(fileContent.length / 1024).toFixed(1)} KB`);

// 🔍 Contar elementos específicos
const patterns = {
  'Estados React': (fileContent.match(/const \[.*useState/g) || []).length,
  'Botones': (fileContent.match(/<button/g) || []).length,
  'Divs con className': (fileContent.match(/<div className=/g) || []).length,
  'Transiciones': (fileContent.match(/transition-all/g) || []).length
};

console.log('\n🏗️ Estructura del componente:');
Object.entries(patterns).forEach(([key, count]) => {
  console.log(`   ${key}: ${count}`);
});

// 📋 Resumen final
console.log('\n🎯 =====================================');
if (allPassed) {
  console.log('   ✅ SIDEBAR COLAPSIBLE IMPLEMENTADO');
  console.log('   =====================================');
  console.log('🎉 El Gestor de Ventas está listo!');
  console.log('');
  console.log('📋 Funcionalidades verificadas:');
  console.log('   ✅ Menú lateral colapsible');
  console.log('   ✅ Botón toggle funcional');  
  console.log('   ✅ Estado oculto por defecto');
  console.log('   ✅ Transiciones suaves');
  console.log('   ✅ Íconos hamburger/close');
  console.log('   ✅ Tooltips informativos');
  console.log('   ✅ Estadísticas en sidebar');
  console.log('   ✅ Solo visible en desktop');
  
  if (consistencyCheck) {
    console.log('   ✅ Consistente con GestorProyectos');
  }
  
  console.log('');
  console.log('🚀 Para probar:');
  console.log('   1. Inicia la aplicación: npm run dev');
  console.log('   2. Ve a Gestor de Ventas');
  console.log('   3. Usa el botón ☰ para mostrar/ocultar menú');
  console.log('');
} else {
  console.log('   ❌ ALGUNOS CAMBIOS NO SE APLICARON');
  console.log('   =====================================');
  console.log('⚠️ Revisa los elementos marcados como FALTA');
}

console.log('✨ Verificación completada!\n');
