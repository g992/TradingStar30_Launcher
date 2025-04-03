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
import createRouter from 'src/router'; // Импортируем функцию создания роутера

const app = createApp(App);
const router = createRouter(); // Создаем экземпляр роутера

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

app.use(router); // Подключаем роутер к приложению

app.mount('#q-app'); // Монтируем приложение в элемент с id="q-app" в HTML 