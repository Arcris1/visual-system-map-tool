<template>
  <div class="h-full flex flex-col bg-gray-50">
    <!-- Toolbar -->
    <Toolbar 
      @add-node="handleAddNode"
      @save-diagram="handleSaveDiagram"
      @load-diagram="handleLoadDiagram"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @reset-zoom="resetZoom"
      @toggle-grid="toggleGrid"
    />
    
    <div class="flex-1 flex">
      <!-- Canvas Area -->
      <div class="flex-1 relative">
        <div 
          ref="drawflowContainer" 
          id="drawflow" 
          class="h-full bg-white"
          :class="{ 'grid-background': showGrid }"
        ></div>
        
        <!-- Zoom Controls -->
        <div class="absolute bottom-4 right-4 flex flex-col gap-2">
          <button 
            @click="zoomIn" 
            class="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border"
            title="Zoom In"
          >
            <Plus class="w-4 h-4" />
          </button>
          <button 
            @click="zoomOut" 
            class="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border"
            title="Zoom Out"
          >
            <Minus class="w-4 h-4" />
          </button>
          <button 
            @click="resetZoom" 
            class="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border"
            title="Reset Zoom"
          >
            <Home class="w-4 h-4" />
          </button>
        </div>
        
        <!-- Mini Map -->
        <div class="absolute top-4 right-4 w-48 h-32 bg-white/90 rounded-lg shadow-md border overflow-hidden">
          <canvas ref="miniMapCanvas" class="w-full h-full"></canvas>
        </div>
      </div>
      
      <!-- Side Panel -->
      <div class="w-80 bg-white border-l border-gray-200 flex flex-col">
        <!-- Search Panel -->
        <SearchPanel 
          :search="searchQuery"
          :tags="selectedTags"
          :all-tags="allTags"
          :filtered-nodes="filteredNodes"
          @update:search="searchQuery = $event"
          @update:tags="selectedTags = $event"
          @node-selected="highlightNode"
        />
        
        <!-- Node Editor -->
        <NodeEditor 
          v-if="isNodeEditorOpen && selectedNode"
          :node="selectedNode"
          @update-node="handleUpdateNode"
          @delete-node="handleDeleteNode"
          @close="closeNodeEditor"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Plus, Minus, Home } from 'lucide-vue-next'
import Drawflow from 'drawflow'
import { useDiagramStore } from '@/stores/diagram'
import Toolbar from './Toolbar.vue'
import SearchPanel from './SearchPanel.vue'
import NodeEditor from './NodeEditor.vue'

// Router
const router = useRouter()
const route = useRoute()

// Store
const diagramStore = useDiagramStore()
const { 
  currentDiagram, 
  selectedNode, 
  isNodeEditorOpen, 
  searchQuery, 
  selectedTags, 
  allTags, 
  filteredNodes
} = storeToRefs(diagramStore)

const {
  selectNode,
  updateNode,
  addNode,
  removeNode,
  addConnection,
  removeConnection,
  closeNodeEditor,
  fetchDiagram
} = diagramStore

// Refs
const drawflowContainer = ref(null)
const miniMapCanvas = ref(null)

// Local state
const drawflowInstance = ref(null)
const showGrid = ref(true)
const zoom = ref(1)

// Node types configuration
const nodeTypes = {
  Event: { color: '#3b82f6', icon: '⚡' },
  Process: { color: '#10b981', icon: '⚙️' },
  API: { color: '#f59e0b', icon: '🔗' },
  Database: { color: '#8b5cf6', icon: '🗄️' },
  Decision: { color: '#ef4444', icon: '❓' },
  External: { color: '#6b7280', icon: '🌐' }
}

onMounted(async () => {
  initializeDrawflow()
  
  // Load diagram if ID is provided in route
  const diagramId = route.params.id
  if (diagramId && diagramId !== 'new') {
    try {
      await fetchDiagram(diagramId)
    } catch (error) {
      console.error('Failed to load diagram:', error)
      router.push({ name: 'diagrams' })
    }
  }
  
  updateMiniMap()
})

onUnmounted(() => {
  if (drawflowInstance.value) {
    drawflowInstance.value.clear()
  }
})

watch(currentDiagram, (newDiagram) => {
  if (newDiagram && drawflowInstance.value) {
    loadDiagramToCanvas(newDiagram)
  }
}, { deep: true })

watch(filteredNodes, () => {
  highlightFilteredNodes()
})

const initializeDrawflow = () => {
  const container = drawflowContainer.value
  if (!container) return
  
  drawflowInstance.value = new Drawflow(container)
  drawflowInstance.value.reroute = true
  drawflowInstance.value.reroute_fix_curvature = true
  drawflowInstance.value.force_first_input = false
  
  // Configure drawflow
  drawflowInstance.value.start()
  drawflowInstance.value.zoom_out()
  drawflowInstance.value.zoom_in()
  
  // Event listeners
  drawflowInstance.value.on('nodeSelected', (id) => {
    const nodeData = findNodeById(id)
    if (nodeData) {
      selectNode(nodeData)
    }
  })
  
  drawflowInstance.value.on('connectionCreated', (connection) => {
    addConnection({
      from: connection.output_id,
      to: connection.input_id,
      output: connection.output_class,
      input: connection.input_class
    })
  })
  
  drawflowInstance.value.on('connectionRemoved', (connection) => {
    removeConnection(connection.output_id, connection.input_id)
  })
  
  drawflowInstance.value.on('nodeMoved', (id) => {
    const nodeElement = drawflowInstance.value.getNodeFromId(id)
    if (nodeElement && currentDiagram.value?.data?.nodes) {
      const nodeData = currentDiagram.value.data.nodes.find(n => n.id === `node_${id}`)
      if (nodeData) {
        nodeData.position = {
          x: nodeElement.pos_x,
          y: nodeElement.pos_y
        }
      }
    }
    updateMiniMap()
  })
  
  drawflowInstance.value.on('zoom', () => {
    updateMiniMap()
  })
}

const findNodeById = (drawflowId) => {
  if (!currentDiagram.value?.data?.nodes) return null
  return currentDiagram.value.data.nodes.find(n => n.id === `node_${drawflowId}`)
}

const loadDiagramToCanvas = (diagram) => {
  if (!drawflowInstance.value || !diagram.data) return
  
  // Clear existing canvas
  drawflowInstance.value.clear()
  
  // Add nodes
  if (diagram.data.nodes) {
    diagram.data.nodes.forEach(node => {
      addNodeToCanvas(node)
    })
  }
  
  // Add connections
  if (diagram.data.connections) {
    nextTick(() => {
      diagram.data.connections.forEach(conn => {
        addConnectionToCanvas(conn)
      })
    })
  }
  
  updateMiniMap()
}

const addNodeToCanvas = (nodeData) => {
  if (!drawflowInstance.value) return
  
  const nodeType = nodeTypes[nodeData.type] || nodeTypes.Process
  const html = createNodeHTML(nodeData, nodeType)
  
  const drawflowId = nodeData.id.replace('node_', '')
  
  drawflowInstance.value.addNode(
    nodeData.label || 'Untitled',
    1, // inputs
    1, // outputs  
    nodeData.position?.x || 100,
    nodeData.position?.y || 100,
    'node',
    {},
    html,
    false,
    drawflowId
  )
}

const createNodeHTML = (nodeData, nodeType) => {
  return `
    <div class="drawflow-node" style="border-left: 4px solid ${nodeType.color}">
      <div class="node-header">
        <span class="node-icon">${nodeType.icon}</span>
        <span class="node-title">${nodeData.label || 'Untitled'}</span>
      </div>
      <div class="node-type">${nodeData.type || 'Process'}</div>
      ${nodeData.details?.description ? `<div class="node-description">${nodeData.details.description}</div>` : ''}
    </div>
  `
}

const addConnectionToCanvas = (connection) => {
  if (!drawflowInstance.value) return
  
  const fromId = connection.from.replace('node_', '')
  const toId = connection.to.replace('node_', '')
  
  drawflowInstance.value.addConnection(fromId, toId, 'output_1', 'input_1')
}

const handleAddNode = (nodeType) => {
  if (!drawflowInstance.value) return
  
  const newNodeData = {
    id: `node_${Date.now()}`,
    type: nodeType,
    label: `New ${nodeType}`,
    position: { x: 200, y: 200 },
    details: {
      description: '',
      tags: [],
      owner: '',
      api: '',
      function: ''
    }
  }
  
  addNode(newNodeData)
  addNodeToCanvas(newNodeData)
  selectNode(newNodeData)
  updateMiniMap()
}

const handleUpdateNode = (nodeId, updatedData) => {
  updateNode(nodeId, updatedData)
  
  // Update node in canvas
  const drawflowId = nodeId.replace('node_', '')
  const nodeElement = drawflowInstance.value.getNodeFromId(drawflowId)
  
  if (nodeElement) {
    const nodeType = nodeTypes[updatedData.type] || nodeTypes.Process
    const newHTML = createNodeHTML(updatedData, nodeType)
    
    drawflowInstance.value.updateNodeDataFromId(drawflowId, newHTML)
  }
  
  updateMiniMap()
}

const handleDeleteNode = (nodeId) => {
  const drawflowId = nodeId.replace('node_', '')
  drawflowInstance.value.removeNodeId(`node-${drawflowId}`)
  removeNode(nodeId)
  updateMiniMap()
}

const handleSaveDiagram = async () => {
  if (!currentDiagram.value) {
    // Create new diagram
    const diagramData = {
      title: 'New Diagram',
      description: '',
      data: {
        nodes: [],
        connections: []
      },
      tags: []
    }
    
    try {
      await diagramStore.createDiagram(diagramData)
    } catch (error) {
      console.error('Failed to create diagram:', error)
    }
  } else {
    // Update existing diagram
    try {
      await diagramStore.updateDiagram(currentDiagram.value.id, {
        data: currentDiagram.value.data
      })
    } catch (error) {
      console.error('Failed to save diagram:', error)
    }
  }
}

const handleLoadDiagram = () => {
  // Navigate to diagram list
  router.push({ name: 'diagrams' })
}

const zoomIn = () => {
  if (drawflowInstance.value) {
    drawflowInstance.value.zoom_in()
    updateMiniMap()
  }
}

const zoomOut = () => {
  if (drawflowInstance.value) {
    drawflowInstance.value.zoom_out()
    updateMiniMap()
  }
}

const resetZoom = () => {
  if (drawflowInstance.value) {
    drawflowInstance.value.zoom_reset()
    updateMiniMap()
  }
}

const toggleGrid = () => {
  showGrid.value = !showGrid.value
}

const highlightNode = (nodeId) => {
  // Highlight specific node on canvas
  const drawflowId = nodeId.replace('node_', '')
  const nodeElement = document.querySelector(`#node-${drawflowId}`)
  
  if (nodeElement) {
    // Remove previous highlights
    document.querySelectorAll('.node-highlighted').forEach(el => {
      el.classList.remove('node-highlighted')
    })
    
    // Add highlight
    nodeElement.classList.add('node-highlighted')
    
    // Center on node
    const rect = nodeElement.getBoundingClientRect()
    const container = drawflowContainer.value
    const containerRect = container.getBoundingClientRect()
    
    const centerX = rect.left - containerRect.left + rect.width / 2
    const centerY = rect.top - containerRect.top + rect.height / 2
    
    container.scrollTo({
      left: centerX - container.clientWidth / 2,
      top: centerY - container.clientHeight / 2,
      behavior: 'smooth'
    })
  }
}

const highlightFilteredNodes = () => {
  if (!drawflowInstance.value) return
  
  // Remove all highlights
  document.querySelectorAll('.node-filtered').forEach(el => {
    el.classList.remove('node-filtered')
  })
  
  // Add highlights for filtered nodes
  filteredNodes.value.forEach(node => {
    const drawflowId = node.id.replace('node_', '')
    const nodeElement = document.querySelector(`#node-${drawflowId}`)
    if (nodeElement) {
      nodeElement.classList.add('node-filtered')
    }
  })
}

const updateMiniMap = () => {
  if (!miniMapCanvas.value || !drawflowInstance.value) return
  
  const canvas = miniMapCanvas.value
  const ctx = canvas.getContext('2d')
  const container = drawflowContainer.value
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Draw simplified nodes
  const nodes = container.querySelectorAll('.drawflow-node')
  nodes.forEach(node => {
    const rect = node.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()
    
    const x = (rect.left - containerRect.left) / containerRect.width * canvas.width
    const y = (rect.top - containerRect.top) / containerRect.height * canvas.height
    const w = rect.width / containerRect.width * canvas.width
    const h = rect.height / containerRect.height * canvas.height
    
    ctx.fillStyle = '#3b82f6'
    ctx.fillRect(x, y, Math.max(w, 2), Math.max(h, 2))
  })
  
  // Draw viewport rectangle
  const viewportX = container.scrollLeft / container.scrollWidth * canvas.width
  const viewportY = container.scrollTop / container.scrollHeight * canvas.height
  const viewportW = container.clientWidth / container.scrollWidth * canvas.width
  const viewportH = container.clientHeight / container.scrollHeight * canvas.height
  
  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = 1
  ctx.strokeRect(viewportX, viewportY, viewportW, viewportH)
}
</script>

<style scoped>
.grid-background {
  background-image: 
    linear-gradient(rgba(0, 0, 0, .1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, .1) 1px, transparent 1px);
  background-size: 20px 20px;
}

:deep(.drawflow-node) {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  padding: 12px;
  min-width: 150px;
}

:deep(.node-header) {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
}

:deep(.node-icon) {
  font-size: 18px;
}

:deep(.node-title) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.node-type) {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 500;
}

:deep(.node-description) {
  font-size: 14px;
  color: #4b5563;
  margin-top: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:deep(.node-highlighted) {
  box-shadow: 0 0 0 2px #3b82f6, 0 0 0 4px rgba(59, 130, 246, 0.2);
}

:deep(.node-filtered) {
  box-shadow: 0 0 0 2px #10b981, 0 0 0 3px rgba(16, 185, 129, 0.2);
}

:deep(.drawflow .connection .main-path) {
  stroke: #3b82f6;
  stroke-width: 2px;
}

:deep(.drawflow .connection .main-path:hover) {
  stroke: #1d4ed8;
  stroke-width: 3px;
}
</style>