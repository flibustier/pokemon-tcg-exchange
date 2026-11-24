// import { createRouter, createWebHistory } from 'vue-router'
import { isLogged } from '@/services/store'

// What search engines and link previews show of a page (services/head.ts). A page without them is
// left out of search engines.
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
  }
}

const AccountView = () => import('../views/AccountView.vue')

export const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/StepView.vue'),
    // Guards return where to go instead of calling next(), deprecated by Vue Router
    beforeEnter: () => (isLogged() ? '/account/proposals' : true),
    meta: {
      title: 'Pokemon TCG Pocket Exchange Center - Trade Your Cards with the World',
      description:
        'Select your wishlist, create offers, enter your Friend ID and match with other players. Our platform allows you to easily find and organize trades, complete your collection and make the most of your doublons.',
    },
  },
  {
    path: '/login',
    name: 'login',
    meta: {
      title: 'Sign in - Pokemon TCG Pocket Exchange Center',
      description:
        'Sign in to see the players who give the Pokemon TCG Pocket cards you want, and want the ones you give.',
    },
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
    meta: {
      title: 'How to trade and exchange your Pokemon TCG Pocket cards with our hub',
      description: 'Trade and exchange safely your Pokemon TCG Pocket cards with our exchange hub',
    },
    component: () => import('../views/HelpView.vue'),
  },
  {
    path: '/account',
    name: 'account',
    component: AccountView,
    // Not at build time, where nobody is signed in: the page would get the head and the modules of
    // the sign-in page (vite.config.ts leaves its HTML empty)
    beforeEnter: () => (import.meta.env.SSR || isLogged() ? true : '/login'),
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
