const fs = require('fs');
const file = 'C:/Users/tulie/OneDrive/Escritorio/Proyectos Antigravity/Traductor-Granite/traductor-app/src/App.jsx';
const code = fs.readFileSync(file, 'utf8');

// replace h-screen with h-[100dvh]
let newCode = code.replace(/h-screen/g, 'h-[100dvh]');

// Find the welcome banner:
// {/* Welcome message bubble */}
//         <div className="flex flex-col items-center mb-8 mt-4 text-center">
//           <div className="bg-black/60 border border-orange-500/20 backdrop-blur-md rounded-2xl px-6 py-4 shadow-xl">
//             <h1 className="text-2xl font-black text-orange-500 uppercase tracking-tighter" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.8)' }}>
//               MEGAPARK LIVE TRANSLATOR
//             </h1>
//             <p className="text-white/60 text-xs mt-1 font-medium tracking-wide uppercase">
//               Speak or type. Your translation history will appear here.
//             </p>
//           </div>
//         </div>

const bannerRegex = /\{\/\* Welcome message bubble \*\/\}(.|\n|\r)*?<\/div>\s*<\/div>/;

const newBanner = `{historyList.length === 0 && !transcript && !isProcessing && (
          <div className="flex flex-col items-center justify-center flex-1 mt-12 text-center">
            <div className="w-24 h-24 mb-6 rounded-full border-2 border-orange-500/20 overflow-hidden shadow-[0_0_20px_rgba(234,88,12,0.1)]">
               <img src="/megapark-logo.jpg" alt="Megapark" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white/50 uppercase tracking-tighter">
              Megapark <span className="text-orange-500/60">Live</span>
            </h1>
            <p className="text-white/30 text-sm mt-3 font-medium tracking-wide">
              {baseLang === 'es-ES' ? 'Habla o escribe para traducir' : 'Sprechen oder tippen zum Übersetzen'}
            </p>
          </div>
        )}`;

newCode = newCode.replace(bannerRegex, newBanner);

// For the scroll issue on mobile, sometimes absolute footer overlapping makes the bottom items unclickable or blocks scroll.
// The main tag:
// <main className="relative z-10 flex-1 flex flex-col p-4 md:p-8 overflow-y-auto custom-scrollbar max-w-4xl mx-auto w-full pb-32">
// This looks fine, but let's make sure it handles touch scroll by adding -webkit-overflow-scrolling: touch or using flex properly.
newCode = newCode.replace('overflow-y-auto custom-scrollbar', 'overflow-y-auto overscroll-y-contain custom-scrollbar scroll-smooth');

// Write back
fs.writeFileSync(file, newCode);
console.log('Done');
