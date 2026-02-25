// Fonction attente de connection vers kafka + connection instance producer ET consumer
const conection = async(consumer,producer,maxRetries = 10, delay = 5000)=>{
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

// Création topic
const initTopics = async(admin,topicsToCreate)=>{
    await admin.connect();
    await admin.createTopics({
        topics: topicsToCreate.map(t => ({ topic: t, numPartitions: 1, replicationFactor: 1 })),
        waitForLeaders: true,
    });
    // await waitForTopicsLeaders(admin,topicsToCreate);
    await admin.disconnect();
    console.log('✅ Topics créés');
}
export {conection,initTopics};