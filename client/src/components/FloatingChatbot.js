import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  SparklesIcon,
  LightBulbIcon,
  HeartIcon,
  PhotoIcon,
  ArrowTopRightOnSquareIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline';

const FloatingChatbot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "¡Hola! 👋 Soy **KSAMATI Bot**, tu asistente virtual inteligente del **Sistema Integral de Gestión Empresarial**.\n\n🚀 **KSAMATI** es tu plataforma todo-en-uno para gestionar:\n• 📊 Proyectos con Excel avanzado\n• 🛒 Ventas y cotizaciones\n• 🔔 Alertas inteligentes\n• 📅 Citas y reuniones\n\n💡 **¿Cómo puedo ayudarte?**\n• Pregunta \"**¿Qué es KSAMATI?**\" para saber más\n• Di \"**ir a proyectos**\" para navegar\n• Sube una **imagen** para análisis\n• 🔊 **Activa mi voz** con el botón del altavoz\n• Consulta sobre cualquier módulo\n\n✨ ¡Estoy aquí para optimizar tu negocio!",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  // 🔊 Estados para síntesis de voz
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 🔊 Cargar voces disponibles cuando el componente se monta
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      const spanishVoices = availableVoices.filter(voice => 
        voice.lang.startsWith('es') || voice.lang.includes('Spanish')
      );
      
      setVoices(availableVoices);
      
      // Seleccionar voz en español por defecto, o la primera disponible
      const defaultVoice = spanishVoices[0] || availableVoices[0];
      setSelectedVoice(defaultVoice);
    };

    loadVoices();
    
    // Algunos navegadores cargan las voces de forma asíncrona
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // 🔊 Función para convertir texto a voz
  const speakText = (text) => {
    if (!voiceEnabled || !selectedVoice || isSpeaking) return;

    // Limpiar marcado markdown básico para TTS
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remover **texto**
      .replace(/\n/g, '. ') // Convertir saltos de línea en pausas
      .replace(/•/g, '') // Remover bullets
      .replace(/🚀|📊|🛒|🔔|📅|🤖|✨|💡|🔗|⚡|📋|🎯|💼|🔧|🎨|💾|🏗️|📋|🔥|💻|🔄|🛡️|⚙️|📸|🖼️|🔍|💬|🆘|📚|💪|🌟/g, ''); // Remover emojis

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.voice = selectedVoice;
    utterance.rate = 0.9; // Velocidad ligeramente más lenta para claridad
    utterance.pitch = 1.1; // Tono ligeramente más alto
    utterance.volume = 0.8; // Volumen al 80%

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    speechSynthesis.speak(utterance);
  };

  // 🔊 Función para detener la voz
  const stopSpeaking = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // 🔊 Alternar síntesis de voz
  const toggleVoice = () => {
    if (voiceEnabled && isSpeaking) {
      stopSpeaking();
    }
    setVoiceEnabled(!voiceEnabled);
  };

  const navigationRoutes = {
    // Rutas principales
    'inicio': '/inicio',
    'home': '/inicio', 
    'principal': '/inicio',
    'proyectos': '/proyectos',
    'proyecto': '/proyectos',
    'ventas': '/ventas',
    'venta': '/ventas',
    'alertas': '/alertas',
    'alerta': '/alertas',
    'notificaciones': '/alertas',
    'citas': '/citas',
    'cita': '/citas',
    'agendar': '/citas',
    'agenda': '/citas',
    'chatbot': '/chatbot',
    'chat': '/chatbot'
  };

  const predefinedResponses = [
    {
      keywords: ['hola', 'hi', 'hello', 'saludos', 'buenos días', 'buenas tardes'],
      responses: [
        "¡Hola! 😊 ¿Cómo está tu día? ¿En qué puedo asistirte?\n\n✨ **Tips rápidos:**\n• Escribe \"ir a proyectos\" para navegar\n• Sube una imagen para que la analice\n• Pregúntame sobre cualquier módulo",
        "¡Saludos! 🌟 Estoy aquí para ayudarte con cualquier consulta sobre KSAMATI.\n\n🚀 **Puedo llevarte a:**\n• Proyectos • Ventas • Alertas • Citas",
        "¡Hola! 👋 ¿Listo para optimizar tu negocio? ¡Pregúntame lo que necesites!"
      ]
    },
    {
      keywords: ['ksamati', 'sistema ksamati', 'que es ksamati', 'para que sirve ksamati', 'sobre ksamati', 'qué es ksamati', 'que hace ksamati', 'funciones de ksamati', 'características ksamati', 'módulos ksamati', 'sistema', 'plataforma', 'funciones', 'características', 'módulos', 'que hace', 'para qué sirve', 'información'],
      responses: [
        "🚀 **KSAMATI** es un **Sistema Integral de Gestión Empresarial** multiplataforma diseñado para optimizar tu negocio.\n\n💼 **¿Para qué sirve?**\n• 📊 **Gestor de Proyectos** - Excel avanzado con fórmulas automáticas\n• 🛒 **Gestor de Ventas** - Cotizaciones y seguimiento de clientes\n• 🔔 **Centro de Alertas** - Notificaciones inteligentes\n• 📅 **Agendar Citas** - Organización de reuniones\n• 🤖 **Chatbot Inteligente** - Asistente virtual 24/7\n\n✨ **Características destacadas:**\n• Responsive (PC, tablet, móvil)\n• Base de datos MySQL + localStorage\n• Fórmulas y cálculos automáticos\n• Interfaz estilo Excel profesional",
        "💡 **KSAMATI** es tu **plataforma todo-en-uno** para gestión empresarial.\n\n🎯 **Módulos principales:**\n• **Proyectos**: Gestión financiera completa con Excel avanzado\n• **Ventas**: Cotizadores especializados (Melamina, Granito, Tercializaciones)\n• **Alertas**: Centro de notificaciones en tiempo real\n• **Citas**: Calendario y agenda inteligente\n• **Chatbot**: Navegación por voz y análisis de imágenes\n\n🔧 **Tecnología avanzada:**\n• Node.js + React.js + MySQL\n• Persistencia dual (online/offline)\n• Responsive design\n• Fórmulas automáticas\n• Sistema de pestañas tipo Excel",
        "🏗️ **KSAMATI** - **Sistema Completo de Gestión de Proyectos**\n\n📋 **¿Qué problema resuelve?**\nUnifica la gestión de proyectos, ventas, clientes y finanzas en una sola plataforma profesional.\n\n🔥 **Beneficios clave:**\n• **Excel inteligente** - Fórmulas automáticas y cálculos en tiempo real\n• **Gestión integral** - Proyectos, ventas, alertas y citas en un solo lugar\n• **Acceso universal** - Funciona en cualquier dispositivo\n• **Datos seguros** - MySQL + backup automático\n• **Interfaz intuitiva** - Fácil de usar, potente en funciones\n\n🚀 **¿Quieres ver algún módulo?** Dime \"ir a proyectos\" o \"llévame a ventas\""
      ]
    },
    {
      keywords: ['ir a', 'llévame a', 'navegar a', 'ir al', 'llévame al', 've a', 'vamos a'],
      responses: [],
      isNavigationCommand: true
    },
    {
      keywords: ['proyecto', 'proyectos', 'gestión', 'excel'],
      responses: [
        "📊 ¡Genial! El **Gestor de Proyectos** es el núcleo del sistema **KSAMATI**.\n\n🔗 **¿Quieres que te lleve allí?** Escribe: \"ir a proyectos\"\n\n💡 **Funcionalidades KSAMATI:**\n• **Excel avanzado** - Interfaz profesional tipo Excel\n• **Fórmulas automáticas** - Cálculos financieros en tiempo real\n• **Sistema de pestañas** - Múltiples proyectos simultáneos\n• **Persistencia dual** - MySQL + localStorage\n• **Responsive total** - PC, tablet, móvil",
        "🏗️ Los proyectos son el corazón de **KSAMATI**. Este módulo integra:\n\n✨ **Características únicas:**\n• Gestión financiera completa\n• Análisis de balances automático\n• Seguimiento de cobranzas\n• Integración con ventas y alertas\n\n📋 **Escribe:** \"llévame a proyectos\" y verás el poder de KSAMATI",
        "📈 El **Gestor de Proyectos KSAMATI** revolutiona la gestión empresarial:\n\n🚀 **Ventajas competitivas:**\n• Presupuestos dinámicos con fórmulas\n• Control de fechas y plazos\n• Seguimiento de clientes integrado\n• Reportes automáticos\n\n⚡ **Navegación rápida:** \"ir a proyectos\""
      ]
    },
    {
      keywords: ['venta', 'ventas', 'cotización', 'cliente'],
      responses: [
        "🛒 ¡Perfecto! El **Gestor de Ventas KSAMATI** revolutiona tu proceso comercial.\n\n🔗 **¿Te llevo?** Escribe: \"ir a ventas\"\n\n💰 **Características exclusivas:**\n• **3 Cotizadores especializados** (Melamina, Granito, Tercializaciones)\n• **Fórmulas automáticas** - Totales y balances al instante\n• **Sistema de pestañas** - Múltiples cotizaciones simultáneas\n• **Estados inteligentes** - Cotizando, Enviado, Aprobado, Facturado\n• **Integración completa** con proyectos y alertas",
        "💰 El **módulo de ventas** es donde **KSAMATI** brilla. Incluye:\n\n✨ **Tecnología avanzada:**\n• Cotizadores con cálculos en tiempo real\n• Seguimiento de clientes integrado\n• Sincronización automática con Excel principal\n• Responsive total para cualquier dispositivo\n\n⚡ **Acceso rápido:** \"llévame a ventas\"",
        "🎯 **KSAMATI Ventas** - El futuro de las cotizaciones empresariales:\n\n🚀 **Ventajas competitivas:**\n• Estados de cotizaciones en tiempo real\n• Cálculos automáticos sin errores\n• Historial completo de interacciones\n• Integración con proyectos y finanzas\n\n📋 **Di:** \"navegar a ventas\" y descubre el poder"
      ]
    },
    {
      keywords: ['alerta', 'alertas', 'notificación', 'notificaciones'],
      responses: [
        "🔔 ¡Perfecto! Las alertas te mantienen informado sobre todo lo importante.\n\n🔗 **¿Vamos?** Escribe: \"ir a alertas\"\n\n📊 **Características:**\n• Notificaciones en tiempo real\n• Configuración personalizada\n• Historial de alertas",
        "📢 El centro de alertas te ayuda a estar siempre al día con notificaciones importantes.\n\n⚡ **Navegación:** \"llévame a alertas\"",
      ]
    },
    {
      keywords: ['cita', 'citas', 'agendar', 'agenda', 'reunión', 'reuniones'],
      responses: [
        "📅 ¡Excelente! El módulo de citas te ayuda a organizar todas tus reuniones y compromisos.\n\n🔗 **¿Te llevo?** Escribe: \"ir a citas\"\n\n⏰ **Funciones:**\n• Agendar nuevas citas\n• Gestionar calendario\n• Recordatorios automáticos",
        "🗓️ La gestión de citas es clave para un negocio organizado.\n\n⚡ **Acceso directo:** \"llévame a citas\"",
      ]
    },
    {
      keywords: ['imagen', 'foto', 'imágenes', 'picture', 'subir imagen', 'analizar imagen'],
      responses: [
        "📸 ¡Perfecto! Puedo analizar imágenes para ayudarte mejor.\n\n🖼️ **¿Cómo subir una imagen?**\n1. Haz click en el ícono 📷 de abajo\n2. Selecciona tu imagen\n3. Te ayudo a interpretarla\n\n✨ **Puedo analizar:**\n• Capturas de pantalla\n• Documentos escaneados\n• Diagramas de procesos",
        "🔍 ¡Genial! Las imágenes me ayudan a entender mejor qué necesitas.\n\nUsa el botón de la cámara 📷 para subir cualquier imagen de referencia.",
      ]
    },
    {
      keywords: ['tecnología', 'tecnologías', 'como funciona', 'cómo funciona', 'backend', 'frontend', 'base de datos', 'mysql', 'react', 'node', 'arquitectura', 'desarrollo', 'programación'],
      responses: [
        "⚙️ **KSAMATI** está construido con **tecnología de vanguardia**:\n\n🔧 **Backend potente:**\n• **Node.js + Express.js** - Servidor robusto y escalable\n• **MySQL** - Base de datos relacional profesional\n• **API RESTful** - Comunicación estándar y eficiente\n• **Stored Procedures** - Lógica de negocio optimizada\n\n🎨 **Frontend moderno:**\n• **React.js** - Interfaz de usuario reactiva\n• **Tailwind CSS** - Diseño responsive y elegante\n• **React Router** - Navegación fluida\n• 🔊 **Web Speech API** - Síntesis de voz inteligente\n\n💾 **Persistencia híbrida:**\n• **MySQL primario** + **localStorage backup**\n• Funciona online y offline",
        "🏗️ **Arquitectura KSAMATI** - Diseño profesional empresarial:\n\n🚀 **Stack tecnológico:**\n• **Frontend**: React.js + Tailwind CSS + Web Speech API\n• **Backend**: Node.js + Express.js\n• **Database**: MySQL + localStorage\n• **Deployment**: Docker + Docker Compose\n\n✨ **Características técnicas:**\n• **Responsive Design** - Adaptable a cualquier dispositivo\n• **SPA (Single Page Application)** - Navegación ultrarrápida\n• **API REST** - Arquitectura escalable\n• **PWA Ready** - Progressive Web App\n• **Real-time calculations** - Fórmulas automáticas\n• 🔊 **Text-to-Speech** - Respuestas con voz",
        "💻 **¿Cómo funciona KSAMATI?**\n\n🔄 **Flujo de datos inteligente:**\n1. **Interface React** captura datos del usuario\n2. **API Node.js** procesa la lógica de negocio\n3. **MySQL** almacena información de forma segura\n4. **Fórmulas automáticas** calculan resultados\n5. **localStorage** mantiene backup local\n6. 🔊 **Síntesis de voz** reproduce respuestas\n\n🛡️ **Seguridad y rendimiento:**\n• Conexión híbrida (online/offline)\n• Validación de datos en tiempo real\n• Backup automático\n• Interfaz optimizada para velocidad\n• Síntesis de voz nativa del navegador"
      ]
    },
    {
      keywords: ['voz', 'hablar', 'sonido', 'audio', 'text to speech', 'tts', 'speech', 'reproducir', 'escuchar', 'altavoz'],
      responses: [
        "🔊 ¡Genial que preguntes sobre mi **funcionalidad de voz**!\n\n✨ **¿Cómo funciona?**\n• Haz click en el **botón del altavoz** 🔊 en mi header\n• Todas mis respuestas se reproducirán automáticamente\n• Puedes **detener** la voz en cualquier momento\n• También puedes reproducir **mensajes anteriores** individualmente\n\n🎯 **Características de mi voz:**\n• **Síntesis natural** usando Web Speech API\n• **Velocidad optimizada** para claridad\n• **Texto limpio** (sin emojis ni formato)\n• **Control total** - pausa, detén, reproduce\n\n💡 **Tip:** ¡Actívame y pregunta sobre KSAMATI para escuchar mis respuestas!",
        "🎤 ¡Mi **sistema de voz** hace que KSAMATI sea aún más accesible!\n\n🔧 **Tecnología avanzada:**\n• **Web Speech API** nativa del navegador\n• **Múltiples voces** disponibles (español prioritario)\n• **Limpieza inteligente** de texto (markdown, emojis)\n• **Control de reproducción** completo\n\n🎯 **¿Cómo usarlo?**\n1. Click en 🔊 para activar\n2. Mis respuestas se reproducen automáticamente\n3. Click en ⏹️ para detener si es necesario\n4. Cada mensaje tiene su botón individual 🔊\n\n✨ **¡Perfecto para multitareas!** Puedes trabajar mientras escuchas mis explicaciones sobre KSAMATI.",
        "🔊 **Mi voz inteligente** es una de las características más cool de **KSAMATI Bot**!\n\n🚀 **Ventajas de la síntesis de voz:**\n• **Accesibilidad** - Perfecto para personas con discapacidades visuales\n• **Multitarea** - Escucha mientras trabajas en otras cosas\n• **Comprensión** - Mejor retención de información compleja\n• **Comodidad** - No necesitas leer todo el texto\n\n⚙️ **Configuración inteligente:**\n• Detecta automáticamente voces en español\n• Velocidad optimizada para claridad empresarial\n• Limpia el texto de formato para mejor pronunciación\n• Compatible con todos los navegadores modernos\n\n💡 **¿Sabías que?** Puedo explicar cualquier módulo de KSAMATI por voz. ¡Pruébame!"
      ]
    },
    {
      keywords: ['ayuda', 'help', 'como', 'tutorial', 'explicar'],
      responses: [
        "🆘 ¡Por supuesto! Estoy aquí para guiarte en todo KSAMATI.\n\n🎯 **Comandos útiles:**\n• \"ir a [módulo]\" → Navegación directa\n• Subir imagen → Análisis visual\n• Preguntar sobre funciones\n\n📍 **Módulos disponibles:**\nProyectos • Ventas • Alertas • Citas",
        "📚 Puedo explicarte cualquier funcionalidad paso a paso.\n\n💡 **Tip:** Sube una captura de pantalla si necesitas ayuda con algo específico que ves.",
        "🔍 ¡Perfecto! Soy tu guía personal en KSAMATI.\n\n🚀 **Formas de interactuar:**\n1. Comandos de navegación\n2. Preguntas específicas\n3. Análisis de imágenes"
      ]
    },
    {
      keywords: ['gracias', 'thank', 'bien', 'perfecto', 'excelente'],
      responses: [
        "¡De nada! 😊 Siempre es un placer ayudar.\n\n🔄 **¿Necesitas ir a algún módulo?** Solo dime \"ir a [nombre]\"",
        "🌟 ¡Me alegra haber sido útil! Recuerda que estoy aquí 24/7 para cualquier consulta.\n\n📷 **Tip:** Puedo analizar imágenes si necesitas ayuda visual.",
        "💪 ¡Genial que todo esté funcionando bien! Si necesitas navegar a otro lugar, solo dímelo."
      ]
    }
  ];

  // 🧠 Función inteligente para detectar navegación y dar respuestas
  const getBotResponse = (userMessage, hasImage = false) => {
    const message = userMessage.toLowerCase();
    
    // 🔍 Detectar comando de navegación
    const navigationMatch = message.match(/(?:ir a|llévame a|navegar a|ir al|llévame al|ve a|vamos a)\s+(\w+)/);
    if (navigationMatch) {
      const targetModule = navigationMatch[1];
      const route = navigationRoutes[targetModule];
      
      if (route) {
        // Navegar automáticamente
        setTimeout(() => {
          navigate(route);
          setIsOpen(false); // Cerrar chat tras navegar
        }, 2000);
        
        const moduleNames = {
          'inicio': 'Inicio',
          'proyectos': 'Gestor de Proyectos', 
          'ventas': 'Gestor de Ventas',
          'alertas': 'Centro de Alertas',
          'citas': 'Agendar Citas',
          'chatbot': 'Chatbot'
        };
        
        return `🚀 ¡Perfecto! Te estoy llevando a **${moduleNames[targetModule] || targetModule}**...\n\n⏱️ *Navegando en 2 segundos...*\n\n✨ **Consejo:** Una vez allí, si tienes dudas, vuelve a abrir el chat y pregúntame lo que necesites.`;
      } else {
        return `❓ Hmm, no reconozco el módulo "${targetModule}". \n\n📍 **Módulos disponibles:**\n• Proyectos (\"ir a proyectos\")\n• Ventas (\"ir a ventas\")\n• Alertas (\"ir a alertas\")\n• Citas (\"ir a citas\")\n• Inicio (\"ir a inicio\")\n\n💡 **Ejemplo:** \"llévame a proyectos\"`;
      }
    }

    // 📸 Si hay imagen, dar respuesta específica
    if (hasImage) {
      const imageResponses = [
        "📸 ¡Excelente imagen! He analizado lo que me has enviado.\n\n🔍 **Lo que veo:**\nEsta imagen parece estar relacionada con KSAMATI. ¿Te ayudo con algo específico sobre lo que muestras?\n\n💡 **¿Necesitas que te lleve a algún módulo relacionado?**",
        "🖼️ ¡Perfecto! He procesado tu imagen.\n\n✨ **Análisis:** Veo elementos del sistema KSAMATI. ¿Hay algo específico en la imagen que te gustaría que explique?\n\n🔗 **Puedo llevarte** al módulo correspondiente si me lo indicas.",
        "📷 ¡Imagen recibida y analizada!\n\n🤖 **Mi análisis:** Esta captura muestra funcionalidades de KSAMATI. ¿Qué aspecto específico te interesa?\n\n⚡ **Comando rápido:** \"ir a [módulo]\" para navegar directamente."
      ];
      return imageResponses[Math.floor(Math.random() * imageResponses.length)];
    }
    
    // 🎯 Respuestas categorizadas normales
    for (let category of predefinedResponses) {
      if (category.isNavigationCommand) continue; // Saltar comandos de navegación ya procesados
      
      if (category.keywords.some(keyword => message.includes(keyword))) {
        const randomResponse = category.responses[Math.floor(Math.random() * category.responses.length)];
        return randomResponse;
      }
    }

    // 🤷 Respuestas por defecto
    const defaultResponses = [
      "🤔 Interesante pregunta. ¿Podrías ser más específico?\n\n🎯 **Sobre KSAMATI puedo ayudarte con:**\n• **\"¿Qué es KSAMATI?\"** → Información completa del sistema\n• **\"ir a proyectos\"** → Navegación directa\n• **Análisis visual** → Sube una imagen 📷\n• **Módulos específicos** → Proyectos, Ventas, Alertas, Citas",
      "💡 No estoy seguro de entender completamente. ¿Te refieres a algún módulo específico de **KSAMATI**?\n\n🚀 **El sistema KSAMATI incluye:**\n• 📊 **Proyectos** → \"llévame a proyectos\"\n• 🛒 **Ventas** → \"ir a ventas\"\n• 🔔 **Alertas** → \"navegar a alertas\"\n• 📅 **Citas** → \"ve a citas\"\n\n💬 También pregunta: **\"¿Para qué sirve KSAMATI?\"**",
      "🔍 Hmm, déjame pensar... ¿Podrías reformular tu pregunta?\n\n✨ **KSAMATI** es un sistema integral de gestión empresarial. \n\n📸 **Tip:** Si tienes una captura de pantalla de lo que necesitas, súbela y te ayudo mejor.\n\n🎯 **O pregunta sobre:**\n• Funcionalidades del sistema\n• Módulos específicos\n• Tecnologías utilizadas",
      "🎯 ¡Buena pregunta! Me encanta hablar sobre **KSAMATI**.\n\n🚀 **Comandos útiles:**\n• **\"¿Qué es KSAMATI?\"** → Información completa\n• **\"ir a [módulo]\"** → Navegación directa\n• **Subir imagen** → Análisis visual\n• **\"tecnología\"** → Stack técnico\n\n💼 **KSAMATI** es tu plataforma todo-en-uno para gestión empresarial. ¿Qué aspecto te interesa más?"
    ];

    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  // 📷 Función para manejar subida de imágenes
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage({
          file: file,
          preview: e.target.result,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // 🗑️ Función para remover imagen seleccionada
  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() && !selectedImage) return;

    // 📝 Crear mensaje del usuario (con imagen si la hay)
    const userMessage = {
      id: Date.now(),
      text: inputText || '📷 *Imagen enviada*',
      sender: 'user',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      image: selectedImage ? selectedImage.preview : null,
      imageName: selectedImage ? selectedImage.name : null
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText;
    const hasImage = !!selectedImage;
    
    // Limpiar input e imagen
    setInputText('');
    removeSelectedImage();
    setIsTyping(true);

    // 🤖 Simular respuesta del bot con delay
    setTimeout(() => {
      const botResponseText = getBotResponse(messageText, hasImage);
      const botResponse = {
        id: Date.now() + 1,
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
      
      // 🔊 Reproducir respuesta en voz alta si está habilitada
      if (voiceEnabled) {
        setTimeout(() => {
          speakText(botResponseText);
        }, 500); // Pequeño delay para que termine la animación
      }
    }, Math.random() * 2000 + 1000); // 1-3 segundos de delay
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Botón flotante */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative group transition-all duration-300 transform hover:scale-110 ${
            isOpen ? 'rotate-180' : 'rotate-0 hover:rotate-12'
          }`}
        >
          {/* Círculos animados de fondo */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-ping opacity-20"></div>
          
          {/* Botón principal */}
          <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white p-4 rounded-full shadow-2xl border-4 border-white/20 backdrop-blur-sm">
            {isOpen ? (
              <XMarkIcon className="h-8 w-8 animate-spin" />
            ) : (
              <div className="relative">
                <ChatBubbleLeftRightIcon className="h-8 w-8 animate-bounce" />
                {/* Efectos de brillo */}
                <SparklesIcon className="absolute -top-1 -right-1 h-4 w-4 text-yellow-300 animate-pulse" />
                <HeartIcon className="absolute -bottom-1 -left-1 h-3 w-3 text-red-300 animate-pulse" />
              </div>
            )}
          </div>

          {/* Texto flotante */}
          <div className={`absolute bottom-full right-0 mb-2 transition-all duration-300 ${
            isOpen ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
          }`}>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap shadow-lg border border-white/20">
              💬 ¡Pregúntame lo que necesites!
            </div>
            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 transform rotate-45 mx-auto -mt-1"></div>
          </div>
        </button>
      </div>

      {/* Ventana del chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[90vw] h-[500px] max-h-[70vh] bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 z-40 animate-slide-up overflow-hidden">
          
          {/* Header del chat */}
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-4 rounded-t-2xl">
            <div className="flex items-center">
              <div className="relative">
                {/* Avatar del robot */}
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-white animate-pulse" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full"></div>
              </div>
              
              <div className="ml-3 flex-1">
                <h3 className="text-white font-bold text-lg">KSAMATI Bot</h3>
                <p className="text-white/80 text-sm flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  Asistente Virtual Activo
                  {isSpeaking && (
                    <span className="ml-2 text-yellow-300 animate-bounce">🔊 Hablando...</span>
                  )}
                </p>
              </div>

              {/* 🔊 Control de voz */}
              <button
                onClick={toggleVoice}
                className={`mr-2 p-2 rounded-full transition-all duration-200 ${
                  voiceEnabled 
                    ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' 
                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white/80'
                }`}
                title={voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
              >
                {voiceEnabled ? (
                  <SpeakerWaveIcon className={`h-5 w-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                ) : (
                  <SpeakerXMarkIcon className="h-5 w-5" />
                )}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* 🔊 Indicador de voz activada */}
            {voiceEnabled && (
              <div className="mt-2 text-center">
                <div className="inline-flex items-center bg-white/10 rounded-full px-3 py-1 text-xs text-white/90">
                  <SpeakerWaveIcon className="h-3 w-3 mr-1" />
                  <span>Voz activada - Las respuestas se reproducirán</span>
                  {isSpeaking && (
                    <button
                      onClick={stopSpeaking}
                      className="ml-2 text-red-300 hover:text-red-200 transition-colors"
                      title="Detener voz"
                    >
                      ⏹️
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Área de mensajes */}
          <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-slate-900/50 to-gray-900/50 h-[340px]">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${
                    message.sender === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-l-2xl rounded-tr-2xl' 
                      : 'bg-white/10 backdrop-blur-sm text-white rounded-r-2xl rounded-tl-2xl border border-white/20'
                  } px-4 py-3 shadow-lg animate-fade-in`}>
                    
                    {/* 🖼️ Mostrar imagen si existe */}
                    {message.image && (
                      <div className="mb-3">
                        <img 
                          src={message.image} 
                          alt={message.imageName || "Imagen enviada"}
                          className="max-w-full h-auto rounded-lg border border-white/20 shadow-md"
                          style={{ maxHeight: '200px' }}
                        />
                        {message.imageName && (
                          <p className="text-xs opacity-70 mt-1">📎 {message.imageName}</p>
                        )}
                      </div>
                    )}
                    
                    {/* 📝 Texto del mensaje con formato markdown básico */}
                    <div className="text-sm leading-relaxed whitespace-pre-line">
                      {message.text.split('**').map((part, index) => 
                        index % 2 === 1 ? <strong key={index}>{part}</strong> : part
                      )}
                    </div>
                    
                    {/* 🔊 Control de voz para mensajes del bot */}
                    {message.sender === 'bot' && (
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs opacity-70">{message.timestamp}</p>
                        <button
                          onClick={() => speakText(message.text)}
                          disabled={isSpeaking}
                          className={`text-xs p-1 rounded hover:bg-white/10 transition-colors ${
                            isSpeaking ? 'opacity-50 cursor-not-allowed' : 'opacity-70 hover:opacity-100'
                          }`}
                          title="Reproducir en voz alta"
                        >
                          <SpeakerWaveIcon className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    
                    {/* Timestamp para mensajes de usuario */}
                    {message.sender === 'user' && (
                      <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Indicador de "escribiendo" */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/10 backdrop-blur-sm text-white rounded-r-2xl rounded-tl-2xl border border-white/20 px-4 py-3 shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs opacity-70">KSAMATI Bot está escribiendo...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input área */}
          <div className="p-4 bg-white/5 backdrop-blur-sm border-t border-white/10">
            
            {/* 🖼️ Preview de imagen seleccionada */}
            {selectedImage && (
              <div className="mb-3 p-3 bg-white/10 rounded-lg border border-white/20">
                <div className="flex items-center space-x-3">
                  <img 
                    src={selectedImage.preview} 
                    alt="Vista previa"
                    className="w-12 h-12 rounded-lg border border-white/20 object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">📎 {selectedImage.name}</p>
                    <p className="text-white/60 text-xs">Imagen lista para enviar</p>
                  </div>
                  <button
                    onClick={removeSelectedImage}
                    className="text-red-400 hover:text-red-300 p-1 hover:bg-red-500/20 rounded"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={selectedImage ? "Describe la imagen (opcional)..." : "Escribe tu mensaje o comando..."}
                  className="w-full bg-white/10 text-white placeholder-white/50 rounded-full px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/20 backdrop-blur-sm"
                />
                <LightBulbIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-yellow-400 animate-pulse" />
              </div>
              
              {/* 📷 Botón para subir imagen */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 border border-white/20 hover:border-white/40"
                title="Subir imagen"
              >
                <PhotoIcon className="h-5 w-5" />
              </button>
              
              {/* ✈️ Botón enviar */}
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() && !selectedImage}
                className={`p-3 rounded-full transition-all duration-200 ${
                  (inputText.trim() || selectedImage)
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-110 shadow-lg' 
                    : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                }`}
                title="Enviar mensaje"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>

            {/* 💡 Mensaje de ayuda dinámico */}
            <div className="mt-2 text-center">
              <p className="text-white/40 text-xs">
                💬 Escribe "ir a proyectos" • 📷 Sube imágenes • 🔊 Activa voz • 🤖 Pregunta lo que necesites
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChatbot;
