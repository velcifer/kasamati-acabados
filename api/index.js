// 🚀 VERCEL SERVERLESS FUNCTION - KSAMATI API
// Este archivo es el punto de entrada para las funciones serverless de Vercel

const app = require('../server/index');

// Vercel puede usar Express directamente
// El app de Express funciona como handler automáticamente
module.exports = app;
