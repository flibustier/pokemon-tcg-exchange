import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import type { MessageKey } from '@/services/i18n'
import { isLogged } from '@/services/store'

// The pages of the app. Each one has a file in src/pages, which holds what search engines and link
// previews read, except the conversations: GitHub Pages answers 404.html, the same app, for them.
// The public pages (home, help…) are outside the app, see src/pages/[...locale].

declare module 'vue-router' {
  interface RouteMeta {
    title?: MessageKey
  }
}

const AccountView = () => import('../views/AccountView.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/start',
    name: 'start',
    component: () => import('../views/StepView.vue'),
    // Guards return where to go instead of calling next(), deprecated by Vue Router
    beforeEnter: () => (isLogged() ? '/account/proposals' : true),
  },
  {
    path: '/login',
    name: 'login',
    meta: { title: 'title.login' },
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
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
  },
]

export const createAppRouter = () => createRouter({ history: createWebHistory(), routes })
