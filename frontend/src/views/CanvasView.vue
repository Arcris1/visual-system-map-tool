<template>
  <AppLayout>
    <div class="h-full flex flex-col">
    <!-- Toolbar -->
    <Toolbar 
      @add-node="handleAddNode"
      @new-canvas="handleNewCanvas"
      @save-diagram="handleSaveDiagram"
      @load-diagram="handleLoadDiagram"
      @zoom-in="zoomIn"
      @zoom-out="zoomOut"
      @reset-zoom="resetZoom"
      @toggle-grid="toggleGrid"
    />
    
    <div class="flex-1 flex">
      <!-- Canvas Area -->
      <div class="flex-1 relative bg-transparent" style="overflow: hidden;">
        <div 
          ref="drawflowContainer" 
          id="drawflow" 
          class="h-full grid-background"
        ></div>
        
        <!-- Zoom Controls -->
        <div class="fixed bottom-4 right-4 flex flex-col gap-2 z-[100] pointer-events-auto">
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
          <div class="h-px bg-gray-300 my-1"></div>
          <button 
            @click="recenterCanvas" 
            class="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border"
            title="Recenter Canvas (Fixes panning issues)"
          >
            <Crosshair class="w-4 h-4" />
          </button>
          <button 
            @click="fixNodePositions" 
            class="p-2 bg-amber-50 border border-amber-300 rounded-lg shadow-md hover:bg-amber-100"
            title="Fix Node Positions (Reset misplaced nodes)"
          >
            <WandSparkles class="w-4 h-4 text-amber-600" />
          </button>
          <button 
            @click="forceResetAllNodes" 
            class="p-2 bg-red-50 border border-red-300 rounded-lg shadow-md hover:bg-red-100"
            title="FORCE RESET ALL NODES TO CENTER (Nuclear option)"
          >
            <Zap class="w-4 h-4 text-red-600" />
          </button>
        </div>
        
        <!-- Mini Map - Positioned to avoid overlap with toolbar buttons -->
        <div class="fixed top-24 right-4 w-48 h-32 bg-white/90 rounded-lg shadow-md border overflow-hidden z-[100] pointer-events-none">
          <canvas ref="miniMapCanvas" class="w-full h-full"></canvas>
        </div>
        
        <!-- Floating Search Panel -->
        <div 
          v-if="showSearchPanel"
          class="floating-search-panel"
        >
          <SearchPanel 
            :search="searchQuery"
            :tags="selectedTags"
            :all-tags="allTags"
            :filtered-nodes="filteredNodes"
            @update:search="searchQuery = $event"
            @update:tags="selectedTags = $event"
            @node-selected="highlightNode"
          />
          <button 
            @click="showSearchPanel = false"
            class="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
          >
            <X class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <!-- Search Toggle Button - Positioned to avoid overlap with node type buttons -->
        <button
          v-if="!showSearchPanel"
          @click="showSearchPanel = true"
          class="fixed top-40 left-4 p-3 bg-white rounded-lg shadow-md hover:bg-gray-50 border z-[100]"
          title="Search & Filter"
        >
          <Search class="w-5 h-5" />
        </button>
      </div>
      
      <!-- Floating Node Editor -->
      <NodeEditor 
        v-if="isNodeEditorOpen && selectedNode"
        :node="selectedNode"
        @update-node="handleUpdateNode"
        @delete-node="handleDeleteNode"
        @close="closeNodeEditor"
      />
      
      <!-- Technical Details Panel -->
      <TechnicalDetailsPanel 
        v-if="selectedNode && !isNodeEditorOpen"
        :node="selectedNode"
        @close="selectedNode = null"
      />
    </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import AppLayout from '@/layouts/AppLayout.vue'
import { Plus, Minus, Home, Search, X, Crosshair, WandSparkles, Zap } from 'lucide-vue-next'
import Drawflow from 'drawflow'
import { useDiagramStore } from '@/stores/diagram'
import Toolbar from '@/components/Toolbar.vue'
import SearchPanel from '@/components/SearchPanel.vue'
import NodeEditor from '@/components/NodeEditor.vue'
import TechnicalDetailsPanel from '@/components/TechnicalDetailsPanel.vue'

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
const resizeHandle = ref(null)
const sidePanel = ref(null)

// Local state
const showSearchPanel = ref(false)
const drawflowInstance = ref(null)
const showGrid = ref(true)
const zoom = ref(1)
const isLoadingDiagram = ref(false)
const diagramLoaded = ref(false)

// Map our node IDs to Drawflow's internal IDs
const nodeIdMap = ref(new Map()) // Maps 'node_123456789' -> '1' (drawflow's internal ID)

// Node types configuration with vibrant colors and gradients
const nodeTypes = {
  Event: { 
    color: '#3b82f6', 
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    bgGradient: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    icon: '⚡',
    shadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  Process: { 
    color: '#10b981', 
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    bgGradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    icon: '⚙️',
    shadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
  },
  API: { 
    color: '#f59e0b', 
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    icon: '🔗',
    shadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
  },
  Database: { 
    color: '#8b5cf6', 
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    bgGradient: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
    icon: '🗄️',
    shadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
  },
  Decision: { 
    color: '#ef4444', 
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    bgGradient: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
    icon: '❓',
    shadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
  },
  External: { 
    color: '#6b7280', 
    gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    bgGradient: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    icon: '🌐',
    shadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
  }
}

onMounted(async () => {
  initializeDrawflow()
  
  // Load diagram if ID is provided in route
  const diagramId = route.params.id
  if (diagramId && diagramId !== 'new') {
    try {
      await fetchDiagram(diagramId)
      // Manually load the diagram after fetching
      if (currentDiagram.value) {
        loadDiagramToCanvas(currentDiagram.value)
      }
    } catch (error) {
      console.error('Failed to load diagram:', error)
      router.push({ name: 'dashboard' })
    }
  } else {
    // Reset canvas for new diagram - clear any previous data
    diagramStore.resetCanvas()
    
    // Clear the Drawflow canvas
    if (drawflowInstance.value) {
      drawflowInstance.value.clear()
      nodeIdMap.value.clear()
    }
    
    diagramLoaded.value = true
    console.log('New canvas initialized with clean state')
  }
  
  // Position validation removed - nodes now use natural Drawflow coordinate system
  // If migration is needed, it will happen automatically in loadDiagramToCanvas()
  
  updateMiniMap()
})

onUnmounted(() => {
  if (drawflowInstance.value) {
    drawflowInstance.value.clear()
  }
  
  // Clean up event listeners
  const container = drawflowContainer.value
  if (container && container._panEventListeners) {
    const listeners = container._panEventListeners
    window.removeEventListener('keydown', listeners.handleKeyDown)
    window.removeEventListener('keyup', listeners.handleKeyUp)
    container.removeEventListener('mousedown', listeners.handleMouseDown)
    container.removeEventListener('mousemove', listeners.handleMouseMove)
    container.removeEventListener('mouseup', listeners.handleMouseUp)
    container.removeEventListener('mouseleave', listeners.handleMouseLeave)
  }
  
  // Cleanup panning listeners only
})

// Watch for route parameter changes (navigating between diagrams)
watch(() => route.params.id, async (newId, oldId) => {
  if (newId !== oldId) {
    console.log(`Route changed from ${oldId} to ${newId}`)
    
    if (newId && newId !== 'new') {
      // Load existing diagram
      try {
        await fetchDiagram(newId)
        if (currentDiagram.value) {
          loadDiagramToCanvas(currentDiagram.value)
        }
      } catch (error) {
        console.error('Failed to load diagram:', error)
      }
    } else {
      // Reset for new canvas
      diagramStore.resetCanvas()
      
      if (drawflowInstance.value) {
        drawflowInstance.value.clear()
        nodeIdMap.value.clear()
      }
      
      diagramLoaded.value = true
      console.log('Canvas reset for new diagram')
    }
  }
})

watch(() => currentDiagram.value?.id, (newId, oldId) => {
  // Only reload when the diagram ID changes (switching to a different diagram)
  // Not when the data changes (adding nodes/connections)
  if (newId !== oldId && currentDiagram.value && drawflowInstance.value && !isLoadingDiagram.value) {
    loadDiagramToCanvas(currentDiagram.value)
  }
})

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
  
  // Simply let Drawflow work normally - removing all custom overrides
  
  // Simple solution: Just let Drawflow work as designed
  
  // Enable canvas panning with middle mouse or space+drag
  let isPanning = false
  let panStartX = 0
  let panStartY = 0
  let scrollLeft = 0
  let scrollTop = 0
  let spacePressed = false
  
  // Track space key and keyboard shortcuts
  const handleKeyDown = (e) => {
    // Space for pan mode
    if (e.code === 'Space' && !e.repeat && !e.target.matches('input, textarea')) {
      spacePressed = true
      container.classList.add('pan-mode')
      e.preventDefault()
    }
    
    // Ctrl/Cmd + 0 to recenter
    if ((e.ctrlKey || e.metaKey) && e.key === '0') {
      recenterCanvas()
      e.preventDefault()
    }
  }
  
  const handleKeyUp = (e) => {
    if (e.code === 'Space') {
      spacePressed = false
      if (!isPanning) {
        container.classList.remove('pan-mode')
      }
    }
  }
  
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  
  // Mouse events for panning
  const handleMouseDown = (e) => {
    // Middle mouse button or space+left click for panning
    if (e.button === 1 || (e.button === 0 && spacePressed)) {
      isPanning = true
      panStartX = e.pageX - container.offsetLeft
      panStartY = e.pageY - container.offsetTop
      scrollLeft = container.scrollLeft
      scrollTop = container.scrollTop
      container.classList.add('panning')
      container.classList.remove('pan-mode')
      e.preventDefault()
      console.log('🖐️ Canvas panning started')
    }
  }
  
  const handleMouseMove = (e) => {
    if (!isPanning) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const x = e.pageX - container.offsetLeft
    const y = e.pageY - container.offsetTop
    
    // Adjust panning speed based on zoom level for smoother experience
    const zoomLevel = drawflowInstance.value?.zoom || 1
    const panSpeed = 1.5 / zoomLevel // Inverse of zoom for consistent feel
    
    const walkX = (x - panStartX) * panSpeed
    const walkY = (y - panStartY) * panSpeed
    
    // Use requestAnimationFrame for smoother panning
    requestAnimationFrame(() => {
      container.scrollLeft = scrollLeft - walkX
      container.scrollTop = scrollTop - walkY
    })
    
    // Throttle minimap updates for performance
    if (!handleMouseMove._lastUpdate || Date.now() - handleMouseMove._lastUpdate > 50) {
      updateMiniMap()
      handleMouseMove._lastUpdate = Date.now()
    }
  }
  
  const handleMouseUp = (e) => {
    if (isPanning) {
      isPanning = false
      container.classList.remove('panning')
      if (spacePressed) {
        container.classList.add('pan-mode')
      }
      console.log('🖐️ Canvas panning ended')
    }
  }
  
  const handleMouseLeave = () => {
    if (isPanning) {
      isPanning = false
      container.classList.remove('panning')
      if (spacePressed) {
        container.classList.add('pan-mode')
      }
    }
  }
  
  container.addEventListener('mousedown', handleMouseDown)
  container.addEventListener('mousemove', handleMouseMove)
  container.addEventListener('mouseup', handleMouseUp)
  container.addEventListener('mouseleave', handleMouseLeave)
  
  // Store listener references for cleanup
  container._panEventListeners = {
    handleKeyDown,
    handleKeyUp,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave
  }
  
  // Event listeners
  drawflowInstance.value.on('nodeSelected', (id) => {
    const nodeData = findNodeById(id)
    if (nodeData) {
      selectNode(nodeData)
    }
  })
  
  // Add double-click event listener to container for nodes
  container.addEventListener('dblclick', (e) => {
    console.log('Double-click detected on:', e.target)
    
    // Look for the parent node element (it has the node-X id)
    const nodeContainer = e.target.closest('[id^="node-"]')
    console.log('Found node container:', nodeContainer)
    
    if (nodeContainer) {
      const drawflowId = nodeContainer.id.replace('node-', '')
      console.log('Drawflow node ID:', drawflowId)
      console.log('NodeIdMap:', Array.from(nodeIdMap.value.entries()))
      
      // Find our node ID from Drawflow's internal ID
      let ourNodeId = null
      for (const [id, drawflowNodeId] of nodeIdMap.value.entries()) {
        if (drawflowNodeId === drawflowId) {
          ourNodeId = id
          break
        }
      }
      
      console.log('Our node ID:', ourNodeId)
      
      if (ourNodeId) {
        const nodeData = currentDiagram.value.data.nodes.find(n => n.id === ourNodeId)
        console.log('Node data found:', nodeData)
        
        if (nodeData) {
          selectNode(nodeData)
          console.log('✅ Selected node:', nodeData.label)
          console.log('isNodeEditorOpen:', isNodeEditorOpen.value)
        }
      } else {
        console.warn('Could not find our node ID for drawflow ID:', drawflowId)
      }
    } else {
      console.log('No node container found under double-click')
    }
  })
  
  drawflowInstance.value.on('connectionCreated', (connection) => {
    console.log('Connection created:', connection)
    
    // Find our node IDs from the Drawflow IDs
    let fromNodeId = null
    let toNodeId = null
    
    for (const [nodeId, drawflowId] of nodeIdMap.value.entries()) {
      if (drawflowId === connection.output_id.toString()) {
        fromNodeId = nodeId
      }
      if (drawflowId === connection.input_id.toString()) {
        toNodeId = nodeId
      }
    }
    
    if (fromNodeId && toNodeId) {
      addConnection({
        from: fromNodeId,
        to: toNodeId,
        output: connection.output_class,
        input: connection.input_class
      })
      console.log(`Connection saved: ${fromNodeId} -> ${toNodeId}`)
    } else {
      console.warn('Could not find node IDs for connection:', connection)
    }
  })
  
  drawflowInstance.value.on('connectionRemoved', (connection) => {
    console.log('Connection removed:', connection)
    
    // Find our node IDs from the Drawflow IDs
    let fromNodeId = null
    let toNodeId = null
    
    for (const [nodeId, drawflowId] of nodeIdMap.value.entries()) {
      if (drawflowId === connection.output_id.toString()) {
        fromNodeId = nodeId
      }
      if (drawflowId === connection.input_id.toString()) {
        toNodeId = nodeId
      }
    }
    
    if (fromNodeId && toNodeId) {
      removeConnection(fromNodeId, toNodeId)
    }
  })
  
  drawflowInstance.value.on('nodeRemoved', (id) => {
    console.log('Node removed from Drawflow:', id)
    
    // Find our node ID from Drawflow's internal ID
    let ourNodeId = null
    for (const [nodeId, drawflowId] of nodeIdMap.value.entries()) {
      if (drawflowId === id.toString()) {
        ourNodeId = nodeId
        break
      }
    }
    
    if (ourNodeId) {
      console.log('Removing node from store:', ourNodeId)
      removeNode(ourNodeId)
      nodeIdMap.value.delete(ourNodeId)
    }
    updateMiniMap()
  })
  
  drawflowInstance.value.on('nodeMoved', (id) => {
    const nodeElement = drawflowInstance.value.getNodeFromId(id)
    if (nodeElement && currentDiagram.value?.data?.nodes) {
      // Find our node ID from Drawflow's internal ID
      let ourNodeId = null
      for (const [nodeId, drawflowId] of nodeIdMap.value.entries()) {
        if (drawflowId === id.toString()) {
          ourNodeId = nodeId
          break
        }
      }
      
      if (ourNodeId) {
        const nodeData = currentDiagram.value.data.nodes.find(n => n.id === ourNodeId)
        if (nodeData) {
          nodeData.position = {
            x: nodeElement.pos_x,
            y: nodeElement.pos_y
          }
          console.log(`Updated position for ${ourNodeId}:`, nodeData.position)
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
  if (!drawflowInstance.value || !diagram?.data) return
  
  isLoadingDiagram.value = true
  
  // Clear existing canvas and ID map
  drawflowInstance.value.clear()
  nodeIdMap.value.clear()
  
  // Ensure data structure exists
  if (!diagram.data.nodes) diagram.data.nodes = []
  if (!diagram.data.connections) diagram.data.connections = []
  
  // Migration: Check if nodes are using old coordinate system (10000-centered)
  // Old system: positions around 10000 (range 2000-18000)
  // New system: positions starting at 400 (range 100-5000)
  
  let needsMigration = false
  
  // Check if ALL nodes are in old coordinate system
  const allNodesInOldSystem = diagram.data.nodes.every(node => {
    const pos = node.position || { x: 0, y: 0 }
    return pos.x > 5000 || pos.y > 5000
  })
  
  if (allNodesInOldSystem && diagram.data.nodes.length > 0) {
    console.log('🔄 Migrating nodes from old coordinate system (10000-centered) to new system...')
    needsMigration = true
    
    diagram.data.nodes.forEach((node, index) => {
      const oldPos = node.position || { x: 10000, y: 10000 }
      
      // Migrate from 10000-centered to new system
      // Grid pattern starting at (400, 150)
      const startX = 400
      const startY = 150
      const gridSize = 300
      const cols = 4
      const row = Math.floor(index / cols)
      const col = index % cols
      
      if (!node.position) node.position = {}
      node.position.x = startX + (col * gridSize)
      node.position.y = startY + (row * gridSize)
      
      console.log(`  🔄 ${node.label}: (${oldPos.x}, ${oldPos.y}) → (${node.position.x}, ${node.position.y})`)
    })
    
    console.log('✅ Migration complete - nodes repositioned to new coordinate system')
    alert('🔄 Diagram migrated to new coordinate system!\nNodes have been repositioned to the visible area.\n\n📌 Please SAVE the diagram to persist these changes.')
  }
  
  // Add nodes
  if (diagram.data.nodes && diagram.data.nodes.length > 0) {
    diagram.data.nodes.forEach(node => {
      addNodeToCanvas(node)
    })
  }
  
  // Add connections after nodes are loaded
  if (diagram.data.connections && diagram.data.connections.length > 0) {
    nextTick(() => {
      diagram.data.connections.forEach(conn => {
        addConnectionToCanvas(conn)
      })
      
      nextTick(() => {
        isLoadingDiagram.value = false
        diagramLoaded.value = true
        
        // Restore viewport position if saved
        restoreViewport(diagram)
        
        updateMiniMap()
      })
    })
  } else {
    nextTick(() => {
      isLoadingDiagram.value = false
      diagramLoaded.value = true
      
      // Restore viewport position if saved
      restoreViewport(diagram)
      
      updateMiniMap()
    })
  }
}

const restoreViewport = (diagram) => {
  if (diagram?.data?.viewport && drawflowContainer.value) {
    const { scrollLeft, scrollTop, zoom } = diagram.data.viewport
    
    // Restore scroll position
    if (scrollLeft !== undefined && scrollTop !== undefined) {
      setTimeout(() => {
        drawflowContainer.value.scrollLeft = scrollLeft
        drawflowContainer.value.scrollTop = scrollTop
        console.log('Restored viewport position:', { scrollLeft, scrollTop })
      }, 100)
    }
    
    // Restore zoom level
    if (zoom !== undefined && drawflowInstance.value) {
      // Drawflow doesn't have direct zoom setter, so we track it
      console.log('Saved zoom level:', zoom)
    }
  }
}

const addNodeToCanvas = (nodeData) => {
  if (!drawflowInstance.value) return
  
  const nodeType = nodeTypes[nodeData.type] || nodeTypes.Process
  const html = createNodeHTML(nodeData, nodeType)
  
  // Default starting position for new nodes (visible in viewport)
  const defaultX = 400
  const defaultY = 150
  
  // Use provided position or default
  let posX = nodeData.position?.x !== undefined ? nodeData.position.x : defaultX
  let posY = nodeData.position?.y !== undefined ? nodeData.position.y : defaultY
  
  // Safety check: if position is from old 10000-centered system, migrate it
  // Old positions were around 10000, new positions should be < 5000
  if (posX > 5000 || posY > 5000) {
    console.warn(`⚠️ Node ${nodeData.label} has old position (${posX}, ${posY}). Migrating to new system.`)
    // Shift from 10000-centered to 0-based: subtract ~9600 to get visible range
    posX = Math.max(defaultX, posX - 9600)
    posY = Math.max(defaultY, posY - 9600)
    // Update the nodeData position so it gets saved correctly
    if (nodeData.position) {
      nodeData.position.x = posX
      nodeData.position.y = posY
    }
  }
  
  // Add the node and get Drawflow's internal ID
  const drawflowInternalId = drawflowInstance.value.addNode(
    nodeData.label || 'Untitled',
    1, // inputs
    1, // outputs  
    posX,
    posY,
    'node',
    {},
    html
  )
  
  // Store the mapping between our ID and Drawflow's internal ID
  nodeIdMap.value.set(nodeData.id, drawflowInternalId.toString())
  console.log(`Mapped ${nodeData.id} -> drawflow ID ${drawflowInternalId} at position (${posX}, ${posY})`)
}

const createNodeHTML = (nodeData, nodeType) => {
  // Check if node has technical details
  const hasTechnicalDetails = nodeData.details && (
    (nodeData.details.variables && nodeData.details.variables.length > 0) ||
    (nodeData.details.parameters && nodeData.details.parameters.length > 0) ||
    (nodeData.details.arguments && nodeData.details.arguments.length > 0) ||
    (nodeData.details.payloads && nodeData.details.payloads.length > 0)
  )
  
  // Count total technical items
  const techCount = (nodeData.details?.variables?.length || 0) + 
                   (nodeData.details?.parameters?.length || 0) + 
                   (nodeData.details?.arguments?.length || 0) + 
                   (nodeData.details?.payloads?.length || 0)
  
  // Escape HTML in text to prevent injection
  const escapeHtml = (text) => {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
  
  const label = escapeHtml(nodeData.label || 'Untitled')
  const type = escapeHtml(nodeData.type || 'Process')
  const description = nodeData.details?.description ? escapeHtml(nodeData.details.description) : ''
  
  return `
    <div class="custom-node-content node-type-${nodeData.type?.toLowerCase() || 'process'}" 
         data-color="${nodeType.color}"
         data-gradient="${nodeType.gradient}"
         data-bg-gradient="${nodeType.bgGradient}"
         data-shadow="${nodeType.shadow}">
      <!-- Drag handle in top-left corner -->
      <div class="node-drag-handle node-drag-handle-corner" title="Drag to move">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="4" cy="4" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="4" cy="8" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="4" cy="12" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="8" cy="4" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="8" cy="8" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="8" cy="12" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="12" cy="4" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="12" cy="8" r="1.5" fill="currentColor" opacity="0.4"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.4"/>
        </svg>
      </div>
      <!-- Entire header is draggable -->
      <div class="node-header node-drag-handle" title="Drag to move node">
        <span class="node-icon">${nodeType.icon}</span>
        <span class="node-title">${label}</span>
        ${hasTechnicalDetails ? `<span class="tech-badge" title="${techCount} technical items">⚙️ ${techCount}</span>` : ''}
      </div>
      <div class="node-type-badge" data-gradient="${nodeType.gradient}">
        ${type}
      </div>
      ${description ? `<div class="node-description">${description}</div>` : ''}
    </div>
  `
}

const addConnectionToCanvas = (connection) => {
  if (!drawflowInstance.value || !connection) return
  
  try {
    // Handle different connection data structures
    let fromNodeId = connection.from || `node_${connection.output_id}`
    let toNodeId = connection.to || `node_${connection.input_id}`
    
    // Check if this is a legacy connection format (like 'node_1', 'node_2')
    // Legacy connections have numeric suffixes that are too short (1-2 digits)
    const isLegacyConnection = /^node_\d{1,2}$/.test(fromNodeId) || /^node_\d{1,2}$/.test(toNodeId)
    
    if (isLegacyConnection) {
      console.warn('⚠️ Skipping legacy connection format. Please re-create connections and save:', {
        from: fromNodeId,
        to: toNodeId
      })
      return
    }
    
    // Get the Drawflow internal IDs from our mapping
    const fromDrawflowId = nodeIdMap.value.get(fromNodeId)
    const toDrawflowId = nodeIdMap.value.get(toNodeId)
    
    if (!fromDrawflowId || !toDrawflowId) {
      console.warn('Drawflow IDs not found in mapping:', {
        from: fromNodeId,
        to: toNodeId,
        fromDrawflowId,
        toDrawflowId,
        availableMappings: Array.from(nodeIdMap.value.entries())
      })
      return
    }
    
    console.log(`Adding connection: ${fromNodeId}(${fromDrawflowId}) -> ${toNodeId}(${toDrawflowId})`)
    
    drawflowInstance.value.addConnection(
      fromDrawflowId,
      toDrawflowId,
      connection.output || 'output_1',
      connection.input || 'input_1'
    )
  } catch (error) {
    console.error('Error adding connection to canvas:', error, connection)
  }
}

const getNextNodePosition = () => {
  const container = drawflowContainer.value
  
  // With natural Drawflow layout (no wrapper transform), start nodes near visible area
  // Place first node at reasonable starting position (400, 150)
  const startX = 400
  const startY = 150
  
  if (!currentDiagram.value?.data?.nodes || currentDiagram.value.data.nodes.length === 0) {
    // First node - place at starting position
    return { 
      x: startX,
      y: startY
    }
  }
  
  // Get the last node position
  const lastNode = currentDiagram.value.data.nodes[currentDiagram.value.data.nodes.length - 1]
  const lastPos = lastNode.position || { x: startX, y: startY }
  
  // Offset the new node (250px right, 50px down) for clear separation
  const newX = lastPos.x + 250
  const newY = lastPos.y + 50
  
  // If we've gone too far right, wrap to a new row
  if (newX > startX + 1000) {
    return { 
      x: startX, 
      y: lastPos.y + 200 
    }
  }
  
  return { x: newX, y: newY }
}

const handleAddNode = (nodeType) => {
  if (!drawflowInstance.value) return
  
  const position = getNextNodePosition()
  
  const newNodeData = {
    id: `node_${Date.now()}`,
    type: nodeType,
    label: `New ${nodeType}`,
    position: position,
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
  
  // Scroll to show the new node (with a small delay to ensure it's rendered)
  setTimeout(() => {
    const container = drawflowContainer.value
    if (container) {
      // Calculate where to scroll to show this node
      // We want the node to be visible in the viewport
      const targetScrollLeft = container.scrollLeft
      const targetScrollTop = container.scrollTop
      
      container.scrollTo({
        left: targetScrollLeft,
        top: targetScrollTop,
        behavior: 'smooth'
      })
    }
    updateMiniMap()
  }, 100)
}

const handleUpdateNode = (nodeId, updatedData) => {
  console.log('=== handleUpdateNode called ===')
  console.log('Node ID:', nodeId)
  console.log('Updated Data:', updatedData)
  
  // Update in store first
  updateNode(nodeId, updatedData)
  
  // Get Drawflow's internal ID from our mapping
  const drawflowId = nodeIdMap.value.get(nodeId)
  if (!drawflowId) {
    console.error(`❌ No Drawflow ID mapping found for ${nodeId}`)
    console.log('Available mappings:', Array.from(nodeIdMap.value.entries()))
    return
  }
  console.log(`✅ Using mapped Drawflow ID: ${drawflowId} for node ${nodeId}`)
  
  try {
    // Try multiple ID formats to find the node (Drawflow uses 'node-X' format)
    let nodeElement = document.getElementById(`node-${drawflowId}`)
    
    if (!nodeElement) {
      // Try without hyphen
      nodeElement = document.getElementById(`node${drawflowId}`)
    }
    
    if (!nodeElement) {
      // Try to find by data-id attribute
      nodeElement = document.querySelector(`[data-id="${drawflowId}"]`)
    }
    
    if (!nodeElement) {
      // Last resort: find in drawflow container
      const container = drawflowContainer.value
      if (container) {
        const allNodes = container.querySelectorAll('.drawflow-node')
        console.log('Found nodes in container:', allNodes.length)
        
        // Try to find by checking the drawflow instance
        try {
          const drawflowNode = drawflowInstance.value.getNodeFromId(drawflowId)
          if (drawflowNode) {
            console.log('Found in drawflow data:', drawflowNode)
            // Find the parent node element
            nodeElement = container.querySelector(`.parent-node[data-node="${drawflowId}"]`)
            if (!nodeElement) {
              // Try finding by class
              nodeElement = container.querySelector(`#node-${drawflowId}`)
            }
          }
        } catch (e) {
          console.log('getNodeFromId failed:', e.message)
        }
      }
    }
    
    console.log('Node element found:', !!nodeElement)
    
    if (nodeElement) {
      // Update the HTML content
      const nodeType = nodeTypes[updatedData.type] || nodeTypes.Process
      const newHTML = createNodeHTML(updatedData, nodeType)
      console.log('New HTML generated:', newHTML.substring(0, 100) + '...')
      
      // Find the drawflow_content_node div and update its innerHTML
      let contentNode = nodeElement.querySelector('.drawflow_content_node')
      
      // If not found, the nodeElement itself might be the content node
      if (!contentNode && nodeElement.classList.contains('drawflow-node')) {
        contentNode = nodeElement.parentElement
      }
      
      console.log('Content node found:', !!contentNode)
      
      if (contentNode) {
        contentNode.innerHTML = newHTML
        console.log('✅ HTML updated successfully')
      } else {
        // Fallback: Replace the entire node
        console.log('Trying fallback: re-adding node to canvas')
        
        // Remove old node and add updated one
        drawflowInstance.value.removeNodeId(`node-${drawflowId}`)
        addNodeToCanvas(updatedData)
        
        console.log('✅ Node re-added successfully')
      }
      
      // Update the node name in drawflow data
      try {
        const drawflowNode = drawflowInstance.value.getNodeFromId(drawflowId)
        if (drawflowNode) {
          drawflowNode.name = updatedData.label || 'Untitled'
          console.log('✅ Drawflow node name updated to:', drawflowNode.name)
        }
      } catch (e) {
        console.log('Could not update drawflow node name:', e.message)
      }
    } else {
      console.log('❌ Node element not found in DOM. Using fallback: update HTML directly')
      
      // Debug: Let's see what IDs are actually in the DOM
      const allNodes = document.querySelectorAll('[id^="node-"]')
      console.log(`Found ${allNodes.length} total nodes in DOM`)
      allNodes.forEach(node => {
        console.log(`  - Node ID: ${node.id}`)
      })
      console.log(`Looking for: node-${drawflowId}`)
      
      // Fallback: Find and update the node's HTML content directly
      const nodeType = nodeTypes[updatedData.type] || nodeTypes.Process
      const newHTML = createNodeHTML(updatedData, nodeType)
      
      // Try to find the node by its drawflow-node class within the node container
      const nodeContainer = document.getElementById(`node-${drawflowId}`)
      if (nodeContainer) {
        console.log('✅ Found node container by ID')
        // Find the drawflow-node div inside
        const drawflowNode = nodeContainer.querySelector('.drawflow-node')
        if (drawflowNode) {
          // Update the inner content while preserving the container
          drawflowNode.outerHTML = newHTML
          console.log('✅ Node HTML updated directly')
        } else {
          console.log('❌ drawflow-node div not found inside container')
        }
      } else {
        console.log('❌ Node container not found by getElementById')
        
        // Try searching by class and checking text content
        const drawflowNodes = document.querySelectorAll('.drawflow_content_node')
        console.log(`Found ${drawflowNodes.length} nodes with .drawflow_content_node class`)
        
        let found = false
        drawflowNodes.forEach((node, index) => {
          console.log(`  Checking node ${index}: id="${node.id}"`)
          const nodeId = node.id.replace('node-', '')
          if (nodeId === drawflowId) {
            console.log(`  ✅ Match found!`)
            const drawflowNode = node.querySelector('.drawflow-node')
            if (drawflowNode) {
              drawflowNode.outerHTML = newHTML
              console.log('✅ Node HTML updated via class search')
              found = true
            } else {
              console.log('  ❌ No .drawflow-node inside')
            }
          }
        })
        
        if (!found) {
          console.log('⚠️ Could not find node to update')
        }
      }
    }
  } catch (error) {
    console.error('❌ Error updating node in canvas:', error)
  }
  
  updateMiniMap()
  console.log('=== handleUpdateNode complete ===')
}

const handleDeleteNode = (nodeId) => {
  console.log('Deleting node:', nodeId)
  
  // Get Drawflow's internal ID from our mapping
  const drawflowId = nodeIdMap.value.get(nodeId)
  
  if (drawflowId) {
    console.log('Removing from Drawflow with ID:', drawflowId)
    drawflowInstance.value.removeNodeId(`node-${drawflowId}`)
    
    // Remove from our mapping
    nodeIdMap.value.delete(nodeId)
  } else {
    console.warn('Could not find Drawflow ID for node:', nodeId)
  }
  
  // Remove from store
  removeNode(nodeId)
  console.log('Node removed from store')
  
  updateMiniMap()
}

const handleSaveDiagram = async () => {
  try {
    // Save current viewport position and zoom
    const container = drawflowContainer.value
    if (container && currentDiagram.value?.data) {
      currentDiagram.value.data.viewport = {
        scrollLeft: container.scrollLeft,
        scrollTop: container.scrollTop,
        zoom: drawflowInstance.value?.zoom || 1
      }
    }
    
    if (!currentDiagram.value?.id) {
      // Create new diagram
      const diagramData = {
        title: currentDiagram.value?.title || 'Untitled Diagram',
        description: currentDiagram.value?.description || '',
        data: currentDiagram.value?.data || {
          nodes: [],
          connections: []
        },
        tags: []
      }
      
      console.log('Creating new diagram:', diagramData)
      const newDiagram = await diagramStore.createDiagram(diagramData)
      console.log('Diagram created successfully:', newDiagram)
      
      // Update the route to include the new diagram ID
      if (newDiagram && newDiagram.id) {
        router.push({ name: 'canvas', params: { id: newDiagram.id } })
      }
    } else {
      // Update existing diagram
      console.log('Updating diagram:', currentDiagram.value.id)
      await diagramStore.updateDiagram(currentDiagram.value.id, {
        title: currentDiagram.value.title,
        description: currentDiagram.value.description,
        data: currentDiagram.value.data,
        tags: currentDiagram.value.tags || []
      })
      console.log('Diagram updated successfully')
    }
    
    // Show success message (you could add a toast notification here)
    alert('Diagram saved successfully!')
  } catch (error) {
    console.error('Failed to save diagram:', error)
    alert('Failed to save diagram. Please try again.')
  }
}

const handleNewCanvas = () => {
  // Navigate to new canvas route which will trigger reset
  router.push({ name: 'canvas', params: { id: 'new' } })
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

const recenterCanvas = () => {
  const container = drawflowContainer.value
  if (!container) return
  
  // Calculate center position
  const maxScrollLeft = container.scrollWidth - container.clientWidth
  const maxScrollTop = container.scrollHeight - container.clientHeight
  
  // Smooth scroll to center
  container.scrollTo({
    left: maxScrollLeft / 2,
    top: maxScrollTop / 2,
    behavior: 'smooth'
  })
  
  console.log('🎯 Canvas recentered')
  updateMiniMap()
}

const fixNodePositions = () => {
  if (!currentDiagram.value?.data?.nodes || currentDiagram.value.data.nodes.length === 0) {
    alert('No nodes to fix!')
    return
  }
  
  // New coordinate system starts at (400, 150)
  const startX = 400
  const startY = 150
  let fixedCount = 0
  
  console.log('🔧 Manually fixing node positions (migrating from old coordinate system)...')
  
  currentDiagram.value.data.nodes.forEach((node, index) => {
    const pos = node.position || { x: 0, y: 0 }
    
    // Check if position is from old system (> 5000) or invalid (< 100)
    if (pos.x > 5000 || pos.y > 5000 || pos.x < 100 || pos.y < 100) {
      console.log(`  ⚠️ Fixing ${node.label}: (${pos.x}, ${pos.y})`)
      
      // Reposition in a grid pattern starting at (400, 150)
      const gridSize = 300
      const cols = 4
      const row = Math.floor(index / cols)
      const col = index % cols
      
      if (!node.position) node.position = {}
      node.position.x = startX + (col * gridSize)
      node.position.y = startY + (row * gridSize)
      
      console.log(`    → Fixed to: (${node.position.x}, ${node.position.y})`)
      fixedCount++
    }
  })
  
  if (fixedCount > 0) {
    console.log(`✅ Fixed ${fixedCount} node(s)`)
    
    // Reload the canvas with fixed positions
    loadDiagramToCanvas(currentDiagram.value)
    
    alert(`✅ Fixed ${fixedCount} misplaced node(s)!\n\nNodes repositioned to visible area in a grid pattern.\n\n📌 IMPORTANT: Click "Save" to persist these changes!`)
  } else {
    console.log('✅ All nodes are in valid positions')
    alert('✅ All nodes are already in valid positions!')
  }
}

const forceResetAllNodes = () => {
  if (!currentDiagram.value?.data?.nodes || currentDiagram.value.data.nodes.length === 0) {
    alert('⚠️ No nodes found to reset!')
    return
  }
  
  const nodeCount = currentDiagram.value.data.nodes.length
  const confirmed = confirm(
    `⚡ FORCE RESET ALL ${nodeCount} NODES ⚡\n\n` +
    `This will reset ALL nodes to canvas center regardless of their current position.\n\n` +
    `Current positions will be LOST!\n\n` +
    `Are you sure you want to continue?`
  )
  
  if (!confirmed) return
  
  console.log('⚡ NUCLEAR RESET - Forcing all nodes to visible area...')
  
  const startX = 400
  const startY = 150
  const gridSize = 300
  const cols = 4
  
  // FORCE reset ALL nodes - no conditions
  currentDiagram.value.data.nodes.forEach((node, index) => {
    const oldPos = node.position ? `(${node.position.x}, ${node.position.y})` : 'undefined'
    
    const row = Math.floor(index / cols)
    const col = index % cols
    
    // Create new position object to ensure reactivity
    node.position = {
      x: startX + (col * gridSize),
      y: startY + (row * gridSize)
    }
    
    console.log(`  🔄 ${node.label}: ${oldPos} → (${node.position.x}, ${node.position.y})`)
  })
  
  console.log(`✅ Force reset ${nodeCount} nodes to visible area`)
  
  // Clear and reload the entire canvas
  if (drawflowInstance.value) {
    drawflowInstance.value.clear()
    nodeIdMap.value.clear()
  }
  
  // Reload with new positions
  loadDiagramToCanvas(currentDiagram.value)
  
  // Recenter viewport
  setTimeout(() => {
    recenterCanvas()
    alert(
      `⚡ SUCCESS! ⚡\n\n` +
      `All ${nodeCount} nodes have been FORCE RESET to canvas center!\n\n` +
      `✅ Nodes are now in a grid pattern\n` +
      `✅ Canvas is centered\n\n` +
      `📌 SAVE NOW to keep these changes!`
    )
  }, 300)
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

// Resize functionality
let isResizing = false
let startX = 0
let startWidth = 0

const startResize = (e) => {
  isResizing = true
  startX = e.clientX
  startWidth = sidePanelWidth.value
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  
  // Prevent text selection while dragging
  e.preventDefault()
  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'
}

const handleResize = (e) => {
  if (!isResizing) return
  
  const deltaX = startX - e.clientX
  const newWidth = startWidth + deltaX
  
  // Set min and max width for the panel
  const minWidth = 280 // Minimum width
  const maxWidth = 800 // Maximum width
  
  sidePanelWidth.value = Math.max(minWidth, Math.min(newWidth, maxWidth))
}

const stopResize = () => {
  isResizing = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}
</script>

<style scoped>
@keyframes gridPulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.9;
  }
}

.grid-background {
  background-color: #f8fafc;
  background-image: 
    linear-gradient(rgba(59, 130, 246, .12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, .12) 1px, transparent 1px),
    radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 60%);
  background-size: 20px 20px, 20px 20px, 100% 100%;
  animation: gridPulse 4s ease-in-out infinite;
  position: relative;
}

/* Resize Handle */
.resize-handle {
  width: 8px;
  background: transparent;
  cursor: ew-resize;
  position: relative;
  flex-shrink: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.resize-handle:hover {
  background-color: rgba(59, 130, 246, 0.1);
}

.resize-handle-line {
  width: 2px;
  height: 40px;
  background-color: #e5e7eb;
  border-radius: 2px;
  transition: all 0.2s;
}

.resize-handle:hover .resize-handle-line {
  background-color: #3b82f6;
  height: 60px;
}

/* Make the canvas area very large for extensive flows */
:deep(#drawflow) {
  overflow: auto !important;
  transition: cursor 0.2s ease;
  /* PREVENT auto-scroll behavior - CRITICAL */
  scroll-behavior: auto !important;
  -webkit-overflow-scrolling: auto !important;
  /* Lock scroll position - prevent programmatic scrolling */
  overscroll-behavior: contain !important;
  /* Disable scroll snap */
  scroll-snap-type: none !important;
  /* Prevent smooth transitions */
  scroll-padding: 0 !important;
  scroll-margin: 0 !important;
}

:deep(#drawflow.pan-mode) {
  cursor: grab !important;
}

:deep(#drawflow.panning) {
  cursor: grabbing !important;
  user-select: none;
}

:deep(.drawflow) {
  width: 100% !important;
  height: 100% !important;
  position: relative !important;
  background: transparent !important;
  /* Ensure the drawflow container takes full space */
  overflow: visible !important;
}

:deep(.drawflow .drawflow-wrapper) {
  /* Let Drawflow handle sizing naturally */
  position: relative !important;
  background-color: transparent !important;
  background-image: 
    linear-gradient(rgba(0, 0, 0, .08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, .08) 1px, transparent 1px) !important;
  background-size: 20px 20px !important;
  background-position: 0 0 !important;
  background-repeat: repeat !important;
}

:deep(.drawflow .parent-drawflow) {
  background: transparent !important;
  /* Ensure parent can scroll freely */
  overflow: visible !important;
}

/* Node Animations */
@keyframes nodeEntry {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

@keyframes iconRotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes iconBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes glow {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }
  50% {
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.6);
  }
}

/* Drawflow node wrapper - allow dragging */
:deep(.drawflow-node) {
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  box-shadow: none !important;
  cursor: move !important;
}

/* Drawflow's content wrapper */
:deep(.drawflow_content_node) {
  display: block !important;
  width: auto !important;
  height: auto !important;
}

/* Custom node content - our styled content */
:deep(.custom-node-content) {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid #e5e7eb;
  min-width: 200px; /* Slightly wider for better header space */
  padding: 12px;
  padding-top: 40px; /* Extra space for drag handle at top */
  animation: nodeEntry 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: visible;
  pointer-events: none; /* Let parent handle dragging */
  display: block;
}

/* Drag handle - corner indicator */
:deep(.node-drag-handle-corner) {
  position: absolute;
  top: 6px;
  left: 6px; /* Changed from right to left */
  width: 24px; /* Slightly larger */
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: #9ca3af;
  opacity: 0.6;
  transition: all 0.2s ease;
  pointer-events: all; /* Enable dragging */
  z-index: 10;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

:deep(.node-drag-handle-corner:hover) {
  opacity: 1;
  color: #6b7280;
  background: rgba(255, 255, 255, 1);
  transform: scale(1.15);
}

:deep(.node-drag-handle-corner:active) {
  cursor: grabbing;
  transform: scale(0.95);
}

:deep(.drawflow-node:hover .node-drag-handle-corner) {
  opacity: 0.9;
}

/* Make entire header draggable */
:deep(.node-header.node-drag-handle) {
  cursor: grab;
  pointer-events: all;
  user-select: none;
  padding: 10px 12px; /* More padding for easier grabbing */
  margin: 0 -12px; /* Negative margin to extend clickable area */
  margin-top: -8px;
  margin-bottom: 8px;
  border-radius: 8px 8px 0 0;
  transition: background-color 0.2s ease;
}

:deep(.node-header.node-drag-handle:hover) {
  background-color: rgba(255, 255, 255, 0.5);
}

:deep(.node-header.node-drag-handle:active) {
  cursor: grabbing;
  background-color: rgba(255, 255, 255, 0.7);
}

@keyframes dragHandlePulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

:deep(.node-drag-handle svg) {
  width: 16px;
  height: 16px;
  display: block;
}

/* Node type specific backgrounds */
:deep(.custom-node-content.node-type-event) {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-left: 5px solid #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

:deep(.custom-node-content.node-type-process) {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border-left: 5px solid #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

:deep(.custom-node-content.node-type-api) {
  background: linear-gradient(135deg, #fed7aa 0%, #fdba74 100%);
  border-left: 5px solid #f59e0b;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

:deep(.custom-node-content.node-type-database) {
  background: linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%);
  border-left: 5px solid #a855f7;
  box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
}

:deep(.custom-node-content.node-type-decision) {
  background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
  border-left: 5px solid #ef4444;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

:deep(.custom-node-content.node-type-external) {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  border-left: 5px solid #6b7280;
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
}

:deep(.drawflow-node:hover .custom-node-content) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

:deep(.custom-node-content::before) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.4) 50%, 
    transparent 100%);
  background-size: 200% 100%;
  animation: shimmer 3s infinite;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 0;
}

:deep(.drawflow-node:hover .custom-node-content::before) {
  opacity: 1;
}

:deep(.custom-node-content .node-header) {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

:deep(.custom-node-content .node-icon) {
  font-size: 20px;
  display: inline-block;
  line-height: 1;
  transition: transform 0.3s ease;
}

:deep(.drawflow-node:hover .node-icon) {
  animation: iconPulse 0.6s ease-in-out;
}

:deep(.custom-node-content .node-title) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  font-weight: 600;
  font-size: 14px;
  color: #111827;
}

@keyframes badgePulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(102, 126, 234, 0.5);
  }
}

:deep(.custom-node-content .tech-badge) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
  animation: badgePulse 2s ease-in-out infinite;
  transition: all 0.3s ease;
  line-height: 1;
}

:deep(.custom-node-content .tech-badge:hover) {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.6);
}

:deep(.custom-node-content .node-type-badge) {
  font-size: 11px;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  position: relative;
  z-index: 1;
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-block;
}

/* Node type badge colors */
:deep(.node-type-event .node-type-badge) {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

:deep(.node-type-process .node-type-badge) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

:deep(.node-type-api .node-type-badge) {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

:deep(.node-type-database .node-type-badge) {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
}

:deep(.node-type-decision .node-type-badge) {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

:deep(.node-type-external .node-type-badge) {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

:deep(.custom-node-content .node-description) {
  font-size: 12px;
  color: #4b5563;
  margin-top: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  position: relative;
  z-index: 1;
}

@keyframes highlightPulse {
  0%, 100% {
    box-shadow: 0 0 0 3px #3b82f6, 0 0 0 6px rgba(59, 130, 246, 0.3), 0 8px 20px rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow: 0 0 0 5px #3b82f6, 0 0 0 10px rgba(59, 130, 246, 0.2), 0 12px 28px rgba(0, 0, 0, 0.2);
  }
}

@keyframes filterGlow {
  0%, 100% {
    box-shadow: 0 0 0 3px #10b981, 0 0 0 6px rgba(16, 185, 129, 0.3), 0 8px 20px rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow: 0 0 0 5px #10b981, 0 0 0 10px rgba(16, 185, 129, 0.2), 0 12px 28px rgba(0, 0, 0, 0.2);
  }
}

:deep(.node-highlighted) {
  animation: highlightPulse 1.5s ease-in-out infinite;
  transform: scale(1.02);
  z-index: 100;
}

:deep(.node-filtered) {
  animation: filterGlow 1.5s ease-in-out infinite;
  transform: scale(1.02);
  z-index: 100;
}

/* Node type specific icon animations */
:deep(.node-type-event .node-icon) {
  animation: iconPulse 1s ease-in-out infinite;
}

:deep(.node-type-process .node-icon) {
  animation: iconRotate 4s linear infinite;
}

:deep(.node-type-api .node-icon) {
  animation: iconBounce 1.5s ease-in-out infinite;
}

:deep(.node-type-database .node-icon) {
  animation: iconPulse 2s ease-in-out infinite;
}

:deep(.node-type-decision .node-icon) {
  animation: iconBounce 1.2s ease-in-out infinite;
}

:deep(.node-type-external .node-icon) {
  animation: iconRotate 6s linear infinite;
}

/* Connection Animations */
@keyframes connectionFlow {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: -20;
  }
}

@keyframes connectionGlow {
  0%, 100% {
    filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.8));
  }
}

:deep(.drawflow .connection .main-path) {
  stroke: #3b82f6;
  stroke-width: 3px;
  stroke-dasharray: 10 5;
  animation: connectionFlow 1s linear infinite, connectionGlow 2s ease-in-out infinite;
  transition: all 0.3s ease;
  filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.5));
}

:deep(.drawflow .connection .main-path:hover) {
  stroke: #1d4ed8;
  stroke-width: 4px;
  stroke-dasharray: 15 5;
  animation: connectionFlow 0.6s linear infinite, connectionGlow 1s ease-in-out infinite;
  filter: drop-shadow(0 0 8px rgba(29, 78, 216, 0.8));
}

/* Connection points (input/output ports) */
@keyframes portPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  50% {
    transform: scale(1.2);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0);
  }
}

:deep(.drawflow .drawflow-node .input),
:deep(.drawflow .drawflow-node .output) {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: 3px solid white;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  animation: portPulse 2s ease-in-out infinite;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
}

:deep(.drawflow .drawflow-node .input:hover),
:deep(.drawflow .drawflow-node .output:hover) {
  transform: scale(1.3);
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.8);
  animation: portPulse 0.8s ease-in-out infinite;
}

/* Multiple connection variants */
:deep(.drawflow .connection:nth-child(4n+1) .main-path) {
  stroke: #3b82f6;
}

:deep(.drawflow .connection:nth-child(4n+2) .main-path) {
  stroke: #10b981;
  filter: drop-shadow(0 0 3px rgba(16, 185, 129, 0.5));
}

:deep(.drawflow .connection:nth-child(4n+3) .main-path) {
  stroke: #f59e0b;
  filter: drop-shadow(0 0 3px rgba(245, 158, 11, 0.5));
}

:deep(.drawflow .connection:nth-child(4n+4) .main-path) {
  stroke: #8b5cf6;
  filter: drop-shadow(0 0 3px rgba(139, 92, 246, 0.5));
}

/* Floating Search Panel */
.floating-search-panel {
  position: fixed;
  left: 20px;
  top: 100px;
  width: 350px;
  max-height: calc(100vh - 120px);
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  overflow: hidden;
}
</style>