<template>
    <!-- Barre animée -->
   <div class="barre">
    <div :class="['progress',{start:value<=0.33,medium:(value<=0.66 && value>=0.33),finished:value>0.66}]" :style="{ width: value*100 + '%' }"></div>
   </div>
</template>
<script>
export default {
  name:'progressBar',
  props:{
    value: {
        type: Number,
        default() {
            return 0
        },
        required: true,
        validator(value) {
            const areIntegers = Number.isInteger(value);
            let is0to1 = false;
            if (!areIntegers) {
                console.warn("La valeur doit être un int");
            }
            else{
                if(value>=0 && value <=1){
                    is0to1 = true
                }
                else{
                    console.warn("La valeur doit être entre 0 et 1");
                }
            }
            return areIntegers && is0to1;
        }
    }
  }
}
/*"*/
</script>
<style>
.barre{
    width:20em;
    height:1.5em;
    background-color: #ffffff;
    border-radius: 4px;
    border: solid 0.1em #3a3a3a; 
}
.progress{
    width:0%;
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
}
.start{
    background-color: crimson;
}
.medium{
    background-color: orange;
}
.finished{
    background-color: #52a535;
}
</style>
