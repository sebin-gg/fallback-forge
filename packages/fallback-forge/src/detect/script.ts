import type { ResolvedConfig } from '../types.js';

export interface DetectOptions {
  /** Routes that have a companion page. */
  routes: string[];
}

/**
 * Inline script injected at the top of <head>, before the app bundle. Plain
 * ES5, no dependencies, wrapped in try/catch so a missing API can never break
 * the full site. Signals, in order: manual override (`?lite=1|0`, remembered
 * choice), Save-Data, effectiveType, downlink, rtt, and finally a slow-load
 * timer that fires if `window.load` has not happened in time.
 */
export function detectScript(cfg: ResolvedConfig, opts: DetectOptions): string {
  const d = cfg.detection;
  const settings = JSON.stringify({
    base: cfg.companionBase,
    param: d.queryParam,
    key: d.storageKey,
    saveData: d.saveData,
    types: d.effectiveTypes,
    maxDown: d.maxDownlinkMbps,
    minRtt: d.minRttMs,
    slowLoad: d.slowLoadMs,
    routes: opts.routes,
  });
  return (
    `(function(){try{var c=${settings};` +
    'var p=location.pathname;if(p===c.base||p.indexOf(c.base+"/")===0)return;' +
    'var r=p.replace(/\\/+$/,"")||"/";' +
    'var q=new URLSearchParams(location.search).get(c.param);var s=null;' +
    'try{s=localStorage.getItem(c.key)}catch(e){}' +
    'function remember(v){try{localStorage.setItem(c.key,v)}catch(e){}}' +
    'function lite(route){return c.base+(route==="/"?"/":route+"/")}' +
    'function go(reason){remember("lite");location.replace(lite(r)+"?ff="+reason+location.hash)}' +
    'if(q==="0"){remember("full");return}' +
    'document.addEventListener("DOMContentLoaded",function(){var a=document.querySelector("[data-ff-switch]");if(!a)return;' +
    'a.addEventListener("click",function(ev){ev.preventDefault();var cur=location.pathname.replace(/\\/+$/,"")||"/";remember("lite");' +
    'location.href=c.routes.indexOf(cur)!==-1?lite(cur):c.base+"/"})});' +
    'if(c.routes.indexOf(r)===-1)return;' +
    'if(q==="1"||s==="lite")return go("manual");' +
    'if(s==="full")return;' +
    'var n=navigator.connection||navigator.mozConnection||navigator.webkitConnection;' +
    'if(n){if(c.saveData&&n.saveData)return go("save-data");' +
    'if(n.effectiveType&&c.types.indexOf(n.effectiveType)!==-1)return go("effective-type");' +
    'if(typeof n.downlink==="number"&&n.downlink>0&&n.downlink<=c.maxDown)return go("downlink");' +
    'if(typeof n.rtt==="number"&&n.rtt>=c.minRtt)return go("rtt")}' +
    'if(c.slowLoad>0){var t=setTimeout(function(){go("slow-load")},c.slowLoad);' +
    'window.addEventListener("load",function(){clearTimeout(t)})}' +
    '}catch(e){}})();'
  );
}

/** Small fixed link so visitors can choose the lightweight version themselves. */
export function manualSwitchLink(companionBase: string): {
  href: string;
  style: string;
  text: string;
} {
  return {
    href: `${companionBase}/`,
    style:
      'position:fixed;bottom:.5rem;right:.5rem;z-index:2147483647;font:14px system-ui,sans-serif;' +
      'background:#111;color:#fff;padding:.4rem .7rem;border-radius:999px;text-decoration:none;opacity:.85',
    text: 'Lightweight version',
  };
}
