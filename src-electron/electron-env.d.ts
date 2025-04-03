declare namespace NodeJS {
  interface ProcessEnv {
    QUASAR_PUBLIC_FOLDER: string;
    QUASAR_ELECTRON_PRELOAD_FOLDER: string;
    QUASAR_ELECTRON_PRELOAD_EXTENSION: string;
    APP_URL: string;
  }
}

// --- Объявляем глобальные переменные, предоставляемые Electron Forge Webpack Plugin --- 
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Добавляем объявление для пути к HTML (хотя Forge часто предоставляет его как WEBPACK_ENTRY, добавим и HTML_PATH для ясности)
declare const MAIN_WINDOW_HTML_PATH: string;
// --- Конец объявления глобальных переменных --- 
