<script setup>
import { ref } from 'vue'

const colorMode = useColorMode();

const toggleDarkMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark';
}
</script>

<template>
  <div class="guest-layout">
    <nav class="guest-nav">
      <div class="logo">My Logo</div>
      <el-button type="primary" @click="toggleDarkMode">
        {{ isDark ? 'Light Mode' : 'Dark Mode' }}
      </el-button>
    </nav>
    <slot />
  </div>
</template>