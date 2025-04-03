// electron-preload.ts
// Пример Preload скрипта
// Здесь можно безопасно выставлять API из Node.js в рендерер через contextBridge

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    // Пример функции для отправки сообщения в главный процесс
    sendMessage: (channel: string, data: unknown) => ipcRenderer.send(channel, data),

    // Пример функции для получения ответа от главного процесса
    onReply: (channel: string, func: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => {
        // Предоставляем event и используем any[] для универсальности
        // В реальном приложении лучше использовать более строгие типы для args
        ipcRenderer.on(channel, (event, ...args) => func(event, ...args));
    },

    // Функция для удаления слушателя
    removeListener: (channel: string, func: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => {
        ipcRenderer.removeListener(channel, func);
    },

    // Можно добавить другие API здесь...
    // Например, доступ к файловой системе (с осторожностью!)
    // readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
});

console.log('Preload script loaded.'); 