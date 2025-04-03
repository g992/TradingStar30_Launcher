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
      <q-page padding>
        <!-- Основное содержимое страницы -->
        <!-- Пока что пусто -->
      </q-page>
    </q-page-container>

    <q-dialog v-model="isSettingsDialogOpen">
      <q-card style="min-width: 450px">
        <q-card-section>
          <div class="text-h6">Настройки</div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-y-md">
          <div class="text-caption">Путь к приложению TradingStar 3</div>
          <div class="row items-center no-wrap">
            <q-input
              v-model="appPath"
              outlined
              dense
              readonly
              class="col"
              placeholder="Выберите папку приложения..."
            />
            <q-btn
              flat
              dense
              icon="folder_open"
              @click="selectAppPath"
              class="q-ml-sm"
              aria-label="Выбрать папку"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Закрыть" color="primary" v-close-popup />
          <q-btn flat label="Сохранить" color="primary" @click="saveSettings" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-layout>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { QLayout, QHeader, QPageContainer, QPage, QDialog, QCard, QCardSection, QCardActions, QBtn, QToolbar, QToolbarTitle, QInput } from 'quasar';

const isSettingsDialogOpen = ref(false);
const appPath = ref('');

const openSettingsDialog = () => {
  // TODO: Загрузить сохраненный путь при открытии
  isSettingsDialogOpen.value = true;
};

const selectAppPath = async () => {
  console.log('Запрос выбора пути к приложению...');
  console.log('window.electronAPI', window.electronAPI);
  if (window.electronAPI && window.electronAPI.selectDirectory) {
    try {
      const selectedPath = await window.electronAPI.selectDirectory();
      if (selectedPath) {
        appPath.value = selectedPath;
        console.log('Выбран путь:', selectedPath);
      } else {
        console.log('Выбор пути отменен пользователем.');
      }
    } catch (error) {
      console.error('Ошибка при выборе директории:', error);
      // TODO: Показать пользователю сообщение об ошибке
    }
  } else {
    console.warn('API Electron (selectDirectory) не доступно.');
    // Возможно, стоит показать сообщение пользователю или использовать заглушку
    appPath.value = '/path/not/available';
  }
};

const saveSettings = () => {
  // TODO: Реализовать сохранение настроек (например, appPath.value)
  console.log('Сохранение настроек...', appPath.value);
};

</script>

<style>
/* Удаляем старые стили макета */
/* .app-layout { ... } */
/* .app-content { ... } */

/* Оставляем только необходимые глобальные стили, если они есть */
/* #app { height: 100%; } */ /* q-layout обычно сам управляет высотой */
</style>

<!-- Комментарии про app.scss и style можно убрать, если они больше не релевантны --> 