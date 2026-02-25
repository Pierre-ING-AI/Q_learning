<template>
    <Transition name="fade">
        <div v-if="tab!=null" class="HeatmapPolicy">
            <div class="HeatmapPolicy-line" v-for="(lines,id_line) in maze" :key="id_line">
                <div class="HeatmapPolicy-column" v-for="(cell,id_col) in lines" :key="id_col">
                    <div v-if="((id_line>0 && id_col>0) && (id_line<tab.length-1 && id_col<lines.length-1))">
                        <div v-if="cell==1" class="cell mur"></div>
                        <div v-else class="cell">
                            <!-- UP -->
                            <svg v-if="tab[id_line][id_col]==2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="background-color:#fef7e0" fill="#444">
                                <path d="M12 4L3 13h5.5v7h7V13H21L12 4z"/>
                            </svg>
                            <!-- DOWN -->
                            <svg v-if="tab[id_line][id_col]==3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="background-color:#6299F8" fill="#444">
                                <path d="M12 20l9-9h-5.5V4h-7v7H3l9 9z"/>
                            </svg>
                            <!-- LEFT -->
                            <svg v-if="tab[id_line][id_col]==0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="background-color:#EE786D" fill="#444">
                                <path d="M4 12l9 9v-5.5h7v-7H13V3L4 12z"/>
                            </svg>
                            <!-- RIGHT -->
                            <svg v-if="tab[id_line][id_col]==1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="background-color:#89CB9B" fill="#444">
                                <path d="M20 12l-9-9v5.5H4v7h7V21l9-9z"/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>
<script>
export default {
  name:'HeatmapPolicy',
  props:{
    tab: {
        type: Array,
        default() {
            return null
        },
        required: true,
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
    },
    maze:{
        type: Array,
        default() {
            return null
        },
        required: true,
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
  }
}
/*"*/
</script>
<style>
.HeatmapPolicy{
  border-radius: 4px;
  border-color:lightgray;
  background-color: #e8f0ff;
}
.HeatmapPolicy >.HeatmapPolicy-line{
    display: flex; 
    flex-direction: row; 
}
.HeatmapPolicy-column .cell{
    border-radius: 2px;
    width: 2em;
    height:2em;
    background-color:#ffff; 
    /* width: clamp(16px, 5vw, 64px);
    height: clamp(16px, 5vw, 64px); */
}
.HeatmapPolicy-column .mur{
   background-color:#444;
}
</style>
