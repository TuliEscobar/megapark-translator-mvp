import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Globe, Sparkles, Trash2, Send, Volume2, History, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { saveTranslation, getTranslationHistory } from './services/api';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [baseLang, setBaseLang] = useState('es-ES');
  const [historyList, setHistoryList] = useState([]);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [historyList, transcript, isProcessing]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Web Speech API no soportada en este navegador. Usa Chrome o Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = baseLang;

    recognition.onstart = () => {
      finalTranscriptRef.current = '';
      if (!transcript) setTranscript('');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      
      if (final) {
        finalTranscriptRef.current += ' ' + final;
      }
      
      setTranscript((finalTranscriptRef.current + ' ' + interim).trim());
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      if (event.error !== 'no-speech') {
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      const textToProcess = finalTranscriptRef.current.trim();
      if (textToProcess) {
        processTranslation(textToProcess);
      }
    };

    recognitionRef.current = recognition;
  }, [baseLang]);

  const toggleRecording = () => {
    if (!apiKey) {
      setError('API Key no configurada en las variables de entorno (.env).');
      setTimeout(() => setError(''), 5000);
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setError('');
      setIsRecording(true);
      recognitionRef.current.lang = baseLang;
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error(e);
        setIsRecording(false);
      }
    }
  };

  const processTranslation = async (text) => {
    if (!apiKey || !text) return;
    
    setIsProcessing(true);
    setTranscript('');
    finalTranscriptRef.current = '';

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      const prompt = `Identify the language of the following text. 
      1. If it is mainly in Spanish, translate it to German and English.
      2. If it is mainly in German, translate it to Spanish and English.
      3. If it is in English, translate it to Spanish and German.
      
      Return ONLY a JSON object with this exact format, no markdown blocks, no extra text:
      {
        "detected": "Language Name (e.g. Spanish)",
        "transA": "Translation A text",
        "langA": "Language Name A",
        "transB": "Translation B text",
        "langB": "Language Name B"
      }
      
      Text: "${text}"`;
      
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const response = JSON.parse(cleaned);

      if (response) {
        const formattedTranslated = `[${response.langA}] ${response.transA}\n[${response.langB}] ${response.transB}`;
        
        // Guardar en BD
        const saved = await saveTranslation({
          original_text: text,
          translated_text: formattedTranslated,
          source_language: response.detected || baseLang,
          target_language: `${response.langA}/${response.langB}`
        });

        if (saved && saved.success) {
          setHistoryList(prev => [...prev, saved.data]);
        } else {
          // Fallback visual si falla la DB
          setHistoryList(prev => [...prev, {
            id: Date.now(),
            original_text: text,
            translated_text: formattedTranslated,
            source_language: response.detected || baseLang,
            created_at: new Date().toISOString()
          }]);
        }
      }
    } catch (err) {
      console.error("Translation Error:", err);
      setError('Error al procesar la traducción. Intenta de nuevo.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualTranslate = () => {
    if (transcript.trim()) {
      processTranslation(transcript.trim());
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleManualTranslate();
    }
  };

  const speakText = (text, langCodeHint) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const msg = new SpeechSynthesisUtterance(text);
    let langCode = 'en-US';
    const lower = (langCodeHint || '').toLowerCase();
    
    if (lower.includes('spanish') || lower.includes('español')) {
      langCode = 'es-ES';
    } else if (lower.includes('german') || lower.includes('alemán') || lower.includes('deutsch')) {
      langCode = 'de-DE';
    }
    
    msg.lang = langCode;
    window.speechSynthesis.speak(msg);
  };

  const clearChat = () => {
    setHistoryList([]);
    setTranscript('');
    finalTranscriptRef.current = '';
  };

  const toggleLanguage = () => {
    const newLang = baseLang === 'es-ES' ? 'de-DE' : 'es-ES';
    setBaseLang(newLang);
  };

  const getPlaceholder = () => {
    if (baseLang === 'es-ES') return isRecording ? "Escuchando..." : "Toca el micrófono o escribe aquí...";
    if (baseLang === 'de-DE') return isRecording ? "Zuhören..." : "Tippen Sie auf das Mikrofon oder schreiben...";
    return isRecording ? "Listening..." : "Tap the mic or type here...";
  };

  const isOwnMessage = (sourceLang) => {
    if (!sourceLang) return true;
    const lower = sourceLang.toLowerCase();
    if (baseLang === 'es-ES') return lower.includes('spanish') || lower.includes('español') || lower.includes('es');
    if (baseLang === 'de-DE') return lower.includes('german') || lower.includes('alemán') || lower.includes('de');
    return true; 
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full relative overflow-hidden font-sans bg-[#0a0510]">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1a0b2e] via-[#0a0510] to-[#0a0510] opacity-80" />
      <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 w-full bg-[#050208] border-b border-orange-600/30 flex items-center justify-between px-4 md:px-8 py-3 shadow-xl">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-orange-500/50 flex items-center justify-center bg-black overflow-hidden relative shadow-[0_0_15px_rgba(234,88,12,0.3)]">
             <img src="/megapark-logo.jpg" alt="Megapark" className="w-full h-full object-cover" />
             <div className="absolute inset-0 border-[1px] border-dashed border-orange-500/80 rounded-full animate-[spin_10s_linear_infinite] pointer-events-none" />
          </div>
          <div className="hidden md:flex items-center gap-5 text-white font-black uppercase tracking-widest text-sm font-display">
            <span className="text-orange-500 cursor-pointer">Live Chat</span>
            <span className="hover:text-orange-500 cursor-pointer transition-colors">Q-Lounge</span>
            <span className="hover:text-orange-500 cursor-pointer transition-colors">VIP Stage</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
           <button 
             onClick={clearChat}
             className="px-2 py-1 bg-transparent rounded text-[10px] md:text-xs font-bold text-white/50 border border-white/20 hover:border-red-500 hover:text-red-500 transition-all uppercase flex items-center gap-1"
           >
             <Trash2 className="w-3 h-3" /> Clear
           </button>
           <button 
             onClick={toggleLanguage}
             className="px-2 py-1 bg-transparent rounded text-[10px] md:text-xs font-bold text-orange-500 border border-orange-500 hover:bg-orange-500 hover:text-black transition-all uppercase"
           >
             {baseLang === 'es-ES' ? 'YO: ES' : 'YO: DE'}
           </button>
        </div>
      </nav>

      {/* Chat Area */}
      <main className="relative z-10 flex-1 flex flex-col p-4 md:p-8 overflow-y-auto overscroll-y-contain custom-scrollbar scroll-smooth max-w-4xl mx-auto w-full pb-32">
        
        {/* Welcome message bubble */}
        {historyList.length === 0 && !transcript && !isProcessing && (
          <div className="flex flex-col items-center justify-center flex-1 text-center my-auto opacity-80">
            <div className="w-20 h-20 mb-4 rounded-full border-2 border-orange-500/20 overflow-hidden shadow-2xl">
               <img src="/megapark-logo.jpg" alt="Megapark" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-black text-orange-500 uppercase tracking-tighter">MEGAPARK LIVE</h1>
            <p className="text-white/40 text-[10px] mt-2 font-bold tracking-[0.2em] uppercase">
              {baseLang === 'es-ES' ? 'Habla o escribe para traducir' : 'Sprechen oder tippen para comenzar'}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {historyList.map((item) => {
            const own = isOwnMessage(item.source_language);
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id} 
                className={cn("flex flex-col max-w-[90%]", own ? "self-end items-end" : "self-start items-start")}
              >
                <div className={cn(
                  "p-4 rounded-2xl shadow-xl border backdrop-blur-md flex flex-col gap-3 relative",
                  own 
                    ? "bg-orange-950/40 border-orange-500/30 rounded-br-sm" 
                    : "bg-purple-950/40 border-purple-500/30 rounded-bl-sm"
                )}>
                  <p className="text-lg md:text-xl font-bold text-white leading-snug">
                    {item.original_text}
                  </p>
                  
                  <div className={cn("h-px w-full opacity-30", own ? "bg-orange-500" : "bg-purple-500")} />
                  
                  <div className="flex flex-col gap-3">
                    {item.translated_text.split('\n').map((line, idx) => {
                      if (!line.trim()) return null;
                      const match = line.match(/\[(.*?)\]\s*(.*)/);
                      const lang = match ? match[1] : '';
                      const txt = match ? match[2] : line;
                      
                      return (
                        <div key={idx} className="flex flex-col items-start gap-1 w-full">
                          {lang && <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold block">{lang}</span>}
                          <div className="flex items-start justify-between w-full gap-4">
                            <p className="text-base md:text-lg text-orange-200/90 font-medium leading-tight">
                              {txt}
                            </p>
                            <button 
                              onClick={() => speakText(txt, lang)}
                              className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white transition-colors shrink-0"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {transcript && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col max-w-[90%] self-end items-end">
              <div className="p-4 rounded-2xl shadow-xl border border-orange-500/50 bg-orange-900/20 backdrop-blur-md rounded-br-sm">
                <p className="text-lg md:text-xl font-bold text-white/80 leading-snug">
                  {transcript}
                  <span className="w-2 h-4 ml-1 inline-block bg-orange-500 animate-pulse" />
                </p>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {isProcessing && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex flex-col max-w-[90%] self-start items-start">
                 <div className="p-3 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md rounded-bl-sm flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                   <span className="text-[10px] font-bold text-purple-300 uppercase tracking-widest animate-pulse">Translating...</span>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 p-4 md:p-6 flex justify-center bg-gradient-to-t from-black via-[#0a0510] to-transparent">
        <div className="max-w-3xl w-full flex items-end gap-2 md:gap-3 bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-3xl shadow-2xl">
          <button 
            onClick={toggleRecording}
            className={cn("w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-all duration-300", isRecording ? "bg-red-600 shadow-red-600/50" : "bg-orange-600 shadow-orange-600/30")}
          >
            {isRecording ? <Square className="text-white w-5 h-5" fill="currentColor" /> : <Mic className="text-white w-6 h-6" />}
          </button>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className="flex-1 bg-transparent text-sm md:text-base font-medium text-white placeholder:text-white/30 resize-none focus:outline-none max-h-32 py-3 px-2 custom-scrollbar"
            rows={1}
            style={{ minHeight: '48px' }}
          />
          {!isRecording && transcript.trim() && (
            <button onClick={handleManualTranslate} className="w-12 h-12 shrink-0 bg-white/10 text-white rounded-full flex items-center justify-center transition-all">
              <Send className="w-5 h-5 ml-1" />
            </button>
          )}
        </div>
      </footer>

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-red-600 text-white rounded font-bold text-xs shadow-xl border border-red-500 uppercase tracking-wide">
          {error}
        </div>
      )}
    </div>
  );
}
