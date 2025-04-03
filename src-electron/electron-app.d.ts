// src-electron/electron-app.d.ts

// Расширяем стандартный тип Electron.App
declare namespace Electron {
    interface App {
        isQuitting?: boolean;
    }
}

// Добавляем пустой экспорт, чтобы файл считался модулем
export { }; 