const fs = require('fs');
const path = require('path');
const dir = 'public/icons/pins';
const folders = fs.readdirSync(dir);
let html = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { background-color: #33ff33; padding: 20px; font-family: sans-serif; }
        .pin-container { display: flex; flex-wrap: wrap; gap: 20px; }
        .pin-box { text-align: center; }
        img { width: 80px; height: 80px; border: 1px dotted red; }
    </style>
</head>
<body>
    <h1>Pin Transparency Test</h1>
    <div class="pin-container">`;

for (let f of folders) {
    const sub = path.join(dir, f);
    if (fs.statSync(sub).isDirectory()) {
        const files = fs.readdirSync(sub);
        for (let img of files) {
            if (img.endsWith('.svg')) {
                html += `<div class="pin-box"><p>${f}/${img}</p><img src='${sub.replace(/\\/g, '/')}/${img}'></div>`;
            }
        }
    }
}
html += '</div></body></html>';
fs.writeFileSync('all_pins.html', html);
