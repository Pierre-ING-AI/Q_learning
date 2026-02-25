import cors from 'cors'
import express from 'express'
import http from 'http'
import { Kafka } from 'kafkajs';
import { Server } from 'socket.io';
import {conection,initTopics} from './composables/kafkaConection.js'
const app = express();
app.use(cors()); 
app.use(express.json());
const server = http.createServer(app);
const port = 3005

const state = {
    try_learning:0, // learning
    restart_try_Learning:1, // end of learning try
    stop:2, // wait for user action
    run:3 // prediction AI
}

let maze = null;
let currentPosition = null;
let previousPosition = null;
let end = state.stop; // 0 learning - 1 reset try - 2 fin learning-stop running -3 runinng
let mazeHeigh =0;
let mazeWidth =0;
let wait_converge = 60 
let iteration = 0

console.log("loading");

// =====================
// Kafka 
// =====================

// Initialisation objet Kafka nom du client + destination broker kafka
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
});

// creation instance kafka admin consumer et producer
const admin = kafka.admin({ retry: { retries: 8, initialRetryTime: 500 } });
const consumer = kafka.consumer({ groupId: 'test-group' });
const producer = kafka.producer();

await initTopics(admin,['position','map-data']);
await conection(consumer,producer);

await consumer.subscribe({ topic: 'position', fromBeginning: true });
// await consumer.subscribe({ topic: 'qvalues', fromBeginning: true });

// =====================
// WebSocket 
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
//   socket.emit('position', current_position); // Envoi immédiat
});

// WebSocket connection map
const chartsNamespace = io.of("/charts");
chartsNamespace.on('connection', socket => {
  console.log('🟢 socket map connecté');
//   socket.emit('map', map); // Envoi immédiat
});

const mapqvalues = io.of("/runingdddd");
mapqvalues.on('connection', socket => {
  console.log('🟢 socket qvalues connecté');
//   socket.emit('qvalues', qvalues); // Envoi immédiat
});

app.get('/', (req, res) => {
    res.status(200).send('NodeServer /maze ');
});

// =====================
// Post Request 
// =====================

app.post('/runing', async (req, res) => {
    res.status(200).send(req.body);
    maze = req.body.maze;
    console.log(req.body.maze);
    iteration = 0;
    end = state.run; // start learning
    // init learning send first message
    currentPosition= {y:1,x:1} // x colonnes dans une lignes 
    previousPosition = {...currentPosition};
    let response = {position:{y:1,x:1}, map: 0,endTry:end,mapHeigh:mazeHeigh,mapWidth:mazeWidth};
    await producer.send({ topic: 'map-data', messages: [{ value: JSON.stringify(response) }]});
});

app.post('/learning', async (req, res) => {
    res.status(200).send(req.body);
    maze = req.body.maze;
    console.log(req.body.maze);
    end = state.try_learning; // start learning
    mazeHeigh = maze.length;
    mazeWidth = maze[0].length;
    iteration = 0
    // init learning send first message
    currentPosition= {y:1,x:1}; // x colonnes dans une lignes 
    previousPosition = {...currentPosition};
    let response = {position:{y:1,x:1}, map: 0,endTry:end, mapHeigh:mazeHeigh,mapWidth:mazeWidth};
    await producer.send({ topic: 'map-data', messages: [{ value: JSON.stringify(response) }]});
});

async function runing(){
    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            const value = message.value.toString();
            if(maze==null){return;}
            // console.log(value);
            switch (topic) {
                case 'position':
                    //fetch data
                    const data = JSON.parse(value)
                    // console.log('Recu ',data);
                    currentPosition = data.position;
                    end = data.endTry;
                    // console.log('End_status:',end)
                    // Learning
                    if(end==state.try_learning){
                        // currentPosition = JSON.parse(value);
                        // console.log('iteration try_learning:',iteration)
                        if(maze[currentPosition.y][currentPosition.x]==2){
                            end = state.restart_try_Learning;
                            currentPosition = {y:1,x:1}
                            const response = {position:currentPosition, map: 2,endTry:end,mapHeigh:mazeHeigh,mapWidth:mazeWidth};
                            await producer.send({ topic: 'map-data', messages: [{ value: JSON.stringify(response) }]});
                            console.log('Envoye ',response);
                            console.log('iteration',iteration);
                            previousPosition = {...currentPosition};
                            iteration = iteration+1;
                            chartsNamespace.emit('charts',{qvalues_mean:data.qvalues_mean,policy:data.policy,map_maze:maze});
                        }
                        else if(maze[currentPosition.y][currentPosition.x]==1){
                            const response = {position:previousPosition, map:maze[currentPosition.y][currentPosition.x],endTry:end,mapHeigh:mazeHeigh,mapWidth:mazeWidth};
                            await producer.send({ topic: 'map-data', messages: [{ value: JSON.stringify(response) }]});
                            // console.log('Envoye ',response);
                        }
                        else{
                            const response = {position:currentPosition, map: maze[currentPosition.y][currentPosition.x],endTry:end,mapHeigh:mazeHeigh,mapWidth:mazeWidth};
                            await producer.send({ topic: 'map-data', messages: [{ value: JSON.stringify(response) }]});
                            // console.log('Envoye ',response);
                            previousPosition = {...currentPosition};
                        }
                        if(data.iteration>(data.max_iteration-1)){
                            positionNamespace.emit('position',{position:{x:currentPosition.x,y:currentPosition.y},fin:0,current_iteration:data.iteration,max_iteration:data.max_iteration});
                        }
                    }

                    // Retry learning
                    else if(end==state.restart_try_Learning){
                        // console.log("Nouvelle Essai");
                        currentPosition = {y:1,x:1}
                        const response = {position:currentPosition, map: 0,endTry:end,mapHeigh:mazeHeigh,mapWidth:mazeWidth};
                        await producer.send({ topic: 'map-data', messages: [{ value: JSON.stringify(response) }]});
                        // console.log('Envoye ',response);;
                        positionNamespace.emit('position',{position:{x:currentPosition.x,y:currentPosition.y},fin:0,current_iteration:data.iteration,max_iteration:data.max_iteration});
                        previousPosition = {...currentPosition};
                        iteration = iteration+1;
                        console.log('Max steps');
                        console.log('iteration restart_try_Learning:',iteration)
                        chartsNamespace.emit('charts',{qvalues_mean:data.qvalues_mean,policy:data.policy,map_maze:maze});
                        // ai respond end 0
                    }

                    // Running
                    else if(end==state.run){
                        if(maze[currentPosition.y][currentPosition.x]==2){  
                            end = state.stop;    
                            currentPosition = {y:1,x:1};
                            const response = {position:currentPosition, map:2,endTry:end,mapHeigh:mazeHeigh,mapWidth:mazeWidth};
                            await producer.send({ topic: 'map-data', messages: [{ value: JSON.stringify(response) }]});    
                            previousPosition = {...currentPosition};
                        }
                        else if(maze[currentPosition.y][currentPosition.x]==1){
                            const response = {position:previousPosition, map:maze[currentPosition.y][currentPosition.x],endTry:end,mapHeigh:mazeHeigh,mapWidth:mazeWidth};
                            await producer.send({ topic: 'map-data', messages: [{ value: JSON.stringify(response) }]});
                        }
                        else{
                            const response = {position:currentPosition, map: maze[currentPosition.y][currentPosition.x],endTry:end,mapHeigh:mazeHeigh,mapWidth:mazeWidth};
                            await producer.send({ topic: 'map-data', messages: [{ value: JSON.stringify(response)}]}); 
                            previousPosition = {...currentPosition};
                        }
                        positionNamespace.emit('position',{position:{x:currentPosition.x,y:currentPosition.y},fin:0,current_iteration:data.iteration,max_iteration:data.max_iteration});
                    }
                    else{
                        positionNamespace.emit('position',{position:{x:1,y:1},fin:1,current_iteration:data.iteration,max_iteration:data.max_iteration});
                    }
                    break;
                case 'charts':
                    // const data_charts = JSON.parse(value)
                    // // console.log('Recu ',data);
                    // currentPosition = data_charts.qvalues_mean;
                    // end = data_charts.policy;
                    console.log(JSON.parse(value));
                    chartsNamespace.emit(value);
                    break;
            }
        }
    });
}

(async () => {
  try {
    await runing();
  } catch (err) {
    await consumer.disconnect();
    await producer.disconnect();
    console.error('💥 Erreur Kafka :', err);
  }
})();

server.listen(port, () => console.log(`🚀 Serveur sur ${port}`));