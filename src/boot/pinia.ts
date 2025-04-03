import { boot } from 'quasar/wrappers';
import { createPinia } from 'pinia';
import { App } from 'vue'; // Импортируем тип App

// Определяем интерфейс для параметров, которые мы *действительно* передаем
interface ManualBootParams {
    app: App<Element>;
}

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
// Используем наш упрощенный тип вместо BootFileParams
export default boot((params: ManualBootParams) => {
    const { app } = params; // Извлекаем app
    console.log('[Boot] Инициализация Pinia...');
    const pinia = createPinia();
    app.use(pinia);
    console.log('[Boot] Pinia инициализирована.');
    // Опционально: можно сделать что-то с экземпляром Pinia, если нужно
    // Например, добавить плагин к Pinia
}); 