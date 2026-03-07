const fs = require('fs');
const { Jimp, intToRGBA } = require('C:/process_pins/node_modules/jimp');

async function fixGlobalWhite() {
    const filePath = 'public/icons/pins/3 Shri_Chakrapani_Prabhu_Pin/3.2.svg';
    let content = fs.readFileSync(filePath, 'utf8');
    const startIdx = content.indexOf('base64,') + 7;
    const endIdx = content.indexOf('"', startIdx);
    const base64Data = content.substring(startIdx, endIdx);
    const buffer = Buffer.from(base64Data, 'base64');
    const image = await Jimp.read(buffer);

    for (let y = 0; y < image.bitmap.height; y++) {
        for (let x = 0; x < image.bitmap.width; x++) {
            const color = intToRGBA(image.getPixelColor(x, y));
            if (color.r >= 235 && color.g >= 235 && color.b >= 235) {
                image.setPixelColor(0x00000000, x, y);
            }
        }
    }

    const newBase64 = await image.getBase64("image/png");
    const newBase64Part = newBase64.replace(/^data:image\/png;base64,/, '');

    const newContent = content.substring(0, startIdx) + newBase64Part + content.substring(endIdx);
    fs.writeFileSync(filePath, newContent);
    console.log(`Saved ${filePath}`);
}
fixGlobalWhite();
