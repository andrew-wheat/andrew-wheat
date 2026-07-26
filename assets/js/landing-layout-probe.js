(() => {
  const samples = [];
  const shifts = [];
  const state = document.createElement("script");
  state.id = "landing-layout-probe-state";
  state.type = "application/json";
  state.hidden = true;
  document.currentScript.after(state);
  const publish = () => {
    state.textContent = JSON.stringify({ samples, shifts });
  };
  publish();
  try {
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) =>
        shifts.push({
          t: entry.startTime,
          value: entry.value,
          recentInput: entry.hadRecentInput,
        })
      );
      publish();
    }).observe({ type: "layout-shift", buffered: true });
  } catch {}

  const started = performance.now();
  const sample = () => {
    const pick = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
    };
    samples.push({
      t: performance.now() - started,
      width: innerWidth,
      height: innerHeight,
      fonts: document.fonts?.status || "",
      ready: document.readyState,
      header: pick(".site-header"),
      brand: pick(".brand"),
      nav: pick(".site-nav"),
      stage: pick(".minimal-landing"),
      image: pick(".minimal-landing-visual"),
      content: pick(".minimal-landing-content"),
    });
    publish();
    if (performance.now() - started < 2800) requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
})();
