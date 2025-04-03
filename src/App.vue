<template>
  <router-view /> <!-- Отображаем текущий маршрут -->
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'App'
});
</script>

<!-- Глобальные стили здесь не нужны, так как есть app.scss -->
<!-- <style> -->
<!-- </style> --> 