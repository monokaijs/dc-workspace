// wv-preload.ts
import { ipcRenderer, webFrame } from 'electron';

const SHIM = `
(() => {
  if (window.__wvBridgeInitialized) return;
  window.__wvBridgeInitialized = true;

  function emit(type, detail){ try{ window.postMessage({__wvNotifyBridge:true,type,detail}, '*'); }catch{} }

  // 1) Intercept window.Notification
  const Original = window.Notification;
  class InterceptedNotification {
    static get permission(){ return 'granted'; }
    static requestPermission(cb){ cb && cb('granted'); return Promise.resolve('granted'); }
    static get maxActions(){ return Original?.maxActions ?? 0; }
    constructor(title, options = {}) {
      emit('page-notification', { url: location.href, title, options });
      queueMicrotask(() => this.onshow?.(new Event('show')));
    }
    onclick=null; onclose=null; onerror=null; onshow=null;
    close(){ this.onclose?.(new Event('close')); }
    addEventListener(){} removeEventListener(){} dispatchEvent(){ return false; }
  }
  try { Object.defineProperty(window, 'Notification', { configurable:false, writable:false, value: InterceptedNotification }); } catch {}

  // 2) Intercept SW showNotification
  if (window.ServiceWorkerRegistration) {
    const p = window.ServiceWorkerRegistration.prototype;
    const orig = p.showNotification;
    if (orig) {
      Object.defineProperty(p, 'showNotification', {
        configurable: true,
        writable: true,
        value: function(title, options = {}) {
          emit('sw-notification', { url: location.href, title, options });
          return Promise.resolve();
        }
      });
    }
  }
})();
`;

webFrame.executeJavaScriptInIsolatedWorld(0, [{ code: SHIM }]);

window.addEventListener('message', (ev: any) => {
  if (!(ev).data.__wvNotifyBridge) return;
  const { type, detail } = ev.data;
  ipcRenderer.sendToHost('webview:notification', { source: type, ...detail });
});
