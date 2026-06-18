// Updated generateCandle.js
const PImage = require('pureimage');

async function generateMemorialCandle(name, dates, message, symbol) {
    const img = PImage.make(500, 500);
    const ctx = img.getContext('2d');

    // Fill background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 500, 500);

    // Draw your elements here (excluding .ellipse)
    ctx.fillStyle = '#000000';
    ctx.font = '24pt Arial';
    ctx.fillText(name, 50, 100);
    ctx.fillText(dates, 50, 150);
    ctx.fillText(message, 50, 200);

    // Return the image buffer
    return await PImage.encodePNGToStream(img);
}

module.exports = { generateMemorialCandle };
