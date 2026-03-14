const fs = require('fs');
const path = require('path');
const dir = 'frontend/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    content = content.replace(/hover:bg-gray-200/g, "hover:bg-white/20 hover:scale-105 transition-all");
    content = content.replace(/bg-gray-200/g, "bg-white/10");
    fs.writeFileSync(path.join(dir, file), content, 'utf8');
});
console.log("hovers fixed");
