import { contextBridge, ipcRenderer, webFrame } from 'electron';

export interface MenuItemSpec {
  id?: string;
  label?: string;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
  role?: string;
  accelerator?: string;
  enabled?: boolean;
  visible?: boolean;
  checked?: boolean;
  submenu?: MenuItemSpec[];
}

export type WindowAction = 'MINI' | 'MAXI' | 'RSTR' | 'HIDE' | 'CLOSE' | 'KILL';

const dispatchToPage = (name: string, detail: unknown) => {
  const code = `document.dispatchEvent(new CustomEvent(${JSON.stringify(name)}, { detail: ${JSON.stringify(detail)} }));`;
  webFrame.executeJavaScript(code).catch((err) => {
    console.error(`dispatch ${name} failed:`, err);
  });
};

ipcRenderer.on('WIN-INFO', (_, info) => dispatchToPage('APP-INFO', info));
ipcRenderer.on('MENU-CLICK', (_, info) => dispatchToPage('APP-MENU-CLICK', info));

contextBridge.exposeInMainWorld('electronAPI', {
  setMenu: (template: MenuItemSpec[] | null) => {
    ipcRenderer.send('MENU-SET', template);
  },
  windowAction: (act: WindowAction) => {
    ipcRenderer.send('WINDOW', act);
  },
  setTrayName: (name: string) => {
    ipcRenderer.send('TRAY-NAME', name);
  },
  appReady: () => {
    ipcRenderer.send('GET-APP-INFO');
  },
});