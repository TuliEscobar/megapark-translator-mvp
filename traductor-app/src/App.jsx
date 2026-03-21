import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send, Volume2, Sparkles } from 'lucide-react';
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
      setError("Web Speech API no soportada. Usa Chrome o Safari.");
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
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      if (final) finalTranscriptRef.current += ' ' + final;
      setTranscript((finalTranscriptRef.current + ' ' + interim).trim());
    };
    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
      const textToProcess = finalTranscriptRef.current.trim();
      if (textToProcess) processTranslation(textToProcess);
    };
    recognitionRef.current = recognition;
  }, [baseLang]);

  const toggleRecording = () => {
    if (!apiKey) {
      setError('API Key no configurada.');
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
      const prompt = `Identify the language. If Spanish, translate to German and English. If German, translate to Spanish and English. If English, translate to Spanish and German. JSON: {detected, transA, langA, transB, langB}. Text: "${text}"`;
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const response = JSON.parse(cleaned);
      if (response) {
        const formattedTranslated = `[${response.langA}] ${response.transA}\n[${response.langB}] ${response.transB}`;
        const saved = await saveTranslation({
          original_text: text,
          translated_text: formattedTranslated,
          source_language: response.detected || baseLang,
          target_language: `${response.langA}/${response.langB}`
        });
        if (saved && saved.success) setHistoryList(prev => [...prev, saved.data]);
        else setHistoryList(prev => [...prev, { id: Date.now(), original_text: text, translated_text: formattedTranslated, source_language: response.detected || baseLang, created_at: new Date().toISOString() }]);
      }
    } catch (err) {
      setError('Error en la traducción.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualTranslate = () => {
    if (transcript.trim()) processTranslation(transcript.trim());
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
    if (lower.includes('spanish') || lower.includes('español')) langCode = 'es-ES';
    else if (lower.includes('german') || lower.includes('alemán') || lower.includes('deutsch')) langCode = 'de-DE';
    msg.lang = langCode;
    window.speechSynthesis.speak(msg);
  };

  const clearChat = () => {
    setHistoryList([]);
    setTranscript('');
    finalTranscriptRef.current = '';
  };

  const toggleLanguage = () => {
    setBaseLang(prev => prev === 'es-ES' ? 'de-DE' : 'es-ES');
  };

  const getPlaceholder = () => {
    if (baseLang === 'es-ES') return isRecording ? "Escuchando..." : "Escribe o habla...";
    if (baseLang === 'de-DE') return isRecording ? "Zuhören..." : "Schreiben oder sprechen...";
    return isRecording ? "Listening..." : "Type or speak...";
  };

  const isOwnMessage = (sourceLang) => {
    if (!sourceLang) return true;
    const lower = sourceLang.toLowerCase();
    if (baseLang === 'es-ES') return lower.includes('spanish') || lower.includes('español') || lower.includes('es');
    if (baseLang === 'de-DE') return lower.includes('german') || lower.includes('alemán') || lower.includes('de');
    return true; 
  };

  return (
    /* Contenedor fijo para evitar problemas con las barras del navegador */
    <div className="fixed inset-0 flex flex-col bg-[#0a0510] text-white overflow-hidden safe-area-padding">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1a0b2e] via-[#0a0510] to-[#0a0510] opacity-80" />
      
      {/* Navbar con altura fija */}
      <nav className="relative z-20 w-full h-16 bg-[#050208]/90 backdrop-blur-md border-b border-orange-600/30 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full border border-orange-500/50 overflow-hidden relative">
             <img src="/megapark-logo.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xs font-black tracking-tighter text-orange-500 uppercase">MEGAPARK</span>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={clearChat} className="p-2 text-white/40 hover:text-white"><Trash2 className="w-4 h-4" /></button>
           <button onClick={toggleLanguage} className="px-3 py-1.5 rounded-full text-[10px] font-black text-black bg-orange-500 uppercase shadow-lg shadow-orange-600/20">
             {baseLang === 'es-ES' ? 'ESPAÑOL' : 'DEUTSCH'}
           </button>
        </div>
      </nav>

      {/* Area de Chat con scroll independiente */}
      <main className="relative z-10 flex-1 overflow-y-auto custom-scrollbar scroll-smooth flex flex-col px-4 pt-4 pb-20 overscroll-contain">
        
        {historyList.length === 0 && !transcript && !isProcessing && (
          <div className="flex flex-col items-center justify-center flex-1 text-center opacity-40 py-10">
            <div className="w-16 h-16 mb-4 rounded-full border border-white/10 overflow-hidden grayscale mx-auto">
               <img src="/megapark-logo.jpg" alt="Megapark" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-lg font-black text-white uppercase tracking-widest">MEGAPARK LIVE</h2>
          </div>
        )}

        <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
          {historyList.map((item) => {
            const own = isOwnMessage(item.source_language);
            return (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={item.id} className={cn("flex flex-col max-w-[85%]", own ? "self-end items-end" : "self-start items-start")}>
                <div className={cn("p-4 rounded-2xl shadow-lg border backdrop-blur-md flex flex-col gap-2", own ? "bg-orange-950/30 border-orange-500/20 rounded-br-sm" : "bg-purple-950/30 border-purple-500/20 rounded-bl-sm")}>
                  <p className="text-base font-bold text-white leading-tight">{item.original_text}</p>
                  <div className={cn("h-px w-full opacity-20", own ? "bg-orange-500" : "bg-purple-500")} />
                  {item.translated_text.split('\n').map((line, idx) => {
                    const match = line.match(/\[(.*?)\]\s*(.*)/);
                    const lang = match ? match[1] : '';
                    const txt = match ? match[2] : line;
                    return (
                      <div key={idx} className="flex items-center justify-between gap-3 w-full">
                        <p className="text-sm text-orange-100/80 font-medium leading-tight flex-1">
                           <span className="text-[8px] uppercase tracking-tighter opacity-50 block">{lang}</span>
                           {txt}
                        </p>
                        <button onClick={() => speakText(txt, lang)} className="p-1.5 bg-white/5 rounded-full text-white/30 shrink-0"><Volume2 className="w-3 h-3" /></button>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
          {transcript && (
            <div className="flex flex-col max-w-[85%] self-end items-end">
              <div className="p-4 rounded-2xl border border-orange-500/40 bg-orange-900/10 backdrop-blur-md rounded-br-sm">
                <p className="text-base font-bold text-white/70 leading-tight">{transcript}<span className="w-1.5 h-3 ml-1 inline-block bg-orange-500 animate-pulse" /></p>
              </div>
            </div>
          )}
          {isProcessing && (
            <div className="p-3 self-start rounded-2xl border border-white/5 bg-black/20 backdrop-blur-md rounded-bl-sm flex items-center gap-2">
               <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
               <span className="text-[8px] font-bold text-purple-300 uppercase tracking-widest animate-pulse">Translating...</span>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Footer fijo al fondo del contenedor */}
      <footer className="relative z-30 w-full p-4 bg-gradient-to-t from-[#0a0510] via-[#0a0510] to-transparent shrink-0 pb-6 md:pb-8">
        <div className="max-w-xl mx-auto flex items-center gap-2 bg-white/5 backdrop-blur-2xl border border-white/10 p-2 rounded-full shadow-2xl">
          <button onClick={toggleRecording} className={cn("w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-all", isRecording ? "bg-red-600" : "bg-orange-600")}>
            {isRecording ? <Square className="text-white w-4 h-4" fill="currentColor" /> : <Mic className="text-white w-5 h-5" />}
          </button>
          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            className="flex-1 bg-transparent text-sm font-medium text-white placeholder:text-white/20 outline-none px-2 h-10"
          />
          {!isRecording && transcript.trim() && (
            <button onClick={handleManualTranslate} className="w-10 h-10 shrink-0 bg-white/10 text-white rounded-full flex items-center justify-center"><Send className="w-4 h-4 ml-0.5" /></button>
          )}
        </div>
      </footer>

      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-600 text-white rounded-full text-[10px] font-black uppercase shadow-2xl">
          {error}
        </div>
      )}
    </div>
  );
}
