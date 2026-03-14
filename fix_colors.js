const fs = require('fs');
const path = require('path');

const dir = 'frontend/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');

    // Fix Action links / text colors
    content = content.replace(/text-blue-[6789]00/g, "text-blue-400");
    content = content.replace(/text-purple-[6789]00/g, "text-purple-400");
    content = content.replace(/text-green-[6789]00/g, "text-emerald-400");
    content = content.replace(/text-red-[6789]00/g, "text-rose-400");
    content = content.replace(/text-yellow-[6789]00/g, "text-amber-400");

    // Fix Badges
    content = content.replace(/bg-green-100/g, "bg-emerald-500/10 border border-emerald-500/20");
    content = content.replace(/bg-red-100/g, "bg-rose-500/10 border border-rose-500/20");
    content = content.replace(/bg-yellow-100/g, "bg-amber-500/10 border border-amber-500/20");
    content = content.replace(/bg-blue-100/g, "bg-blue-500/10 border border-blue-500/20");

    fs.writeFileSync(path.join(dir, file), content, 'utf8');
});
console.log("Colors fixed.");
