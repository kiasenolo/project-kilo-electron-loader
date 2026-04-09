import { app, BrowserWindow, ipcMain, Menu, Tray, screen } from 'electron';
import path from 'path';
import { uIOhook } from 'uiohook-napi';

const baseURL = "http://127.0.0.1:9487/_LABS/DesktopOverlay";
const iconPath = "icon.png";
const appName = "Desktop Overlay";
app.setName("Desktop-Overlay");
app.setAppUserModelId("kiasenolo.desktop.overlay");

app.whenReady().then(() => {
  app.commandLine.appendSwitch('enable-gpu');
  app.commandLine.appendSwitch('ignore-gpu-blocklist');

  const TrayOwO = new Tray(iconPath);
  const Main = new BrowserWindow({
    alwaysOnTop: true,
    autoHideMenuBar: true,
    frame: false,
    transparent: true,
    resizable: true,
    icon: iconPath,
    minimizable: false,
    fullscreen: true,
    title: appName,
    // opacity: .7,
    webPreferences: {
      webSecurity: false,
    },
  });

  const hideWin = () => { Main.hide(); }
  const showWin = () => { Main.show(); Main.focus(); }

  Main.setAlwaysOnTop(true, 'screen-saver');
  Main.setSkipTaskbar(true)
  Main.setIgnoreMouseEvents(true)
  Main.loadURL(baseURL + "?NONE_BACKGROUND");

  TrayOwO.setTitle(appName)

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

  TrayOwO.setContextMenu(Menu.buildFromTemplate([
    {
      label: "Reload",
      click() {
        Main.loadURL(baseURL + "?NONE_BACKGROUND");
      },
    }
  ]))

  uIOhook.on('keydown', (event) => {
    if (event.keycode === 56 || event.keycode === 3640) {
    }
  });

  uIOhook.on('keyup', (event) => {
    if (event.keycode === 56 || event.keycode === 3640) {
    }
  });

  uIOhook.start()

  Main.on("close", () => {
    uIOhook.stop()
  })

});