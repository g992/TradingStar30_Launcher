import { createPinia } from 'pinia';
import { App } from 'vue'; // Импортируем тип App

// Экспортируем интерфейс
export interface ManualBootParams {
    app: App<Element>;
}

// Экспортируем простую функцию вместо обертки boot
const piniaBoot = (params: ManualBootParams) => {
    const { app } = params; // Извлекаем app
    console.log('[Boot] Инициализация Pinia...');
    const pinia = createPinia();
    app.use(pinia);
    console.log('[Boot] Pinia инициализирована.');
};

export default piniaBoot; 