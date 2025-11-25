import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import DashboardView from '@/views/DashboardView.vue'
import CanvasView from '@/views/CanvasView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { 
        title: 'Login',
        guest: true 
      }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { 
        title: 'Register',
        guest: true 
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { 
        title: 'Dashboard',
        requiresAuth: true 
      }
    },
    {
      path: '/canvas/:id?',
      name: 'canvas',
      component: CanvasView,
      meta: { 
        title: 'Canvas Editor',
        requiresAuth: true 
      }
    }
  ],
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Set page title
  if (to.meta.title) {
    document.title = `${to.meta.title} - Visual System Map Tool`
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // Try to restore session from token
      const isAuthenticated = await authStore.checkAuth()
      
      if (!isAuthenticated) {
        // Redirect to login
        next({ 
          name: 'login', 
          query: { redirect: to.fullPath } 
        })
        return
      }
    }
  }

  // Redirect authenticated users away from guest pages
  if (to.meta.guest && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }

  next()
})

export default router
