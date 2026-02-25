<template>
    <Transition name="fade">
        <div v-if="tab!=null" class="heatmap">
            <div class="heatmap-line" v-for="(lines,id_line) in tab" :key="id_line">
                <div class="heatmap-column" v-for="(cell,id_col) in lines" :key="id_col">
                    <div v-if="((id_line>0 && id_col>0) && (id_line<tab.length-1 && id_col<lines.length-1))">
                        <div class="cell" :style="getcolor(cell,color)"></div>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>
<script>
export default {
  name:'Heatmap',
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
    color:{
        type: Object,
        default() {
            return {
                "-20":"#34495E",
                "-5":"#1F618D",
                "0":"#5499C7",
                "10":"#7FB3D5",
                "20":"#A9CCE3",
                "30":"#EAF2F8",
                "40":"#FEE98B",
                "50":"#FCCF5F",
                "60":"#FFB65C",
                "70":"#F88663",
                "80":"#EC716F",
                "90":"#DB5151",
                "100":"#B03A2E",
                "110":"#7F0000",
                "120":"#8E44AD",
            }
        },
    }
  },
  data(){
    return{
        end:true,
        maze_tab:null
    }
  },
  methods:{
    getcolor(value){
        let result = "#EAECEE"
        let keys = Object.keys(this.color).map(Number);
        keys.sort((a, b) => a - b);
        for(var key of keys){
            if (this.color.hasOwnProperty(key)) {
                if(value>=key){
                    result = this.color[key]
                }
            }
        }
        return "background-color:"+result+";";
    }
  },
}
/*"*/
</script>
<style>
.heatmap{
  border-radius: 4px;
  border-color:lightgray;
  background-color: #e8f0ff;
}
.heatmap >.heatmap-line{
    display: flex; 
    flex-direction: row; 
}
.heatmap-column .cell{
    padding:1em;
    border-radius: 2px;
}
</style>
