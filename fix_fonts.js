const fs = require('fs');
const path = require('path');

const dir = 'frontend/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');

    // Make backgrounds dark and glass
    content = content.replace(/bg-white\b/g, "glass-panel");
    content = content.replace(/bg-gray-50\b/g, "bg-white/5");
    content = content.replace(/bg-gray-100\b/g, "bg-white/10");
    
    // Borders
    content = content.replace(/border-gray-200\b/g, "border-white/10");
    content = content.replace(/border-gray-300\b/g, "border-white/20");
    content = content.replace(/border-gray-100\b/g, "border-white/5");
    
    // Texts
    content = content.replace(/text-gray-900\b/g, "text-white");
    content = content.replace(/text-gray-800\b/g, "text-white");
    content = content.replace(/text-gray-700\b/g, "text-slate-200");
    content = content.replace(/text-gray-600\b/g, "text-slate-300");
    content = content.replace(/text-gray-500\b/g, "text-slate-400");
    content = content.replace(/text-gray-400\b/g, "text-slate-500");

    // Table rows
    content = content.replace(/hover:bg-gray-50\b/g, "hover:bg-white/5");
    
    // Forms specific (inputs inside dark mode)
    // we must give inputs a dark class because they might look default
    // we'll replace common input classes
    
    fs.writeFileSync(path.join(dir, file), content, 'utf8');
});
console.log("All files processed for dark mode text/background.");
