<template>
  <div class="maze">
    <div class="maze-line" v-for="(lines,id_line) in maze" :key="id_line">
        <div class="maze-column" v-for="(cell,id_col) in lines" :key="id_col">
            <div v-if="((id_line>0 && id_col>0) && (id_line<maze.length-1 && id_col<lines.length-1))" :class="['cell',{mur:cell==1,vide:cell==0,sortie:cell==2,player:(position.x==id_col && position.y==id_line)}]" @click="caseToWall(id_line,id_col)"></div>
        </div>
    </div>
  </div>
</template>
<script>
import generate_maze from '@/composables/Qlearning/generate_maze';
export default {
  name:'Maze',
  emits: ['update:maze'],
  props:{
    position: {
        type: Object,
        default() {
            return { x:1, y:1 };
        },
        required: true,
        validator(value) {
            const hasKeys = 'x' in value && 'y' in value;
            const areIntegers = Number.isInteger(value.x) && Number.isInteger(value.y);
            if (!hasKeys) {
                console.warn("L'objet doit contenir les clés 'x' et 'y'.");
            }
            if (!areIntegers) {
                console.warn("Les propriétés 'x' et 'y' doivent être des entiers.");
            }
            return hasKeys && areIntegers;
        }
    },
    maze:{
        type: Array,
        default(){
            return generate_maze();
        },
        validator(value) {
            const istab = Array.isArray(value);
            const is2Dtab = Array.isArray(value[0]);
            const areIntegers = Number.isInteger(value[0][0]);
            if(!istab){
                console.warn("L'objet doit être un tableau");
            }
            else if (!is2Dtab) {
                console.warn("L'objet doit être un tableau de deux dimensions");
            }
            else if (!areIntegers) {
                console.warn("Le tableau doit contenir des entiers");
            }
            return istab && is2Dtab && areIntegers;
        }
    }
  },
  data(){
    return{
        end:true
        // maze:null
    }
  },
  mounted(){
    this.$emit('update:maze', this.maze);
  },
  methods:{
    caseToWall(line,column){
        if (this.maze[line][column] ==2){
            this.maze[line][column] = 0;
            this.end = false;
        }
        else if (this.maze[line][column] ==1){
            if(this.end){
                this.maze[line][column] = 0;
            }
            else{
                this.maze[line][column] = this.maze[line][column]+1;
                this.end = true;
            }
        }
        else{
            this.maze[line][column] = this.maze[line][column]+1;
        }
        this.$emit('update:maze', [...this.maze]); // ... Spread opareator pour forcer le changement de reference et trigger la reactivité de vue sur une reference immobile sur des objets changeant. Selon gemini a tester
    }
  },
}
/*"*/
</script>
<style>
.maze{
  border-radius: 4px;
  border-color:lightgray;
  /* background-color: #e8f0ff; */
  width: 60em;
  height:35em;
  display: flex;
  flex-direction: column;
}
.maze >.maze-line{
    display: flex;
    flex: 1;
    /* flex-direction: row;  */
}
.maze-line >.maze-column{
    display: flex; 
    flex: 1; /* Aligne les largeurs */
    /* display: flex;
    flex-direction: row;  */
}
.maze-column >.cell{
    /* width: 10%;
    height: 10%; */
    /* width: 10px;
    height: 10px; */
    flex: 1;
    aspect-ratio: 1 / 1; /* Force la cellule à rester un carré parfait */
    height: auto;
    /* height: 100%; */
    border-radius: 2px;
}
.maze-column >.mur{
    background-color: #444;
}
.maze-column >.sortie{
    background-color: #52a535;
}
.maze-column >.vide{
    background-color: White;
}
.maze-column >.player{
    background-color: crimson;
}
</style>
