/** Opt-in, local-only measurements. Never changes the game viewport or saves. */
export function installViewportDebug(cameraAspect:()=>number) {
  const host=document.createElement('aside');
  host.id='viewport-debug';
  document.body.append(host);
  const shadow=host.attachShadow({mode:'open'});
  shadow.innerHTML=`<style>
    :host{position:fixed;z-index:2147483647;top:max(8px,env(safe-area-inset-top));left:max(8px,env(safe-area-inset-left));width:min(420px,calc(100% - env(safe-area-inset-left) - env(safe-area-inset-right) - 16px));color:#fff;background:#102824f5;border:1px solid #fff;border-radius:8px;font:14px/1.4 Arial,sans-serif;}
    *{box-sizing:border-box} summary{padding:10px;cursor:pointer} section{padding:0 10px 10px;max-height:65dvh;overflow:auto;touch-action:pan-y}
    pre{font:12px/1.45 monospace;white-space:pre-wrap;overflow-wrap:anywhere;margin:8px 0}
    button{font:inherit;padding:10px;min-height:44px;color:#102824;background:#f5ebc9;border:0;border-radius:6px;margin:2px}
    textarea{width:100%;height:110px;font:16px/1.4 monospace} p{margin:6px 0} [hidden]{display:none!important}
    .probe{position:fixed;visibility:hidden;pointer-events:none;width:0;top:0;left:0}
  </style><details open><summary>Viewport-Diagnose · v075-1</summary><section>
    <p>Werte bei sichtbarem Rand kopieren. Keine automatische Übertragung.</p>
    <pre id="values"></pre><button id="refresh">Aktualisieren</button><button id="copy">Werte kopieren</button>
    <p id="status" role="status"></p><textarea id="report" aria-label="Diagnose zum Kopieren" readonly hidden></textarea>
  </section></details>`;
  const probes=['vh','svh','dvh'].map(unit=>{
    const el=document.createElement('div');el.className='probe';el.style.height=`100${unit}`;shadow.append(el);return el;
  });
  const safe=document.createElement('div');safe.className='probe';
  safe.style.padding='env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';shadow.append(safe);
  const round=(n:number)=>Math.round(n*100)/100;
  function box(el:Element|null){
    if(!el)return null;
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);
    return {x:round(r.x),y:round(r.y),width:round(r.width),height:round(r.height),clientWidth:el.clientWidth,clientHeight:el.clientHeight,scrollWidth:el.scrollWidth,scrollHeight:el.scrollHeight,position:s.position,overflow:s.overflow,transform:s.transform};
  }
  const history:unknown[]=[];
  let report='',frame=0;
  function update(reason:string){
    const vv=window.visualViewport,canvas=document.querySelector<HTMLCanvasElement>('#world'),safeStyle=getComputedStyle(safe);
    const data={
      diagnostic:'v075-1',time:new Date().toISOString(),reason,
      page:location.origin+location.pathname,diagnosticBundle:import.meta.url,
      assets:Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'),el=>el.src).concat(Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),el=>el.href)),
      userAgent:navigator.userAgent,embedded:window.top!==window,
      displayMode:['standalone','fullscreen','minimal-ui'].find(mode=>matchMedia(`(display-mode: ${mode})`).matches)||'browser',
      window:{innerWidth,innerHeight,outerWidth,outerHeight,devicePixelRatio,scrollX,scrollY},
      visualViewport:vv?{width:round(vv.width),height:round(vv.height),offsetTop:round(vv.offsetTop),offsetLeft:round(vv.offsetLeft),scale:vv.scale}:null,
      screen:{width:screen.width,height:screen.height,orientation:screen.orientation?.type,angle:screen.orientation?.angle,landscape:matchMedia('(orientation: landscape)').matches},
      html:box(document.documentElement),body:box(document.body),app:box(document.getElementById('app')),
      canvas:box(canvas),buffer:canvas?{width:canvas.width,height:canvas.height}:null,cameraAspect:cameraAspect(),
      start:box(document.getElementById('start')),startContent:box(document.querySelector('.start-copy')),
      viewportUnits:Object.fromEntries(probes.map((el,i)=>[['vh','svh','dvh'][i],round(el.getBoundingClientRect().height)])),
      safeArea:{top:safeStyle.paddingTop,right:safeStyle.paddingRight,bottom:safeStyle.paddingBottom,left:safeStyle.paddingLeft},
      gameScale:getComputedStyle(document.documentElement).getPropertyValue('--game-scale'),
      serviceWorker:navigator.serviceWorker?.controller?.scriptURL||null,
    };
    history.push({time:data.time,reason,window:data.window,visualViewport:data.visualViewport,app:data.app,canvas:data.canvas});
    if(history.length>8)history.shift();
    report=JSON.stringify({...data,recent:history},null,2);
    shadow.querySelector('#values')!.textContent=[
      `${data.page}\n${data.assets.map(url=>url.split('/').pop()).join(' · ')}`,
      `window innen ${innerWidth} × ${innerHeight} / außen ${outerWidth} × ${outerHeight}`,
      `visualViewport ${vv?`${round(vv.width)} × ${round(vv.height)}, top ${round(vv.offsetTop)}, scale ${round(vv.scale)}`:'nicht verfügbar'}`,
      `html clientHeight ${data.html?.clientHeight} / body Höhe ${data.body?.height}`,
      `app ${data.app?.width} × ${data.app?.height} / canvas ${data.canvas?.width} × ${data.canvas?.height}`,
      `Puffer ${canvas?.width} × ${canvas?.height} / Kamera ${round(data.cameraAspect)}`,
      `vh / svh / dvh: ${Object.values(data.viewportUnits).join(' / ')}`,
      `${data.screen.landscape?'Querformat':'Hochformat'} · ${data.displayMode} · ${reason}`,
    ].join('\n');
  }
  // Event-driven and debug-only; no polling and no game resize handler.
  const schedule=(event:Event)=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;update(event.type);});};
  for(const name of ['resize','orientationchange','pageshow'])window.addEventListener(name,schedule);
  document.addEventListener('visibilitychange',schedule);
  window.visualViewport?.addEventListener('resize',schedule);
  window.visualViewport?.addEventListener('scroll',schedule);
  const observer=new ResizeObserver(()=>{if(!frame)frame=requestAnimationFrame(()=>{frame=0;update('container');});});
  for(const id of ['app','world']){const el=document.getElementById(id);if(el)observer.observe(el);}
  shadow.querySelector<HTMLButtonElement>('#refresh')!.onclick=()=>update('manuell');
  shadow.querySelector<HTMLButtonElement>('#copy')!.onclick=async()=>{
    update('kopieren');
    const text=shadow.querySelector<HTMLTextAreaElement>('#report')!,status=shadow.querySelector('#status')!;
    text.value=report;
    try{await navigator.clipboard.writeText(report);status.textContent='Kopiert. Bitte im Chat einfügen.';text.hidden=true;}
    catch{text.hidden=false;text.focus();text.select();status.textContent='Text gedrückt halten und kopieren.';}
  };
  update('geladen');
}
