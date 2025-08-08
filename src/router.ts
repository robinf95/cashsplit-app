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
  const clerk = (window as any).Clerk
  if (to.meta.requiresAuth && !clerk?.user) return next('/signin')
  next()
})

export default router