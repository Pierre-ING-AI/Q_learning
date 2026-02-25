
import { Kafka } from 'kafkajs';

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
export default {waitForBrokers,waitForTopicsLeaders};