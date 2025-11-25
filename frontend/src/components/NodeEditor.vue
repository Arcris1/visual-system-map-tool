<template>
  <div class="floating-node-editor">
    <!-- Header -->
    <div class="editor-header">
      <h3 class="text-lg font-medium text-gray-900">Node Editor</h3>
      <button 
        @click="$emit('close')"
        class="p-1 hover:bg-gray-100 rounded"
      >
        <X class="w-5 h-5 text-gray-400" />
      </button>
    </div>

    <!-- Scrollable Content -->
    <div class="editor-content">
      <!-- Basic Info -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
        
        <!-- Node Label -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Label
          </label>
          <input 
            v-model="localNode.label"
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter node label"
          />
        </div>

        <!-- Node Type -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select 
            v-model="localNode.type"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Event">⚡ Event</option>
            <option value="Process">⚙️ Process</option>
            <option value="API">🔗 API</option>
            <option value="Database">🗄️ Database</option>
            <option value="Decision">❓ Decision</option>
            <option value="External">🌐 External</option>
          </select>
        </div>

        <!-- Description -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea 
            v-model="localNode.details.description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Describe what this node does..."
          ></textarea>
        </div>
      </div>

      <!-- Metadata -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 mb-3">Metadata</h4>
        
        <!-- Owner/Team -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Owner/Team
          </label>
          <input 
            v-model="localNode.details.owner"
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Backend Team, John Doe"
          />
        </div>

        <!-- API/Route (for API/Process types) -->
        <div v-if="['API', 'Process'].includes(localNode.type)" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ localNode.type === 'API' ? 'Endpoint' : 'Function/Method' }}
          </label>
          <input 
            v-model="localNode.details.api"
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :placeholder="localNode.type === 'API' ? 'e.g., /api/users' : 'e.g., UserController@create'"
          />
        </div>

        <!-- Database Details (for Database type) -->
        <div v-if="localNode.type === 'Database'" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Table/Collection
          </label>
          <input 
            v-model="localNode.details.table"
            type="text" 
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., users, orders"
          />
        </div>

        <!-- External Service Details -->
        <div v-if="localNode.type === 'External'" class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Service URL
          </label>
          <input 
            v-model="localNode.details.url"
            type="url" 
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://api.external-service.com"
          />
        </div>

        <!-- Tags -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div class="flex flex-wrap gap-2 mb-2">
            <span 
              v-for="(tag, index) in localNode.details.tags" 
              :key="tag"
              class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
            >
              {{ tag }}
              <button 
                @click="removeTag(index)"
                class="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X class="w-3 h-3" />
              </button>
            </span>
          </div>
          <div class="flex gap-2">
            <input 
              v-model="newTag"
              @keyup.enter="addTag"
              type="text" 
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add a tag..."
            />
            <button 
              @click="addTag"
              class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Technical Details -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 mb-3">Technical Details</h4>
        
        <!-- Variables Section -->
        <div class="mb-4">
          <button 
            @click="toggleSection('variables')"
            class="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span class="text-sm font-medium text-gray-700">Variables</span>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">{{ (localNode.details.variables || []).length }}</span>
              <ChevronRight :class="['w-4 h-4 text-gray-400 transition-transform', expandedSections.variables ? 'rotate-90' : '']" />
            </div>
          </button>
          
          <div v-if="expandedSections.variables" class="mt-2 space-y-2 pl-3 border-l-2 border-gray-200">
            <div 
              v-for="(variable, index) in localNode.details.variables || []" 
              :key="index"
              class="p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-medium text-gray-500">Variable {{ index + 1 }}</span>
                <button 
                  @click="removeVariable(index)"
                  class="text-red-600 hover:bg-red-50 p-1 rounded"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
              <div class="space-y-2">
                <input 
                  v-model="variable.name"
                  type="text" 
                  placeholder="Variable name"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
                <select 
                  v-model="variable.type"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="array">array</option>
                  <option value="object">object</option>
                  <option value="null">null</option>
                  <option value="undefined">undefined</option>
                  <option value="any">any</option>
                  <option value="Date">Date</option>
                  <option value="Promise">Promise</option>
                  <option value="Function">Function</option>
                </select>
                <textarea 
                  v-model="variable.description"
                  rows="2"
                  placeholder="Description"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none"
                ></textarea>
              </div>
            </div>
            <button 
              @click="addVariable"
              class="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 px-3 py-2"
            >
              <Plus class="w-4 h-4" />
              Add Variable
            </button>
          </div>
        </div>

        <!-- Parameters Section -->
        <div class="mb-4">
          <button 
            @click="toggleSection('parameters')"
            class="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span class="text-sm font-medium text-gray-700">Parameters</span>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">{{ (localNode.details.parameters || []).length }}</span>
              <ChevronRight :class="['w-4 h-4 text-gray-400 transition-transform', expandedSections.parameters ? 'rotate-90' : '']" />
            </div>
          </button>
          
          <div v-if="expandedSections.parameters" class="mt-2 space-y-2 pl-3 border-l-2 border-gray-200">
            <div 
              v-for="(param, index) in localNode.details.parameters || []" 
              :key="index"
              class="p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-medium text-gray-500">Parameter {{ index + 1 }}</span>
                <button 
                  @click="removeParameter(index)"
                  class="text-red-600 hover:bg-red-50 p-1 rounded"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
              <div class="space-y-2">
                <input 
                  v-model="param.name"
                  type="text" 
                  placeholder="Parameter name"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
                <select 
                  v-model="param.type"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="array">array</option>
                  <option value="object">object</option>
                  <option value="null">null</option>
                  <option value="undefined">undefined</option>
                  <option value="any">any</option>
                  <option value="UUID">UUID</option>
                  <option value="email">email</option>
                  <option value="url">url</option>
                  <option value="Date">Date</option>
                  <option value="timestamp">timestamp</option>
                </select>
                <textarea 
                  v-model="param.description"
                  rows="2"
                  placeholder="Description"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none"
                ></textarea>
              </div>
            </div>
            <button 
              @click="addParameter"
              class="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 px-3 py-2"
            >
              <Plus class="w-4 h-4" />
              Add Parameter
            </button>
          </div>
        </div>

        <!-- Arguments Section -->
        <div class="mb-4">
          <button 
            @click="toggleSection('arguments')"
            class="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span class="text-sm font-medium text-gray-700">Arguments</span>
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500">{{ (localNode.details.arguments || []).length }}</span>
              <ChevronRight :class="['w-4 h-4 text-gray-400 transition-transform', expandedSections.arguments ? 'rotate-90' : '']" />
            </div>
          </button>
          
          <div v-if="expandedSections.arguments" class="mt-2 space-y-2 pl-3 border-l-2 border-gray-200">
            <div 
              v-for="(arg, index) in localNode.details.arguments || []" 
              :key="index"
              class="p-3 bg-white border border-gray-200 rounded-lg"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="text-xs font-medium text-gray-500">Argument {{ index + 1 }}</span>
                <button 
                  @click="removeArgument(index)"
                  class="text-red-600 hover:bg-red-50 p-1 rounded"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
              <div class="space-y-2">
                <input 
                  v-model="arg.name"
                  type="text" 
                  placeholder="Argument name"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
                <select 
                  v-model="arg.type"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  <option value="Request">Request</option>
                  <option value="Response">Response</option>
                  <option value="Context">Context</option>
                  <option value="Session">Session</option>
                  <option value="User">User</option>
                  <option value="Error">Error</option>
                  <option value="Event">Event</option>
                  <option value="Stream">Stream</option>
                  <option value="Buffer">Buffer</option>
                  <option value="Connection">Connection</option>
                  <option value="Promise">Promise</option>
                  <option value="Callback">Callback</option>
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="array">array</option>
                  <option value="object">object</option>
                  <option value="any">any</option>
                </select>
                <textarea 
                  v-model="arg.description"
                  rows="2"
                  placeholder="Description"
                  class="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none"
                ></textarea>
              </div>
            </div>
            <button 
              @click="addArgument"
              class="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 px-3 py-2"
            >
              <Plus class="w-4 h-4" />
              Add Argument
            </button>
          </div>
        </div>

        <!-- Payloads Section - Enhanced UX -->
        <div class="mb-4">
          <button 
            @click="toggleSection('payloads')"
            class="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 rounded-lg transition-colors border border-purple-200"
          >
            <span class="text-sm font-medium text-gray-900 flex items-center gap-2">
              <span class="text-lg">📦</span>
              Payloads
            </span>
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">{{ (localNode.details.payloads || []).length }}</span>
              <ChevronRight :class="['w-4 h-4 text-gray-400 transition-transform', expandedSections.payloads ? 'rotate-90' : '']" />
            </div>
          </button>
          
          <div v-if="expandedSections.payloads" class="mt-3 space-y-4">
            <div 
              v-for="(payload, index) in localNode.details.payloads || []" 
              :key="index"
              class="bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <!-- Payload Header -->
              <div class="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div class="flex items-center gap-3">
                  <span class="flex items-center justify-center w-8 h-8 bg-white border-2 border-gray-300 rounded-lg text-sm font-bold text-gray-700">
                    {{ index + 1 }}
                  </span>
                  <div>
                    <div class="text-sm font-semibold text-gray-900">Payload {{ index + 1 }}</div>
                    <div class="text-xs text-gray-500">
                      {{ payload.direction ? (payload.direction === 'incoming' ? '⬇️ Incoming' : '⬆️ Outgoing') : 'No direction set' }}
                      {{ payload.contentType ? ` · ${payload.contentType}` : '' }}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <!-- View Mode Toggle -->
                  <button 
                    v-if="payload.example"
                    @click="payload._viewMode = payload._viewMode === 'preview' ? 'edit' : 'preview'"
                    class="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-1"
                    title="Toggle preview/edit mode"
                  >
                    <span v-if="payload._viewMode === 'preview'">✏️ Edit</span>
                    <span v-else>👁️ Preview</span>
                  </button>
                  <!-- Delete Button -->
                  <button 
                    @click="removePayload(index)"
                    class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete payload"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Payload Content -->
              <div class="p-4 space-y-4">
                <!-- Direction & Content Type Row -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1.5">Direction</label>
                    <select 
                      v-model="payload.direction"
                      class="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    >
                      <option value="">Select direction</option>
                      <option value="incoming">⬇️ Incoming (Request)</option>
                      <option value="outgoing">⬆️ Outgoing (Response)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1.5">Content Type</label>
                    <select 
                      v-model="payload.contentType"
                      class="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                    >
                      <option value="">Select type</option>
                      <option value="application/json">📄 JSON</option>
                      <option value="application/xml">📋 XML</option>
                      <option value="application/x-www-form-urlencoded">📝 Form Data</option>
                      <option value="multipart/form-data">📎 Multipart</option>
                      <option value="text/plain">📃 Plain Text</option>
                      <option value="text/html">🌐 HTML</option>
                      <option value="text/csv">📊 CSV</option>
                      <option value="application/pdf">📕 PDF</option>
                      <option value="image/*">🖼️ Image</option>
                    </select>
                  </div>
                </div>

                <!-- Payload Example/Data -->
                <div>
                  <label class="flex items-center justify-between text-xs font-medium text-gray-700 mb-1.5">
                    <span>Payload Example / Data</span>
                    <span v-if="payload.example" class="text-xs text-gray-500">{{ payload.example.length }} characters</span>
                  </label>
                  
                  <!-- Edit Mode -->
                  <div v-if="!payload._viewMode || payload._viewMode === 'edit'">
                    <textarea 
                      v-model="payload.example"
                      rows="8"
                      placeholder="Paste your JSON, XML, or example data here...&#10;&#10;Example JSON:&#10;{&#10;  &quot;user_id&quot;: 123,&#10;  &quot;action&quot;: &quot;login&quot;,&#10;  &quot;timestamp&quot;: &quot;2025-01-01T00:00:00Z&quot;&#10;}"
                      class="w-full px-3 py-3 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono bg-gray-50 resize-y min-h-[200px]"
                    ></textarea>
                    <!-- Format Buttons -->
                    <div class="flex gap-2 mt-2">
                      <button 
                        v-if="payload.contentType === 'application/json'"
                        @click="formatJSON(payload)"
                        class="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                      >
                        ✨ Format JSON
                      </button>
                      <button 
                        @click="copyToClipboard(payload.example)"
                        class="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors"
                      >
                        📋 Copy
                      </button>
                      <button 
                        @click="payload.example = ''"
                        class="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                      >
                        🗑️ Clear
                      </button>
                    </div>
                  </div>

                  <!-- Preview Mode -->
                  <div v-else class="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[400px]">
                    <pre class="text-sm text-green-400 font-mono whitespace-pre-wrap">{{ payload.example }}</pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add Payload Button -->
            <button 
              @click="addPayload"
              class="w-full flex items-center justify-center gap-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border-2 border-dashed border-purple-300 hover:border-purple-400 px-4 py-3 rounded-xl transition-all"
            >
              <Plus class="w-5 h-5" />
              Add New Payload
            </button>
          </div>
        </div>
      </div>

      <!-- Documentation -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 mb-3">Documentation</h4>
        
        <!-- Comments/Notes -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Notes/Comments
          </label>
          <textarea 
            v-model="localNode.details.notes"
            rows="4"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Add any additional notes, implementation details, or comments..."
          ></textarea>
        </div>

        <!-- Related Links -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Related Links
          </label>
          <div class="space-y-2">
            <div 
              v-for="(link, index) in localNode.details.links || []" 
              :key="index"
              class="flex gap-2"
            >
              <input 
                v-model="link.title"
                type="text" 
                placeholder="Link title"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input 
                v-model="link.url"
                type="url" 
                placeholder="https://..."
                class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button 
                @click="removeLink(index)"
                class="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            <button 
              @click="addLink"
              class="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <Plus class="w-4 h-4" />
              Add link
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Fixed Footer Actions -->
    <div class="editor-footer">
      <button 
        @click="handleDelete"
        class="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
      >
        Delete Node
      </button>
      <div class="flex gap-2">
        <button 
          @click="$emit('close')"
          class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button 
          @click="handleSave"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, reactive } from 'vue'
import { X, Plus, Trash2, ChevronRight } from 'lucide-vue-next'

// Props
const props = defineProps({
  node: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits(['update-node', 'delete-node', 'close'])

// Local state
const localNode = reactive({
  id: '',
  type: 'Process',
  label: '',
  details: {
    description: '',
    owner: '',
    api: '',
    table: '',
    url: '',
    tags: [],
    notes: '',
    links: [],
    variables: [],
    parameters: [],
    arguments: [],
    payloads: []
  }
})

const newTag = ref('')

// Expanded sections state
const expandedSections = reactive({
  variables: false,
  parameters: false,
  arguments: false,
  payloads: false
})

// Watch for prop changes
watch(() => props.node, (newNode) => {
  if (newNode) {
    console.log('NodeEditor: Loading node data:', newNode)
    
    // Ensure details exist
    const nodeDetails = newNode.details || {}
    
    Object.assign(localNode, {
      id: newNode.id,
      type: newNode.type || 'Process',
      label: newNode.label || '',
      position: newNode.position,
      details: {
        description: nodeDetails.description || '',
        owner: nodeDetails.owner || '',
        api: nodeDetails.api || '',
        table: nodeDetails.table || '',
        url: nodeDetails.url || '',
        tags: Array.isArray(nodeDetails.tags) ? [...nodeDetails.tags] : [],
        notes: nodeDetails.notes || '',
        links: Array.isArray(nodeDetails.links) ? [...nodeDetails.links] : [],
        variables: Array.isArray(nodeDetails.variables) ? [...nodeDetails.variables] : [],
        parameters: Array.isArray(nodeDetails.parameters) ? [...nodeDetails.parameters] : [],
        arguments: Array.isArray(nodeDetails.arguments) ? [...nodeDetails.arguments] : [],
        payloads: Array.isArray(nodeDetails.payloads) ? [...nodeDetails.payloads] : []
      }
    })
    
    console.log('NodeEditor: Local node updated to:', localNode)
  }
}, { immediate: true, deep: true })

// Methods
const addTag = () => {
  if (newTag.value.trim() && !localNode.details.tags.includes(newTag.value.trim())) {
    localNode.details.tags.push(newTag.value.trim())
    newTag.value = ''
  }
}

const removeTag = (index) => {
  localNode.details.tags.splice(index, 1)
}

const addLink = () => {
  if (!localNode.details.links) {
    localNode.details.links = []
  }
  localNode.details.links.push({ title: '', url: '' })
}

const removeLink = (index) => {
  localNode.details.links.splice(index, 1)
}

// Toggle section expansion
const toggleSection = (section) => {
  expandedSections[section] = !expandedSections[section]
}

// Variables methods
const addVariable = () => {
  if (!localNode.details.variables) {
    localNode.details.variables = []
  }
  localNode.details.variables.push({ name: '', type: '', description: '' })
}

const removeVariable = (index) => {
  localNode.details.variables.splice(index, 1)
}

// Parameters methods
const addParameter = () => {
  if (!localNode.details.parameters) {
    localNode.details.parameters = []
  }
  localNode.details.parameters.push({ name: '', type: '', description: '' })
}

const removeParameter = (index) => {
  localNode.details.parameters.splice(index, 1)
}

// Arguments methods
const addArgument = () => {
  if (!localNode.details.arguments) {
    localNode.details.arguments = []
  }
  localNode.details.arguments.push({ name: '', type: '', description: '' })
}

const removeArgument = (index) => {
  localNode.details.arguments.splice(index, 1)
}

// Payloads methods
const addPayload = () => {
  if (!localNode.details.payloads) {
    localNode.details.payloads = []
  }
  localNode.details.payloads.push({ 
    direction: '', 
    contentType: '', 
    example: '',
    _viewMode: 'edit' // Default to edit mode
  })
}

const removePayload = (index) => {
  localNode.details.payloads.splice(index, 1)
}

// Format JSON in payload
const formatJSON = (payload) => {
  try {
    const parsed = JSON.parse(payload.example)
    payload.example = JSON.stringify(parsed, null, 2)
  } catch (e) {
    alert('Invalid JSON format. Please check your syntax.\n\nError: ' + e.message)
  }
}

// Copy to clipboard
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('✅ Copied to clipboard!')
  } catch (err) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('✅ Copied to clipboard!')
  }
}

const handleSave = () => {
  console.log('Saving node:', JSON.parse(JSON.stringify(localNode)))
  
  // Create a deep copy to ensure all nested objects are included
  const updatedNode = {
    id: localNode.id,
    type: localNode.type,
    label: localNode.label,
    position: props.node.position, // Preserve position from original node
    details: {
      description: localNode.details.description || '',
      owner: localNode.details.owner || '',
      api: localNode.details.api || '',
      table: localNode.details.table || '',
      url: localNode.details.url || '',
      tags: [...(localNode.details.tags || [])],
      notes: localNode.details.notes || '',
      links: [...(localNode.details.links || [])],
      variables: [...(localNode.details.variables || [])],
      parameters: [...(localNode.details.parameters || [])],
      arguments: [...(localNode.details.arguments || [])],
      payloads: [...(localNode.details.payloads || [])]
    }
  }
  
  console.log('Emitting update-node with:', updatedNode)
  emit('update-node', localNode.id, updatedNode)
  emit('close')
}

const handleDelete = () => {
  if (confirm('Are you sure you want to delete this node? This action cannot be undone.')) {
    emit('delete-node', localNode.id)
    emit('close')
  }
}
</script>

<style scoped>
.floating-node-editor {
  position: fixed;
  right: 20px;
  top: 100px;
  width: 400px;
  max-height: calc(100vh - 120px);
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 1000;
}

.editor-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.editor-content > div {
  margin-bottom: 1.5rem;
}

.editor-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  background: white;
}

/* Custom scrollbar */
.editor-content::-webkit-scrollbar {
  width: 6px;
}

.editor-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.editor-content::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.editor-content::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>