import { createRouter, createWebHistory } from 'vue-router'
import Qlearning from '../views/Qlearning.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Qlearning',
      component: Qlearning,
    },
  ],
})
export default router
