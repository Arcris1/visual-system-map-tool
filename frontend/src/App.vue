<template>
  <div id="app" class="h-screen flex flex-col">
    <router-view />
  </div>
</template>

<script setup>
// Main App component - all routing is handled by router-view
</script>

<style>
/* Global styles */
* {
  box-sizing: border-box;
}

html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Drawflow specific styles */
.drawflow {
  width: 100%;
  height: 100%;
  text-align: initial;
  background: #fafafa;
}

.drawflow .drawflow-node {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  padding: 12px;
  min-width: 150px;
}

.drawflow .drawflow-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.drawflow .drawflow-node.selected {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.drawflow .connection .main-path {
  stroke: #3b82f6;
  stroke-width: 2px;
  fill: none;
}

.drawflow .connection .main-path:hover {
  stroke: #1d4ed8;
  stroke-width: 3px;
}

.drawflow .connection .point {
  stroke: #3b82f6;
  stroke-width: 2px;
  fill: #3b82f6;
}

.drawflow .connection .point:hover {
  stroke: #1d4ed8;
  stroke-width: 3px;
}

/* Input/Output connection points */
.drawflow .drawflow-node .inputs .input,
.drawflow .drawflow-node .outputs .output {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #6b7280;
  border: 2px solid white;
}

.drawflow .drawflow-node .inputs .input:hover,
.drawflow .drawflow-node .outputs .output:hover {
  background: #3b82f6;
}
</style>
