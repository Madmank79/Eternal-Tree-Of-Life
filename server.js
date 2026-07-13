const express = require('express');
const cors = require('cors'); // Required for CORS
const app = express();
const sharp = require('sharp');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// --- CORS CONFIGURATION ---
// This bridge allows your Wix site to talk to your Render server
app.use(cors({
    origin: "https://theeternaltreeoflife.wixsite.com"
}));

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Middleware to parse JSON
app.use(express.json());

// Helper function to wrap text for the image
function wrapText(text, maxChars) {
    if (!text) return [];
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
        if ((currentLine + ' ' + words[i]).length < maxChars) {
            currentLine += ' ' + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);
    return lines;
}

// Route to receive the mint request
app.post('/mint', async (req, res) => {
    try {
        console.log("Received data from Wix:", req.body);
        const { firstName, birthDate, deathDate, message } = req.body;
        const bDate = birthDate ? birthDate.slice(0, 10) : "N/A";
        const dDate = deathDate ? deathDate.slice(0, 10) : "N/A";
        
        const wrappedLines = wrapText(message, 40);
        let messageLines = [];
        for (let i = 0; i < wrappedLines.length; i++) {
            messageLines.push(`<text x="416" y="${640 + (i * 30)}" text-anchor="middle" font-family="Arial" font-size="20">${wrappedLines[i]}</text>`);
        }

        const templatePath = path.join(__dirname, 'candle-template-blank.jpg');
        const svgOverlay = `
            <svg width="832" height="1248" xmlns="http://www.w3.org/2000/svg">
                <text x="416" y="500" text-anchor="middle" font-family="Arial" font-size="70">${firstName}</text>
                <text x="416" y="560" text-anchor="middle" font-family="Arial" font-size="40">${bDate} - ${dDate}</text>
                ${messageLines.join('')}
            </svg>`;

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

        res.json({ success: true, imageUrl: result.secure_url });
    } catch (err) {
        console.error("Backend error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

