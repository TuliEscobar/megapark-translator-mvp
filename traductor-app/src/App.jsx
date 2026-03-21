import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send, Volume2, Sparkles, Lightbulb } from 'lucide-react';
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
  const messagesEndRef = useRef(null);
  const finalTranscriptRef = useRef('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [historyList, transcript, isProcessing]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Web Speech API no soportada.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = baseLang;
    recognition.onstart = () => {
      finalTranscriptRef.current = '';
    };
    recognition.onresult = (event) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; ++i) {
        fullTranscript += event.results[i][0].transcript;
      }
      setTranscript(fullTranscript);
    };
    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
      setTimeout(() => {
        setTranscript(prev => {
          if (prev.trim()) processTranslation(prev.trim());
          return prev;
        });
      }, 500);
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
      setTranscript('');
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

  const processTranslation = async (text, customPrompt = null) => {
    if (!apiKey || !text || isProcessing) return;
    setIsProcessing(true);
    setTranscript('');

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const defaultPrompt = `Task: Translate the following text.
      1. If mainly Spanish, translate to German and English.
      2. If mainly German, translate to Spanish and English.
      3. If mainly English, translate to Spanish and German.
      SPECIAL INSTRUCTION: ONLY if the detected language is GERMAN and the text sounds like a complaint, provide a VERY SHORT (max 12 words) action recommendation in SPANISH.
      Return ONLY JSON: {"detected", "transA", "langA", "transB", "langB", "recommendation"}. Text: "${text}"`;
      
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(customPrompt || defaultPrompt);
      const raw = result.response.text();
      const response = JSON.parse(raw.replace(/```json|```/g, '').trim());

      if (response) {
        let tA = response.transA;
        let lA = response.langA;
        let tB = response.transB;
        let lB = response.langB;

        if (lB.toLowerCase().includes('german')) {
          [tA, tB] = [tB, tA];
          [lA, lB] = [lB, lA];
        }

        const formattedTranslated = `[${lA}] ${tA}${tB ? `\n[${lB}] ${tB}` : ''}`;
        
        // Cuando usamos un consejo, el "original" que guardamos es la respuesta generada
        // pero para evitar la duplicidad visual, si el customPrompt existe, guardamos solo la respuesta
        const saved = await saveTranslation({
          original_text: customPrompt ? "Respuesta automática" : text,
          translated_text: formattedTranslated,
          source_language: response.detected || baseLang,
          target_language: `${lA}/${lB}`,
          recommendation: response.recommendation
        });

        if (saved && saved.success) setHistoryList(prev => [...prev, saved.data]);
        else setHistoryList(prev => [...prev, { id: Date.now(), original_text: customPrompt ? "Respuesta automática" : text, translated_text: formattedTranslated, source_language: response.detected || baseLang, created_at: new Date().toISOString(), recommendation: response.recommendation }]);
      }
    } catch (err) {
      setError('Error en la traducción.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseAdvice = (advice) => {
    const prompt = `Based on: "${advice}", generate a professional response in SPANISH. Then translate ONLY to GERMAN. Return JSON: {"detected": "Spanish", "transA": "German Translation", "langA": "German", "transB": "", "langB": ""}`;
    processTranslation(advice, prompt);
  };

  const speakText = (text, lang) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    const low = (lang || '').toLowerCase();
    if (low.includes('span') || low.includes('espa')) msg.lang = 'es-ES';
    else if (low.includes('ger') || low.includes('alem') || low.includes('deut')) msg.lang = 'de-DE';
    else msg.lang = 'en-US';
    window.speechSynthesis.speak(msg);
  };

  const toggleLanguage = () => setBaseLang(prev => prev === 'es-ES' ? 'de-DE' : 'es-ES');
  const getPlaceholder = () => baseLang === 'es-ES' ? (isRecording ? "Escuchando..." : "Toca el micro o escribe...") : (isRecording ? "Zuhören..." : "Tippen o. sprechen...");

  const isOwnMessage = (sourceLang) => {
    const lower = (sourceLang || '').toLowerCase();
    if (baseLang === 'es-ES') return lower.includes('span') || lower.includes('espa') || lower.includes('es');
    return lower.includes('ger') || lower.includes('alem') || lower.includes('de');
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0a0510] text-white overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1a0b2e] via-[#0a0510] to-[#0a0510] opacity-80" />
      <nav className="relative z-20 w-full h-16 bg-[#050208]/90 backdrop-blur-md border-b border-orange-600/30 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border border-orange-500/50 overflow-hidden"><img src="/megapark-logo.jpg" alt="Logo" className="w-full h-full object-cover" /></div>
          <span className="text-[10px] font-black tracking-widest text-orange-500 uppercase">MEGAPARK</span>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setHistoryList([])} className="p-2 text-white/30 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
           <button onClick={toggleLanguage} className="px-4 py-2 rounded-full text-[10px] font-black text-black bg-orange-600 uppercase shadow-lg active:scale-95 transition-transform">{baseLang === 'es-ES' ? 'YO: ESPAÑOL' : 'YO: DEUTSCH'}</button>
        </div>
      </nav>
      <main className="relative z-10 flex-1 overflow-y-auto custom-scrollbar scroll-smooth flex flex-col px-4 pt-4 pb-24 overscroll-contain">
        {historyList.length === 0 && !transcript && !isProcessing && (
          <div className="flex flex-col items-center justify-center flex-1 text-center opacity-30 my-auto">
            <div className="w-16 h-16 mb-4 rounded-full border border-white/10 overflow-hidden grayscale mx-auto"><img src="/megapark-logo.jpg" alt="Megapark" className="w-full h-full object-cover" /></div>
            <h2 className="text-xs font-bold text-white uppercase tracking-[0.3em]">READY TO TRANSLATE</h2>
          </div>
        )}
        <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto">
          {historyList.map((item) => {
            const own = isOwnMessage(item.source_language);
            const lines = item.translated_text.split('\n').filter(l => l.trim());
            const first = lines[0]?.match(/\[(.*?)\]\s*(.*)/);
            const mainTxt = first ? first[2] : (lines[0] || '');
            const mainLang = first ? first[1] : '';
            return (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={item.id} className={cn("flex flex-col max-w-[88%]", own ? "self-end items-end" : "self-start items-start")}>
                <div className={cn("p-4 rounded-2xl shadow-xl border backdrop-blur-md flex flex-col gap-2", own ? "bg-orange-950/30 border-orange-500/20 rounded-br-sm" : "bg-purple-950/30 border-purple-500/20 rounded-bl-sm")}>
                  <div className="flex items-start justify-between w-full gap-4">
                    <p className="text-lg md:text-xl font-black text-white leading-tight">{mainTxt}</p>
                    <button onClick={() => speakText(mainTxt, mainLang)} className="p-2 bg-white/10 rounded-full text-white shrink-0 active:scale-90"><Volume2 className="w-4 h-4" /></button>
                  </div>
                  <div className={cn("h-px w-full opacity-20 my-1", own ? "bg-orange-500" : "bg-purple-500")} />
                  <div className="flex flex-col gap-2 opacity-70">
                    <p className="text-xs font-bold text-orange-200/90 leading-tight italic">"{item.original_text}"</p>
                    {lines.slice(1).map((line, idx) => {
                      const m = line.match(/\[(.*?)\]\s*(.*)/);
                      return (
                        <div key={idx} className="flex items-center justify-between gap-3 w-full border-t border-white/5 pt-1">
                          <p className="text-[10px] font-medium text-white/60">[{m ? m[1] : ''}] {m ? m[2] : line}</p>
                          <button onClick={() => speakText(m?m[2]:line, m?m[1]:'')} className="p-1 text-white/30"><Volume2 className="w-3 h-3" /></button>
                        </div>
                      );
                    })}
                  </div>
                  {item.recommendation && (
                    <motion.div whileTap={{ scale: 0.98 }} onClick={() => handleUseAdvice(item.recommendation)} className="mt-2 p-3 bg-blue-500/10 border border-blue-400/30 rounded-xl flex gap-3 items-start cursor-pointer hover:bg-blue-500/20 transition-all border-dashed">
                      <Lightbulb className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1">Tulito's Advice <span className="text-[7px] bg-blue-500 text-black px-1 rounded uppercase font-bold">Use response</span></p>
                        <p className="text-xs text-blue-100/90 font-medium italic">"{item.recommendation}"</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
          {transcript && (
            <div className="flex flex-col max-w-[88%] self-end items-end">
              <div className="p-4 rounded-2xl border border-orange-500/40 bg-orange-900/10 backdrop-blur-md rounded-br-sm">
                <p className="text-base font-bold text-white/70 leading-tight">{transcript}<span className="w-1.5 h-3 ml-1 inline-block bg-orange-500 animate-pulse" /></p>
              </div>
            </div>
          )}
          {isProcessing && (
            <div className="p-3 self-start rounded-2xl border border-white/5 bg-black/20 backdrop-blur-md rounded-bl-sm flex items-center gap-2">
               <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
               <span className="text-[9px] font-bold text-purple-300 uppercase tracking-widest animate-pulse">Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </main>
      <footer className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-[#0a0510] to-transparent shrink-0 pb-8">
        <div className="max-w-xl mx-auto flex items-center gap-2 bg-[#1a0b2e]/80 backdrop-blur-2xl border border-white/10 p-2 rounded-full shadow-2xl">
          <button onClick={toggleRecording} className={cn("w-12 h-12 shrink-0 rounded-full flex items-center justify-center transition-all shadow-lg", isRecording ? "bg-red-600 mic-active" : "bg-orange-600 shadow-orange-600/40")}>
            {isRecording ? <Square className="text-white w-5 h-5" fill="currentColor" /> : <Mic className="text-white w-6 h-6" />}
          </button>
          <input type="text" value={transcript} onChange={(e) => setTranscript(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); processTranslation(transcript); } }} placeholder={getPlaceholder()} className="flex-1 bg-transparent text-sm font-medium text-white placeholder:text-white/20 outline-none px-3 h-10" />
          {!isRecording && transcript.trim() && (
            <button onClick={() => processTranslation(transcript)} className="w-12 h-12 shrink-0 bg-white/5 text-orange-500 rounded-full flex items-center justify-center active:scale-95 transition-transform"><Send className="w-5 h-5 ml-0.5" /></button>
          )}
        </div>
      </footer>
      {error && <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-600 text-white rounded-full text-[10px] font-black uppercase shadow-2xl border border-red-500">{error}</div>}
    </div>
  );
}
