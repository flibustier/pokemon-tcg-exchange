import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/StepView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/logout',
      name: 'logout',
      component: () => import('../views/LogoutView.vue'),
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('../views/ProposalsView.vue'),
    },
    {
      path: '/account/proposals',
      name: 'proposals',
      component: () => import('../views/ProposalsView.vue'),
    },
  ],
})

export default router
