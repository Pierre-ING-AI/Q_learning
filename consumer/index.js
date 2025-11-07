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
    [-2,-2,-2,-2,-2,-2,-2,-2,-2,-2],
    [-2,0,0,0,0,0,0,-2,0,-2],
    [-2,0,0,0,-2,-2,-2,-2,0,-2],
    [-2,0,-2,0,0,0,0,0,0,-2],
    [-2,0,-2,0,-2,0,-2,0,0,-2],
    [-2,0,0,0,-2,0,0,0,50,-2],
    [-2,0,0,0,-2,0,0,0,0,-2],
    [-2,0,0,0,-2,0,0,0,0,-2],
    [-2,-2,-2,-2,-2,-2,-2,-2,-2,-2]
  ];
let map = [
    [-2,-2,-2,-2,-2,-2,-2,-2,-2,-2],
    [-2,0,0,0,0,0,0,-2,0,-2],
    [-2,0,0,0,-2,-2,-2,-2,0,-2],
    [-2,0,-2,0,0,0,0,0,0,-2],
    [-2,0,-2,0,-2,0,-2,0,0,-2],
    [-2,0,0,0,-2,0,0,0,50,-2],
    [-2,0,0,0,-2,0,0,0,0,-2],
    [-2,0,0,0,-2,0,0,0,0,-2],
    [-2,-2,-2,-2,-2,-2,-2,-2,-2,-2]
  ];
let qvalues = Array.from({length:9}, () => Array.from({length:10}, () => Array(4).fill(0)));
let previous_position = [1,1];
let current_position = [1,1];
mur = -2
sortie = 50
bonus = 1
skip_first_iteration = 0
step = 0
max_step = 2000
end = false
// Initialisation objet Kafka nom du client + destination broker kafka
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
});

// creation instance kafka admin consumer et producer
const admin = kafka.admin({ retry: { retries: 8, initialRetryTime: 500 } });
const consumer = kafka.consumer({ groupId: 'test-group' });
const producer = kafka.producer();

// =====================
// Utils Kafka
// =====================

async function waitForBrokers(maxRetries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      //await admin.connect();
      const clusterInfo = await admin.describeCluster();
      //console.log(clusterInfo);
      // 🔍 Diagnostic complet
      console.log("🔍  clusterInfo reçu :", JSON.stringify(clusterInfo.brokers, null, 2));
      const brokerCount = clusterInfo?.brokers?.length ?? 0;

      if (brokerCount > 0) {
        console.log(`✅ Kafka prêt (${brokerCount} broker${brokerCount > 1 ? 's' : ''} disponibles)`);
        //await admin.disconnect();
        return true;
      } else {
        console.log("⚠️ Aucun broker détecté dans les métadonnées, nouvelle tentative...");
      }
      throw new Error("⏳ Aucun broker disponible");
    } catch (err) {
      console.log(`⏳ Tentative ${attempt}/${maxRetries} : Kafka pas encore prêt (${err.message})`);
    } finally {
      try {
        //await admin.disconnect();
      } catch { /* ignore */ }
    }
    // Attente avant nouvelle tentative
    await new Promise(res => setTimeout(res, delayMs));
  }
  throw new Error("❌ Kafka n’a pas été prêt à temps");
}

async function waitForTopicsLeaders(topics, maxRetries = 10, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      //await admin.connect();
      const metadata = await admin.fetchTopicMetadata({ topics });
      const allLeadersAssigned = metadata.topics.every(t => 
        t.partitions.every(p => p.leader !== -1)
      );
      //await admin.disconnect();
      if (allLeadersAssigned) {
        console.log(`✅ Tous les topics ont un leader`);
        return;
      }
      throw new Error("⏳ Certains partitions n'ont pas encore de leader");
    } catch (err) {
      console.log(`⏳ Tentative ${attempt}/${maxRetries} : Leaders pas prêts (${err.message})`);
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
  throw new Error("❌ Les topics n'ont pas de leaders assignés à temps");
}

// =====================
// Gestion Topics
// =====================

async function resetTopics() {
  const topicsToCreate = ['position', 'position-reward', 'qvalues'];
  //await admin.connect();
  const existingTopics = await admin.listTopics();
  const toDelete = topicsToCreate.filter(t => existingTopics.includes(t));

  if (toDelete.length > 0) {
    await admin.deleteTopics({ topics: toDelete });
    console.log('🗑 Topics supprimés :', toDelete);
  } else {
    console.log('Aucun topic à supprimer');
  }
  //await admin.disconnect();
  await waitForBrokers();
  //await admin.connect();
  await admin.createTopics({
    topics: topicsToCreate.map(t => ({ topic: t, numPartitions: 1, replicationFactor: 1 })),
    waitForLeaders: true,
  });
  console.log('✅ Topics créés');
  //await admin.disconnect();
  await waitForTopicsLeaders(topicsToCreate);
}

// =====================
// WebSocket & HTTP
// =====================

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',      // <-- important pour le frontend
    methods: ['GET','POST']
  }
});

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

// Création de la route mère
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
async function startKafka() {
  //await consumer.connect();
  //await producer.connect();
  //console.log('✅ Connecté à Kafka !');

  await consumer.subscribe({ topic: 'position', fromBeginning: true });
  await consumer.subscribe({ topic: 'qvalues', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const value = message.value.toString();
      switch (topic) {
        case 'position':
          fin = false
          current_position = JSON.parse(value);
          const expectedreward = map[current_position[0]][current_position[1]];
          if (expectedreward === mur) current_position = previous_position;
          if (expectedreward === sortie || step>max_step) {
            map = map_origine; 
            current_position = [1,1];
            previous_position = [0,1]
            skip_first_iteration = skip_first_iteration+1;
            console.log(skip_first_iteration); 
            step = 0;
            fin = true
          }
          if (expectedreward === bonus) map[current_position[0]][current_position[1]] =0;
          //else map[current_position[0]][current_position[1]] = -2 + (1/2)*(map[current_position[0]][current_position[1]]+2); //punish return to the same case
          const response = { id: 0, position: current_position, reward: expectedreward,end:fin, timestamp: Date.now() };
          await producer.send({ topic: 'position-reward', messages: [{ value: JSON.stringify(response) }] });
          if (skip_first_iteration>10){
            positionNamespace.emit('position', current_position);
            mapNamespace.emit('map', map);
          }
          previous_position = current_position;
          step = step+1
          console.log(step)
          break;

        case 'qvalues':
          mapqvalues.emit('qvalues', JSON.parse(value));
          break;
      }
    }
  });
}

// =====================
// Lancement
// =====================

(async () => {
  try {
    await admin.connect();
    await resetTopics();
    await admin.disconnect();
    await waitForKafka();
    await startKafka();
  } catch (err) {
    console.error('💥 Erreur Kafka :', err);
  }
})();