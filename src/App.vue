<template>
  <q-layout view="hHh lpR fFf">

    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          TradingStar 3 Launcher
        </q-toolbar-title>

        <q-btn dense flat round icon="settings" @click="openSettingsDialog" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page padding class="q-gutter-y-md">

        <!-- Кнопки управления приложением -->
        <div class="row justify-end q-gutter-x-sm">
          <q-btn
            v-if="!appStore.isRunning"
            label="Запустить приложение"
            color="positive"
            icon="play_arrow"
            @click="appStore.startApp"
            :disable="!canStartApp"
          />
          <q-btn
            v-if="appStore.isRunning"
            label="Остановить приложение"
            color="negative"
            icon="stop"
            @click="confirmStopApp"
          />
        </div>

        <!-- Секция вывода логов приложения -->
        <q-card flat bordered class="q-mt-md" v-if="appStore.appOutput.length > 0 || appStore.isRunning">
          <q-card-section class="q-pb-none">
            <div class="text-subtitle2">Логи TradingStar 3</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pa-none">
            <!-- Используем q-scroll-area для прокрутки и q-list для отображения -->
            <q-scroll-area style="height: 300px;" ref="logScrollAreaRef">
              <q-list dense separator>
                <q-item
                  v-for="(log, index) in appStore.appOutput"
                  :key="index"
                  :class="{ 'text-negative': log.startsWith('ERROR:') }"
                >
                  <q-item-section>
                    <!-- Можно добавить временную метку, если нужно -->
                    <span class="log-entry" v-html="ansiConverter.toHtml(log)"></span>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-scroll-area>
          </q-card-section>
        </q-card>

      </q-page>
    </q-page-container>

    <q-dialog v-model="isSettingsDialogOpen">
      <q-card style="min-width: 450px">
        <q-card-section>
          <div class="text-h6">Настройки</div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-md">
          <!-- Путь к приложению -->
          <div class="text-caption">Путь к приложению TradingStar 3</div>
          <div class="row items-center no-wrap">
            <q-input
              :model-value="appStore.appPath"
              outlined
              dense
              readonly
              class="col"
              placeholder="Выберите файл приложения..."
            />
            <q-btn
              flat
              dense
              icon="folder_open"
              @click="selectAppPath"
              class="q-ml-sm"
              aria-label="Выбрать файл"
            />
          </div>

           <!-- API Ключ -->
           <q-input
             :model-value="appStore.apiKey"
             @update:model-value="val => appStore.setApiKey(String(val))"
             label="API Ключ TradingStar"
             outlined
             dense
             placeholder="Введите ваш API ключ..."
           />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Закрыть" color="primary" @click="closeSettingsDialog" />
          <q-btn flat label="Сохранить" color="primary" @click="saveSettingsAndClose" />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-layout>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { QLayout, QHeader, QPageContainer, QPage, QDialog, QCard, QCardSection, QCardActions, QBtn, QToolbar, QToolbarTitle, QInput, useQuasar, QScrollArea, QList, QItem, QItemSection, QSeparator } from 'quasar';
import { useAppStore } from './stores/app';
import AnsiToHtml from 'ansi-to-html';

// Define the expected shape of the injected API
interface ElectronAPI {
  selectDirectory: () => Promise<string | undefined>;
}

// Создаем экземпляр конвертера (можно настроить цвета при желании)
const ansiConverter = new AnsiToHtml({ fg: '#bbb', bg: 'transparent', newline: false, escapeXML: true });

console.log('[App.vue setup] Начало выполнения setup');

const $q = useQuasar();
const appStore = useAppStore();

console.log('[App.vue setup] Хранилище appStore получено');

const isSettingsDialogOpen = ref(false);
const logScrollAreaRef = ref<QScrollArea | null>(null);

// --- Загрузка настроек при монтировании ---
onMounted(() => {
  appStore.loadSettings();
});
// --- Конец загрузки при монтировании ---

// Вычисляемое свойство для определения, можно ли запустить приложение
const canStartApp = computed(() => {
  return !!appStore.appPath && !!appStore.apiKey;
});

// --- Автоматическая прокрутка логов вниз ---
watch(() => appStore.appOutput, async () => {
  await nextTick();
  logScrollAreaRef.value?.setScrollPercentage('vertical', 1, 300);
}, { deep: true });
// --- Конец автопрокрутки ---

const openSettingsDialog = () => {
  isSettingsDialogOpen.value = true;
};

const selectAppPath = async () => {
  console.log('Запрос выбора пути к приложению...');
  const api = window.electronAPI as unknown as ElectronAPI | undefined;
  console.log('window.electronAPI', api);

  if (api && api.selectDirectory) {
    try {
      const selectedPath = await api.selectDirectory();
      if (selectedPath) {
        appStore.setAppPath(selectedPath);
        console.log('Выбран путь:', selectedPath);
      } else {
        console.log('Выбор пути отменен пользователем.');
      }
    } catch (error) {
      console.error('Ошибка при выборе файла:', error);
      $q.notify({ type: 'negative', message: 'Ошибка при выборе пути к приложению.' });
    }
  } else {
    console.warn('API Electron (selectDirectory) не доступно.');
    $q.notify({ type: 'warning', message: 'Функция выбора пути недоступна.' });
  }
};

const saveSettingsAndClose = () => {
  appStore.saveSettings();
  $q.notify({ type: 'positive', message: 'Настройки сохранены.' });
  isSettingsDialogOpen.value = false;
};

const closeSettingsDialog = () => {
  isSettingsDialogOpen.value = false;
};

const confirmStopApp = () => {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Вы уверены, что хотите остановить приложение TradingStar 3?',
    cancel: 'Отмена',
    ok: 'Остановить',
    persistent: true
  }).onOk(() => {
    appStore.stopApp();
  });
};

</script>

<style scoped>
/* Стили остаются прежними */
/* #app { height: 100%; } */

.log-entry {
  font-family: 'Menlo', 'Consolas', monospace; /* Моноширинный шрифт для логов */
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-size: 0.85em;
  line-height: 1.4;
}
/* Добавляем стили по умолчанию от ansi-to-html, чтобы цвета работали */
.ansi-to-html-tag {
  /* Можно переопределить стили, если стандартные не нравятся */
}
</style>

<!-- Комментарии про app.scss и style можно убрать, если они больше не релевантны --> 