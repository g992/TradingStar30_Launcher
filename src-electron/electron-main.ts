import { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import os from 'os';
import { spawn, ChildProcess } from 'child_process';

// Временно объявляем тип здесь, чтобы исправить ошибку линтера
declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
    }
  }
}

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

console.log(`[Main Init] process.env.PORT: ${process.env.PORT}`);
console.log(`[Main Init] process.env.APP_URL: ${process.env.APP_URL}`);

const platform = process.platform || os.platform();

const currentDir = __dirname;
// Убираем devAppUrl, он не нужен
// const devAppUrl = process.env.APP_URL;

let mainWindow: BrowserWindow | undefined;
let appProcess: ChildProcess | null = null;
// let tray: Tray | null = null; // Комментируем, так как трей не будет создаваться

app.isQuitting = false;

/* // Комментируем всю функцию createTray, так как она больше не используется
async function createTray() {
  const iconPath = path.resolve(currentDir, 'icons/icon.png');
  try {
    require('fs').accessSync(iconPath);
  } catch (e) {
    console.error(`[Main] Tray icon not found at ${iconPath}, using default Electron icon.`);
    return;
  }

  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Показать Лаунчер',
      click: () => {
        mainWindow?.show();
      }
    },
    {
      label: 'Выход',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('TradingStar 3 Launcher');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow?.show();
  });

  console.log('[Main] Tray icon created.');
}
*/

async function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.resolve(currentDir, 'icons/icon.png'),
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
  });

  console.log(`[Main] Loading URL: ${MAIN_WINDOW_WEBPACK_ENTRY}`);
  await mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  if (process.env.DEV) {
    mainWindow.webContents.openDevTools();
  }

  /* // Комментируем обработчик minimize
  (mainWindow as any).on('minimize', (event: Electron.Event) => {
    event.preventDefault();
    mainWindow?.hide();
    console.log('[Main] Window minimized to tray.');
  });
  */

  mainWindow.on('close', (event: Electron.Event) => {
    /* // Комментируем логику скрытия в трей при закрытии
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
      console.log('[Main] Window closed to tray.');
    }
    */
    // Вместо этого просто позволяем окну закрыться, app.quit() будет вызван позже в 'window-all-closed'
    console.log('[Main] Window close event.');
  });

  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
}

void app.whenReady().then(async () => {
  await createWindow();
  // await createTray(); // Комментируем вызов createTray
});

async function handleFileOpen() {
  console.log('[Main] handleFileOpen called');
  if (!mainWindow) {
    console.warn('[Main] handleFileOpen: mainWindow is not available.');
    return;
  }

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
      { name: 'Исполняемые файлы (без расширения)', extensions: [''] },
      { name: 'Все файлы', extensions: ['*'] },
    ];
  } else {
    fileFilters = [
      { name: 'Исполняемые файлы', extensions: [''] },
      { name: 'Все файлы', extensions: ['*'] },
    ];
  }

  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: dialogTitle,
      properties: ['openFile'],
      filters: fileFilters,
    });
    if (!canceled && filePaths.length > 0) {
      return filePaths[0];
    }
  } catch (error) {
    console.error('[Main] Error in handleFileOpen:', error);
  }
  return undefined;
}

ipcMain.handle('select-directory', handleFileOpen);

ipcMain.handle('start-app', async (_event, appPath: string, apiKey: string) => {
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
    appProcess = spawn(appPath, ['-k', apiKey], {
      stdio: 'pipe',
    });

    if (appProcess.stdout) {
      appProcess.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(`[App Output]: ${message}`);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('app-output', message);
        }
      });
    } else { console.warn('[Main] App process stdout is not available.'); }

    if (appProcess.stderr) {
      appProcess.stderr.on('data', (data) => {
        const message = data.toString();
        console.error(`[App Error]: ${message}`);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('app-output', `ERROR: ${message}`);
        }
      });
    } else { console.warn('[Main] App process stderr is not available.'); }

    appProcess.on('close', (code) => {
      console.log(`[Main] App process exited with code ${code}`);
      appProcess = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('app-stopped', code);
      }
    });

    appProcess.on('error', (err) => {
      console.error(`[Main] Failed to start app process: ${err.message}`);
      const errMsg = err.message;
      appProcess = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('app-error', errMsg);
      }
    });

    console.log('[Main] App process spawned successfully.');
    return { success: true };

  } catch (error) {
    console.error('[Main] Error spawning process:', error);
    appProcess = null;
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('app-error', errorMessage);
    }
    return { success: false, message: `Ошибка запуска: ${errorMessage}` };
  }
});

ipcMain.handle('stop-app', async () => {
  console.log('[Main] Received stop-app request');
  if (appProcess) {
    console.log('[Main] Killing app process...');
    const killed = appProcess.kill();
    if (killed) {
      console.log('[Main] Kill signal sent successfully.');
    } else {
      console.warn('[Main] Failed to send kill signal. Process might already be dead.');
      appProcess = null;
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('app-stopped', null);
      }
    }
  } else {
    console.warn('[Main] No app process to stop.');
  }
});

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.on('window-all-closed', () => {
  if (appProcess) {
    console.log('[Main] Killing app process on window-all-closed.');
    appProcess.kill();
    appProcess = null;
  }
  // if (platform !== 'darwin') { // Убираем проверку платформы, чтобы приложение закрывалось всегда
  console.log('[Main] Quitting app because all windows are closed.');
  app.quit(); // Добавляем вызов quit()
  // }
});

app.on('activate', () => {
  if (mainWindow === undefined) {
    void createWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  console.log('[Main] Before quit event');
  app.isQuitting = true;
  // tray?.destroy(); // Комментируем уничтожение трея
  if (appProcess) {
    console.log('[Main] Killing app process on before-quit.');
    appProcess.kill();
    appProcess = null;
  }
});
