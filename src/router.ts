import { createRouter, createWebHistory } from 'vue-router'
import GroupSelect from './components/GroupSelect.vue'
import ExpenseList from './components/ExpenseList.vue'
import SignIn from './components/SignIn.vue'

const routes = [
  { path: '/signin', component: SignIn },
  { path: '/', redirect: '/groups' },
  { path: '/groups', component: GroupSelect, meta: { requiresAuth: true } },
  { path: '/groups/:id', component: ExpenseList, meta: { requiresAuth: true } },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(async (to, from, next) => {
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    const clerk = (window as any).Clerk

    // If Clerk is not available, allow navigation (fallback)
    if (!clerk) {
      return next()
    }

    // Wait for Clerk to be fully loaded
    if (!clerk.loaded) {
      await new Promise(resolve => {
        const checkLoaded = () => {
          if (clerk.loaded) {
            resolve(true)
          } else {
            setTimeout(checkLoaded, 100)
          }
        }
        checkLoaded()
      })
    }

    // Check if user is authenticated
    if (!clerk.user) {
      return next('/signin')
    }
  }

  next()
})

export default router