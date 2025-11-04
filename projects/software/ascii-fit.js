(function(){
  const _state = new WeakMap();
  function getState(el){
    let s = _state.get(el);
    if(!s){ s = { maxCols: 0, maxRows: 0 }; _state.set(el, s); }
    return s;
  }

  function initAscii(pre, opts={}){
    if(!pre) return;
    const colBuffer = Number(opts.colBuffer ?? pre.dataset.colBuffer ?? 2);
    const rowBuffer = Number(opts.rowBuffer ?? pre.dataset.rowBuffer ?? 0);
    const computeCols = () => {
      const lines = pre.textContent.split('\n');
      const maxCols = lines.reduce((m,l)=>Math.max(m, l.replace(/\r/g,'').replace(/\s+$/,'').length), 0);
      const st = getState(pre);
      st.maxCols = Math.max(st.maxCols, maxCols);
      pre.style.setProperty('--ascii-cols', String(Math.max(1, st.maxCols + colBuffer)));
      const maxRows = Math.max(1, lines.length);
      st.maxRows = Math.max(st.maxRows, maxRows);
      pre.style.setProperty('--ascii-rows', String(Math.max(1, st.maxRows + rowBuffer)));
    };
    const updateWidth = () => {
      const container = pre.closest('.container') || pre.parentElement;
  const cw = container && container.clientWidth ? container.clientWidth : window.innerWidth;
  const ch = container && container.clientHeight ? container.clientHeight : window.innerHeight;
  pre.style.setProperty('--ascii-container-w', cw + 'px');
  pre.style.setProperty('--ascii-container-h', ch + 'px');
    };
    computeCols();
    updateWidth();
    window.addEventListener('resize', updateWidth, { passive: true });
  }

  function onReady(){
  document.querySelectorAll('.ascii-title').forEach(el => initAscii(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

  // Public API for fitting arbitrary ASCII blocks (e.g., animated screen)
  window.asciiFit = {
    apply(pre, opts={}){
      if(!pre) return;
      const container = opts.container || pre.parentElement || document.body;
      const colBuffer = Number(opts.colBuffer ?? 2);
      const rowBuffer = Number(opts.rowBuffer ?? 0);
      let rafId = 0;
      const updateContentSize = () => {
        if (rafId) return; // coalesce per frame
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          const rect = pre.getBoundingClientRect();
          pre.style.setProperty('--ascii-content-w', rect.width + 'px');
          pre.style.setProperty('--ascii-content-h', rect.height + 'px');
          const root = document.documentElement;
          root.style.setProperty('--ascii-content-w', rect.width + 'px');
          root.style.setProperty('--ascii-content-h', rect.height + 'px');
        });
      };
      const measure = () => {
        const lines = (opts.text || pre.textContent || '').split('\n');
        const rows = opts.rows || Math.max(1, lines.length);
        const cols = opts.cols || Math.max(1, lines.reduce((m,l)=>Math.max(m, l.replace(/\r/g,'').replace(/\s+$/,'').length), 0));
        const st = getState(pre);
        st.maxRows = Math.max(st.maxRows, rows);
        st.maxCols = Math.max(st.maxCols, cols);
        pre.style.setProperty('--ascii-rows', String(st.maxRows + rowBuffer));
        pre.style.setProperty('--ascii-cols', String(st.maxCols + colBuffer));
        updateContentSize();
      };
      const updateWH = () => {
        const cw = container.clientWidth || window.innerWidth;
        const ch = container.clientHeight || window.innerHeight;
        pre.style.setProperty('--ascii-container-w', cw + 'px');
        pre.style.setProperty('--ascii-container-h', ch + 'px');
        updateContentSize();
      };
      if (!opts.rows || !opts.cols) measure();
      else {
        const st = getState(pre);
        st.maxRows = Math.max(st.maxRows, opts.rows);
        st.maxCols = Math.max(st.maxCols, opts.cols);
        pre.style.setProperty('--ascii-rows', String(st.maxRows + rowBuffer));
        pre.style.setProperty('--ascii-cols', String(st.maxCols + colBuffer));
        updateContentSize();
      }
      updateWH();
      if (opts.onResize !== false) {
        window.addEventListener('resize', updateWH, { passive: true });
      }
      return { update: () => { measure(); updateWH(); } };
    }
  };
})();
