
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jsPDF = require("jspdf");
const fs = require("fs");
const bcrypt = require('bcrypt');
//const gridfs = require('gridfs-stream');
const multer = require('multer');
const { text } = require("pdfkit");
app.use(express.static('pub'));
app.use(bodyParser.urlencoded({ extended: true }));
const User = require("./model/User");
const Mod = require("./model/Mod");


const path = require("path");
app.set("view engine", "html");
app.engine("html", require("ejs").renderFile);

//connessione al db Ospedaledb su cluster Mongodb

const dbUrl = process.env.MONGODB_URI || "mongodb+srv://Gianni:1234@clustervincenzo.3glcyhq.mongodb.net/OspedaleDb?retryWrites=true&w=majority";

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
})
.then(() => console.log("Database registrazione connesso"))
.catch(err => console.error("Errore di connessione al database:", err));





    //creazione modello user=paziente
    //const User = mongoose.model("User", userSchema);

    //dati registrazione profilo paziente datab
    
    const notesSchema = {
    nome: String,
    cognome: String,
    nato: String,
    data: String,
    residenza: String,
    telefono: Number,
    email: String
    
};


const Note = mongoose.model("Note", notesSchema);
    //creato data in Mongo+ controlli

app.get("/", async (req, res) => {
    try {
        res.sendFile(__dirname + "/pub/index.html");
    } catch (error) {
        console.error("Errore durante la gestione della richiesta GET:", error);
        res.status(500).send("Errore interno del server");
    }
});

app.post("/", async (req, res) => {
    try {
        res.sendFile(__dirname + "/pub/index.html");
        if (!req.body.nome || !req.body.cognome) {
            return res.status(400).send("Dati non compilati in modo corretto.");
        }
// recupera dati da form in index.html
        let newNote = new Note({
            nome: req.body.nome,
            cognome: req.body.cognome,
            nato: req.body.nato,
            data: req.body.data,
            residenza: req.body.residenza,
            telefono: req.body.telefono,
            email: req.body.email
            
        });

        await newNote.save();

        // Genera e salva il PDF 
        generatePDF(newNote);

        res.redirect("/");
    } catch (error) {
        console.error("Errore durante la gestione della richiesta POST:", error);
        res.status(500).send("Errore interno del server");
    }
});









// Middleware per servire file statici dalla directory pub
app.use(express.static('pub'));

//  route per la Home Page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/pub/index.html');
});




const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server in esecuzione sulla porta ${port}`);
});


//schema db login


// register form
app.get("/register", function (req, res) {
    res.render("home");
});
 
//  user signup
app.post("/register", async (req, res) => {
    const user = await User.create({
      username: req.body.username,
      password: req.body.password
    });
   
    return res.render("mod");
  });
 

// Mostra il form di login
app.get("/login", (req, res) => {
    res.render("login");
});

// Login per l'utente
app.get("/", function(req, res) {
    res.sendFile(path.join(__dirname, "index.html"));
  });
 
// user login
app.post("/login", async function(req, res) {
    try {
        const user = await User.findOne({ username: req.body.username });

        if (user) {
            const result = req.body.password === user.password;

            if (result) {
                res.render("home");
            } else {
                res.status(400).json({ error: "Password errata" });
            }
        } else {
            res.status(400).json({ error: "L' utente non esiste" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

 
// user logout 
app.get("/logout", function (req, res) {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/index');
      });
});
 
 
 
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect("/login");
}


// Login per il moderatore
app.post("/mod", async (req, res) => {
    try {
        const mod = await Mod.findOne({ username: req.body.username });

        if (mod) {
            const result = req.body.password === mod.password;

            if (result) {
                res.render("mod");
            } else {
                res.status(400).json({ error: "Password errata" });
            }
        } else {
            res.status(400).json({ error: "Il moderatore non esiste" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});


//  route per la pagina di prenotazione
app.get("/prenotazione", async (req, res) => {
    try {
        res.sendFile(__dirname + "/pub/prenotazione.html");
    } catch (error) {
        console.error("Errore durante la gestione della richiesta GET:", error);
        res.status(500).send("Errore interno del server");
    }
});

// Gestione della richiesta di prenotazione
app.post("/prenotazione", async (req, res) => {
    try {
        

        if (!req.body.nome || !req.body.cognome || !req.body.tipoVisita || !req.body.data) {
            return res.status(400).send("Compila tutti i campi del modulo di prenotazione.");
        }

        // ricezione dati body prenotazione
        let newPrenotazione = new Prenotazione({
            nome: req.body.nome,
            cognome: req.body.cognome,
            dataNascita: req.body.dataNascita,
            codiceFiscale: req.body.codiceFiscale,
            indirizzo: req.body.indirizzo,
            tipoVisita: req.body.tipoVisita,
            data: req.body.data,
            note: req.body.note
        });

        // Salva la prenotazione nel database
        await newPrenotazione.save();

       

        res.render("home"); // Redirect alla pagina di prenotazione
    } catch (error) {
        console.error("Errore durante la gestione della richiesta POST:", error);
        res.status(500).send("Errore interno del server");

    }
});









//modello prenotazione
const prenotazioneSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    cognome: { type: String, required: true },
    dataNascita: { type: Date, required: true },
    codiceFiscale: { type: String },
    indirizzo: { type: String },
    tipoVisita: { type: String, required: true },
    data: { type: Date, required: true },
    note: { type: String }
});

const Prenotazione = mongoose.model('Prenotazione', prenotazioneSchema);

module.exports = Prenotazione;









//importa immagine in mongo

const ImageSchema = new mongoose.Schema({
    path: { type: String, required: true },
  
  });
  
  const ImageModel = mongoose.model('Image', ImageSchema);
  
  // Salva il percorso dell'immagine nel database

  const nuovaImmagine = new ImageModel({ path: '"C:\Users\vince\OneDrive\Desktop\db.png"' });
   nuovaImmagine.save()
    .then(() => {
      console.log('Immagine salvata con successo nel database.');
    })
    .catch((errore) => {
      console.error('Errore nel salvataggio dell\'immagine nel database:', errore);
    });

    
    const Image = require('./index.js');






    ////visulizzo immagine da mongo
    app.get('/uploads/:id', async (req, res) => {
        try {
            const image = await ImageModel.findById(req.params.id.replace(/[{()}]/g, ''));
    
            if (!image) {
                return res.status(404).send('Immagine non trovata');
            }
    
            // Invia i dati dell'immagine come risposta
            res.contentType(image.contentType);
            res.send(image.data);
        } catch (error) {
            console.error(error);
            res.status(500).send('Errore del server');
        }
    });



    




// Definizione dello schema del modulo di domande e risposte
const domandeSchema = new mongoose.Schema({
    nome: String,
    domanda1: String,
    domanda2: String,
    
});

const DomandeModel = mongoose.model('Domande', domandeSchema);

// Middleware per il parsing del corpo della richiesta
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Gestione della richiesta di invio del modulo
app.post('/submitForm', async (req, res) => {
    try {
        const nuovaDomanda = new DomandeModel(req.body);
        await nuovaDomanda.save();
        res.send('Modulo inviato con successo!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Errore durante l\'invio del modulo.');
    }
});



app.get('/getQuestions', async (req, res) => {
    try {
        const domande = await DomandeModel.find({}, '-_id -__v');
        res.json(domande);
    } catch (error) {
        console.error(error);
        res.status(500).send('Errore durante il recupero delle domande.');
    }
});








// Definizione dello schema del modulo di risposte
const risposteSchema = new mongoose.Schema({
    domandaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Domande', required: true },
    risposta: String,
    // Aggiungi altri campi necessari
});

const RisposteModel = mongoose.model('Risposte', risposteSchema);

// ...

// Gestione della richiesta di invio delle risposte
app.post('/risposteForm', async (req, res) => {
    try {
        const nuovaRisposta = new RisposteModel(req.body);
        await nuovaRisposta.save();
        res.send('Risposta inviata con successo!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Errore durante l\'invio della risposta.');
    }
});

// Aggiungi questo dopo l'inizializzazione di app
app.get('/getAnswers', async (req, res) => {
    try {
        const risposte = await RisposteModel.find({}, '-__v');
        res.json(risposte);
    } catch (error) {
        console.error(error);
        res.status(500).send('Errore durante il recupero delle risposte.');
    }
});






















































































// Definizione del modello per i corsi
const Corso = mongoose.model('Corso', {
    titolo: String,
    descrizione: String,
    istruttore: String,
    videoURL: String
  });


// Endpoint per la visualizzazione della lista dei corsi
app.get('/corsi', async (req, res) => {
    try {
      const corsi = await Corso.find();
      res.send(corsi);
    } catch (error) {
      console.error('Errore durante il recupero dei corsi:', error);
      res.status(500).send('Errore interno del server');
    }
  });
  
  // Endpoint per l'aggiunta di un nuovo corso
  app.post('/aggiungi-corso', async (req, res) => {
    try {
      // Estrai i dati dal body della richiesta
      const { titolo, descrizione, istruttore, videoURL } = req.body;
  
      // Crea un nuovo corso utilizzando il modello
      const nuovoCorso = new Corso({
        titolo,
        descrizione,
        istruttore,
        videoURL
      });
  
      // Salva il nuovo corso nel database
      await nuovoCorso.save();
  
      res.redirect('/mod');
    } catch (error) {
      console.error('Errore durante l\'aggiunta del corso:', error);
      res.status(500).send('Errore interno del server');
    }
  });









































//// vecchi codici di test e prova



//  vecchi collegamenti pagine
//app.get('/prenotazione', (req, res) => {
  //res.sendFile(__dirname + '/pub/prenotazione.html');
//});
//app.get('/login', (req, res) => {
    //res.sendFile(__dirname + '/pub/login.html');
  //});
//pdf visita medica
//function generatePDF(data) {
   // const pdf = new jsPDF();
    // Aggiungi il contenuto al PDF
    //pdf.text(20, 20, 'Dati Paziente:');
    //pdf.text(20, 30, 'Nome: ' + data.nome);
   // pdf.text(20, 40, 'Cognome: ' + data.cognome);
   //const pdfPath = __dirname + "/pdfs/prenotazione_" + data._id + ".pdf";

    // Salva il PDF
    //pdf.save(pdfPath, () => {
   //     console.log("PDF salvato:", pdfPath);
   //// });
//}


//const Grid = require('gridfs-stream');
//Grid.mongo = mongoose.mongo;
//const gfs = Grid(mongoose.connection.db);
//
//app.get('/video/:filename', (req, res) => {
    //const readstream = gfs.createReadStream({ filename: req.params.filename });
    //readstream.pipe(res);
////});

//app.get('/video/:filename', (req, res) => {
    ///const readstream = gfs.createReadStream({ filename: req.params.filename });
    //readstream.pipe(res);
//});

//app.listen(port, () => {
   // console.log(`Server in esecuzione sulla porta ${port}`);
//});



// Codice lato client
// Codice lato client
//const imgElement = document.getElementById('immagineVisibile');
//imgElement.src = `/uploads/${idDellImmagineDaVisualizzare}`;


// index.js
////const imgElement = document.getElementById('immagineVisibile');

// Immagine da visualizzare (sostituisci con il percorso appropriato o URL dell'immagine)
//const imagePath = '/uploads/65c676eb1c54e06c8cdfa042';

// Imposta il percorso dell'immagine come sorgente dell'elemento immagine
//imgElement.src = imagePath;


