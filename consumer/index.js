const { Kafka } = require('kafkajs');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const express = require('express');
const app = express();
app.use(cors()); 
const port = 3005;
const server = http.createServer(app);

const map_origine = [
    [-50,-50,-50,-50,-50,-50,-50,-50,-50,-50],
    [-50,0,0,0,0,0,20,-50,0,-50],
    [-50,0,0,0,-50,-50,-50,-50,0,-50],
    [-50,0,-50,0,0,20,0,0,0,-50],
    [-50,0,-50,1,-50,0,-50,1,1,-50],
    [-50,0,0,0,-50,0,0,0,40,-50],
    [-50,0,0,0,-50,0,0,0,0,-50],
    [-50,0,0,0,-50,0,0,0,0,-50],
    [-50,-50,-50,-50,-50,-50,-50,-50,-50,-50]
  ];
let map = [
    [-50,-50,-50,-50,-50,-50,-50,-50,-50,-50],
    [-50,0,0,0,0,0,20,-50,0,-50],
    [-50,0,0,0,-50,-50,-50,-50,0,-50],
    [-50,0,-50,0,0,20,0,0,0,-50],
    [-50,0,-50,1,-50,0,-50,1,1,-50],
    [-50,0,0,0,-50,0,0,0,40,-50],
    [-50,0,0,0,-50,0,0,0,0,-50],
    [-50,0,0,0,-50,0,0,0,0,-50],
    [-50,-50,-50,-50,-50,-50,-50,-50,-50,-50]
  ];;
let qvalues = Array.from({length:9}, () => Array.from({length:10}, () => Array(4).fill(0)));
let previous_position = [1,1];
let current_position = [1,1];
// Initialisation objet Kafka nom du client + destination broker kafka
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
});

// Création d'une instance consumer et producer 
const consumer = kafka.consumer({ groupId: 'test-group' });
const producer = kafka.producer();

// Démarrage serveur HTTP + WebSocket

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',      // <-- important pour le frontend
    methods: ['GET','POST']
  }
});


// Route REST pour debug
//app.get('/position', (req, res) => res.json({ position: current_position }));
//app.get('/map', (req, res) => {
//  res.json({map});//
//});


// WebSocket connection position
const positionNamespace = io.of("/position");
positionNamespace.on('connection', socket => {
  console.log('🟢 Socket position connecté');
  socket.emit('position', current_position); // Envoi immédiat
  //socket.emit('position', current_position); // envoie immédiat
});

// WebSocket connection map
const mapNamespace = io.of("/map");
mapNamespace.on('connection', socket => {
  console.log('🟢 socket map connecté');
  socket.emit('map', map); // Envoi immédiat
  //socket.emit('position', current_position); // envoie immédiat
});

const mapqvalues = io.of("/qvalues");
mapqvalues.on('connection', socket => {
  console.log('🟢 socket qvalues connecté');
  socket.emit('qvalues', qvalues); // Envoi immédiat
  //socket.emit('position', current_position); // envoie immédiat
});
app.get('/', (req, res) => {
    res.send('Serveur Express avec 3 Socket.IO namespaces actif !');
});
server.listen(port, () => console.log(`🚀 Serveur sur ${port}`));
// Fonction attente de connection vers kafka + connection instance producer ET consumer
async function waitForKafka(maxRetries = 10, delay = 5000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🔄 Tentative de connexion à Kafka (${i + 1}/${maxRetries})...`);
      await consumer.connect();
      await producer.connect();
      console.log('✅ Connecté à Kafka !');
      return;
    } catch (err) {
      console.log(`❌ Kafka pas prêt (${err.message}), nouvelle tentative...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Impossible de se connecter à Kafka après plusieurs essais.');
}

// souscription du consumer au topic kafka + ecoute message
(async () => {
  try {
    await waitForKafka();

    await consumer.subscribe({ topic: 'position', fromBeginning: true });
    await consumer.subscribe({ topic: 'qvalues', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        //console.log({
        //  topic,
        //  partition,
        //  offset: message.offset,
        //  value: message.value.toString(),
        //});
        // pour chaque message lire puis renvoyer une réponse
        const value = message.value.toString();
        switch (topic) {
          case 'position':
            //try {
            console.log("message topic position");
            current_position = JSON.parse(value);
            console.log(`📤 Message recu :`, current_position);
            let expectedreward = map[current_position[0]][current_position[1]]
            console.log(`Expected rewards trouvé :`, expectedreward);
            if (expectedreward == -50) {
              console.log(`current position:`, current_position);
              console.log(`previous_position:`, previous_position);
              current_position = previous_position
              console.log(`current position:`, current_position);
            }
            // Si la position est la sortie : revenir au debut 
            //map[previous_position[0]][previous_position[1]] = -10
            if (expectedreward == 40){
              current_position = [1,1]
              map = map_origine
            }
            
            //current_position = previous_position;

            const response = {
              id: 0,
              position:current_position,
              reward:expectedreward,
              timestamp: Date.now(),
            };
            // renvoie de la réponse 
            await producer.send({
              topic: 'position-reward',
              messages: [{ value: JSON.stringify(response) }],
            });
            console.log(`📤 Réponse envoyée sur "position-response":`, response);
            positionNamespace.emit('position', current_position);
            mapNamespace.emit('map', map);
            console.log(`fin current position:`, current_position);
            console.log(`fin previous_position:`, previous_position);
            previous_position =  current_position;
            console.log(`fin current position:`, current_position);
            console.log(`fin previous_position:`, previous_position);
            //} catch {
            //  current_position = previous_position;
            //  console.log("erreur position");
            //}
            break;
          case 'qvalues':
            console.log("message topic qvalues");
            mapqvalues.emit('qvalues', JSON.parse(value));
            console.log("envoie qvalues");
            break;
          default:
            console.log("waiting message");
            break;
        }
         // Création d'une "réponse"
      },
    });
  } catch (err) {
    console.error('💥 Erreur Kafka :', err);
  }
})();
//app.get('/position', (req, res) => {
//  res.json({position:current_position});
//});

//app.listen(port, () => {
 // console.log(`🚀 Serveur Node.js lancé sur le port ${port}`);
//});