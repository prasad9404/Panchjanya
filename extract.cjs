const fs = require('fs');
let content = fs.readFileSync('public/icons/pins/3 Shri_Chakrapani_Prabhu_Pin/3.2.svg', 'utf8');
const startIdx = content.indexOf('base64,') + 7;
const endIdx = content.indexOf('"', startIdx);
const base64Data = content.substring(startIdx, endIdx);
const buffer = Buffer.from(base64Data, 'base64');
fs.writeFileSync('3.2.png', buffer);
