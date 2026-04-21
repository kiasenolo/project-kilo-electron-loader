import { app, BrowserWindow, ipcMain, Menu, Tray, screen, shell } from 'electron';
import path from 'path';
import { setAppInfo } from '@kiase/base.config';

const baseURL = "http://127.0.0.1:9487/_LABS/E621-API";
const iconPath = "icon.ico";

setAppInfo(app, {
  appID: "kiasenolo.e621.app",
  appName: "E621-Desktop-App"
})

app.whenReady().then(() => {
  app.commandLine.appendSwitch('enable-gpu');
  app.commandLine.appendSwitch('ignore-gpu-blocklist');

  let appIsReady = false

  const TrayOwO = new Tray(iconPath);
  const Main = new BrowserWindow({
    minWidth: 800,
    minHeight: 400,
    width: 1280,
    height: 720,
    autoHideMenuBar: true,
    frame: false,
    resizable: true,
    backgroundColor: "#000",
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'main.js')
    },
  });

  Main.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('http')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  Main.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  const mute = (mute: boolean) => Main.webContents.setAudioMuted(mute);
  const hideWin = () => { Main.hide(); mute(true) }
  const showWin = () => { Main.show(); mute(false); Main.focus(); }

  type Ract = {
    top: number,
    left: number,
    width: number,
    height: number,
  }

  const setWindowRact = ({
    top,
    left,
    width,
    height,
  }: Ract) => {
    const currentBounds = Main.getBounds();
    const area = screen.getDisplayMatching(currentBounds);
    const { x: offsetX, y: offsetY, width: screenW, height: screenH } = area.workArea;
    const norm = (val: number) => val / 100;

    const rect = {
      x: offsetX + ~~(screenW * norm(left)),
      y: offsetY + ~~(screenH * norm(top)),
      width: ~~(screenW * norm(width)),
      height: ~~(screenH * norm(height)),
    };

    Main.setBounds(rect);
  };

  Main.loadURL(baseURL + "?electron");

  ipcMain.on("WINDOW", function (_, args) {
    switch (args) {
      case "MINI": return Main.minimize();
      case "MAXI": return Main.maximize();
      case "RSTR": return Main.restore();
      case "HIDE": return hideWin();
      case "CLOSE": return Main.close();
      case "KILL": return app.exit(1);
    };
  });

  const sendWindowInfo = () => {
    if (!appIsReady) return;
    setTimeout(() => {
      const data = {
        id: Main.id,
        isFocused: Main.isFocused(),
        isFullScreen: Main.isFullScreen(),
        isMinimized: Main.isMinimized(),
        isMaximized: Main.isMaximized(),
      }
      Main.webContents.send("WIN-INFO", data)
    }, 0)
  }

  Main.on("blur", sendWindowInfo)
  Main.on("focus", sendWindowInfo)
  Main.on("maximize", sendWindowInfo)
  Main.on("restore", sendWindowInfo)
  Main.on("unmaximize", sendWindowInfo)
  Main.on("minimize", sendWindowInfo)
  Main.on("enter-full-screen", sendWindowInfo)
  Main.on("leave-full-screen", sendWindowInfo)

  let isAltF4 = false
  Main.webContents.on('before-input-event', (event, input) => {
    if (input.alt && input.key === 'F4') {
      isAltF4 = true;
      hideWin();
      event.preventDefault();

      setTimeout(() => { isAltF4 = false; }, 100);
    }
  });

  ipcMain.on("TRAY-NAME", function (_, args) {
    TrayOwO.setToolTip(args);
  });

  ipcMain.on("GET-APP-INFO", function (_, args) {
    appIsReady = true;
    sendWindowInfo()
  });


  TrayOwO.on("click", () => {
    Main.focus();
  });

  TrayOwO.on("double-click", () => {
    if (Main.isVisible()) {
      hideWin();
    } else {
      showWin();
    }
  });

  const ReactList: [number, number][] = [
    [95, 2.5],
    [90, 5],
    [85, 7.5],
    [80, 10],
  ]
  const trayReactMenu: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = ReactList.map(e => ({
    label: `Reset Rect ${e[0]}`,
    click() {
      setWindowRact({
        height: e[0],
        width: e[0],
        top: e[1],
        left: e[1],
      })
    }
  }))

  TrayOwO.setContextMenu(Menu.buildFromTemplate([
    {
      label: "Show E621",
      click() {
        showWin();
      }
    },
    {
      type: 'separator'
    },
    ...trayReactMenu,
    {
      type: 'separator'
    },
    {
      label: "Hide",
      click() {
        hideWin();
      }
    },
    {
      label: "Quit",
      click() {
        showWin();
        Main.close();
      }
    },
    {
      label: "Quit ( force )",
      toolTip: "Force quit widthout any asking",
      click() { app.exit(1) },
    },
  ]));
});