const fs = require('fs');
const file = 'C:/Users/tulie/OneDrive/Escritorio/Proyectos Antigravity/Traductor-Granite/traductor-app/src/App.jsx';
let code = fs.readFileSync(file, 'utf8');

// replace h-screen with h-[100dvh]
code = code.replace(/h-screen/g, 'h-[100dvh]');
code = code.replace('overflow-y-auto custom-scrollbar', 'overflow-y-auto overscroll-y-contain custom-scrollbar scroll-smooth');

const start = code.indexOf('{/* Welcome message bubble */}');
const endStr = '</div>\n        </div>';
let end = code.indexOf(endStr, start);

if (start !== -1 && end !== -1) {
  end += endStr.length;
  const chunk = code.substring(start, end);
  
  const newBanner = `
        {/* Welcome Empty State */}
        {historyList.length === 0 && !transcript && !isProcessing && (
          <div className="flex flex-col items-center justify-center flex-1 h-full text-center mt-12 md:mt-24 opacity-80">
             <div className="w-24 h-24 mb-4 rounded-full overflow-hidden shadow-[0_0_20px_rgba(234,88,12,0.1)] border-2 border-orange-500/20">
               <img src="/megapark-logo.jpg" alt="Megapark" className="w-full h-full object-cover" />
             </div>
             <h1 className="text-2xl md:text-3xl font-black text-white/50 uppercase tracking-tighter">
               Megapark <span className="text-orange-500/60">Live</span>
             </h1>
             <p className="text-white/30 text-sm mt-3 font-medium tracking-wide uppercase">
               {baseLang === 'es-ES' ? 'Habla o escribe para comenzar' : 'Sprechen oder tippen für den Start'}
             </p>
          </div>
        )}`;
  
  code = code.replace(chunk, newBanner);
  fs.writeFileSync(file, code);
  console.log('Replaced banner successfully');
} else {
  console.log('Could not find banner');
}
