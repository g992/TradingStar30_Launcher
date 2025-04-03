/// <reference types="vite/client" /> // Если бы мы использовали Vite, но оставим на всякий случай
/// <reference types="vue/macros-global" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
    const component: DefineComponent<{}, {}, any>;
    export default component;
}

// --- Добавляем глобальный интерфейс для Electron API --- 
declare global {
    interface Window {
        electronAPI?: {
            selectDirectory: () => Promise<string | undefined>;
            // Другие методы API можно будет добавить сюда
        };
    }
}
// --- Конец добавления интерфейса ---

// Дополнительно можно объявить здесь глобальные типы, если они нужны,
// например, типы для переменных окружения, если бы они использовались в коде клиента.
// declare global {
//   interface ImportMetaEnv {
//     readonly VITE_APP_TITLE: string
//     // more env variables...
//   }
//   interface ImportMeta {
//     readonly env: ImportMetaEnv
//   }
// } 