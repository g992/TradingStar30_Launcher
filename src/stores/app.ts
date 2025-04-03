import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useQuasar } from 'quasar'; // Импортируем useQuasar для уведомлений
import { ElectronAPI } from 'src/electron-api'; // Используем абсолютный путь

// Ключи для localStorage
const API_KEY_STORAGE_KEY = 'tradingStarApiKey';
const APP_PATH_STORAGE_KEY = 'tradingStarAppPath';


export const useAppStore = defineStore('app', () => {
    const $q = useQuasar(); // Для уведомлений

    // --- Состояние ---
    const apiKey = ref('');
    const appPath = ref('');
    const isRunning = ref(false); // Статус запущенного приложения
    const appOutput = ref<string[]>([]); // Массив для хранения вывода приложения

    // --- Действия ---

    /**
     * Загружает настройки (путь и ключ API) из localStorage.
     */
    const loadSettings = () => {
        const savedPath = localStorage.getItem(APP_PATH_STORAGE_KEY);
        if (savedPath) {
            appPath.value = savedPath;
            console.log('Загружен сохраненный путь:', savedPath);
        }
        const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (savedApiKey) {
            apiKey.value = savedApiKey;
            console.log('Загружен сохраненный API ключ.');
        }
    };

    /**
     * Сохраняет текущие настройки (путь и ключ API) в localStorage.
     */
    const saveSettings = () => {
        try {
            localStorage.setItem(APP_PATH_STORAGE_KEY, appPath.value);
            localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.value); // Сохраняем и ключ
            console.log('Настройки сохранены:', { path: appPath.value, apiKey: apiKey.value ? '***' : 'пусто' });
            $q.notify({ type: 'positive', message: 'Настройки сохранены.' }); // Уведомление
        } catch (error) {
            console.error('Ошибка при сохранении настроек в localStorage:', error);
            const message = error instanceof Error ? error.message : String(error);
            $q.notify({ type: 'negative', message: `Ошибка сохранения: ${message}` }); // Уведомление об ошибке
        }
    };

    /**
     * Устанавливает путь к приложению.
     * @param {string} path - Новый путь.
     */
    const setAppPath = (path: string) => {
        appPath.value = path;
    };

    /**
     * Устанавливает API ключ.
     * @param {string} key - Новый ключ.
     */
    const setApiKey = (key: string) => {
        apiKey.value = key;
    };

    /**
     * Запускает приложение TradingStar через Electron main процесс.
     */
    const startApp = async () => {
        // Получаем доступ к API непосредственно перед использованием
        const electronAPI = window.electronAPI as ElectronAPI | undefined;
        // Логируем полученный объект API
        console.log('[Store startApp] window.electronAPI:', electronAPI);

        // --- Проверки --- 
        if (!appPath.value) {
            $q.notify({ type: 'warning', message: 'Путь к приложению не указан.' });
            return;
        }
        if (!apiKey.value) {
            $q.notify({ type: 'warning', message: 'API ключ не указан.' });
            return;
        }
        // Проверяем наличие API и метода
        if (!electronAPI?.startAppProcess || !electronAPI.onAppOutput || !electronAPI.removeAppOutputListener) {
            console.error('API Electron (startAppProcess/onAppOutput/removeAppOutputListener) не доступно.');
            $q.notify({ type: 'negative', message: 'Функция запуска/обработки вывода приложения недоступна.' });
            return;
        }
        // --- Конец проверок ---

        console.log(`[Store] Запрос на запуск приложения: ${appPath.value}`);
        appOutput.value = []; // Очищаем предыдущий вывод

        // Подписываемся на вывод приложения (electronAPI точно существует здесь из-за проверки выше)
        electronAPI.onAppOutput((message) => {
            // Добавляем сообщение в конец массива
            appOutput.value.push(message);
            // Удаляем старые сообщения, если превышен лимит 500
            while (appOutput.value.length > 500) {
                appOutput.value.shift(); // Удаляем самый старый (первый) элемент
            }
        });

        try {
            $q.loading.show({ message: 'Запуск TradingStar 3...' });
            // electronAPI.startAppProcess точно существует
            const result = await electronAPI.startAppProcess(appPath.value, apiKey.value);

            if (result.success) {
                isRunning.value = true;
                console.log('[Store] Приложение успешно запущено (согласно ответу main процесса).');
                $q.notify({ type: 'positive', message: 'TradingStar 3 запущен.' });
            } else {
                console.error('[Store] Ошибка запуска приложения:', result.message);
                isRunning.value = false;
                $q.notify({ type: 'negative', message: result.message || 'Не удалось запустить приложение.' });
                // Отписываемся при ошибке (electronAPI.removeAppOutputListener точно существует)
                electronAPI.removeAppOutputListener();
            }
        } catch (error) {
            console.error('[Store] Критическая ошибка при вызове startAppProcess:', error);
            isRunning.value = false;
            const message = error instanceof Error ? error.message : String(error);
            $q.notify({ type: 'negative', message: `Ошибка IPC: ${message}` });
            // Отписываемся при ошибке (electronAPI?.removeAppOutputListener существует, если electronAPI существует)
            electronAPI?.removeAppOutputListener(); // Оставляем ? на всякий случай, хотя не должно быть null
        } finally {
            $q.loading.hide();
        }
    };

    /**
     * Останавливает приложение TradingStar через Electron main процесс.
     */
    const stopApp = async () => {
        // Получаем доступ к API непосредственно перед использованием
        const electronAPI = window.electronAPI as ElectronAPI | undefined;

        // Проверяем наличие API и метода
        if (!electronAPI?.stopAppProcess || !electronAPI.removeAppOutputListener) {
            console.error('API Electron (stopAppProcess/removeAppOutputListener) не доступно.');
            $q.notify({ type: 'negative', message: 'Функция остановки приложения недоступна.' });
            return;
        }

        console.log('[Store] Запрос на остановку приложения...');
        try {
            $q.loading.show({ message: 'Остановка TradingStar 3...' });
            // electronAPI.stopAppProcess точно существует
            await electronAPI.stopAppProcess();
            isRunning.value = false; // Считаем остановленным сразу после запроса
            console.log('[Store] Запрос на остановку отправлен.');
            $q.notify({ type: 'info', message: 'Запрос на остановку TradingStar 3 отправлен.' });
            // Отписываемся (electronAPI.removeAppOutputListener точно существует)
            electronAPI.removeAppOutputListener();
        } catch (error) {
            console.error('[Store] Ошибка при вызове stopAppProcess:', error);
            const message = error instanceof Error ? error.message : String(error);
            isRunning.value = false;
            $q.notify({ type: 'negative', message: `Ошибка IPC при остановке: ${message}` });
            // Отписываемся при ошибке (electronAPI?.removeAppOutputListener существует, если electronAPI существует)
            electronAPI?.removeAppOutputListener(); // Оставляем ? на всякий случай
        } finally {
            $q.loading.hide();
        }
    };

    // --- Слушатель завершения процесса из Main ---
    // Нужно зарегистрировать слушатель в App.vue или другом месте,
    // где есть доступ к жизненному циклу компонента
    const setupAppLifecycleListeners = () => {
        // Пример: ipcRenderer.on('app-stopped', () => { isRunning.value = false; });
        // ipcRenderer.on('app-error', (message) => { /* обработка ошибки запуска */ });
        // Лучше сделать это через electronAPI, как onAppOutput
    }

    return {
        apiKey,
        appPath,
        isRunning,
        appOutput,
        loadSettings,
        saveSettings,
        setAppPath,
        setApiKey,
        startApp,
        stopApp,
        // setupAppLifecycleListeners // Пока не используется напрямую
    };
}); 