<template>
  <div class="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
    <!-- Left: Node Tools -->
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-1 border rounded-lg">
        <button 
          v-for="nodeType in nodeTypes" 
          :key="nodeType"
          @click="$emit('add-node', nodeType)"
          class="px-3 py-2 text-sm hover:bg-gray-50 first:rounded-l-lg last:rounded-r-lg flex items-center gap-2"
          :title="`Add ${nodeType}`"
        >
          <span class="text-lg">{{ getNodeIcon(nodeType) }}</span>
          <span>{{ nodeType }}</span>
        </button>
      </div>
    </div>

    <!-- Center: Diagram Title -->
    <div class="flex-1 text-center">
      <input 
        v-if="isEditingTitle"
        v-model="diagramTitle"
        @blur="saveTitle"
        @keyup.enter="saveTitle"
        @keyup.escape="cancelEditTitle"
        class="text-lg font-medium bg-transparent border-b-2 border-blue-500 outline-none text-center"
        ref="titleInput"
      />
      <h1 
        v-else
        @click="editTitle"
        class="text-lg font-medium text-gray-900 cursor-pointer hover:text-blue-600"
      >
        {{ currentDiagram?.title || 'Untitled Diagram' }}
      </h1>
    </div>

    <!-- Right: Action Tools -->
    <div class="flex items-center gap-2">
      <!-- New/Save/Load -->
      <button 
        @click="$emit('new-canvas')"
        class="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        title="Create New Canvas"
      >
        <FilePlus class="w-4 h-4" />
        <span>New</span>
      </button>
      
      <button 
        @click="$emit('save-diagram')"
        class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
      >
        <Save class="w-4 h-4" />
        <span>Save</span>
      </button>
      
      <button 
        @click="$emit('load-diagram')"
        class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
      >
        <FolderOpen class="w-4 h-4" />
        <span>Load</span>
      </button>

      <!-- Divider -->
      <div class="w-px h-6 bg-gray-300"></div>

      <!-- Zoom Controls -->
      <div class="flex items-center gap-1 border rounded-lg">
        <button 
          @click="$emit('zoom-out')"
          class="p-2 hover:bg-gray-50 rounded-l-lg"
          title="Zoom Out"
        >
          <Minus class="w-4 h-4" />
        </button>
        <div class="px-3 py-2 text-sm bg-gray-50 min-w-[60px] text-center">
          {{ Math.round(zoom * 100) }}%
        </div>
        <button 
          @click="$emit('zoom-in')"
          class="p-2 hover:bg-gray-50 rounded-r-lg"
          title="Zoom In"
        >
          <Plus class="w-4 h-4" />
        </button>
      </div>

      <button 
        @click="$emit('reset-zoom')"
        class="p-2 border rounded-lg hover:bg-gray-50"
        title="Reset Zoom"
      >
        <Home class="w-4 h-4" />
      </button>

      <!-- Divider -->
      <div class="w-px h-6 bg-gray-300"></div>

      <!-- View Options -->
      <button 
        @click="$emit('toggle-grid')"
        class="p-2 border rounded-lg hover:bg-gray-50"
        :class="{ 'bg-blue-100 border-blue-300': showGrid }"
        title="Toggle Grid"
      >
        <Grid3x3 class="w-4 h-4" />
      </button>

      <!-- Pan hint -->
      <div 
        class="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-xs text-blue-700"
        title="Hold Space + Drag or Middle Mouse Button to pan canvas"
      >
        <Hand class="w-4 h-4" />
        <span class="whitespace-nowrap">Space + Drag to Pan</span>
      </div>

      <!-- Settings -->
      <button 
        class="p-2 border rounded-lg hover:bg-gray-50"
        title="Settings"
      >
        <Settings class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { Save, FolderOpen, FilePlus, Plus, Minus, Home, Grid3x3, Settings, Hand } from 'lucide-vue-next'
import { useDiagramStore } from '@/stores/diagram'

// Define emits
defineEmits([
  'add-node',
  'new-canvas',
  'save-diagram', 
  'load-diagram',
  'zoom-in',
  'zoom-out', 
  'reset-zoom',
  'toggle-grid'
])

// Props
defineProps({
  zoom: {
    type: Number,
    default: 1
  },
  showGrid: {
    type: Boolean,
    default: true
  }
})

// Store
const diagramStore = useDiagramStore()
const { currentDiagram } = storeToRefs(diagramStore)

// Local state
const nodeTypes = ['Event', 'Process', 'API', 'Database', 'Decision', 'External']
const isEditingTitle = ref(false)
const diagramTitle = ref('')
const titleInput = ref(null)

// Node icons mapping
const nodeIcons = {
  Event: '⚡',
  Process: '⚙️',
  API: '🔗',
  Database: '🗄️',
  Decision: '❓',
  External: '🌐'
}

const getNodeIcon = (nodeType) => {
  return nodeIcons[nodeType] || '⚙️'
}

const editTitle = () => {
  diagramTitle.value = currentDiagram.value?.title || 'Untitled Diagram'
  isEditingTitle.value = true
  
  nextTick(() => {
    titleInput.value?.focus()
    titleInput.value?.select()
  })
}

const saveTitle = () => {
  if (currentDiagram.value && diagramTitle.value.trim()) {
    // This will be implemented when connecting to API
    console.log('Saving title:', diagramTitle.value)
    currentDiagram.value.title = diagramTitle.value.trim()
  }
  isEditingTitle.value = false
}

const cancelEditTitle = () => {
  isEditingTitle.value = false
  diagramTitle.value = currentDiagram.value?.title || 'Untitled Diagram'
}
</script>