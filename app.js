const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
var cors = require('cors');

const filesPayloadExists = require('./middleware/filesPayloadExists');
const fileExtLimiter = require('./middleware/fileExtLimiter');
const fileSizeLimiter = require('./middleware/fileSizeLimiter');

const PORT = process.env.PORT || 3500;

const app = express();
app.use(cors({
    origin: "http://localhost:3500",
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
       "Access-Control-Allow-Headers": "*",
    },
  }));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get('/download/:file', (req, res) => {
    console.log(__dirname +"/files/" + req.params.file)
    res.download(__dirname +"/files/" + req.params.file, (err) => {
        
        if (err) {
          res.status(500).send({
            message: "Could not download the file. " + err,
          });
        }
    });    
});

app.post('/upload',
    fileUpload({ createParentPath: true }),
    filesPayloadExists,
   // fileExtLimiter(['.png', '.jpg', '.jpeg']),
    fileSizeLimiter,
    (req, res) => {
        const files = req.files
        console.log(files)

        Object.keys(files).forEach(key => {
            const filepath = path.join(__dirname, 'files', files[key].name)
            files[key].mv(filepath, (err) => {
                if (err) return res.status(500).json({ status: "error", message: err })
            })
        })

        return res.json({ status: 'success', message: Object.keys(files).toString() })
    }
)




app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));