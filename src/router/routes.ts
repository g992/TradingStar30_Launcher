import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: () => import('src/layouts/MainLayout.vue'), // Используем ленивую загрузку
        children: [
            { path: '', component: () => import('src/pages/IndexPage.vue') } // Главная страница
            // Добавьте другие маршруты здесь
            // { path: 'about', component: () => import('src/pages/AboutPage.vue') }
        ],
    },

    // Всегда оставляйте это последним,
    // но вы можете также добавить свою страницу 404
    {
        path: '/:catchAll(.*)*',
        component: () => import('src/pages/ErrorNotFound.vue'), // Пример страницы 404
    },
];

export default routes; 