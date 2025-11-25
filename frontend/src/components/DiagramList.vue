<template>
  <div class="h-full bg-gray-50">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Visual System Maps</h1>
          <p class="text-gray-600 mt-1">Manage and explore your system diagrams</p>
        </div>
        <button 
          @click="createNewDiagram"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus class="w-4 h-4" />
          New Diagram
        </button>
      </div>

      <!-- Filters -->
      <div class="mt-4 flex items-center gap-4">
        <!-- Search -->
        <div class="flex-1 max-w-md relative">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            v-model="searchQuery"
            placeholder="Search diagrams..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <!-- Tags Filter -->
        <select 
          v-model="selectedTag"
          class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Tags</option>
          <option v-for="tag in availableTags" :key="tag" :value="tag">
            {{ tag }}
          </option>
        </select>

        <!-- My Diagrams Filter -->
        <label class="flex items-center gap-2">
          <input 
            v-model="showMyDiagrams"
            type="checkbox"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-700">My Diagrams</span>
        </label>
      </div>
    </div>

    <!-- Content -->
    <div class="p-6">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-12">
        <div class="text-red-600 mb-2">{{ error }}</div>
        <button 
          @click="loadDiagrams"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredDiagrams.length === 0" class="text-center py-12">
        <div class="text-gray-400 text-6xl mb-4">📊</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">
          {{ diagrams.length === 0 ? 'No diagrams yet' : 'No matching diagrams' }}
        </h3>
        <p class="text-gray-600 mb-4">
          {{ diagrams.length === 0 
            ? 'Create your first visual system map to get started' 
            : 'Try adjusting your search filters'
          }}
        </p>
        <button 
          v-if="diagrams.length === 0"
          @click="createNewDiagram"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create First Diagram
        </button>
      </div>

      <!-- Diagrams Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div 
          v-for="diagram in filteredDiagrams" 
          :key="diagram.id"
          class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
          @click="openDiagram(diagram)"
        >
          <!-- Thumbnail -->
          <div class="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-lg p-4 relative overflow-hidden">
            <!-- Mini visualization of nodes -->
            <div class="absolute inset-4">
              <div 
                v-for="(node, index) in (diagram.data?.nodes || []).slice(0, 8)" 
                :key="node.id"
                class="absolute w-3 h-3 rounded-full opacity-60"
                :class="getNodeColor(node.type)"
                :style="getThumbnailNodePosition(index)"
              ></div>
              <!-- Connection lines -->
              <svg class="absolute inset-0 w-full h-full">
                <line 
                  v-for="(connection, index) in (diagram.data?.connections || []).slice(0, 4)"
                  :key="index"
                  x1="20%" y1="30%" 
                  x2="70%" y2="60%"
                  stroke="#3b82f6" 
                  stroke-width="1" 
                  opacity="0.3"
                />
              </svg>
            </div>
            
            <!-- Actions -->
            <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                @click.stop="duplicateDiagram(diagram)"
                class="p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-50"
                title="Duplicate"
              >
                <Copy class="w-3 h-3 text-gray-600" />
              </button>
            </div>
          </div>

          <!-- Content -->
          <div class="p-4">
            <h3 class="font-medium text-gray-900 truncate">{{ diagram.title }}</h3>
            
            <p v-if="diagram.description" class="text-sm text-gray-600 mt-1 line-clamp-2">
              {{ diagram.description }}
            </p>
            
            <!-- Stats -->
            <div class="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span class="flex items-center gap-1">
                <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                {{ diagram.data?.nodes?.length || 0 }} nodes
              </span>
              <span class="flex items-center gap-1">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                {{ diagram.data?.connections?.length || 0 }} connections
              </span>
            </div>

            <!-- Tags -->
            <div v-if="diagram.tags?.length" class="flex flex-wrap gap-1 mt-2">
              <span 
                v-for="tag in diagram.tags.slice(0, 3)" 
                :key="tag"
                class="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {{ tag }}
              </span>
              <span 
                v-if="diagram.tags.length > 3"
                class="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
              >
                +{{ diagram.tags.length - 3 }}
              </span>
            </div>

            <!-- Meta -->
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div class="text-xs text-gray-500">
                by {{ diagram.creator?.name || 'Unknown' }}
              </div>
              <div class="text-xs text-gray-400">
                v{{ diagram.version }}
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2 mt-3">
              <button 
                @click.stop="openDiagram(diagram)"
                class="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Open
              </button>
              <button 
                @click.stop="showDiagramMenu(diagram, $event)"
                class="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
              >
                <MoreVertical class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Context Menu -->
    <div 
      v-if="contextMenu.show"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      class="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
      @click.stop
    >
      <button 
        @click="editDiagram(contextMenu.diagram)"
        class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
      >
        <Edit class="w-4 h-4" />
        Edit
      </button>
      <button 
        @click="duplicateDiagram(contextMenu.diagram)"
        class="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
      >
        <Copy class="w-4 h-4" />
        Duplicate
      </button>
      <div class="border-t border-gray-100 my-1"></div>
      <button 
        @click="deleteDiagram(contextMenu.diagram)"
        class="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
      >
        <Trash2 class="w-4 h-4" />
        Delete
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Plus, Search, Copy, MoreVertical, Edit, Trash2 } from 'lucide-vue-next'
import { useDiagramStore } from '@/stores/diagram'

// Router
const router = useRouter()

// Store
const diagramStore = useDiagramStore()
const { 
  diagrams, 
  loading, 
  error
} = storeToRefs(diagramStore)

const {
  fetchDiagrams,
  duplicateDiagram: storeDuplicateDiagram,
  deleteDiagram: storeDeleteDiagram
} = diagramStore

// Local state
const searchQuery = ref('')
const selectedTag = ref('')
const showMyDiagrams = ref(false)
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  diagram: null
})

// Computed
const availableTags = computed(() => {
  if (!diagrams.value || !Array.isArray(diagrams.value)) return []
  
  const tags = new Set()
  diagrams.value.forEach(diagram => {
    if (diagram.tags) {
      diagram.tags.forEach(tag => tags.add(tag))
    }
  })
  return Array.from(tags).sort()
})

const filteredDiagrams = computed(() => {
  if (!diagrams.value || !Array.isArray(diagrams.value)) return []
  
  let filtered = [...diagrams.value]
  
  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(diagram => 
      diagram.title.toLowerCase().includes(query) ||
      diagram.description?.toLowerCase().includes(query)
    )
  }
  
  // Tag filter
  if (selectedTag.value) {
    filtered = filtered.filter(diagram => 
      diagram.tags?.includes(selectedTag.value)
    )
  }
  
  // My diagrams filter
  if (showMyDiagrams.value) {
    // This would filter by current user ID in a real implementation
    // filtered = filtered.filter(diagram => diagram.created_by === currentUserId)
  }
  
  return filtered
})

// Methods
const loadDiagrams = async () => {
  try {
    await fetchDiagrams()
  } catch (error) {
    console.error('Failed to load diagrams:', error)
  }
}

const createNewDiagram = () => {
  router.push({ name: 'canvas', query: { new: 'true' } })
}

const openDiagram = (diagram) => {
  router.push({ name: 'canvas', params: { id: diagram.id } })
}

const editDiagram = (diagram) => {
  router.push({ name: 'canvas', params: { id: diagram.id }, query: { edit: 'true' } })
  contextMenu.value.show = false
}

const duplicateDiagram = async (diagram) => {
  try {
    await storeDuplicateDiagram(diagram.id)
    contextMenu.value.show = false
  } catch (error) {
    console.error('Failed to duplicate diagram:', error)
  }
}

const deleteDiagram = async (diagram) => {
  if (confirm(`Are you sure you want to delete "${diagram.title}"? This action cannot be undone.`)) {
    try {
      await storeDeleteDiagram(diagram.id)
      contextMenu.value.show = false
    } catch (error) {
      console.error('Failed to delete diagram:', error)
    }
  }
}

const showDiagramMenu = (diagram, event) => {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    diagram
  }
}

const hideContextMenu = () => {
  contextMenu.value.show = false
}

const getNodeColor = (nodeType) => {
  const colors = {
    Event: 'bg-blue-400',
    Process: 'bg-green-400',
    API: 'bg-yellow-400',
    Database: 'bg-purple-400',
    Decision: 'bg-red-400',
    External: 'bg-gray-400'
  }
  return colors[nodeType] || 'bg-gray-400'
}

const getThumbnailNodePosition = (index) => {
  const positions = [
    { left: '15%', top: '20%' },
    { left: '45%', top: '15%' },
    { left: '75%', top: '25%' },
    { left: '25%', top: '45%' },
    { left: '65%', top: '50%' },
    { left: '85%', top: '45%' },
    { left: '35%', top: '70%' },
    { left: '65%', top: '75%' }
  ]
  return positions[index] || { left: '50%', top: '50%' }
}

// Lifecycle
onMounted(() => {
  loadDiagrams()
  document.addEventListener('click', hideContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>