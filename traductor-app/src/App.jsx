import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Globe, Sparkles, Settings, Trash2, Languages, Send, Volume2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [translationA, setTranslationA] = useState('');
  const [langA, setLangA] = useState('');
  const [translationB, setTranslationB] = useState('');
  const [langB, setLangB] = useState('');
  const [detectedLang, setDetectedLang] = useState('');
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [isConfiguring, setIsConfiguring] = useState(!apiKey);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [baseLang, setBaseLang] = useState('es-ES');

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

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
      setIsConfiguring(true);
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setTranslationA('');
      setLangA('');
      setTranslationB('');
      setLangB('');
      setDetectedLang('');
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
        setDetectedLang(response.detected || '');
        setTranslationA(response.transA || '');
        setLangA(response.langA || '');
        setTranslationB(response.transB || '');
        setLangB(response.langB || '');
      }
    } catch (err) {
      console.error("Translation Error:", err);
      setError('Error al procesar la traducción. Intenta de nuevo.');
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

  const speakText = (text, languageName) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    
    const msg = new SpeechSynthesisUtterance(text);
    let langCode = 'en-US';
    const lowerLang = (languageName || '').toLowerCase();
    
    if(lowerLang.includes('spanish') || lowerLang.includes('español')) {
      langCode = 'es-ES';
    } else if(lowerLang.includes('german') || lowerLang.includes('alemán') || lowerLang.includes('deutsch')) {
      langCode = 'de-DE';
    }
    
    msg.lang = langCode;
    window.speechSynthesis.speak(msg);
  };

  const clear = () => {
    setTranscript('');
    finalTranscriptRef.current = '';
    setTranslationA('');
    setLangA('');
    setTranslationB('');
    setLangB('');
    setDetectedLang('');
    setError('');
  };

  const toggleLanguage = () => {
    const newLang = baseLang === 'es-ES' ? 'de-DE' : 'es-ES';
    setBaseLang(newLang);
    alert(`Idioma principal de escucha cambiado a: ${newLang === 'es-ES' ? 'Español' : 'Alemán'}`);
  };

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden font-sans bg-[#0a0510]">
      {/* Background ambient light matching the image */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1a0b2e] via-[#0a0510] to-[#0a0510] opacity-80" />
      <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Megapark Navbar */}
      <nav className="relative z-10 w-full bg-[#050208] border-b border-orange-600/30 flex items-center justify-between px-4 md:px-8 py-3 shadow-xl">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center bg-black overflow-hidden relative">
             <Globe className="w-6 h-6 text-white" />
             <div className="absolute inset-0 border-[1px] border-dashed border-orange-500/50 rounded-full animate-[spin_10s_linear_infinite]" />
          </div>
          <div className="hidden md:flex items-center gap-5 text-white font-black uppercase tracking-widest text-sm font-display">
            <span className="text-orange-500 cursor-pointer">Home</span>
            <span className="hover:text-orange-500 cursor-pointer transition-colors">History</span>
            <span className="hover:text-orange-500 cursor-pointer transition-colors">Q-Lounge</span>
            <span className="hover:text-orange-500 cursor-pointer transition-colors">VIP Stage</span>
            <span className="text-orange-500 cursor-pointer">Tickets</span>
            <span className="hover:text-orange-500 cursor-pointer transition-colors">Jobs</span>
            <span className="hover:text-orange-500 cursor-pointer transition-colors">More</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <button 
             onClick={toggleLanguage}
             className="px-3 py-1 bg-transparent rounded text-xs font-bold text-orange-500 border border-orange-500 hover:bg-orange-500 hover:text-black transition-all uppercase"
           >
             {baseLang === 'es-ES' ? 'EN | DE' : 'DE | ES'}
           </button>
           <button 
             onClick={() => setIsConfiguring(true)}
             className="p-1.5 bg-transparent rounded border border-white/20 hover:border-orange-500 text-white hover:text-orange-500 transition-colors"
           >
             <Settings className="w-4 h-4" />
           </button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col gap-6 p-4 md:p-8 overflow-hidden max-w-5xl mx-auto w-full">
        
        {/* Megapark Welcome Banner */}
        <div className="flex flex-col items-start mb-2 mt-4">
          <h1 className="text-4xl md:text-5xl font-black text-orange-500 uppercase tracking-tighter" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
            WELCOME TO MEGAPARK!
          </h1>
          <p className="text-orange-400/80 font-medium tracking-wide mt-1 text-sm">
            The place where <span className="font-bold text-white">LANGUAGES & JOY</span> are shared.
          </p>
          <div className="mt-4">
             <button className="bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-wider text-xs px-6 py-2 rounded-full shadow-lg shadow-orange-600/20 flex items-center gap-2">
                VIP TRANSLATION <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
             </button>
          </div>
        </div>

        {/* Source Text (Editable) */}
        <div className={cn("bg-black/60 rounded-xl p-5 flex flex-col border backdrop-blur-md transition-colors min-h-[140px] shadow-2xl", isRecording ? "border-red-500/50" : "border-orange-500/20")}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-orange-500 uppercase tracking-widest">
              YOUR MESSAGE {detectedLang && <span className="text-white/50">| {detectedLang}</span>}
            </span>
            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full border border-red-500/30">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-red-400 uppercase">Recording</span>
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col relative">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Listening..." : "Tap the mic to speak, or type your message here..."}
              className="w-full flex-1 bg-transparent text-xl md:text-2xl font-semibold leading-relaxed text-white placeholder:text-white/30 resize-none focus:outline-none"
            />
            {transcript && !isRecording && (
              <button 
                onClick={handleManualTranslate}
                className="absolute bottom-0 right-0 p-2 bg-orange-600 hover:bg-orange-500 text-white rounded-full shadow-lg shadow-orange-600/20 transition-transform active:scale-95"
                title="Translate text"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isProcessing && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center py-2 text-orange-500 gap-2"
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="font-bold uppercase tracking-widest text-sm animate-pulse">Translating...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Translations Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 pb-24">
          <div className="bg-black/60 backdrop-blur-md rounded-xl p-5 flex flex-col border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 to-transparent" />
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black text-white uppercase tracking-widest">
                  {langA || 'TRANSLATION 1'}
                </span>
                {translationA && (
                  <button 
                    onClick={() => speakText(translationA, langA)} 
                    className="p-2 bg-orange-600/20 text-orange-500 rounded-full hover:bg-orange-600 hover:text-white transition-colors"
                    title="Play Audio"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <p className="text-xl md:text-2xl font-bold text-white leading-tight">
                {translationA || <span className="text-white/20 font-normal">Waiting...</span>}
              </p>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-md rounded-xl p-5 flex flex-col border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-transparent" />
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black text-white uppercase tracking-widest">
                  {langB || 'TRANSLATION 2'}
                </span>
                {translationB && (
                  <button 
                    onClick={() => speakText(translationB, langB)} 
                    className="p-2 bg-purple-600/20 text-purple-400 rounded-full hover:bg-purple-600 hover:text-white transition-colors"
                    title="Play Audio"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <p className="text-xl md:text-2xl font-bold text-white leading-tight">
                {translationB || <span className="text-white/20 font-normal">Waiting...</span>}
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Control Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-20 pb-6 flex justify-center bg-gradient-to-t from-black via-black/80 to-transparent pt-12">
        <div className="flex items-center gap-8">
          <button 
            onClick={clear}
            className="p-3 bg-[#1a0b2e] border border-white/10 rounded-full text-white/50 hover:text-white hover:border-white/30 transition-all"
            title="Clear all"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <button 
            onClick={toggleRecording}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl border-4",
              isRecording 
                ? "bg-red-600 border-red-500 shadow-red-600/50 scale-105" 
                : "bg-orange-600 border-orange-500 shadow-orange-600/40 hover:scale-105 hover:bg-orange-500"
            )}
          >
            {isRecording ? <Square className="text-white w-8 h-8" fill="currentColor" /> : <Mic className="text-white w-10 h-10" />}
          </button>
        </div>
      </footer>

      {/* Config Overlay */}
      <AnimatePresence>
        {isConfiguring && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-[#0a0510] p-8 rounded-2xl w-full max-w-md border border-orange-500/30 shadow-2xl shadow-orange-500/10"
            >
              <h2 className="text-3xl font-black text-orange-500 mb-2 uppercase tracking-tighter">Setup</h2>
              <p className="text-white/60 text-sm mb-6">Enter your Gemini API Key to enable the translation engine.</p>
              
              <div className="space-y-4">
                <div>
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Paste your API Key here..."
                    className="w-full bg-black border border-white/20 rounded-lg px-4 py-3 text-white font-mono focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                
                <button 
                  onClick={() => setIsConfiguring(false)}
                  disabled={!apiKey}
                  className="w-full bg-orange-600 py-3 rounded-lg font-black uppercase tracking-widest text-white hover:bg-orange-500 disabled:opacity-50 transition-colors"
                >
                  Save & Continue
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-red-600 text-white rounded font-bold text-sm shadow-xl border border-red-500 uppercase tracking-wide">
          {error}
        </div>
      )}
    </div>
  );
}