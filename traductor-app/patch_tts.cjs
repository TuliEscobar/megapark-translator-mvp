const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const ttsFunc = `const speakText = (text, languageName) => {
    if (!window.speechSynthesis) return;
    const msg = new SpeechSynthesisUtterance(text);
    let langCode = 'en-US';
    const lowerLang = languageName.toLowerCase();
    
    if(lowerLang.includes('spanish') || lowerLang.includes('español')) {
      langCode = 'es-ES';
    } else if(lowerLang.includes('german') || lowerLang.includes('alemán') || lowerLang.includes('deutsch')) {
      langCode = 'de-DE';
    }
    
    msg.lang = langCode;
    window.speechSynthesis.speak(msg);
  };

  const clear = () => {`;

code = code.replace('const clear = () => {', ttsFunc);
fs.writeFileSync('src/App.jsx', code);