// import { createRouter, createWebHistory } from 'vue-router'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { isLogged } from '@/services/store'

const AccountView = () => import('../views/AccountView.vue')

export const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/StepView.vue'),
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
    path: '/forgotten-password',
    name: 'forgotten-password',
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
    component: AccountView,
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
        component: AccountView,
      },
      {
        path: 'offers',
        name: 'offers',
        component: AccountView,
      },
      {
        path: 'proposals',
        name: 'proposals',
        component: AccountView,
      },
      {
        path: 'beta',
        name: 'beta',
        component: AccountView,
      },
      {
        path: 'messages',
        name: 'messages',
        component: AccountView,
        children: [
          {
            path: ':id',
            name: 'message',
            component: AccountView,
          },
        ],
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
