const express = require('express');
const app = express();
const sharp = require('sharp');
const path = require('path');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Server is live and ready for minting requests.');
});

function wrapText(text, maxChars) {
    if (!text) return [];
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        if ((currentLine + ' ' + words[i]).length <= maxChars) {
            currentLine += ' ' + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);
    return lines;
}

app.post('/api/mint-candle', async (req, res) => {
    const { firstName, birthDate, deathDate, message } = req.body;
    const bDate = birthDate ? birthDate.slice(0, 10) : "N/A";
    const dDate = deathDate ? deathDate.slice(0, 10) : "N/A";

    // Adjusted for smaller, more readable message text
    const charsPerLine = 35; 
    const wrappedLines = wrapText(message, charsPerLine);

    let messagelines = [];
    for (let i = 0; i < wrappedLines.length; i++) {
        messagelines.push(`
            <text x="416" y="${650 + (i * 40)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#1A1A1A">${wrappedLines[i]}</text>
        `);
    }

    const templatePath = path.join(__dirname, 'candle-template-blank.jpg');
    const svgOverlay = `
    <svg width="832" height="1248" xmlns="http://www.w3.org/2000/svg">
        <text x="416" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="70" fill="#1A1A1A">${firstName}</text>
        <text x="416" y="570" text-anchor="middle" font-family="Arial, sans-serif" font-size="45" fill="#1A1A1A">${bDate} - ${dDate}</text>
        ${messagelines.join('')}
    </svg>`;

    try {
        const buffer = await sharp(templatePath)
            .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
            .jpeg({ quality: 95 })
            .toBuffer();

        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }).end(buffer);
        });

        res.status(200).json({ success: true, imageUrl: result.secure_url });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});