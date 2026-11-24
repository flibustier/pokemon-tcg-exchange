// import { createRouter, createWebHistory } from 'vue-router'
import { isLogged } from '@/services/store'

const AccountView = () => import('../views/AccountView.vue')

export const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/StepView.vue'),
    // Guards return where to go instead of calling next(), deprecated by Vue Router
    beforeEnter: () => (isLogged() ? '/account/proposals' : true),
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
    path: '/confirm-email',
    name: 'confirm-email',
    component: () => import('../views/ConfirmEmailView.vue'),
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
    beforeEnter: () => (isLogged() ? true : '/login'),
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
        path: 'settings',
        name: 'settings',
        component: AccountView,
      },
      {
        path: 'beta',
        name: 'beta',
        component: AccountView,
      },
      {
        path: 'insights',
        name: 'insights',
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
