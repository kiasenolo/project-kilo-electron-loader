import { ipcRenderer } from 'electron';

document.addEventListener("APP-ACTRON", (e: any) => {
  ipcRenderer.send("WINDOW", e.detail.ACT);
});

document.addEventListener("TRAY-NAME", (e: any) => {
  ipcRenderer.send("TRAY-NAME", e.detail.NAME);
});

document.addEventListener("APP-IS-READY", () => {
  ipcRenderer.send("GET-APP-INFO");
});

ipcRenderer.on("WIN-INFO", (_, e) => {
  document.dispatchEvent(new CustomEvent("APP-INFO", { detail: e }))
})