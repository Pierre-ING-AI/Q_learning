<script setup>
import { ref, watch, toRaw, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'
import VueApexCharts from "vue3-apexcharts";

const column = ref(10);
const lines = ref(9);
const position = ref([1, 1]);
//chargement de la map
const map = ref([])
const qvalues = ref({ qvalues_charts_value: [], qvalues_charts_id: [] })
const series_mean_value = ref([]);
const series_direction = ref([]);


/**
 * Transforme un tableau 2D (Proxy ou tableau classique) en dataheat
 * @param {Array|Proxy} array2D - Tableau 2D ou Proxy réactif
 * @param {String} prefix - Préfixe pour le nom des lignes (ex: 'Ligne')
 * @returns {Array} - Tableau formaté pour dataheat
 */
function proxyToDataHeat(array2D, prefix = 'Ligne') {
  if (!array2D) return [];

  // on utilise toRaw pour obtenir un tableau "pur" si c'est un Proxy
  const rawArray = toRaw(array2D);

  return rawArray.map((row, i) => ({
    name: `${prefix} ${i + 1}`,
    data: row.map((y, j) => ({ x: j, y }))
  }));
}

function getColorByValue(val) {
  switch (val) {
    case 0: return '#F5294B'; // bad way
    case 1: return '#E7CA36'; // medium way
    case 2: return '#8B928F';  // no data
    case 3: return '#69E03E'; // good way
    default: return '#D1D5DB'; // neutral gray
  }
}

function getLabelByValue(val) {
  switch (val) {
    case 0: return 'G'; // bad way
    case 1: return 'D'; // medium way
    case 2: return 'H';  // no data
    case 3: return 'B'; // good way
    default: return '-'; // neutral gray
  }
}


function proxyToDataHeatId(array2D, prefix = 'Ligne') {
  if (!array2D) return [];
  const rawArray = toRaw(array2D);

  return rawArray.map((row, i) => ({
    name: `${prefix} ${i + 1}`,
    data: row.map((val, j) => ({
      x: j,
      y: val,                    // still keep numeric value internally
      fillColor: getColorByValue(val)
    }))
  }));
}

// Web socket pour récupérer les données temps réel de node js
const socketposition = io('http://localhost:3005/position');
const socketmap = io('http://localhost:3005/map');
const socketqvalues = io('http://localhost:3005/qvalues');

onMounted(() => {
  socketposition.on('position', (data) => {
    position.value = data;
    //console.log('Position reçue:', data)
  });
  socketmap.on('map', (data) => {
    map.value = data;
    //console.log('map reçue:', data)
  });
  socketqvalues.on('qvalues', (data) => {
    qvalues.value = data;
    const temp_value = proxyToDataHeat(data.qvalues_charts_value, 'Valeur');
    series_mean_value.value.updateSeries(temp_value,true);

    const temp_id = proxyToDataHeatId(data.qvalues_charts_id, 'id');
    series_direction.value.updateSeries(temp_id,true);
    console.log('id_heat:', series_direction.value);
    //= proxyToDataHeat(data.qvalues_charts_value, 'Valeur');
    //console.log('Qvalues reçue:',data)
    //console.log('Qvalues_charts_value:', qvalues.value.qvalues_charts_value);
    //console.log('Qvalues_charts_id:', qvalues.value.qvalues_charts_id);
  });
});

// Mettre à jour automatiquement la série dès que qvalues change
watch(qvalues, (newVal) => {
  if (newVal.qvalues_charts_value && newVal.qvalues_charts_value.length) {
    series_mean_value.value = proxyToDataHeat(newVal.qvalues_charts_value, 'Valeur');
    console.log('value_heat:', series_mean_value.value);
  }
  if (newVal.qvalues_charts_id && newVal.qvalues_charts_id.length) {
    series_direction.value = proxyToDataHeatId(newVal.qvalues_charts_id, 'id');
    console.log('value_heat:', series_direction.value);
  }
}, { deep: true });

onUnmounted(() => {
  socketposition.disconnect();
  socketmap.disconnect();
  socketqvalues.disconnect();
});


// Props
defineProps({
  msg: String,
})


//  charts
// Import local du composant
const ApexChart = VueApexCharts;
// Données statiques pour la heatmap (5x5)
//const dataheat = [
//  { name: 'Ligne 1', data: [ {x:0, y:10}, {x:1, y:20}, {x:2, y:30}, {x:3, y:40}, {x:4, y:50} ] },
//  { name: 'Ligne 2', data: [ {x:0, y:20}, {x:1, y:10}, {x:2, y:40}, {x:3, y:30}, {x:4, y:60} ] },
//  { name: 'Ligne 3', data: [ {x:0, y:5},  {x:1, y:25}, {x:2, y:35}, {x:3, y:45}, {x:4, y:55} ] },
//  { name: 'Ligne 4', data: [ {x:0, y:15}, {x:1, y:35}, {x:2, y:25}, {x:3, y:50}, {x:4, y:40} ] },
//  { name: 'Ligne 5', data: [ {x:0, y:30}, {x:1, y:10}, {x:2, y:20}, {x:3, y:40}, {x:4, y:50} ] },
//]

//const series = ref(value_heat);
const chartOptions_id = ref({
  chart: {
    type: 'heatmap',
    toolbar: { show: false } // supprime les boutons
  },
  dataLabels: {
    enabled: true,
    style: {
      colors: ['#000'],
      fontSize: '14px',
      fontWeight: 'bold'
    },
    formatter: function (val) {
      // convertit la valeur en lettre
      return getLabelByValue(val);
    }
  },
  plotOptions: {
    heatmap: {
      distributed: true, // allows per-point color
      useFillColorAsStroke: true
    }
  },
  xaxis: {
    labels: { show: false },  // masque les lettres/nombres sur l'axe X
    axisBorder: { show: false },
    axisTicks: { show: false },
    reversed: true,
  },
  yaxis: {
    labels: { show: false },  // masque les lettres/nombres sur l'axe Y
    axisBorder: { show: false },
    axisTicks: { show: false },
    reversed: true,
  },
  legend: { show: false },
  grid: {
    padding: { left:1 },
  },
});

const chartOptions_mean_value = ref({
  chart: {
    type: 'heatmap',
    toolbar: { show: false } // supprime les boutons
  },
  dataLabels: {
    enabled: true,
    style: {
      colors: ['#000'], // couleur du texte (noir par défaut)
      fontSize: '12px',
      fontWeight: 'bold'
    },
    formatter: function (val) {
    // arrondir à 2 décimales (ou autre précision)
    if (typeof val === 'number') {
      return val.toFixed(2); // change "2" par le nombre de décimales souhaité
    }
    return val;
    }
  },
  plotOptions: {
    heatmap: {
      colorScale: {
        ranges: [{
            from: -50,
            to: -40,
            color: '#F5294B',
            name: 'bad way',
          },
          {
            from: -40,
            to: -1,
            color: '#E7CA36',
            name: 'medium way',
          },
          {
            from: 1,
            to: 40,
            color: '#69E03E',
            name: 'good way',
          },
          {
            from: 0,
            to: 1,
            color: '#8B928F',
            name: 'no data',
          }
        ]
      }
    }
  },
  xaxis: {
    labels: { show: false },  // masque les lettres/nombres sur l'axe X
    axisBorder: { show: false },
    axisTicks: { show: false },
    reversed: true,
  },
  yaxis: {
    labels: { show: false },  // masque les lettres/nombres sur l'axe Y
    axisBorder: { show: false },
    axisTicks: { show: false },
    reversed: true,
  },
  legend: { show: false },
  grid: {
    padding: { left:1 },
  },
});

// Variables réactives
//<div v-if="position[0]==c-1 && position[1]==d-1">
//  <button class="btn-ia"type="button" @click=""></button>
//</div>
</script>

<template>
  <h1>{{ msg }}</h1>
  <div class="case">
    <div v-if="loading">Chargement de la map...</div>
    <table v-else>
      <tbody>
        <tr v-for="(c,i) in map" :key="i">
          <td v-for="(d,j) in c" :key="j">
            <div v-if="position[0] === i && position[1] === j">
              <button class="btn-ia"type="button" @click=""></button>
            </div>
            <div v-else-if="d==-50">
              <button class="btn-mur"type="button" @click=""></button>
            </div>
            <div v-else-if="d==-10">
              <button class="btn-passage"type="button" @click=""></button>
            </div>
            <div v-else-if="d==20">
              <button class="btn-bonus"type="button" @click=""></button>
            </div>
            <div v-else-if="d==40">
              <button class="btn-sortie"type="button" @click=""></button>
            </div>
            <div v-else>
              <button class="btn-case"type="button" @click=""></button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="heatmap">
      <h4>Heatmap Value</h4>
      <ApexChart :options="chartOptions_mean_value" :series="series_mean_value" type="heatmap" height="50%" width="100%"/>
      <h4>Heatmap Value</h4>
      <ApexChart :options="chartOptions_id" :series="series_direction" type="heatmap" height="50%" width="100%"/>
    </div>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>