import { defineStore } from 'pinia';
import { ref, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

// Ключи для localStorage
const API_KEY_STORAGE_KEY = 'tradingStarApiKey';
const APP_PATH_STORAGE_KEY = 'tradingStarAppPath';

export const useAppStore = defineStore('app', () => {
    const $q = useQuasar();

    // --- Состояние ---
    const apiKey = ref('');
    const appPath = ref('');
    const isRunning = ref(false);
    const appOutput = ref<string[]>([]);

    // --- Слушатели событий Tauri ---
    let unlistenOutput: UnlistenFn | null = null;
    let unlistenError: UnlistenFn | null = null;
    let unlistenTerminated: UnlistenFn | null = null;

    /**
     * Регистрирует слушатели для событий от Rust бэкенда.
     */
    const registerEventListeners = async () => {
        // Отписываемся от старых, если они есть
        await unregisterEventListeners();

        unlistenOutput = await listen<{ message: string }>('app-output', (event) => {
            appOutput.value.push(event.payload.message);
            while (appOutput.value.length > 500) {
                appOutput.value.shift();
            }
            // Устанавливаем isRunning в true при получении первого вывода, если еще не установлено
            // Это может быть не идеально, но дает обратную связь, что процесс что-то делает
            if (!isRunning.value) {
                console.log('[Store] Process activity detected via output.');
                isRunning.value = true;
            }
        });

        unlistenError = await listen<{ message: string }>('app-error', (event) => {
            console.error('[Store] Received app-error event:', event.payload.message);
            $q.notify({ type: 'negative', message: `Ошибка приложения: ${event.payload.message}` });
            // Можно добавить логику для остановки isRunning при определенных ошибках
        });

        unlistenTerminated = await listen<{ message: string }>('app-terminated', (event) => {
            console.log('[Store] Received app-terminated event:', event.payload.message);
            isRunning.value = false;
            $q.notify({ type: 'info', message: `Приложение завершилось: ${event.payload.message}` });
        });
        console.log('[Store] Tauri event listeners registered.');
    };

    /**
     * Отписывается от слушателей событий Tauri.
     */
    const unregisterEventListeners = async () => {
        if (unlistenOutput) {
            unlistenOutput();
            unlistenOutput = null;
        }
        if (unlistenError) {
            unlistenError();
            unlistenError = null;
        }
        if (unlistenTerminated) {
            unlistenTerminated();
            unlistenTerminated = null;
        }
        console.log('[Store] Tauri event listeners unregistered.');
    };

    // Автоматическая регистрация слушателей при создании store
    // и отписка при уничтожении компонента (если store используется в setup)
    registerEventListeners();
    onUnmounted(() => {
        unregisterEventListeners();
    });

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
            localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.value);
            console.log('Настройки сохранены:', { path: appPath.value, apiKey: apiKey.value ? '***' : 'пусто' });
            $q.notify({ type: 'positive', message: 'Настройки сохранены.' });
        } catch (error) {
            console.error('Ошибка при сохранении настроек в localStorage:', error);
            const message = error instanceof Error ? error.message : String(error);
            $q.notify({ type: 'negative', message: `Ошибка сохранения: ${message}` });
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
     * Запускает приложение TradingStar через Rust команду.
     */
    const startApp = async () => {
        // --- Проверки ---
        if (!appPath.value) {
            $q.notify({ type: 'warning', message: 'Путь к приложению не указан.' });
            return;
        }
        if (!apiKey.value) {
            $q.notify({ type: 'warning', message: 'API ключ не указан.' });
            return;
        }
        // Проверка isRunning для предотвращения двойного запуска
        if (isRunning.value) {
            $q.notify({ type: 'warning', message: 'Приложение уже запущено (согласно флагу isRunning).' });
            return;
        }
        // --- Конец проверок ---

        console.log(`[Store] Вызов Rust команды start_external_app: ${appPath.value}`);
        appOutput.value = []; // Очищаем предыдущий вывод
        // Регистрация слушателей (на случай, если они отписались)
        await registerEventListeners();

        try {
            $q.loading.show({ message: 'Запуск TradingStar 3...' });
            await invoke('start_external_app', { appPath: appPath.value, apiKey: apiKey.value });
            // Не устанавливаем isRunning здесь, ждем события app-output или app-terminated
            console.log('[Store] Команда start_external_app вызвана успешно.');
            $q.notify({ type: 'positive', message: 'Команда запуска TradingStar 3 отправлена.' });
            // isRunning установится при получении первого 'app-output'
        } catch (error) {
            console.error('[Store] Ошибка при вызове команды start_external_app:', error);
            isRunning.value = false; // Сбрасываем, если вызов команды не удался
            const message = typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Неизвестная ошибка');
            $q.notify({ type: 'negative', message: `Ошибка запуска: ${message}` });
            await unregisterEventListeners(); // Отписываемся при ошибке запуска
        } finally {
            // Не скрываем загрузку сразу, скрытие будет при ошибке или завершении
            // Но можно добавить таймаут для скрытия, если процесс долго не отвечает
            if (!isRunning.value) { // Скрываем, если запуск сразу провалился
                $q.loading.hide();
            }
        }
    };

    /**
     * Останавливает приложение TradingStar через Rust команду.
     */
    const stopApp = async () => {
        // Проверяем по флагу, есть ли смысл останавливать
        if (!isRunning.value) {
            $q.notify({ type: 'warning', message: 'Приложение не запущено (согласно флагу isRunning).' });
            return;
        }

        console.log('[Store] Вызов Rust команды kill_external_app...');
        try {
            $q.loading.show({ message: 'Остановка TradingStar 3...' });
            await invoke('kill_external_app');
            console.log('[Store] Команда kill_external_app вызвана успешно.');
            $q.notify({ type: 'info', message: 'Команда остановки TradingStar 3 отправлена.' });
            // isRunning сбросится при получении события 'app-terminated'
        } catch (error) {
            console.error('[Store] Ошибка при вызове команды kill_external_app:', error);
            const message = typeof error === 'string' ? error : (error instanceof Error ? error.message : 'Неизвестная ошибка');
            // В случае ошибки остановки, возможно, стоит попробовать сбросить isRunning
            isRunning.value = false;
            $q.notify({ type: 'negative', message: `Ошибка остановки: ${message}` });
            await unregisterEventListeners(); // Отписываемся при ошибке остановки
        } finally {
            $q.loading.hide();
        }
    };

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
    };
}); 