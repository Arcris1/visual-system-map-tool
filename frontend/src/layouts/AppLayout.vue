<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation Bar -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <!-- Logo & Brand -->
          <div class="flex items-center">
            <router-link to="/dashboard" class="flex items-center space-x-3">
              <div class="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span class="text-xl">🧭</span>
              </div>
              <span class="text-xl font-bold text-gray-900">Visual System Map</span>
            </router-link>
          </div>

          <!-- Navigation Links -->
          <div class="flex items-center space-x-4">
            <router-link
              to="/dashboard"
              class="px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="isActive('/dashboard') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'"
            >
              <div class="flex items-center space-x-2">
                <LayoutGrid class="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </router-link>

            <router-link
              to="/canvas"
              class="px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="isActive('/canvas') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'"
            >
              <div class="flex items-center space-x-2">
                <PenTool class="w-4 h-4" />
                <span>New Canvas</span>
              </div>
            </router-link>

            <!-- User Menu -->
            <div class="relative" ref="userMenuRef">
              <button
                @click="toggleUserMenu"
                class="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <div class="flex items-center space-x-2">
                  <div class="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {{ userInitials }}
                  </div>
                  <span class="text-sm font-medium text-gray-700">{{ userName }}</span>
                </div>
                <ChevronDown class="w-4 h-4 text-gray-500" :class="{ 'rotate-180': userMenuOpen }" />
              </button>

              <!-- Dropdown Menu -->
              <transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <div
                  v-if="userMenuOpen"
                  class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50"
                >
                  <div class="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                    {{ userEmail }}
                  </div>
                  <button
                    @click="handleLogout"
                    class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <LogOut class="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="h-[calc(100vh-4rem)]">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LayoutGrid, PenTool, ChevronDown, LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const userMenuOpen = ref(false)
const userMenuRef = ref(null)

const userName = computed(() => authStore.userName || 'User')
const userEmail = computed(() => authStore.userEmail || '')
const userInitials = computed(() => {
  const name = authStore.userName || 'U'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const isActive = (path) => {
  return route.path.startsWith(path)
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const handleLogout = async () => {
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Close user menu when clicking outside
const handleClickOutside = (event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    userMenuOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.2s;
}
</style>
