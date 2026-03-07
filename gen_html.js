const fs = require('fs');
const path = require('path');
const dir = 'public/icons/pins';
const folders = fs.readdirSync(dir);
let html = '<body style="background:green;display:flex;flex-wrap:wrap;gap:10px;">';
for (let f of folders) {
    const sub = path.join(dir, f);
    if (fs.statSync(sub).isDirectory()) {
        const files = fs.readdirSync(sub);
        for (let img of files) {
            if (img.endsWith('.svg')) {
                html += `<div><p style="color:white">${f}/${img}</p><img src='${sub.replace(/\\/g, '/')}/${img}' style='width:50px;'></div>`;
            }
        }
    }
}
html += '</body>';
fs.writeFileSync('all_pins.html', html);
