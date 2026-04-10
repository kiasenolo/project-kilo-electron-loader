import { app, BrowserWindow, ipcMain, Menu, Tray, screen } from 'electron';
import { uIOhook, UiohookKeyboardEvent } from 'uiohook-napi';
import path from "path"
import { setAppInfo } from '@kiase/base.config';

const baseURL = "http://127.0.0.1:9487/_LABS/DesktopOverlay";
const iconPath = "icon.png";
const appName = "Desktop Overlay";

setAppInfo(app, {
  appID: "kiasenolo.desktop.overlay",
  appName: "Desktop-Overlay"
})

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
      preload: path.join(__dirname, 'main.js')
    },
  });

  const hideWin = () => { Main.hide(); }
  const showWin = () => { Main.show(); Main.focus(); }
  Main.setVisibleOnAllWorkspaces(true)
  Main.setAlwaysOnTop(true, 'pop-up-menu');
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
      label: "Exit",
      click() {
        uIOhook.stop()
        app.exit(0)
      },
    }
  ]))


  let AFKMode = false;

  const setAFKMode = (tar: boolean) => {
    AFKMode = tar;
    Main.webContents.send("AFK-MODE", tar);
    // Main.setIgnoreMouseEvents(!tar)
  }

  const keyEvent = (e: UiohookKeyboardEvent) => {
    const _ = !(e.metaKey && e.altKey)
    Main.setIgnoreMouseEvents(_)
    Main.webContents.send("FOCUS-ON-IT", !_)
  }

  uIOhook.on('keydown', keyEvent);
  uIOhook.on('keyup', keyEvent);

  uIOhook.on('keydown', (e) => {
    if (e.altKey && e.ctrlKey && e.keycode === 37) {
      setAFKMode(!AFKMode)
    }
  });

  uIOhook.start()

  Main.on("close", () => {
    uIOhook.stop()
  })
});