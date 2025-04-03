import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import routes from './routes';

/*
 * Если не нужно разделение кода, можно импортировать все маршруты сразу,
 * но это может увеличить время первоначальной загрузки приложения.
 * import routes from './routes'
 */

export default function (/* { store, ssrContext } */) {
    const router = createRouter({
        scrollBehavior: () => ({ left: 0, top: 0 }), // Прокрутка вверх при переходе
        routes: routes as RouteRecordRaw[], // Приведение типа здесь

        // Оставляем # в URL для Electron приложений
        history: createWebHashHistory(),
    });

    return router;
} 