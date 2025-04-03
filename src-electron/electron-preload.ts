import { contextBridge, ipcRenderer } from 'electron';

// Определяем типы для большей безопасности
interface ElectronAPI {
    selectDirectory: () => Promise<string | undefined>;
    startAppProcess: (appPath: string, apiKey: string) => Promise<{ success: boolean; message?: string }>;
    stopAppProcess: () => Promise<void>;
    onAppOutput: (callback: (message: string) => void) => void; // Для получения stdout
    removeAppOutputListener: () => void; // Для очистки слушателя stdout
}

const api: ElectronAPI = {
    // Вызываем диалог выбора директории в основном процессе
    selectDirectory: () => ipcRenderer.invoke('select-directory'),

    // Запрос на запуск процесса в основном потоке
    startAppProcess: (appPath: string, apiKey: string) => ipcRenderer.invoke('start-app', appPath, apiKey),

    // Запрос на остановку процесса в основном потоке
    stopAppProcess: () => ipcRenderer.invoke('stop-app'),

    // Подписка на вывод приложения (stdout) - Упрощенная версия
    onAppOutput: (callback: (message: string) => void) => {
        ipcRenderer.on('app-output', (_event, message) => callback(String(message)));
        },

    // Отписка от вывода приложения - Упрощенная версия
    removeAppOutputListener: () => {
        ipcRenderer.removeAllListeners('app-output');
    },
};

try {
    contextBridge.exposeInMainWorld('electronAPI', api);
} catch (error) {
    console.error('[Preload] Failed to expose electronAPI via contextBridge:', error);
}

