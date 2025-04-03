<template>
  <q-page class="flex flex-center">
    <h1>Привет из Quasar и Electron Forge!</h1>
    <q-btn color="primary" label="Кликни меня" @click="showNotification" />
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useQuasar, QPage, QBtn } from 'quasar';

// Типизация для API, выставленного через preload
interface ElectronAPI {
  sendMessage: (channel: string, data: unknown) => void;
  onReply: (channel: string, func: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
  removeListener: (channel: string, func: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => void;
}

// Объявление глобальной переменной electronAPI
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export default defineComponent({
  name: 'IndexPage',
  components: {
    QPage,
    QBtn
  },
  setup() {
    const $q = useQuasar();

    const showNotification = () => {
      $q.notify({
        message: 'Уведомление от Quasar!',
        color: 'positive',
        icon: 'check_circle',
      });
      // Пример отправки сообщения в главный процесс через preload API
      if (window.electronAPI) {
          window.electronAPI.sendMessage('message-from-renderer', 'Привет из рендерера!');
      } else {
          console.warn('electronAPI не найдено. Preload скрипт не загружен?');
      }
    };

    return {
      showNotification,
    };
  }
});
</script>

<style scoped>
h1 {
  font-size: 2em;
  margin-bottom: 1em;
  text-align: center; /* Центрируем заголовок */
}
p {
    text-align: center; /* Центрируем текст */
    margin: 0.5em 0;
}
.q-page {
    flex-direction: column; /* Располагаем элементы вертикально */
}
</style> 