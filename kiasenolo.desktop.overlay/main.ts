import { ipcRenderer } from 'electron';

const events = [
  "FOCUS-ON-IT",
  "AFK-MODE",
]

events.forEach(name => {
  ipcRenderer.on(name, (_, e) => {
    document.dispatchEvent(new CustomEvent(name, { detail: e }))
  })
})
