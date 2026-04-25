import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  invoke: (channel: string, ...args: unknown[]) => {
    const validChannels = [
      'device:list',
      'device:connect',
      'device:disconnect',
      'cdp:screencast:start',
      'cdp:screencast:stop',
      'cdp:input:click',
      'cdp:input:type',
      'cdp:input:scroll',
      'cdp:network:enable',
      'cdp:console:evaluate',
      'cdp:dom:getDocument',
      'package:list',
      'package:install',
      'package:uninstall',
      'package:clear',
      'testcase:crud',
      'testcase:execute',
      'testcase:record:start',
      'testcase:record:stop',
      'log:stream',
      'config:get',
      'config:set',
      'plugin:crud',
      'portproxy:crud',
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`Invalid IPC channel: ${channel}`));
  },

  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const validChannels = [
      'device:changed',
      'cdp:screencast:frame',
      'cdp:network:request',
      'testcase:record:step',
      'log:stream',
      'config:changed',
    ];
    if (validChannels.includes(channel)) {
      const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
    return () => {};
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
