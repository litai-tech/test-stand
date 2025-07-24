import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    console.log('preload called')
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)

    contextBridge.exposeInMainWorld('serialAPI', {
      list: () => ipcRenderer.invoke('serial:list'),
      open: (path, baudRate) => ipcRenderer.invoke('serial:open', path, baudRate),
      write: (data) => ipcRenderer.invoke('serial:write', data),
      onData: (callback) => {
        ipcRenderer.removeAllListeners('serial:data'); // avoid multiple listeners
        ipcRenderer.on('serial:data', (_event, data) => callback(data));
      },
    });

    contextBridge.exposeInMainWorld('fileAPI', {
      appendLine: (filePath, line) => ipcRenderer.send('append-line', filePath, line),
    });
  } catch (error) {
    console.error(error)
  }
} else {
  console.log('b')
  window.electron = electronAPI
  window.api = api
  window.test = "a"
}
