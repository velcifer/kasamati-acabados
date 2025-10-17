import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const Chatbot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "¡Hola! Soy el asistente virtual de KSAMATI. ¿En qué puedo ayudarte hoy?",
      sender: 'bot',
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleGoBack = () => {
    navigate('/inicio');
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await axios.post('/api/chatbot/mensaje', {
        mensaje: inputMessage,
        usuarioId: 'user123' // En una app real, esto vendría del contexto de usuario
      });

      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          text: response.data.data.respuestaBot,
          sender: 'bot',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1500); // Simular tiempo de respuesta del bot

    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.",
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const quickActions = [
    "¿Cómo puedo agendar una cita?",
    "Información sobre proyectos",
    "Ayuda con ventas",
    "Ver mis alertas",
    "Contactar soporte"
  ];

  const handleQuickAction = (action) => {
    setInputMessage(action);
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Volver al Inicio
          </button>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient flex-1 text-center">
            Asistente Virtual
          </h1>
          
          <div className="w-20"></div>
        </div>

        {/* Chat Container */}
        <div className="card max-w-4xl mx-auto h-[600px] flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center p-4 border-b border-gray-200">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">KSAMATI Assistant</h3>
              <p className="text-sm text-green-600">En línea</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                  message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' 
                      ? 'bg-primary-500' 
                      : 'bg-gray-200'
                  }`}>
                    {message.sender === 'user' ? (
                      <UserIcon className="h-4 w-4 text-white" />
                    ) : (
                      <ComputerDesktopIcon className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-primary-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <ComputerDesktopIcon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Preguntas frecuentes:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1 rounded-full border border-gray-200 transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={sendMessage} className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className="flex-1 input-field"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="btn-primary p-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Info Card */}
        <div className="card mt-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            ¿Necesitas ayuda adicional?
          </h2>
          <p className="text-gray-600 mb-4">
            Nuestro asistente virtual puede ayudarte con información sobre el sistema KSAMATI
          </p>
          <div className="flex justify-center space-x-4">
            <button className="btn-secondary">
              Contactar Soporte
            </button>
            <button className="btn-primary">
              Ver FAQ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
