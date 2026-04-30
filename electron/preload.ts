import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  invoke: (channel: string, ...args: unknown[]) => {
    const validChannels = [
      'device:list',
      'device:connect',
      'device:disconnect',
      'debug:cdpStatus',
      'debug:listTargets',
      'debug:listProcesses',
      'debug:listSockets',
      'debug:listAllProcesses',
      'debug:queryJsonViaShell',
      'cdp:screencast:start',
      'cdp:screencast:stop',
      'cdp:input:click',
      'cdp:input:type',
      'cdp:input:scroll',
      'cdp:network:enable',
      'cdp:console:evaluate',
      'cdp:dom:getDocument',
      'cdp:dom:querySelector',
      'cdp:dom:getAttributes',
      'cdp:dom:resolveNode',
      'cdp:dom:getElements',
      'package:list',
      'package:install',
      'package:uninstall',
      'package:clear',
      'testcase:list',
      'testcase:get',
      'testcase:create',
      'testcase:update',
      'testcase:delete',
      'testcase:execute',
      'testcase:record:start',
      'testcase:record:stop',
      'log:stream',
      'config:get',
      'config:set',
      'plugin:crud',
      'portproxy:crud',
      'network:intercept:set-enabled',
      'network:intercept:get-enabled',
      'network:intercept:set-rules',
      'network:intercept:get-rules',
      'console:override:list',
      'console:override:create',
      'console:override:update',
      'console:override:delete',
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
      'cdp:network:response',
      'cdp:network:response-body',
      'cdp:network:event',
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
