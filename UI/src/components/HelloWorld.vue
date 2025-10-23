<script setup>
import { ref } from 'vue'

defineProps({
  msg: String,
})

const column= ref(12)
const lines = ref(8)
</script>

<template>
  <h1>{{ msg }}</h1>
    <table>
      <tbody>
        <tr v-for="c in lines" :key="c">
          <td v-for="d in column" :key="d">
            <button class="btn-case"type="button" @click=""> </button>
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
