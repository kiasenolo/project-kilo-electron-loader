import path from 'path';

export type AppInfo = {
  appName: string,
  appID: string,
}

export const setAppInfo = (app: Electron.App, info: AppInfo) => {
  const authorName = "KIASENOLO";
  app.setName(info.appName);
  app.setAppUserModelId(info.appID);
  const appDataPath = app.getPath('appData');
  const newUserDataPath = path.join(appDataPath, authorName, app.getName());
  app.setPath('userData', newUserDataPath);
}
