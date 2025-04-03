import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import os from 'os';
// import { fileURLToPath } from 'url'; // <-- Больше не нужно

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

// --- Используем __dirname для CommonJS вместо import.meta.url --- 
// const currentDir = fileURLToPath(new URL('.', import.meta.url));
const currentDir = __dirname; // <-- Правильный способ в CJS
// --- Конец исправления ---

// --- Убираем ручное определение пути preload --- 
/*
const preloadPath = path.join(__dirname, '../renderer/main_window/preload.js');
console.log(`[Main] Using explicit preload path: ${preloadPath}`);
*/
// --- Конец удаления --- 

const devAppUrl = process.env.APP_URL;
// --- Конец определения путей --- 

let mainWindow: BrowserWindow | undefined;

async function createWindow() {
  /**
   * Initial window options
   */
  console.log('[Main] Creating main window...');
  mainWindow = new BrowserWindow({
    icon: path.resolve(currentDir, 'icons/icon.png'), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      // --- Указываем preload явно, используя константу от Forge --- 
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY, // <-- Используем константу для preload
    },
  });

  // --- Логируем значения констант от Forge --- 
  console.log(`[Main] MAIN_WINDOW_WEBPACK_ENTRY: ${MAIN_WINDOW_WEBPACK_ENTRY}`);
  console.log(`[Main] MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: ${MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY}`);
  // --- Конец логирования --- 

  if (process.env.DEV) {
    // --- Добавляем проверку для APP_URL --- 
    if (!devAppUrl) {
      console.error('ERROR: APP_URL environment variable is not set in development mode.');
      // Можно показать окно с ошибкой или просто выйти
      app.quit();
      return; // Выходим из функции, чтобы не продолжать
    }
    // --- Конец проверки --- 
    await mainWindow.loadURL(devAppUrl); // Используем проверенную переменную
  } else {
    // --- Используем константу MAIN_WINDOW_WEBPACK_ENTRY для загрузки --- 
    // await mainWindow.loadURL(MAIN_WINDOW_HTML_PATH);
    await mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY); // <-- Используем WEBPACK_ENTRY
    // --- Конец использования константы --- 
  }

  // --- Исправляем условие открытия DevTools --- 
  // Используем process.env.DEV, который устанавливается electron-forge start
  if (process.env.DEV) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  }
  // --- Убираем блок else, который мешал ручному открытию DevTools ---
  /*
   else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }
  */

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
}

void app.whenReady().then(createWindow);

// --- Обновляем обработчик IPC для выбора ИСПОЛНЯЕМОГО ФАЙЛА --- 
// Переименовываем функцию для ясности
async function handleFileOpen() {
  console.log('[Main] handleFileOpen called');
  if (!mainWindow) {
    console.warn('[Main] handleFileOpen: mainWindow is not available.');
    return;
  }

  // --- Определяем фильтры файлов на основе платформы --- 
  let fileFilters: Electron.FileFilter[] = [];
  let dialogTitle = 'Выберите исполняемый файл TradingStar 3';

  if (platform === 'win32') {
    fileFilters = [
      { name: 'Исполняемые файлы', extensions: ['exe'] },
      { name: 'Все файлы', extensions: ['*'] },
    ];
  } else if (platform === 'darwin') {
    // На macOS исполняемые файлы часто не имеют расширения или это .app бандлы
    // Пока разрешим выбор любого файла или файла без расширения.
    // Возможно, понадобится дополнительная логика для .app
    dialogTitle = 'Выберите приложение TradingStar 3';
    fileFilters = [
      // { name: 'Приложения', extensions: ['app'] }, // Можно добавить, но .app это директория
      { name: 'Исполняемые файлы (без расширения)', extensions: [''] }, // Пытаемся ловить файлы без расширения
      { name: 'Все файлы', extensions: ['*'] },
    ];
  } else { // Linux и другие
    fileFilters = [
      { name: 'Исполняемые файлы', extensions: [''] }, // Файлы без расширения
      { name: 'Все файлы', extensions: ['*'] },
    ];
  }
  // --- Конец определения фильтров --- 

  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: dialogTitle,
      // --- Меняем свойства и добавляем фильтры --- 
      properties: ['openFile'], // Выбираем файл, а не директорию
      filters: fileFilters,
      // --- Конец изменений --- 
    });
    console.log(`[Main] dialog.showOpenDialog result: canceled=${canceled}, filePaths=${filePaths}`);
    if (!canceled && filePaths.length > 0) {
      // TODO: Добавить проверку, что выбранный файл действительно исполняемый (особенно для Linux/macOS)
      return filePaths[0];
    }
  } catch (error) {
    console.error('[Main] Error in handleFileOpen:', error);
  }
  return undefined;
}

// Обновляем имя обработчика
ipcMain.handle('dialog:openFile', handleFileOpen); // Используем новое имя канала 'dialog:openFile'
// --- Конец обновления обработчика --- 

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    void createWindow();
  }
});
