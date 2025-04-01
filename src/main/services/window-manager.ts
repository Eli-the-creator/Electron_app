// src/main/services/window-manager.ts
import { BrowserWindow, ipcMain } from "electron";
import { screen } from "electron";

// Хранение оригинального размера окна
let originalSize = { width: 0, height: 0 };
let originalPosition = { x: 0, y: 0 };

export function setupWindowManager(mainWindow: BrowserWindow): void {
  console.log("Setting up window manager service...");

  // Сохраняем оригинальный размер при инициализации
  originalSize = {
    width: mainWindow.getSize()[0],
    height: mainWindow.getSize()[1],
  };
  originalPosition = {
    x: mainWindow.getPosition()[0],
    y: mainWindow.getPosition()[1],
  };

  // Обработчик для изменения размера окна
  ipcMain.handle(
    "resize-window",
    async (_, { width, height }: { width: number; height: number }) => {
      try {
        console.log(`Resizing window to ${width}x${height}`);

        // Получаем текущий размер окна
        const currentSize = mainWindow.getSize();
        const currentWidth = currentSize[0];
        const currentHeight = currentSize[1];

        // Если размеры совпадают, ничего не делаем
        if (currentWidth === width && currentHeight === height) {
          return { success: true, alreadyResized: true };
        }

        // Получаем размер экрана
        const display = screen.getPrimaryDisplay();
        const workAreaSize = display.workAreaSize;

        // Проверяем, чтобы новый размер не выходил за границы экрана
        const safeWidth = Math.min(width, workAreaSize.width);
        const safeHeight = Math.min(height, workAreaSize.height);

        // Изменяем размер окна
        mainWindow.setSize(safeWidth, safeHeight);

        // Центрируем окно, если оно не помещается на экране
        const position = mainWindow.getPosition();
        if (
          position[0] + safeWidth > workAreaSize.width ||
          position[1] + safeHeight > workAreaSize.height
        ) {
          const x = Math.max(
            0,
            Math.floor((workAreaSize.width - safeWidth) / 2)
          );
          const y = Math.max(
            0,
            Math.floor((workAreaSize.height - safeHeight) / 2)
          );
          mainWindow.setPosition(x, y);
        }

        return { success: true };
      } catch (error) {
        console.error("Error resizing window:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }
  );

  // Обработчик для возврата к оригинальному размеру
  ipcMain.handle("restore-window", async () => {
    try {
      console.log(
        `Restoring window to original size: ${originalSize.width}x${originalSize.height}`
      );
      mainWindow.setSize(originalSize.width, originalSize.height);
      mainWindow.setPosition(originalPosition.x, originalPosition.y);
      return { success: true };
    } catch (error) {
      console.error("Error restoring window size:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

  console.log("Window manager service setup complete");
}
