// import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/StepView.vue'
import { isLogged } from '@/services/store'

export const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    beforeEnter: (_to, _from, next) => {
      if (isLogged()) {
        next('/account/proposals')
      } else {
        next()
      }
    },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
  },
  {
    path: '/logout',
    name: 'logout',
    component: () => import('../views/LogoutView.vue'),
  },
  {
    path: '/help',
    name: 'help',
    component: () => import('../views/HelpView.vue'),
  },
  {
    path: '/account',
    name: 'account',
    component: () => import('../views/AccountView.vue'),
    beforeEnter: (_to, _from, next) => {
      if (isLogged()) {
        next()
      } else {
        next('/login')
      }
    },
    children: [
      {
        path: 'wishlist',
        name: 'wishlist',
        component: () => import('../views/AccountView.vue'),
      },
      {
        path: 'offers',
        name: 'offers',
        component: () => import('../views/AccountView.vue'),
      },
      {
        path: 'proposals',
        name: 'proposals',
        component: () => import('../views/AccountView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
  },
]

/*
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
*/
