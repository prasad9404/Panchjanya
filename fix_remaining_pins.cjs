const fs = require('fs');
const path = require('path');
const { Jimp, intToRGBA } = require('C:/process_pins/node_modules/jimp');

const targetDir = 'd:/DharmaDisha/Panchjanya/Panchjanya-main/public/icons/pins/3 Shri_Chakrapani_Prabhu_Pin';

async function processSvg(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const startIdx = content.indexOf('base64,') + 7;
    const endIdx = content.indexOf('"', startIdx);
    if (startIdx < 7 || endIdx === -1) {
        console.log(`Skipping ${filePath} (No base64 PNG found)`);
        return;
    }

    const base64Data = content.substring(startIdx, endIdx);
    const buffer = Buffer.from(base64Data, 'base64');
    const image = await Jimp.read(buffer);

    let modifications = 0;

    // Iterate over all pixels
    for (let y = 0; y < image.bitmap.height; y++) {
        for (let x = 0; x < image.bitmap.width; x++) {
            const color = intToRGBA(image.getPixelColor(x, y));
            // Global replacement of near-white pixels
            if (color.r >= 235 && color.g >= 235 && color.b >= 235) {
                if (color.a > 0) {
                    image.setPixelColor(0x00000000, x, y);
                    modifications++;
                }
            }
        }
    }

    if (modifications > 0) {
        const newBase64 = await image.getBase64("image/png");
        const newBase64Part = newBase64.replace(/^data:image\/png;base64,/, '');

        if (base64Data !== newBase64Part) {
            const newContent = content.substring(0, startIdx) + newBase64Part + content.substring(endIdx);
            fs.writeFileSync(filePath, newContent);
            console.log(`Saved ${filePath} (Modified)`);
        } else {
            console.log(`No changes needed for ${filePath}`);
        }
    } else {
        console.log(`No white pixels found for ${filePath}`);
    }
}

async function main() {
    const files = fs.readdirSync(targetDir);
    for (const file of files) {
        if (file.endsWith('.svg')) {
            const fullPath = path.join(targetDir, file);
            await processSvg(fullPath);
        }
    }
    console.log('Done!');
}

main().catch(console.error);
