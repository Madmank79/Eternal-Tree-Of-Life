const express = require('express');
const app = express();
const sharp = require('sharp');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: 'dkrsssltc',
  api_key: '575568288355494',
  api_secret: '8hxJW5piPGCmLLJpVTca-9PpuO0' 
});

app.use(express.json());

// Helper function: Smart word wrapping to prevent mid-word breaking (e.g., pi-oneer)
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
    try {
        const { firstName, birthDate, deathDate, message } = req.body;
        
        // Simple date formatting
        const bDate = birthDate ? birthDate.slice(0, 10) : "N/A";
        const dDate = deathDate ? deathDate.slice(0, 10) : "N/A";

        // Generate smart-wrapped message lines (Max 10 lines)
        const charsPerLine = 28; 
        const wrappedLines = wrapText(message, charsPerLine).slice(0, 10);
        
        let messageLines = [];
        for (let i = 0; i < wrappedLines.length; i++) {
            // Soft charcoal color (#1A1A1A) blends much better than harsh pure black
            messageLines.push(`
                <text x="416" y="${610 + (i * 38)}" 
                      text-anchor="middle" 
                      font-family="Arial, sans-serif" 
                      font-size="26" 
                      fill="#1A1A1A" 
                      filter="url(#jar-curve)">${wrappedLines[i]}</text>
            `);
        }

        const templatePath = path.join(__dirname, 'candle-template-blank.jpg');

        // Create the SVG overlay with a subtle cylindrical distortion filter
        const svgOverlay = `
            <svg width="832" height="1248" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="jar-curve">
                        <feTurbulence type="fractalNoise" baseFrequency="0.01 0.0" numOctaves="1" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </defs>
                
                <text x="416" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" fill="#111111" font-weight="bold" filter="url(#jar-curve)">${firstName || ''}</text>
                
                <text x="416" y="555" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="#222222" font-weight="bold" filter="url(#jar-curve)">${bDate} - ${dDate}</text>
                
                ${messageLines.join('')}
            </svg>`;

        // Process the image with Sharp
        const buffer = await sharp(templatePath)
            .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
            .jpeg({ quality: 95 })
            .toBuffer();

        // Upload directly to Cloudinary
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }).end(buffer);
        });

        // Send the secure URL back to your Wix site
        res.status(200).json({ success: true, imageUrl: result.secure_url });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(3000, () => console.log("Server running and ready for Cloudinary uploads with text warping!"));

