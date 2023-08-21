const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
var cors = require('cors');
const { Keyring,  WsProvider, ApiPromise} = require('@polkadot/api');
const { mnemonicGenerate } = require('@polkadot/util-crypto');

const filesPayloadExists = require('./middleware/filesPayloadExists');
const fileExtLimiter = require('./middleware/fileExtLimiter');
const fileSizeLimiter = require('./middleware/fileSizeLimiter');

const PORT = process.env.PORT || 3500;

const app = express();
app.use(cors({
    origin: "*",
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
       "Access-Control-Allow-Headers": "*",
    },
  }));

  async function runUpload(filePath, fileName) {
    const wsProvider = new WsProvider('ws://34.142.208.254:9944');
    const api = await ApiPromise.create({ provider: wsProvider });
    await api.isReady;
    

    const keyring = new Keyring({ type: 'sr25519' });
    const alice = keyring.addFromUri('//Alice');
    

    try{
        const submitExtrinsic = api.tx.cloudfile.addNewFile('256ytr54rft67uyh', filePath, fileName);
        await submitExtrinsic.signAndSend(alice);
       
    }
    catch(error){
        console.log(error);
    }  


}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post('/transaction', async (req, res) => {
    try { 
        const { mnemonic, to } = req.params.body
        const wsProvider = new WsProvider('ws://34.142.208.254:9944');
        const api = await ApiPromise.create({ provider: wsProvider });
        await api.isReady;
        

        if (!mnemonic || !to) {
            console.log(error);
            return res.sendStatus(400).json({
                "message": "Invalid SEEDS"
            });
        }
   
        const keyring = new Keyring();
        const pair = keyring.createFromUri(mnemonic);

        const txHash = await api.tx.balances
            .transfer(to, 12345)
            .signAndSend(pair);

        return res.status(200).json({
            "message": "transaction success",
            "trx": txHash
        });
    } catch (error) {
        console.log(error);
        return res.sendStatus(400);
    }
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
    async (req, res) => {
        const files = req.files
        console.log(files)
        let fileP = "";

        Object.keys(files).forEach(key => {
            const filepath = path.join(__dirname, 'files', files[key].name)
            fileP = files[key].name;
            files[key].mv(filepath, (err) => {
                if (err) return res.status(500).json({ status: "error", message: err })
            })
        })
        try {
            await runUpload("https://files.bethel.network/download/"+fileP, fileP);
        } catch (error) {
            console.log(error);
            return res.sendStatus(400);
        }

        return res.json({ status: 'success', message: "https://files.bethel.network/download/"+fileP })
    }
)




app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));