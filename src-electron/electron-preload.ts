/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > dependencies and NOT in devDependencies
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 *
 * WARNING!
 * If accessing Node functionality (like importing @electron/remote) then in your
 * electron-main.ts you will need to set the following when you instantiate BrowserWindow:
 *
 * mainWindow = new BrowserWindow({
 *   // ...
 *   webPreferences: {
 *     // ...
 *     sandbox: false // <-- to be able to import @electron/remote in preload script
 *   }
 * }
 */

import { contextBridge, ipcRenderer } from 'electron';

console.log('[Preload] Loading preload script...');

// Определяем API, которое будет доступно в window.electronAPI
const electronAPI = {
    /**
     * Вызывает основной процесс для открытия системного диалога выбора директории.
     * @returns {Promise<string | undefined>} Путь к выбранной директории или undefined, если выбор отменен.
     */
    selectDirectory: (): Promise<string | undefined> => {
        console.log('[Preload] Invoking dialog:openFile');
        return ipcRenderer.invoke('dialog:openFile');
    },
    // Сюда можно добавить другие методы API
};

// Безопасно предоставляем API рендереру
try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI);
    console.log('[Preload] electronAPI exposed successfully.');
} catch (error) {
    console.error('[Preload] Failed to expose electronAPI via contextBridge:', error);
}
