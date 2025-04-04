import { createApp } from 'vue';
import App from './App.vue';
import { Quasar, Notify, Dialog, Loading } from 'quasar';
import quasarLang from 'quasar/lang/ru';
import createRouter from './router';
import { createPinia } from 'pinia';

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css';
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css';

// Import Quasar css
import 'quasar/src/css/index.sass';
import 'src/css/app.scss';

console.log('[Main] Начало main.ts');

const app = createApp(App);
const router = createRouter();
const pinia = createPinia();

console.log('[Main] Приложение создано, до app.use(Quasar)');

app.use(Quasar, {
    plugins: {
        Notify,
        Dialog,
        Loading
    },
    lang: quasarLang,
});

console.log('[Main] Quasar подключен');

app.use(pinia);
console.log('[Main] Pinia подключена');

app.use(router);
console.log('[Main] Роутер подключен, до app.mount');

app.mount('#q-app');

console.log('[Main] Приложение смонтировано.'); 