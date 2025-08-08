import './app.css'

import { Clerk } from '@clerk/clerk-js'
import router from "./router";
import {createPinia} from "pinia";
import {createApp, h} from "vue";
import App from "./App.vue";

async function initializeApp() {
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  const clerk = new Clerk(clerkPubKey || 'pk_test_replace_me')
  await clerk.load()
  ;(window as any).Clerk = clerk

  const app = createApp({ render: () => h(App) })
  app.use(createPinia())
  app.use(router)
  app.mount('#app')
}

initializeApp()

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(console.error)
  })
}