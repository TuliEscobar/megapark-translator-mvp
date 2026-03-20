const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');
code = code.replace('["gemini-2.0-flash", "gemini-1.5-flash"]', '["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]');
fs.writeFileSync('src/App.jsx', code);