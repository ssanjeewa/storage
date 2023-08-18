const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
var cors = require('cors');
const { Keyring} = require('@polkadot/api');
const { mnemonicGenerate } = require('@polkadot/util-crypto');

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

app.post('/createwallet', (req, res) => {
    try {
        const mnemonic = mnemonicGenerate();
        // const keyring = new Keyring({ type: 'sr25519', ss58Format: 2 });

        // const pair = keyring.addFromUri(mnemonic, { name: 'first pair' }, 'ed25519');

        const keyring = new Keyring();
        const pair = keyring.createFromUri(mnemonic);

        // the pair has been added to our keyring
        console.log(keyring.pairs.length, 'pairs available');

        // log the name & address (the latter encoded with the ss58Format)
        console.log(pair.meta.name, 'has address', pair.address);

        return res.status(200).json({
            "address": pair.address,
            "seeds": mnemonic,
            "public_key": keyring.encodeAddress(pair.publicKey)
        });
    } catch (error) {
        console.log(error);
        return res.sendStatus(400);
    }
});

app.get('/download/:file', (req, res) => {
    console.log(__dirname +"/files/" + req.params.file)
    res.download(__dirname +"/files/" + req.params.file, (err) => {
        
        if (err) {
          res.status(500).send({
            message: __dirname +"/files/" + req.params.file,
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