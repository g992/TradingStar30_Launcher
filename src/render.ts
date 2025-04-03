import { createApp } from 'vue';
import { Quasar, Notify, Dialog, Loading } from 'quasar';
import quasarLang from 'quasar/lang/ru'; // Пример: русский язык

// Импорт иконок и стилей Quasar (пути настроены в webpack.renderer.config.ts)
import '@quasar/extras/material-icons/material-icons.css';
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css'; // Пример: FontAwesome
import 'quasar/dist/quasar.sass'; // Основные стили Quasar (SCSS)

// Импорт пользовательских стилей
import 'src/css/app.scss'; // Ваши основные стили

import App from 'src/App.vue';
import createRouter from './router'; // Изменили путь

// Импортируем наш boot-файл Pinia
import piniaBoot from './boot/pinia';

console.log('[Render] Начало render.ts');

const app = createApp(App);
const router = createRouter(); // Создаем экземпляр роутера

console.log('[Render] Приложение создано');

// Вручную вызываем логику boot-файла Pinia
piniaBoot({ app }); // Передаем экземпляр app

console.log('[Render] Pinia boot выполнен');

app.use(Quasar, {
    plugins: { // Указываем плагины Quasar для установки
        Notify,
        Dialog,
        Loading,
    },
    lang: quasarLang, // Установка языка
    config: {
        // Здесь можно задать глобальные настройки Quasar
        // notify: { /* ... */ },
        // loading: { /* ... */ },
        // dialog: { /* ... */ }
    }
    // Можно также указать iconSet: 'material-icons' или другой набор иконок, если нужно
});

console.log('[Render] Quasar подключен');

app.use(router); // Подключаем роутер к приложению

console.log('[Render] Роутер подключен, до app.mount');

app.mount('#q-app'); // Монтируем приложение в элемент с id="q-app"

console.log('[Render] Приложение смонтировано');