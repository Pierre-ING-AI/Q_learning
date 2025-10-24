const { Kafka } = require('kafkajs');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const express = require('express');
const app = express();
app.use(cors()); 
const port = 3005;
const server = http.createServer(app);
const map = [
    [-50,-50,-50,-50,-50,-50,-50,-50,-50,-50],
    [-50,-1,-1,-1,-1,-1,20,-50,-1,-50],
    [-50,-1,-1,-1,-50,-50,-50,-50,-1,-50],
    [-50,-1,-50,-1,-1,20,-10,-1,-1,-50],
    [-50,-1,-50,-1,-50,-1,-50,-1,-1,-50],
    [-50,-1,-1,-1,-50,-1,-1,-1,40,-50],
    [-50,-1,-1,-1,-50,-1,-1,-1,-1,-50],
    [-50,-1,-1,-1,-50,-1,-1,-1,-1,-50],
    [-50,-50,-50,-50,-50,-50,-50,-50,-50,-50]
  ]
let previous_position = [1,1]
let current_position = [1,1]
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
})


// Route REST pour debug
//app.get('/position', (req, res) => res.json({ position: current_position }));
//app.get('/map', (req, res) => {
//  res.json({map});//
//});


// WebSocket connection
const positionNamespace = io.of("/position");
positionNamespace.on('connection', socket => {
  console.log('🟢 Client connecté');
  socket.emit('position', current_position); // Envoi immédiat
  //socket.emit('position', current_position); // envoie immédiat
});

const mapNamespace = io.of("/map");
mapNamespace.on('connection', socket => {
  console.log('🟢 Client connecté');
  socket.emit('map', map); // Envoi immédiat
  //socket.emit('position', current_position); // envoie immédiat
});
app.get('/', (req, res) => {
    res.send('Serveur Express avec 2 Socket.IO namespaces actif !');
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

    await consumer.subscribe({ topic: 'position', fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log({
          topic,
          partition,
          offset: message.offset,
          value: message.value.toString(),
        });
        // pour chaque message lire puis renvoyer une réponse
        const value = message.value.toString();
          try {
            current_position = JSON.parse(value);
          } catch {
            current_position = previous_position;
          }
         // Création d'une "réponse"
        let expectedreward = map[current_position[0]][current_position[1]]
        if (expectedreward == -50) {
          current_position = previous_position
        }
        const response = {
          id: 0,
          position:current_position,
          reward:expectedreward,
          timestamp: Date.now(),
        };
        map[previous_position[0]][previous_position[1]] = -10
        // renvoie de la réponse 
        await producer.send({
          topic: 'position-reward',
          messages: [{ value: JSON.stringify(response) }],
        });
        positionNamespace.emit('position', current_position);
        mapNamespace.emit('map', map);
        previous_position =  current_position
        console.log(`📤 Réponse envoyée sur "position-response":`, response);

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