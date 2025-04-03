<template>
  <q-layout view="lHh Lpr lFf"> <!-- Стандартный макет Quasar -->
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Quasar Electron App
        </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label
          header
        >
          Навигация
        </q-item-label>

        <!-- Добавьте сюда ссылки -->
         <q-item clickable v-ripple to="/">
           <q-item-section avatar>
             <q-icon name="home" />
           </q-item-section>
           <q-item-section>
             Главная
           </q-item-section>
         </q-item>

      </q-list>
    </q-drawer>

    <q-page-container>
      <!-- Здесь будет отображаться содержимое текущей страницы -->
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
// Явный импорт компонентов Quasar
import {
  QLayout, QHeader, QToolbar, QBtn, QToolbarTitle, QDrawer, QList,
  QItemLabel, QItem, QItemSection, QIcon, QPageContainer, Ripple // Ripple - директива
} from 'quasar';

export default defineComponent({
  name: 'MainLayout',
  // Регистрируем компоненты локально
  components: {
    QLayout, QHeader, QToolbar, QBtn, QToolbarTitle, QDrawer, QList,
    QItemLabel, QItem, QItemSection, QIcon, QPageContainer
  },
  // Регистрируем директивы локально
  directives: {
    Ripple
  },
  setup () {
    const leftDrawerOpen = ref(false);

    return {
      leftDrawerOpen,
      toggleLeftDrawer () {
        leftDrawerOpen.value = !leftDrawerOpen.value;
      }
    }
  }
});
</script>

<style scoped>
/* Стили для этого макета */
</style> 