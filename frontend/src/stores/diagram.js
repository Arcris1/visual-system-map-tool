import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { diagramApi } from '@/services/api'

export const useDiagramStore = defineStore('diagram', () => {
  // State
  const currentDiagram = ref(null)
  const diagrams = ref([])
  const loading = ref(false)
  const error = ref(null)
  
  // Canvas state
  const selectedNode = ref(null)
  const isNodeEditorOpen = ref(false)
  const searchQuery = ref('')
  const selectedTags = ref([])

  // Getters
  const filteredNodes = computed(() => {
    if (!currentDiagram.value?.data?.nodes) return []
    
    return currentDiagram.value.data.nodes.filter(node => {
      const matchesSearch = !searchQuery.value || 
        node.label?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        node.details?.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
      
      const matchesTags = selectedTags.value.length === 0 ||
        selectedTags.value.some(tag => node.details?.tags?.includes(tag))
      
      return matchesSearch && matchesTags
    })
  })

  const allTags = computed(() => {
    if (!diagrams.value) return []
    
    const tagSet = new Set()
    diagrams.value.forEach(diagram => {
      if (diagram.tags) {
        diagram.tags.forEach(tag => tagSet.add(tag))
      }
      if (diagram.data?.nodes) {
        diagram.data.nodes.forEach(node => {
          if (node.details?.tags) {
            node.details.tags.forEach(tag => tagSet.add(tag))
          }
        })
      }
    })
    
    return Array.from(tagSet).sort()
  })

  // Actions
  const fetchDiagrams = async (params = {}) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await diagramApi.list(params)
      diagrams.value = response.data.data || []
      return response
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch diagrams'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchDiagram = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await diagramApi.get(id)
      currentDiagram.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch diagram'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createDiagram = async (diagramData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await diagramApi.create(diagramData)
      const newDiagram = response.data
      diagrams.value.unshift(newDiagram)
      currentDiagram.value = newDiagram
      return newDiagram
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create diagram'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateDiagram = async (id, diagramData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await diagramApi.update(id, diagramData)
      const updatedDiagram = response.data
      
      // Update in diagrams list
      const index = diagrams.value.findIndex(d => d.id === id)
      if (index !== -1) {
        diagrams.value[index] = updatedDiagram
      }
      
      // Update current diagram if it's the same one
      if (currentDiagram.value?.id === id) {
        currentDiagram.value = updatedDiagram
      }
      
      return updatedDiagram
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update diagram'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteDiagram = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      await diagramApi.delete(id)
      
      // Remove from diagrams list
      diagrams.value = diagrams.value.filter(d => d.id !== id)
      
      // Clear current diagram if it was deleted
      if (currentDiagram.value?.id === id) {
        currentDiagram.value = null
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete diagram'
      throw err
    } finally {
      loading.value = false
    }
  }

  const duplicateDiagram = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await diagramApi.duplicate(id)
      const duplicatedDiagram = response.data
      diagrams.value.unshift(duplicatedDiagram)
      return duplicatedDiagram
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to duplicate diagram'
      throw err
    } finally {
      loading.value = false
    }
  }

  const setCurrentDiagram = (diagram) => {
    currentDiagram.value = diagram
  }

  const clearCurrentDiagram = () => {
    currentDiagram.value = null
    selectedNode.value = null
    isNodeEditorOpen.value = false
  }

  const resetCanvas = () => {
    // Reset current diagram to fresh state
    currentDiagram.value = {
      name: '',
      description: '',
      tags: [],
      data: {
        nodes: [],
        connections: []
      }
    }
    selectedNode.value = null
    isNodeEditorOpen.value = false
    searchQuery.value = ''
    selectedTags.value = []
    console.log('Canvas reset to clean state')
  }

  const selectNode = (node) => {
    selectedNode.value = node
    isNodeEditorOpen.value = true
  }

  const updateNode = (nodeId, nodeData) => {
    if (!currentDiagram.value?.data?.nodes) {
      console.warn('No diagram or nodes array found')
      return
    }
    
    const nodeIndex = currentDiagram.value.data.nodes.findIndex(n => n.id === nodeId)
    console.log('Updating node at index:', nodeIndex, 'with data:', nodeData)
    
    if (nodeIndex !== -1) {
      const oldNode = currentDiagram.value.data.nodes[nodeIndex]
      const updatedNode = { ...oldNode, ...nodeData }
      currentDiagram.value.data.nodes[nodeIndex] = updatedNode
      
      console.log('Node updated from:', oldNode, 'to:', updatedNode)
    } else {
      console.warn('Node not found with id:', nodeId)
    }
  }

  const addNode = (nodeData) => {
    if (!currentDiagram.value) {
      currentDiagram.value = {
        data: { nodes: [], connections: [] }
      }
    }
    
    if (!currentDiagram.value.data) {
      currentDiagram.value.data = { nodes: [], connections: [] }
    }
    
    if (!currentDiagram.value.data.nodes) {
      currentDiagram.value.data.nodes = []
    }
    
    currentDiagram.value.data.nodes.push(nodeData)
  }

  const removeNode = (nodeId) => {
    if (!currentDiagram.value?.data?.nodes) return
    
    // Remove node
    currentDiagram.value.data.nodes = currentDiagram.value.data.nodes.filter(n => n.id !== nodeId)
    
    // Remove connections related to this node
    if (currentDiagram.value.data.connections) {
      currentDiagram.value.data.connections = currentDiagram.value.data.connections.filter(
        conn => conn.from !== nodeId && conn.to !== nodeId
      )
    }
    
    // Clear selection if this node was selected
    if (selectedNode.value?.id === nodeId) {
      selectedNode.value = null
      isNodeEditorOpen.value = false
    }
  }

  const addConnection = (connectionData) => {
    if (!currentDiagram.value?.data?.connections) {
      if (!currentDiagram.value?.data) {
        currentDiagram.value.data = { nodes: [], connections: [] }
      } else {
        currentDiagram.value.data.connections = []
      }
    }
    
    currentDiagram.value.data.connections.push(connectionData)
  }

  const removeConnection = (from, to) => {
    if (!currentDiagram.value?.data?.connections) return
    
    currentDiagram.value.data.connections = currentDiagram.value.data.connections.filter(
      conn => !(conn.from === from && conn.to === to)
    )
  }

  const setSearchQuery = (query) => {
    searchQuery.value = query
  }

  const setSelectedTags = (tags) => {
    selectedTags.value = tags
  }

  const closeNodeEditor = () => {
    isNodeEditorOpen.value = false
    selectedNode.value = null
  }

  return {
    // State
    currentDiagram,
    diagrams,
    loading,
    error,
    selectedNode,
    isNodeEditorOpen,
    searchQuery,
    selectedTags,
    
    // Getters
    filteredNodes,
    allTags,
    
    // Actions
    fetchDiagrams,
    fetchDiagram,
    createDiagram,
    updateDiagram,
    deleteDiagram,
    duplicateDiagram,
    setCurrentDiagram,
    clearCurrentDiagram,
    resetCanvas,
    selectNode,
    updateNode,
    addNode,
    removeNode,
    addConnection,
    removeConnection,
    setSearchQuery,
    setSelectedTags,
    closeNodeEditor
  }
})