const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Process image with local Sharp script
app.post('/process', upload.single('image'), async (req, res) => {
  try {
    const imagePath = req.file.path;
    const outputPath = `output_${Date.now()}.ply`;
    
    console.log(`Processing image: ${imagePath}`);
    
    // Run the Sharp API script locally
    const python = spawn('modal', ['run', 'sharp_api.py', '--', imagePath]);
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`stdout: ${data}`);
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`stderr: ${data}`);
    });
    
    python.on('close', async (code) => {
      try {
        // Clean up uploaded image
        await fs.unlink(imagePath);
        
        if (code !== 0) {
          return res.status(500).json({
            success: false,
            error: `Script failed with code ${code}: ${stderr}`
          });
        }
        
        // Find the generated PLY file
        const plyFileName = path.basename(imagePath, path.extname(imagePath)) + '_gaussian.ply';
        
        // Read the PLY file
        const plyData = await fs.readFile(plyFileName);
        const plyBase64 = plyData.toString('base64');
        
        // Clean up PLY file
        await fs.unlink(plyFileName);
        
        res.json({
          success: true,
          ply: plyBase64
        });
        
      } catch (err) {
        console.error('Error processing result:', err);
        res.status(500).json({
          success: false,
          error: err.message
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Local Sharp processing server running on http://localhost:${PORT}`);
});
