<template>
  <div class="page">
    <h1> Labyrinthe Qlearning </h1>
    <div class="Graph transition">
      <button @click="submitMaze()" class="play entrainement" :disabled="training">Entrainement</button>
      <button class="play Lancer" :disabled="running">Lancer</button>
      <div class="progress-wrapper" :class="{ 'is-active': training }">
        <ProgressBar v-if="training" class="bar" :value="progress/max_progress"/>
      </div>
    </div>
    <Maze v-model:maze="the_maze" :position="position"/>
    <Transition name="fade">
      <Heatmap v-model:tab="q_mean"/>
    </Transition>
    <Transition name="fade" @after-enter="scrollToCharts">
      <HeatmapPolicy v-model:tab="policy" v-model:maze="the_maze"/>
    </Transition>
  </div>
</template>
<script>
import Maze from '../components/Qlearning/maze.vue';
import Heatmap from '../components/Qlearning/heatmap.vue';
import HeatmapPolicy from '../components/Qlearning/heatmapPolicy.vue';
import ProgressBar from '../components/Qlearning/progressBar.vue';
import sendMaze from '@/composables/Qlearning/sendMaze';
import io from 'socket.io-client';

export default {
  name:'Qlearning',
  components:{
    Maze,Heatmap,HeatmapPolicy,ProgressBar
  },
  data(){
    return {
      the_maze:undefined,
      position:{
        x:1,
        y:1
      },
      q_mean: null,
      policy:null,
      progress:0,
      max_progress:10,
      training:false,
      running:true,
      socketposition:null,
      socketcharts:null
    }
  },
  methods:{
    async submitMaze(){
      this.progress=0;
      this.training = true;
      this.running=true;
      await sendMaze(this.the_maze);
    },
    scrollToCharts(el) {
    // 'el' est l'élément DOM injecté par la transition
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  },
  mounted(){
    this.socketposition = io('http://localhost:3005/position');
    this.socketposition.on('position', (data) => {
      // console.log(data);
      this.position = data.position;
      this.progress=data.current_iteration;
      this.max_progress=data.max_iteration;
      if(data.fin!=0){
        this.training = false;
        this.running=false;
      }
      else{
        this.training = true;
        this.running=true;
      }
    });
    this.socketcharts = io('http://localhost:3005/charts');
    this.socketcharts.on('charts', (data) => {
      console.log(data);
      this.q_mean = data.qvalues_mean;
      this.policy = data.policy;
      this.progress = this.progress+1;
      this.the_maze = data.map_maze;
      //console.log('Position reçue:', data)
    });
  },
  unmounted(){
    this.socketposition.disconnect();
    this.socketcharts.disconnect();
  }
}
</script>
<style>
.page{
  display: flex;
  flex-direction: column;
  justify-content: center; /* Centre horizontalement */
  align-items: center;
}
.Graph{
  display: flex;
  flex-direction: row;
  align-items: center;
  /* align-items: flex-start; */
  align-items: left; 
}
.progress-wrapper {
  /* État fermé */
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  
  /* Transition fluide sur l'ouverture */
  transition: max-width 0.8s cubic-bezier(0.4, 0, 0.2, 1), 
              opacity 0.5s ease,
              margin-left 0.5s ease;
}

.progress-wrapper.is-active {
  /* État ouvert */
  max-width: 25em; /* Une valeur supérieure à la taille réelle de la barre */
  opacity: 1;
  margin-left: 2em; /* On n'ajoute la marge que quand elle apparaît */
}

.bar{
  margin-top: 1em;
  margin-left: 2em;
  min-width: 20em; 
}

h1{
  font-size:2rem;
  font-family:Avenir,Arial, Helvetica, sans-serif;
  color: #3a3a3a;
  margin-top: 2em;
  /* margin-bottom: 1em; */
}
.play{
  background-color:#52a535;
  border-color: none;
  border-radius:3px ;
  border:solid 2px #3a3a3a;
  font-size: 15px;
  /* margin-top: 2em; */
  padding-left:2em;
  padding-right:2em;
  padding-top: 1em;
  padding-bottom: 1em;
  margin-left: 1em;
  color:white;
  box-shadow: 
    0 9px 0 #356922,
    0 10px 25px rgba(0, 0, 0, 0.3);
}
.Lancer{
  background-color:#185abc;
  box-shadow: 
    0 9px 0 #134590,
    0 10px 25px rgba(0, 0, 0, 0.3);
}
.play:active{
  transform: translateY(9px);
  box-shadow: 
    0 0 0 #356922,
    0 3px 10px rgba(0, 0, 0, 0.3);
}
.play:disabled{
  transform: translateY(9px);
  background-color: #696969;
  box-shadow: 
    0 0 0 #356922,
    0 3px 10px rgba(0, 0, 0, 0.3);
}

/* Animation d'apparition simple (Fade) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Animation de montée (Slide + Fade) pour les graphiques */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.8s ease-out;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>
