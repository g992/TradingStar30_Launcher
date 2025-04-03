import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import os from 'os';
import { spawn, ChildProcess } from 'child_process';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const platform = process.platform || os.platform();

const currentDir = __dirname;
// Убираем devAppUrl, он не нужен
// const devAppUrl = process.env.APP_URL;

let mainWindow: BrowserWindow | undefined;
let appProcess: ChildProcess | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.resolve(currentDir, 'icons/icon.png'), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  await mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Открытие DevTools оставляем зависимым от process.env.DEV
  if (process.env.DEV) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
}

void app.whenReady().then(createWindow);

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
      return filePaths[0];
    }
  } catch (error) {
    console.error('[Main] Error in handleFileOpen:', error);
  }
  return undefined;
}

// Обновляем имя обработчика
ipcMain.handle('select-directory', handleFileOpen); // Используем канал 'select-directory' как в preload
// --- Конец обновления обработчика ---

// +++ НОВЫЕ ОБРАБОТЧИКИ ЗАПУСКА/ОСТАНОВКИ +++

// Запуск приложения
ipcMain.handle('start-app', async (_event, appPath: string, apiKey: string) => {
  console.log(`[Main] Received start-app request: path=${appPath}, apiKey=${apiKey ? '***' : 'empty'}`);
  if (appProcess) {
    console.warn('[Main] App process already running.');
    return { success: false, message: 'Приложение уже запущено.' };
  }
  if (!appPath) {
    console.warn('[Main] App path is not provided.');
    return { success: false, message: 'Путь к приложению не указан.' };
  }

  try {
    console.log(`[Main] Spawning process: ${appPath}`);
    // Передаем apiKey как аргумент -k
    appProcess = spawn(appPath, ['-k', apiKey], {
      stdio: 'pipe',
    });

    // Обработка stdout
    if (appProcess.stdout) {
      appProcess.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(`[App Output]: ${message}`);
        mainWindow?.webContents.send('app-output', message);
      });
    } else { console.warn('[Main] App process stdout is not available.'); }

    // Обработка stderr
    if (appProcess.stderr) {
      appProcess.stderr.on('data', (data) => {
        const message = data.toString();
        console.error(`[App Error]: ${message}`);
        // Отправляем и stderr в рендерер с префиксом
        mainWindow?.webContents.send('app-output', `ERROR: ${message}`);
      });
    } else { console.warn('[Main] App process stderr is not available.'); }

    // Обработка завершения
    appProcess.on('close', (code) => {
      console.log(`[Main] App process exited with code ${code}`);
      appProcess = null;
      mainWindow?.webContents.send('app-stopped', code); // Отправляем код завершения
    });

    // Обработка ошибок запуска
    appProcess.on('error', (err) => {
      console.error(`[Main] Failed to start app process: ${err.message}`);
      const errMsg = err.message;
      appProcess = null;
      mainWindow?.webContents.send('app-error', errMsg);
    });

    console.log('[Main] App process spawned successfully.');
    return { success: true };

  } catch (error) {
    console.error('[Main] Error spawning process:', error);
    appProcess = null;
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Важно: также отправить ошибку в рендерер, если сам spawn упал
    mainWindow?.webContents.send('app-error', errorMessage);
    return { success: false, message: `Ошибка запуска: ${errorMessage}` };
  }
});

// Остановка приложения
ipcMain.handle('stop-app', async () => {
  console.log('[Main] Received stop-app request');
  if (appProcess) {
    console.log('[Main] Killing app process...');
    const killed = appProcess.kill(); // SIGTERM по умолчанию
    if (killed) {
      console.log('[Main] Kill signal sent successfully.');
      // Процесс должен завершиться и вызвать событие 'close', которое обнулит appProcess
    } else {
      console.warn('[Main] Failed to send kill signal. Process might already be dead.');
      // Если сигнал не отправлен, возможно, процесс уже завершен, обнуляем вручную
      appProcess = null;
      mainWindow?.webContents.send('app-stopped', null); // Уведомляем об остановке
    }
  } else {
    console.warn('[Main] No app process to stop.');
  }
});

// +++ КОНЕЦ НОВЫХ ОБРАБОТЧИКОВ +++

app.on('window-all-closed', () => {
  // Завершаем дочерний процесс при закрытии всех окон
  if (appProcess) {
    console.log('[Main] Killing app process on window-all-closed.');
    appProcess.kill();
    appProcess = null;
  }
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    void createWindow();
  }
});
