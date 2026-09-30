import { app, BrowserWindow, ipcMain, Menu, Tray, shell, contextBridge, MenuItemConstructorOptions } from 'electron';
import path from 'path';
import { setAppInfo } from '@kiase/base.config';

const baseURL = "http://127.0.0.1:9487/_LABS/E621-API";
const iconPath = "icon.png";

setAppInfo(app, {
  appID: "kiasenolo.e621.app",
  appName: "E621-Desktop-App"
})

app.whenReady().then(() => {
  app.commandLine.appendSwitch('enable-gpu');
  app.commandLine.appendSwitch('ignore-gpu-blocklist');

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
      preload: path.join(__dirname, 'main.js'),
      webSecurity: false,
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
    if (!Main) return;

    const data = {
      id: Main.id,
      isFocused: Main.isFocused(),
      isFullScreen: Main.isFullScreen(),
      isMinimized: Main.isMinimized(),
      isMaximized: Main.isMaximized(),
    }
    Main.webContents.send("WIN-INFO", data)
  }

  Main.on("blur", sendWindowInfo)
  Main.on("focus", sendWindowInfo)
  Main.on("maximize", sendWindowInfo)
  Main.on("restore", sendWindowInfo)
  Main.on("unmaximize", sendWindowInfo)
  Main.on("minimize", sendWindowInfo)
  Main.on("enter-full-screen", sendWindowInfo)
  Main.on("leave-full-screen", sendWindowInfo)

  type templateType = (Electron.MenuItemConstructorOptions | Electron.MenuItem)[]

  const defaultMenu: MenuItemConstructorOptions[] = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const buildItems = (list: any, depth = 0): MenuItemConstructorOptions[] => {
    if (!Array.isArray(list) || depth > 5) return [];

    return list.filter(i => i && typeof i === 'object').map((i): MenuItemConstructorOptions => {
      const item: MenuItemConstructorOptions = {};

      if (typeof i.label === 'string') item.label = i.label;
      if (typeof i.type === 'string') item.type = i.type;
      if (typeof i.role === 'string') item.role = i.role as any;
      if (typeof i.accelerator === 'string') item.accelerator = i.accelerator;
      if (typeof i.enabled === 'boolean') item.enabled = i.enabled;
      if (typeof i.visible === 'boolean') item.visible = i.visible;
      if (typeof i.checked === 'boolean') item.checked = i.checked;
      if (Array.isArray(i.submenu)) item.submenu = buildItems(i.submenu, depth + 1);

      if (typeof i.id === 'string' && !item.role && !item.submenu && item.type !== 'separator') {
        const id = i.id;
        item.click = (menuItem) => {
          Main.webContents.send("MENU-CLICK", {
            id,
            label: menuItem.label,
            type: menuItem.type,
            checked: menuItem.checked,
          });
        };
      }

      return item;
    });
  };

  const applyMenu = (template: MenuItemConstructorOptions[]) =>
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  applyMenu(defaultMenu);

  ipcMain.on("MENU-SET", (_, template) => {
    try {
      applyMenu(template == null ? defaultMenu : buildItems(template));
    } catch (err) {
      console.error("MENU-SET failed:", err);
    }
  });

  contextBridge.exposeInMainWorld('electronAPI', {
    setMenu: (menu?: templateType) => {
      Menu.setApplicationMenu(Menu.buildFromTemplate(menu ?? defaultMenu));
    }
  })

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

  TrayOwO.setContextMenu(Menu.buildFromTemplate([
    {
      label: "Show E621",
      click() {
        showWin();
      }
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