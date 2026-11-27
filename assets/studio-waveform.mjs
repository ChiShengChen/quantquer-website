const canvas = document.getElementById('spectrum');
const ctx = canvas?.getContext('2d');
if (ctx) mountWaveform();

function mountWaveform() {
  // ---- spectrum / signal motif ----
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let W=0,H=0,dpr=1, scrollY=0;
  let waveformVisible = true;
  let animationFrame = null;
  let psdProfile, signalProfile, psdGradient;
  // theme-aware colors (re-read on theme switch)
  let accent='#2DD4BF', gridColor='rgba(255,255,255,0.035)', axisColor='rgba(255,255,255,0.06)';
  function readColors(){
    const cs = getComputedStyle(document.documentElement);
    accent    = (cs.getPropertyValue('--accent').trim()      || accent);
    gridColor = (cs.getPropertyValue('--canvas-grid').trim() || gridColor);
    axisColor = (cs.getPropertyValue('--canvas-axis').trim() || axisColor);
  }
  readColors();

  function resize(){
    dpr = Math.min(2, window.devicePixelRatio||1);
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = Math.round(W*dpr); canvas.height = Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    psdProfile = new Float64Array(Math.floor(W / 3) + 1);
    signalProfile = new Float64Array(Math.floor(W) + 1);
    for (let x = 0; x <= W; x += 3) {
      const u = x / W;
      psdProfile[x / 3] = gauss(u,0.20,0.045)*0.55 + gauss(u,0.50,0.085)*1.0 + gauss(u,0.79,0.05)*0.42;
    }
    for (let x = 0; x <= W; x++) signalProfile[x] = gauss(x / W, 0.5, 0.46);
    updateGradient();
  }

  function updateGradient() {
    const base = H * 0.60;
    psdGradient = ctx.createLinearGradient(0, base - H * 0.22, 0, base);
    psdGradient.addColorStop(0, accent + '16');
    psdGradient.addColorStop(1, accent + '00');
  }
  const gauss = (u,mu,s)=>Math.exp(-Math.pow((u-mu)/s,2)/2);

  function draw(t){
    ctx.clearRect(0,0,W,H);
    const sn = Math.min(1, scrollY / Math.max(1,H));   // 0..1 scroll within hero
    const base = H*0.60;
    const par = scrollY*0.06;                            // parallax drift

    // --- frequency grid (vertical) ---
    ctx.lineWidth = 1;
    ctx.strokeStyle = gridColor;
    const step = Math.max(70, W/14);
    for(let x=step; x<W; x+=step){
      ctx.beginPath(); ctx.moveTo(x, H*0.16); ctx.lineTo(x, H*0.92); ctx.stroke();
    }
    // --- baseline axis ---
    ctx.strokeStyle = axisColor;
    ctx.beginPath(); ctx.moveTo(0, base - par); ctx.lineTo(W, base - par); ctx.stroke();

    // --- PSD envelope (filled, with peaks) ---
    ctx.beginPath();
    ctx.moveTo(0, base - par);
    const breathe = 0.92 + 0.08*Math.sin(t*0.0006);
    for(let x=0; x<=W; x+=3){
      const psd = psdProfile[x / 3] * breathe;
      const yy = (base - par) - psd*H*0.155*(1 - sn*0.5);
      ctx.lineTo(x, yy);
    }
    ctx.lineTo(W, base - par); ctx.closePath();
    ctx.fillStyle = psdGradient; ctx.fill();
    ctx.strokeStyle = accent+'29'; ctx.lineWidth = 1; ctx.stroke();   // ~16% alpha

    // --- live signal trace ---
    const amp = H*0.115 * (1 - sn*0.45);
    ctx.beginPath();
    for(let x=0; x<=W; x+=2){
      const u = x/W;
      let y = Math.sin(u*4.2  + t*0.00045)*0.62
            + Math.sin(u*9.3  + t*0.00075)*0.46
            + Math.sin(u*21.0 - t*0.00095)*0.24
            + Math.sin(u*46.0 + t*0.00130)*0.11;
      const env = signalProfile[x];           // taper at edges
      const yy = (base - par) - y*amp*env;
      x===0 ? ctx.moveTo(x,yy) : ctx.lineTo(x,yy);
    }
    ctx.strokeStyle = accent; ctx.lineWidth = 1.6; ctx.stroke();

    // soft second harmonic ghost
    ctx.beginPath();
    for(let x=0; x<=W; x+=3){
      const u = x/W;
      let y = Math.sin(u*6.5 - t*0.0005)*0.5 + Math.sin(u*15 + t*0.0009)*0.3;
      const env = signalProfile[x];
      const yy = (base - par) - y*amp*0.55*env + 14;
      x===0 ? ctx.moveTo(x,yy) : ctx.lineTo(x,yy);
    }
    ctx.strokeStyle = accent+'38'; ctx.lineWidth = 1; ctx.stroke();   // ~22% alpha
  }

  function frame(t){
    draw(t);
    animationFrame = requestAnimationFrame(frame);
  }

  function updateWaveform(){
    if(waveformVisible && !document.hidden && !reducedMotion.matches){
      if(animationFrame === null) animationFrame = requestAnimationFrame(frame);
      return;
    }
    if(animationFrame !== null){
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    if(waveformVisible && !document.hidden && reducedMotion.matches) draw(0);
  }

  window.addEventListener('resize', ()=>{
    resize();
    updateWaveform();
  }, {passive:true});
  window.addEventListener('scroll', ()=>{ scrollY = window.scrollY; }, {passive:true});
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      waveformVisible = entry.isIntersecting;
      updateWaveform();
    }).observe(canvas);
  }
  document.addEventListener('visibilitychange', updateWaveform);
  reducedMotion.addEventListener('change', updateWaveform);
  resize();
  updateWaveform();

  document.addEventListener('quantquer:themechange', ()=>{
    readColors();
    updateGradient();
    updateWaveform();
  });
}
