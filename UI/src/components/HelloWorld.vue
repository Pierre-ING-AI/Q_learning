<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

import { io } from 'socket.io-client'

const column = ref(10);
const lines = ref(9);
const position = ref([1, 1]);
//chargement de la map
const map = ref([])
// Web socket pour récupérer les données temps réel de node js
const socketposition = io('http://localhost:3005/position');
const socketmap = io('http://localhost:3005/map');

onMounted(() => {
  socketposition.on('position', (data) => {
    position.value = data;
    console.log('Position reçue:', data)
  });
  socketmap.on('map', (data) => {
    map.value = data;
    console.log('map reçue:', data)
  });
});

onUnmounted(() => {
  socketposition.disconnect();
  socketmap.disconnect();
});


// Props
defineProps({
  msg: String,
})

// Variables réactives
//<div v-if="position[0]==c-1 && position[1]==d-1">
//  <button class="btn-ia"type="button" @click=""></button>
//</div>
</script>

<template>
  <h1>{{ msg }}</h1>
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
  
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>