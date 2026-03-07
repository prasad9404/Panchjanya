const fs = require('fs');
const { Jimp, intToRGBA } = require('C:/process_pins/node_modules/jimp');

async function check() {
    const filePath = 'public/icons/pins/3 Shri_Chakrapani_Prabhu_Pin/3.2.svg';
    let content = fs.readFileSync(filePath, 'utf8');
    const startIdx = content.indexOf('base64,') + 7;
    const endIdx = content.indexOf('"', startIdx);
    const base64Data = content.substring(startIdx, endIdx);
    const buffer = Buffer.from(base64Data, 'base64');
    const image = await Jimp.read(buffer);

    for (let x = 0; x < 600; x += 20) {
        const color = intToRGBA(image.getPixelColor(x, 600));
        console.log(`x=${x}: ${color.r}, ${color.g}, ${color.b}, a=${color.a}`);
    }
}
check();
