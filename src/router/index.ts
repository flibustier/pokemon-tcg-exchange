// import { createRouter, createWebHistory } from 'vue-router'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { isLogged } from '@/services/store'
import HomeView from '../views/StepView.vue'

export const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    beforeEnter: (
      _to: RouteLocationNormalized,
      _from: RouteLocationNormalized,
      next: NavigationGuardNext,
    ) => {
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
    beforeEnter: (
      _to: RouteLocationNormalized,
      _from: RouteLocationNormalized,
      next: NavigationGuardNext,
    ) => {
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
    path: '/404',
    name: '404',
    component: () => import('../views/NotFoundView.vue'),
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
