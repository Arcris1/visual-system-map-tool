<template>
  <div class="h-full flex flex-col border-r border-gray-200">
    <!-- Search Header -->
    <div class="p-4 border-b border-gray-200">
      <h3 class="text-lg font-medium text-gray-900 mb-3">Search & Filter</h3>
      
      <!-- Search Input -->
      <div class="relative">
        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input 
          :value="search"
          @input="$emit('update:search', $event.target.value)"
          placeholder="Search nodes..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>

    <!-- Tags Filter -->
    <div class="p-4 border-b border-gray-200">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Filter by Tags</h4>
      
      <div class="space-y-2 max-h-32 overflow-y-auto">
        <label 
          v-for="tag in allTags" 
          :key="tag"
          class="flex items-center gap-2 cursor-pointer"
        >
          <input 
            type="checkbox"
            :checked="tags.includes(tag)"
            @change="toggleTag(tag)"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-sm text-gray-600">{{ tag }}</span>
        </label>
      </div>
      
      <!-- Clear Tags -->
      <button 
        v-if="tags.length > 0"
        @click="clearTags"
        class="mt-2 text-xs text-blue-600 hover:text-blue-800"
      >
        Clear all filters
      </button>
    </div>

    <!-- Node Results -->
    <div class="flex-1 overflow-hidden">
      <div class="p-4">
        <h4 class="text-sm font-medium text-gray-700 mb-2">
          Nodes ({{ filteredNodes.length }})
        </h4>
      </div>
      
      <div class="flex-1 overflow-y-auto px-4">
        <div v-if="filteredNodes.length === 0" class="text-sm text-gray-500 text-center py-8">
          No nodes found
        </div>
        
        <div v-else class="space-y-2 pb-4">
          <div 
            v-for="node in filteredNodes" 
            :key="node.id"
            @click="$emit('node-selected', node.id)"
            class="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors"
          >
            <div class="flex items-start gap-2">
              <span class="text-lg">{{ getNodeIcon(node.type) }}</span>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm text-gray-900 truncate">
                  {{ node.label }}
                </div>
                <div class="text-xs text-gray-500 uppercase tracking-wide">
                  {{ node.type }}
                </div>
                <div v-if="node.details?.description" class="text-xs text-gray-600 mt-1 line-clamp-2">
                  {{ node.details.description }}
                </div>
                <div v-if="node.details?.tags?.length" class="flex flex-wrap gap-1 mt-2">
                  <span 
                    v-for="tag in node.details.tags.slice(0, 3)" 
                    :key="tag"
                    class="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {{ tag }}
                  </span>
                  <span 
                    v-if="node.details.tags.length > 3"
                    class="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    +{{ node.details.tags.length - 3 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="p-4 border-t border-gray-200 bg-gray-50">
      <div class="grid grid-cols-2 gap-4 text-center">
        <div>
          <div class="text-lg font-semibold text-gray-900">{{ totalNodes }}</div>
          <div class="text-xs text-gray-500">Total Nodes</div>
        </div>
        <div>
          <div class="text-lg font-semibold text-gray-900">{{ totalConnections }}</div>
          <div class="text-xs text-gray-500">Connections</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Search } from 'lucide-vue-next'
import { useDiagramStore } from '@/stores/diagram'

// Define props
const props = defineProps({
  search: {
    type: String,
    default: ''
  },
  tags: {
    type: Array,
    default: () => []
  },
  allTags: {
    type: Array,
    default: () => []
  },
  filteredNodes: {
    type: Array,
    default: () => []
  }
})

// Define emits
defineEmits([
  'update:search',
  'update:tags', 
  'node-selected'
])

// Store
const diagramStore = useDiagramStore()
const { currentDiagram } = storeToRefs(diagramStore)

// Computed
const totalNodes = computed(() => {
  return currentDiagram.value?.data?.nodes?.length || 0
})

const totalConnections = computed(() => {
  return currentDiagram.value?.data?.connections?.length || 0
})

// Node icons mapping
const nodeIcons = {
  Event: '⚡',
  Process: '⚙️',
  API: '🔗',
  Database: '🗄️',
  Decision: '❓',
  External: '🌐'
}

// Methods
const getNodeIcon = (nodeType) => {
  return nodeIcons[nodeType] || '⚙️'
}

const toggleTag = (tag) => {
  const newTags = props.tags.includes(tag)
    ? props.tags.filter(t => t !== tag)
    : [...props.tags, tag]
  
  // Emit update using the correct event name
  const emit = getCurrentInstance()?.emit
  emit('update:tags', newTags)
}

const clearTags = () => {
  const emit = getCurrentInstance()?.emit
  emit('update:tags', [])
}

// Import getCurrentInstance for accessing emit
import { getCurrentInstance } from 'vue'
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