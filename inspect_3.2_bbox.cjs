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

    let foundNonTrans = false;
    for (let y = 0; y < image.bitmap.height; y += 10) {
        for (let x = 0; x < image.bitmap.width; x += 10) {
            const color = intToRGBA(image.getPixelColor(x, y));
            if (color.a > 50) {
                console.log(`First visible pixel roughly at: (${x}, ${y}): ${color.r}, ${color.g}, ${color.b}, a=${color.a}`);
                foundNonTrans = true;
                break;
            }
        }
        if (foundNonTrans) break;
    }
}
check();
