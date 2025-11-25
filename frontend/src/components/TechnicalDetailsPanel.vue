<template>
  <div v-if="node && hasTechnicalDetails" class="technical-details-panel">
    <div class="panel-header">
      <h4 class="text-sm font-semibold text-gray-900">Technical Details</h4>
      <button 
        @click="$emit('close')"
        class="p-1 hover:bg-gray-100 rounded"
      >
        <X class="w-4 h-4 text-gray-400" />
      </button>
    </div>

    <div class="panel-content">
      <!-- Variables -->
      <div v-if="node.details?.variables?.length > 0" class="detail-section">
        <div class="section-title">
          <span class="icon">📊</span>
          <span>Variables ({{ node.details.variables.length }})</span>
        </div>
        <div class="items-list">
          <div v-for="(variable, index) in node.details.variables" :key="index" class="item">
            <div class="item-header">
              <span class="item-name">{{ variable.name }}</span>
              <span class="item-type">{{ variable.type }}</span>
            </div>
            <p v-if="variable.description" class="item-description">{{ variable.description }}</p>
          </div>
        </div>
      </div>

      <!-- Parameters -->
      <div v-if="node.details?.parameters?.length > 0" class="detail-section">
        <div class="section-title">
          <span class="icon">🔧</span>
          <span>Parameters ({{ node.details.parameters.length }})</span>
        </div>
        <div class="items-list">
          <div v-for="(param, index) in node.details.parameters" :key="index" class="item">
            <div class="item-header">
              <span class="item-name">{{ param.name }}</span>
              <span class="item-type">{{ param.type }}</span>
            </div>
            <p v-if="param.description" class="item-description">{{ param.description }}</p>
          </div>
        </div>
      </div>

      <!-- Arguments -->
      <div v-if="node.details?.arguments?.length > 0" class="detail-section">
        <div class="section-title">
          <span class="icon">📝</span>
          <span>Arguments ({{ node.details.arguments.length }})</span>
        </div>
        <div class="items-list">
          <div v-for="(arg, index) in node.details.arguments" :key="index" class="item">
            <div class="item-header">
              <span class="item-name">{{ arg.name }}</span>
              <span class="item-type">{{ arg.type }}</span>
            </div>
            <p v-if="arg.description" class="item-description">{{ arg.description }}</p>
          </div>
        </div>
      </div>

      <!-- Payloads -->
      <div v-if="node.details?.payloads?.length > 0" class="detail-section">
        <div class="section-title">
          <span class="icon">📦</span>
          <span>Payloads ({{ node.details.payloads.length }})</span>
        </div>
        <div class="items-list">
          <div v-for="(payload, index) in node.details.payloads" :key="index" class="item">
            <div class="item-header">
              <span class="item-direction" :class="payload.direction">
                {{ payload.direction === 'incoming' ? '⬇️ Incoming' : '⬆️ Outgoing' }}
              </span>
              <span class="item-type">{{ payload.contentType }}</span>
            </div>
            <pre v-if="payload.example" class="item-example">{{ formatExample(payload.example) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  node: {
    type: Object,
    required: true
  }
})

defineEmits(['close'])

const hasTechnicalDetails = computed(() => {
  if (!props.node?.details) return false
  
  return (
    (props.node.details.variables && props.node.details.variables.length > 0) ||
    (props.node.details.parameters && props.node.details.parameters.length > 0) ||
    (props.node.details.arguments && props.node.details.arguments.length > 0) ||
    (props.node.details.payloads && props.node.details.payloads.length > 0)
  )
})

const formatExample = (example) => {
  if (typeof example === 'string') {
    try {
      // Try to parse and pretty-print JSON
      const parsed = JSON.parse(example)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return example
    }
  }
  return JSON.stringify(example, null, 2)
}
</script>

<style scoped>
.technical-details-panel {
  position: fixed;
  left: 20px;
  bottom: 20px;
  width: 350px;
  max-height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 999;
  overflow: hidden;
}

.panel-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.panel-header h4 {
  color: white;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.detail-section {
  margin-bottom: 1.5rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.icon {
  font-size: 1rem;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item {
  padding: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.item-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  font-family: 'Monaco', 'Courier New', monospace;
}

.item-type {
  font-size: 0.75rem;
  color: #6b7280;
  background: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
}

.item-description {
  font-size: 0.8125rem;
  color: #4b5563;
  line-height: 1.5;
  margin: 0;
}

.item-direction {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.item-direction.incoming {
  background: #dbeafe;
  color: #1e40af;
}

.item-direction.outgoing {
  background: #d1fae5;
  color: #065f46;
}

.item-example {
  font-size: 0.75rem;
  color: #374151;
  background: #f3f4f6;
  padding: 0.5rem;
  border-radius: 4px;
  overflow-x: auto;
  margin: 0.5rem 0 0 0;
  font-family: 'Monaco', 'Courier New', monospace;
  line-height: 1.4;
  border: 1px solid #e5e7eb;
}

/* Custom scrollbar */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
