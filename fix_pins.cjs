const fs = require('fs');
const path = require('path');
const { Jimp, intToRGBA, rgbaToInt } = require('C:/process_pins/node_modules/jimp');

const pinsDir = 'd:/DharmaDisha/Panchjanya/Panchjanya-main/public/icons/pins';

function getSvgFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getSvgFiles(fullPath, fileList);
        } else if (fullPath.endsWith('.svg')) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

// Function to calculate distance from center
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

async function processSvg(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const startIdx = content.indexOf('base64,') + 7;
    const endIdx = content.indexOf('"', startIdx);
    if (startIdx < 7 || endIdx === -1) {
        return;
    }

    const base64Data = content.substring(startIdx, endIdx);
    const buffer = Buffer.from(base64Data, 'base64');
    const image = await Jimp.read(buffer);

    const width = image.bitmap.width;
    const height = image.bitmap.height;

    // Instead of BFS, we will turn ALL near-white pixels to transparent 
    // EXCEPT pixels that are inside the actual pin graphic.
    // Since the pins are essentially circular/teardrop shaped and centered,
    // we can either:
    // 1. Better BFS from corners
    // 2. Just replace all pure white #FFFFFF everywhere (or close to it)

    // Wait, let's see why the original script failed.
    // The original script seed was only the immediate borders of the image (x=0, x=width-1, y=0, y=height-1).
    // Sometimes the pin is cropped such that there's NO white pixel on the edge! (or white pixels are cut off by a non-white transparent border?? No, wait.
    // If a bounding box touches the graphic, the graphic's outline might block the BFS from reaching some white background regions.
    // Or maybe the white isn't exactly white.

    const isRemoveable = (r, g, b, a) => {
        if (a < 50) return true; // Treat low alpha as background
        return r >= 235 && g >= 235 && b >= 235; // increased tolerance
    };

    const isEdge = (r, g, b, a) => {
        return a > 0 && r >= 190 && g >= 190 && b >= 190;
    };

    const visited = new Uint8Array(width * height);
    const queue = [];

    const enqueue = (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return;
        const idx = y * width + x;
        if (visited[idx]) return;

        const color = intToRGBA(image.getPixelColor(x, y));
        if (isRemoveable(color.r, color.g, color.b, color.a)) {
            visited[idx] = 1;
            if (color.a > 0) {
                image.setPixelColor(0x00000000, x, y);
            }
            queue.push({ x, y });
        } else if (isEdge(color.r, color.g, color.b, color.a)) {
            visited[idx] = 1;
            const shadowValue = Math.floor((color.r + color.g + color.b) / 3);
            const alpha = Math.max(0, 255 - shadowValue);
            if (alpha < color.a) {
                // image.setPixelColor(rgbaToInt(0, 0, 0, alpha), x, y);
                image.setPixelColor(0x00000000, x, y); // wait, let's just obliterate whiteish edges to make it fully transparent at borders and avoid halos
            }
        }
    };

    // Just seed queue with top 5 and bottom 5 lines of pixels to ensure we get past any single pixel artifacts on the actual edge
    for (let x = 0; x < width; x++) {
        for (let d = 0; d < 10; d++) {
            enqueue(x, d);
            enqueue(x, height - 1 - d);
        }
    }
    for (let y = 0; y < height; y++) {
        for (let d = 0; d < 10; d++) {
            enqueue(d, y);
            enqueue(width - 1 - d, y);
        }
    }

    let head = 0;
    while (head < queue.length) {
        const { x, y } = queue[head++];
        enqueue(x + 1, y);
        enqueue(x - 1, y);
        enqueue(x, y + 1);
        enqueue(x, y - 1);
    }

    const newBase64 = await image.getBase64("image/png");
    const newBase64Part = newBase64.replace(/^data:image\/png;base64,/, '');

    if (base64Data !== newBase64Part) {
        const newContent = content.substring(0, startIdx) + newBase64Part + content.substring(endIdx);
        fs.writeFileSync(filePath, newContent);
        console.log(`Saved ${filePath} (Modified)`);
    } else {
        console.log(`No changes for ${filePath}`);
    }
}

async function main() {
    const files = getSvgFiles(pinsDir);
    for (const file of files) {
        await processSvg(file);
    }
    console.log('Done!');
}

main().catch(console.error);
