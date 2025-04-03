// src/electron-api.d.ts

// Определяем интерфейс один раз для всего приложения
export interface ElectronAPI {
    selectDirectory: () => Promise<string | undefined>;
    startAppProcess: (appPath: string, apiKey: string) => Promise<{ success: boolean; message?: string }>;
    stopAppProcess: () => Promise<void>;
    onAppOutput: (callback: (message: string) => void) => void;
    removeAppOutputListener: () => void;
    // Добавьте другие методы, если они есть в вашем preload
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
} 