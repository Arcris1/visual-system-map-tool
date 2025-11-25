<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from "vue";

import { useRouter, useRoute } from "vue-router";
import { useToast } from "primevue/usetoast";

// Import Utilities, Stores, and Config
import { useMenuConfig } from "@/config/menuConfig";
import { useCompanyProfile } from "@/composables/useCompanyProfile";
import { useScreen } from "@/composables/useScreen";

// Import Configuration and Components
import Header from "@/components/Header.vue";
import SideBar from "@/components/SideBar.vue";
import SecondaryMenu from "@/components/SecondaryMenu.vue";
import MobileDrawer from "@/components/MobileDrawer.vue";

const route = useRoute();
const { meta } = route;
const { sideMenuItems, brand, userMenuItem, panelItem } = useMenuConfig();

// Screen detection
const { isMobile, isTablet, isDesktop } = useScreen();

// Mobile drawer state
const showMobileDrawer = ref(false);

// Company profile data
const { loadProfile } = useCompanyProfile();

// Mobile drawer functions
const toggleMobileDrawer = () => {
  showMobileDrawer.value = !showMobileDrawer.value;
};

const closeMobileDrawer = () => {
  showMobileDrawer.value = false;
};

onMounted(() => {
  // Load company profile when layout mounts
  loadProfile();
});

onUnmounted(() => {});
</script>
<template>
  <div class="flex h-screen">
    <!-- Desktop Sidebar - Hidden on mobile -->
    <SideBar v-if="!isMobile" :items="sideMenuItems" :brand="brand" />
    
    <!-- Mobile Drawer -->
    <MobileDrawer 
      v-if="isMobile" 
      :visible="showMobileDrawer" 
      :items="sideMenuItems" 
      :brand="brand"
      @hide="closeMobileDrawer" 
    />
    
    <div class="flex-1 flex flex-col overflow-auto">
      <Header 
        :items="userMenuItem" 
        :show-mobile-menu-button="isMobile"
        @toggle-mobile-menu="toggleMobileDrawer"
      />
      <main class="flex flex-1 min-h-0">
        <slot />
      </main>
    </div>
  </div>
</template>
