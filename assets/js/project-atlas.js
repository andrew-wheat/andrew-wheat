(function () {
  const canvas = document.querySelector("[data-project-atlas-canvas]");
  const overlay = document.querySelector("[data-project-atlas-overlay]");
  const preview = document.querySelector("[data-project-atlas-preview]");
  const panel = document.querySelector("[data-project-atlas-panel]");
  const list = document.querySelector("[data-project-atlas-list]");
  const stage = document.querySelector("[data-project-atlas-stage]");
  if (!canvas || !overlay || !preview || !panel || !list || !stage) return;

  const ctx = canvas.getContext("2d");
  const webglCanvas = document.createElement("canvas");
  webglCanvas.className = "atlas-webgl-canvas";
  webglCanvas.setAttribute("aria-hidden", "true");
  stage.insertBefore(webglCanvas, canvas);
  const webglLayer = createWebglLandLayer(webglCanvas);
  const TAU = Math.PI * 2;
  const AXIAL_TILT_DEG = 23.44;
  const AXIAL_TILT_RAD = AXIAL_TILT_DEG * Math.PI / 180;
  const AXIAL_TILT_LEAN = 1;
  const VIEW_STATES = {
    FAR_GLOBE: "FAR_GLOBE",
    REGIONAL: "REGIONAL",
    SITE_APPROACH: "SITE_APPROACH",
    LOCAL_SITE: "LOCAL_SITE"
  };
  const GLOBAL_DOT_CAP = 20000;
  const LOCAL_FEATURE_POINT_CAP = 75000;
  const LOCAL_POINT_CLOUD_CAP = 75000;
  const atlasToProjectSlug = {
    "hunters-point-housing": "hunters-point"
  };
  const projectToAtlasSlug = {
    "hunters-point": "hunters-point-housing"
  };
  const projectImages = {
    "enfield-food-pantry": "assets/images/work-covers/enfield-food-pantry.webp",
    "deconstruct-reconfigure": "assets/images/work-covers/deconstruct-reconfigure.webp",
    "borinquen-healing-center": "assets/images/work-covers/borinquen-healing-center.webp",
    "a-chair-is-a-toy": "assets/images/work-covers/chair is a toy.jpg",
    "design-district-canteen": "assets/images/work-covers/design-district-canteen.webp",
    "hunters-point-housing": "assets/images/work-covers/hunters-point.webp",
    "curanto-cookhouse": "assets/images/work-covers/curanto-cookhouse.webp",
    "york-prize": "assets/images/work-covers/york-prize.webp",
    "wood-street-pool": "assets/images/work-covers/wood-street-pool.webp",
    "woven-pavilion": "assets/images/work-covers/woven-pavilion.webp",
    "sustainable-education": "assets/images/work-covers/sustainable-education-nepal.webp"
  };
  const siteGeojsonSlugs = new Set([
    "enfield-food-pantry",
    "borinquen-healing-center",
    "design-district-canteen",
    "hunters-point-housing",
    "curanto-cookhouse",
    "wood-street-pool",
    "sustainable-education"
  ]);

  const state = {
    width: 0,
    height: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    yaw: -0.55,
    pitch: 0,
    targetYaw: -0.55,
    targetPitch: 0,
    zoom: 0.95,
    targetZoom: 0.95,
    velocityYaw: 0,
    velocityPitch: 0,
    mode: "globe",
    viewState: VIEW_STATES.FAR_GLOBE,
    localPanX: 0,
    localPanY: 0,
    localZoom: 1,
    targetLocalZoom: 1,
    dragging: false,
    pointer: null,
    pointers: new Map(),
    pinchDistance: 0,
    pinchZoom: 1,
    projects: [],
    resolved: [],
    active: null,
    localSite: null,
    highlightedCallout: null,
    filterSlugs: null,
    previewProject: null,
    lastTouchPreviewSlug: "",
    lastInteraction: Date.now(),
    reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    globalLandDots: [],
    globalLandDotsReady: false,
    webglLandReady: false,
    globalLandDotsWarned: false,
    siteManifest: new Map(),
    pointCloudManifest: new Map(),
    geojsonCache: new Map(),
    pointCloudCache: new Map(),
    enablePointCloudContext: stage.hasAttribute("data-project-atlas-pointcloud"),
    isInView: true,
    lastLod: -1,
    localDrawBudget: LOCAL_FEATURE_POINT_CAP,
    pins: new Map()
  };

  Promise.all([
    fetch("assets/data/project-atlas.json").then((response) => {
      if (!response.ok) throw new Error("Could not load project-atlas.json");
      return response.json();
    }),
    loadGlobalLandDots(),
    loadSiteManifest(),
    loadPointCloudManifest()
  ])
    .then(([projects]) => {
      state.projects = projects;
      state.resolved = resolveProjects(projects);
      state.active = state.resolved.find((project) => project.atlasType === "sited") || state.resolved[0] || null;
      if (typeof state.active?.resolvedLng === "number") {
        state.yaw = -state.active.resolvedLng * Math.PI / 180;
        state.targetYaw = state.yaw;
      }
      renderList(projects);
      renderPins();
      renderProjectPanel(state.active);
      resize();
      window.requestAnimationFrame(tick);
    })
    .catch(() => {
      panel.innerHTML = '<p class="atlas-fallback">Atlas data could not load. Use the linked project list below.</p>';
    });

  preview.addEventListener("click", (event) => {
    const action = event.target instanceof Element ? event.target.closest("[data-preview-open-local]") : null;
    if (!action || !state.previewProject) return;
    event.preventDefault();
    event.stopPropagation();
    if (state.previewProject.atlasType === "sited") openLocalSite(state.previewProject);
    else selectProject(state.previewProject);
  });

  async function loadGlobalLandDots() {
    try {
      const response = await fetch("assets/data/atlas-global-land-dots.json");
      if (!response.ok) throw new Error("Global land dots missing");
      const dots = await response.json();
      state.globalLandDots = Array.isArray(dots) ? dots.filter((dot) =>
        Number.isFinite(dot.lat) && Number.isFinite(dot.lng)
      ).slice(0, GLOBAL_DOT_CAP) : [];
      state.globalLandDotsReady = state.globalLandDots.length > 0;
      state.webglLandReady = uploadWebglLandDots();
      if (!state.globalLandDotsReady) {
        console.warn("Atlas global land halftone data is empty. TODO: run npm run atlas:data.");
      }
    } catch (error) {
      state.globalLandDots = [];
      state.globalLandDotsReady = false;
      state.webglLandReady = false;
      console.warn(`Atlas global land halftone data could not load. TODO: run npm run atlas:data. ${error.message}`);
    }
  }

  async function loadSiteManifest() {
    try {
      const response = await fetch("assets/data/site-geojson/manifest.json");
      if (!response.ok) throw new Error("Site GeoJSON manifest missing");
      const manifest = await response.json();
      state.siteManifest = new Map((Array.isArray(manifest) ? manifest : []).map((entry) => [entry.slug, entry]));
    } catch {
      state.siteManifest = new Map();
    }
  }

  async function loadPointCloudManifest() {
    if (!state.enablePointCloudContext) return;
    try {
      const response = await fetch("assets/data/site-pointcloud/manifest.json");
      if (!response.ok) throw new Error("Site point-cloud manifest missing");
      const manifest = await response.json();
      state.pointCloudManifest = new Map((Array.isArray(manifest) ? manifest : []).map((entry) => [entry.slug, entry]));
    } catch {
      state.pointCloudManifest = new Map();
    }
  }

  function createWebglLandLayer(targetCanvas) {
    const gl = targetCanvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      powerPreference: "low-power"
    });
    if (!gl) return null;

    const vertexSource = `
      attribute vec4 aDot;
      uniform float uYaw;
      uniform float uRadius;
      uniform float uWidth;
      uniform float uHeight;
      uniform float uDpr;
      uniform float uLod;
      uniform float uTilt;
      uniform vec2 uCenter;
      varying float vAlpha;
      const float PI = 3.141592653589793;
      void main() {
        float phi = aDot.x * PI / 180.0;
        float theta = aDot.y * PI / 180.0 + uYaw;
        float cosPhi = cos(phi);
        float x = cosPhi * sin(theta);
        float y = sin(phi);
        float z = cosPhi * cos(theta);
        float tiltCos = cos(uTilt);
        float tiltSin = sin(uTilt);
        float screenX = x * tiltCos + y * tiltSin;
        float screenY = -x * tiltSin + y * tiltCos;
        vec2 pixel = uCenter + vec2(screenX * uRadius, -screenY * uRadius);
        vec2 clip = vec2(pixel.x / uWidth * 2.0 - 1.0, 1.0 - pixel.y / uHeight * 2.0);
        float depth = clamp((z + 1.0) / 2.0, 0.12, 1.0);
        float lodScale = uLod < 0.5 ? 1.45 : (uLod < 1.5 ? 1.1 : 0.78);
        float visible = step(-0.08, z);
        vAlpha = clamp(aDot.w * (uLod < 0.5 ? 0.78 : 1.0) * depth, 0.05, 0.68) * visible;
        gl_PointSize = clamp(aDot.z * lodScale * depth * uDpr, 0.7, 7.6);
        gl_Position = vec4(clip, 0.0, 1.0);
      }
    `;
    const fragmentSource = `
      precision mediump float;
      varying float vAlpha;
      void main() {
        vec2 c = gl_PointCoord - vec2(0.5);
        if (dot(c, c) > 0.25 || vAlpha <= 0.0) discard;
        gl_FragColor = vec4(244.0 / 255.0, 241.0 / 255.0, 232.0 / 255.0, vAlpha);
      }
    `;
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    return {
      gl,
      program,
      buffer: gl.createBuffer(),
      count: 0,
      locations: {
        dot: gl.getAttribLocation(program, "aDot"),
        yaw: gl.getUniformLocation(program, "uYaw"),
        radius: gl.getUniformLocation(program, "uRadius"),
        width: gl.getUniformLocation(program, "uWidth"),
        height: gl.getUniformLocation(program, "uHeight"),
        dpr: gl.getUniformLocation(program, "uDpr"),
        lod: gl.getUniformLocation(program, "uLod"),
        tilt: gl.getUniformLocation(program, "uTilt"),
        center: gl.getUniformLocation(program, "uCenter")
      }
    };
  }

  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  }

  function uploadWebglLandDots() {
    if (!webglLayer || !state.globalLandDots.length) return false;
    const gl = webglLayer.gl;
    const data = new Float32Array(state.globalLandDots.length * 4);
    state.globalLandDots.forEach((dot, index) => {
      const offset = index * 4;
      data[offset] = dot.lat;
      data[offset + 1] = dot.lng;
      data[offset + 2] = dot.size || 1;
      data[offset + 3] = dot.opacity || 0.34;
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, webglLayer.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    webglLayer.count = state.globalLandDots.length;
    return true;
  }

  function drawWebglLandHalftone(center, radius, lod) {
    if (!state.webglLandReady || !webglLayer) return;
    const gl = webglLayer.gl;
    gl.viewport(0, 0, webglCanvas.width, webglCanvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(webglLayer.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, webglLayer.buffer);
    gl.enableVertexAttribArray(webglLayer.locations.dot);
    gl.vertexAttribPointer(webglLayer.locations.dot, 4, gl.FLOAT, false, 0, 0);
    gl.uniform1f(webglLayer.locations.yaw, state.yaw);
    gl.uniform1f(webglLayer.locations.radius, radius);
    gl.uniform1f(webglLayer.locations.width, state.width);
    gl.uniform1f(webglLayer.locations.height, state.height);
    gl.uniform1f(webglLayer.locations.dpr, state.dpr);
    gl.uniform1f(webglLayer.locations.lod, lod);
    gl.uniform1f(webglLayer.locations.tilt, AXIAL_TILT_RAD * AXIAL_TILT_LEAN);
    gl.uniform2f(webglLayer.locations.center, center.x, center.y);
    gl.drawArrays(gl.POINTS, 0, webglLayer.count);
  }

  function clearWebglLandLayer() {
    if (!webglLayer) return;
    const gl = webglLayer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  function resolveProjects(projects) {
    const bySlug = new Map(projects.map((project) => [project.slug, project]));
    return projects.map((project, index) => {
      if (project.atlasType === "sited") {
        return { ...project, index, resolvedLat: project.lat, resolvedLng: project.lng, parent: null, tether: null };
      }

      if (project.atlasType === "projected") {
        const parent = bySlug.get(project.parentSlug);
        if (!parent || typeof parent.lat !== "number" || typeof parent.lng !== "number") {
          return { ...project, index, resolvedLat: null, resolvedLng: null, parent: null, tether: null };
        }
        const projected = offsetCoordinate(parent.lat, parent.lng, project.projectionDistance || 0.16, project.projectionAngle || 0);
        return {
          ...project,
          index,
          parent,
          resolvedLat: projected.lat,
          resolvedLng: projected.lng,
          tether: { lat: parent.lat, lng: parent.lng }
        };
      }

      const slot = unsitedCoordinate(index);
      return { ...project, index, resolvedLat: slot.lat, resolvedLng: slot.lng, parent: null, tether: null };
    });
  }

  function renderList(projects) {
    list.innerHTML = projects
      .map((project) => `<li data-atlas-list-item="${escapeHtml(project.slug)}"><a href="${projectUrl(project.slug)}">${escapeHtml(project.title)}</a></li>`)
      .join("");
  }

  function renderPins() {
    overlay.innerHTML = "";
    state.pins.clear();
    state.resolved.forEach((project) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "atlas-ui-pin";
      button.dataset.slug = project.slug;
      button.dataset.shape = project.markerShape || "dot";
      button.setAttribute("aria-label", `${project.title}: ${project.scale || "project"}`);
      button.addEventListener("pointerenter", () => showPreview(project));
      button.addEventListener("focus", () => showPreview(project));
      button.addEventListener("click", (event) => {
        event.preventDefault();
        markInteraction();
        state.lastTouchPreviewSlug = project.slug;
        showPreview(project);
      });
      button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          state.lastTouchPreviewSlug = project.slug;
          showPreview(project);
        }
      });
      overlay.appendChild(button);
      state.pins.set(project.slug, button);
    });
  }

  function showPreview(project) {
    state.previewProject = project;
    state.active = project;
    markInteraction();
    renderPreview(project);
    if (state.mode === "local" && state.localSite) {
      const hasLocalData = Boolean(state.geojsonCache.get(state.localSite.slug) || state.pointCloudCache.get(state.localSite.slug));
      renderLocalPanel(state.localSite, state.highlightedCallout, hasLocalData ? "loaded" : "missing");
    } else {
      renderProjectPanel(project);
    }
    state.pins.forEach((button, slug) => {
      button.classList.toggle("is-preview", slug === project.slug);
    });
  }

  function renderPreview(project) {
    const relation = project.atlasType === "projected"
      ? project.relation || "projected study"
      : project.atlasType === "unsited"
        ? "unsited / material study"
        : project.location || "";
    const image = projectImageFor(project);
    const localTarget = localSiteTarget(project);
    const zoomButton = localTarget
      ? '<button class="atlas-preview-link atlas-preview-action" type="button" data-preview-open-local>Zoom to Site</button>'
      : "";
    preview.hidden = false;
    preview.classList.add("atlas-vellum-card");
    preview.innerHTML = `
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(project.title)} preview" loading="lazy" decoding="async" fetchpriority="low">` : ""}
      <p class="atlas-preview-meta">${escapeHtml(relation)}</p>
      <h2>${escapeHtml(project.title)}</h2>
      <p class="atlas-preview-meta">${escapeHtml(project.scale || "")}<br>${escapeHtml(project.register || "")}</p>
      <p>${escapeHtml(project.summary || "")}</p>
      <a class="atlas-preview-link" href="${projectUrl(project.slug)}">View Project</a>
      ${zoomButton}
    `;
    window.requestAnimationFrame(() => positionPreviewCard(project));
    preview.querySelector("img")?.addEventListener("load", () => positionPreviewCard(project), { once: true });
  }

  function positionPreviewCard(project) {
    const button = state.pins.get(project.slug);
    if (!button) return;
    const stageRect = stage.getBoundingClientRect();
    const point = {
      x: parseFloat(button.style.left || `${stageRect.width / 2}`),
      y: parseFloat(button.style.top || `${stageRect.height / 2}`)
    };
    const margin = stageRect.width <= 560 ? 12 : 24;
    const cardWidth = Math.min(360, Math.max(260, stageRect.width - margin * 2));
    const measuredHeight = Math.max(180, Math.min(preview.offsetHeight || 260, stageRect.height - margin * 2));
    const preferLeft = point.x + 22 + cardWidth > stageRect.width - margin;
    const preferAbove = point.y - 24 + measuredHeight > stageRect.height - margin;
    const rawLeft = preferLeft ? point.x - cardWidth - 22 : point.x + 22;
    const rawTop = preferAbove ? point.y - measuredHeight + 24 : point.y - 24;
    const left = clamp(rawLeft, margin, Math.max(margin, stageRect.width - cardWidth - margin));
    const top = clamp(rawTop, margin, Math.max(margin, stageRect.height - measuredHeight - margin));
    preview.style.setProperty("--preview-x", `${left}px`);
    preview.style.setProperty("--preview-y", `${top}px`);
    preview.style.setProperty("--preview-width", `${cardWidth}px`);
  }

  function selectProject(project) {
    state.active = project;
    if (project.atlasType === "unsited") {
      state.mode = "globe";
      state.localSite = null;
      state.highlightedCallout = null;
      focusProject(project);
      renderUnsitedPanel(project);
      return;
    }

    if (project.atlasType === "projected") {
      const parent = findProject(project.parentSlug);
      state.highlightedCallout = project;
      if (parent) {
        state.active = project;
        openLocalSite(parent, project);
      } else {
        renderProjectPanel(project);
      }
      return;
    }

    state.highlightedCallout = null;
    focusProject(project, 2.18);
    renderProjectPanel(project);
  }

  function focusProject(project, zoom = 1.72) {
    if (typeof project.resolvedLat !== "number" || typeof project.resolvedLng !== "number") return;
    state.mode = "globe";
    state.localSite = null;
    state.targetYaw = -project.resolvedLng * Math.PI / 180;
    state.targetPitch = 0;
    state.targetZoom = Math.max(state.targetZoom, zoom);
    state.viewState = currentViewState();
    markInteraction();
  }

  function openLocalSite(project, callout = null) {
    if (!project || project.atlasType === "unsited") return;
    state.mode = "local";
    state.localSite = project;
    state.highlightedCallout = callout;
    state.localPanX = 0;
    state.localPanY = 0;
    state.localZoom = 1;
    state.targetLocalZoom = 1;
    state.targetYaw = -project.resolvedLng * Math.PI / 180;
    state.targetPitch = 0;
    state.viewState = VIEW_STATES.LOCAL_SITE;
    renderLocalPanel(project, callout, "loading");
    Promise.all([loadSiteGeojson(project.slug), loadSitePointCloud(project.slug)]).then(([geojson, pointCloud]) => {
      if (state.localSite?.slug !== project.slug) return;
      renderLocalPanel(project, callout, geojson || pointCloud ? "loaded" : "missing");
    });
  }

  function returnToGlobe() {
    state.mode = "globe";
    state.localSite = null;
    state.highlightedCallout = null;
    state.zoom = 0.95;
    state.targetZoom = 0.95;
    state.localZoom = 1;
    state.targetLocalZoom = 1;
    state.viewState = VIEW_STATES.FAR_GLOBE;
    renderProjectPanel(state.active);
    markInteraction();
  }

  function renderProjectPanel(project) {
    if (!project) {
      panel.innerHTML = '<p>Select a project on the halftone globe.</p>';
      return;
    }

    const lod = currentLod();
    const localTarget = localSiteTarget(project);
    const localButton = localTarget
      ? `<button class="atlas-return" type="button" data-open-local>${project.atlasType === "projected" ? "Zoom to Parent Site" : "Open local site detail"}</button>`
      : "";
    const returnButton = lod > 0
      ? '<button class="atlas-return" type="button" data-return-globe>Return to Globe</button>'
      : "";
    const typeLabel = project.atlasType === "projected"
      ? `${project.relation || "projected study"} from ${project.parentSlug || "parent project"}`
      : project.atlasType === "unsited"
        ? `unsited / ${project.axis || "material"} axis`
        : project.location || "sited";

    panel.innerHTML = `
      <p class="atlas-meta">LOD ${lod} / ${lodLabel(lod)}<br>${escapeHtml(typeLabel)}<br>${coordinateText(project)}</p>
      <h2>${escapeHtml(project.title)}</h2>
      <p>${escapeHtml(project.summary || "")}</p>
      <p class="atlas-meta">${escapeHtml(project.scale || "")}<br>${escapeHtml(project.register || "")}</p>
      <a class="atlas-link" href="${projectUrl(project.slug)}">View Project</a>
      ${localButton}
      ${returnButton}
      <p class="atlas-help">Zoom closer to approach regional and site detail. Real roads, parcels, buildings, water edges, and project footprints only appear when local GeoJSON exists.</p>
    `;

    panel.querySelector("[data-open-local]")?.addEventListener("click", () => {
      if (project.atlasType === "sited") openLocalSite(project);
      else selectProject(project);
    });
    panel.querySelector("[data-return-globe]")?.addEventListener("click", returnToGlobe);
  }

  function renderLocalPanel(project, callout, status) {
    const missing = status === "missing";
    const loading = status === "loading";
    const calloutText = callout ? `<p class="atlas-meta">Callout: ${escapeHtml(callout.title)}<br>${escapeHtml(callout.relation || "")}</p>` : "";
    panel.innerHTML = `
      <p class="atlas-meta">LOD 3 / Local Site Detail<br>${escapeHtml(project.location || "")}<br>${coordinateText(project)}</p>
      <h2>${escapeHtml(callout ? callout.title : project.title)}</h2>
      ${calloutText}
      <p>${escapeHtml(callout ? callout.summary : project.summary || "")}</p>
      ${loading ? '<p class="atlas-fallback">Checking for local GeoJSON...</p>' : ""}
      ${missing ? '<p class="atlas-fallback">Detailed site data has not been added for this project yet.</p>' : ""}
      <p class="atlas-meta">${escapeHtml(project.scale || "")}<br>${escapeHtml(project.register || "")}</p>
      <a class="atlas-link" href="${projectUrl(callout ? callout.slug : project.slug)}">View Project</a>
      <button class="atlas-return" type="button" data-return-globe>Return to Globe</button>
    `;
    panel.querySelector("[data-return-globe]")?.addEventListener("click", returnToGlobe);
  }

  function renderUnsitedPanel(project) {
    panel.innerHTML = `
      <p class="atlas-meta">Unsited material-study panel<br>${escapeHtml(project.axis || "material")} axis</p>
      <h2>${escapeHtml(project.title)}</h2>
      <p>${escapeHtml(project.summary || "")}</p>
      <p class="atlas-fallback">This work has no meaningful site or parent. No fake local map has been generated.</p>
      <p class="atlas-meta">${escapeHtml(project.scale || "")}<br>${escapeHtml(project.register || "")}</p>
      <a class="atlas-link" href="${projectUrl(project.slug)}">View Project</a>
    `;
  }

  async function loadSiteGeojson(slug) {
    if (!siteGeojsonSlugs.has(slug)) return null;
    if (state.geojsonCache.has(slug)) return state.geojsonCache.get(slug);
    const manifestEntry = state.siteManifest.get(slug);
    if (manifestEntry && manifestEntry.status && manifestEntry.status !== "ok") {
      state.geojsonCache.set(slug, null);
      return null;
    }
    try {
      const response = await fetch(`assets/data/site-geojson/${slug}.geojson`, { cache: "no-store" });
      if (!response.ok) throw new Error("GeoJSON missing");
      const geojson = await response.json();
      state.geojsonCache.set(slug, geojson);
      return geojson;
    } catch {
      state.geojsonCache.set(slug, null);
      return null;
    }
  }

  async function loadSitePointCloud(slug) {
    if (!state.enablePointCloudContext) return null;
    if (state.pointCloudCache.has(slug)) return state.pointCloudCache.get(slug);
    const manifestEntry = state.pointCloudManifest.get(slug);
    if (!manifestEntry || (manifestEntry.status && manifestEntry.status !== "ok")) {
      state.pointCloudCache.set(slug, null);
      return null;
    }
    try {
      const response = await fetch(`assets/data/site-pointcloud/${slug}-context-points.json`, { cache: "no-store" });
      if (!response.ok) throw new Error("Point context missing");
      const payload = await response.json();
      const points = Array.isArray(payload) ? payload : payload.points;
      const capped = Array.isArray(points) ? points.slice(0, LOCAL_POINT_CLOUD_CAP) : [];
      state.pointCloudCache.set(slug, capped);
      return capped;
    } catch {
      state.pointCloudCache.set(slug, null);
      return null;
    }
  }

  function resize() {
    // `.atlas-stage` is the clipping container for the sphere, moon callouts, pins, and bounded vellum cards.
    const rect = stage.getBoundingClientRect();
    state.width = Math.max(320, Math.floor(rect.width));
    state.height = Math.max(360, Math.floor(rect.height));
    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    webglCanvas.width = Math.floor(state.width * state.dpr);
    webglCanvas.height = Math.floor(state.height * state.dpr);
    webglCanvas.style.width = `${state.width}px`;
    webglCanvas.style.height = `${state.height}px`;
    webglLayer?.gl.viewport(0, 0, webglCanvas.width, webglCanvas.height);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  function tick() {
    if (document.hidden || !state.isInView) {
      window.requestAnimationFrame(tick);
      return;
    }
    if (!state.reduceMotion && !state.dragging && state.mode === "globe" && Date.now() - state.lastInteraction > 4800) {
      state.targetYaw += 0.0012;
    }
    state.yaw += (state.targetYaw - state.yaw) * 0.085 + state.velocityYaw;
    state.pitch += (state.targetPitch - state.pitch) * 0.085 + state.velocityPitch;
    state.zoom += (state.targetZoom - state.zoom) * 0.09;
    state.localZoom += (state.targetLocalZoom - state.localZoom) * 0.12;
    state.velocityYaw *= 0.91;
    state.velocityPitch *= 0.88;
    state.pitch = clamp(state.pitch, -0.18, 0.18);
    const nextLod = currentLod();
    state.viewState = currentViewState();
    if (nextLod !== state.lastLod) {
      state.lastLod = nextLod;
      if (state.mode === "globe" && state.active) renderProjectPanel(state.active);
    }
    draw();
    if (!preview.hidden && state.previewProject) positionPreviewCard(state.previewProject);
    window.requestAnimationFrame(tick);
  }

  function draw() {
    if (state.mode === "local" && state.localSite) clearWebglLandLayer();
    ctx.clearRect(0, 0, state.width, state.height);
    if (state.mode === "local" && state.localSite) {
      drawLocalSite();
    } else {
      drawGlobe();
    }
  }

  function drawGlobe() {
    const radius = Math.min(state.width, state.height) * 0.28 * state.zoom;
    const center = { x: state.width * 0.5, y: state.height * 0.48 };
    const lod = currentLod();

    drawWebglLandHalftone(center, radius, lod);
    drawSphereLimb(center, radius); // full-globe readability: the canvas/stage overflow controls clipping for the whole sphere.
    if (!state.webglLandReady) drawGlobalLandHalftone(center, radius, lod); // CPU fallback for global land halftone layer
    drawRegionalLandHalftone(center, radius, lod); // regional data-derived land-density emphasis
    drawTethers(center, radius, lod); // tether lines for projected markers
    drawMarkers(center, radius, lod); // project markers and projected markers
    positionPins(center, radius, lod);
  }

  function drawSphereLimb(center, radius) {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = "rgba(244, 241, 232, 0.18)";
    ctx.lineWidth = 1;
    ctx.arc(center.x, center.y, radius, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = "rgba(244, 241, 232, 0.06)";
    ctx.arc(center.x, center.y, radius * 0.992, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawGlobalLandHalftone(center, radius, lod) {
    if (!state.globalLandDotsReady) {
      drawMinimalPlaceholderLayer(center, radius);
      return;
    }

    const stride = lod === 0 ? 3 : lod === 1 ? 2 : 1;
    const scale = lod === 0 ? 1.45 : lod === 1 ? 1.1 : 0.78;
    for (let index = 0; index < state.globalLandDots.length; index += stride) {
      const dot = state.globalLandDots[index];
      const p = projectPoint(dot.lat, dot.lng, center, radius);
      if (!p.visible) continue;
      const opacity = clamp((dot.opacity || 0.34) * (lod === 0 ? 0.78 : 1) * p.depth, 0.05, 0.68);
      ctx.beginPath();
      ctx.fillStyle = `rgba(244, 241, 232, ${opacity})`;
      ctx.arc(p.x, p.y, clamp((dot.size || 1) * scale * p.depth, 0.35, 3.8), 0, TAU);
      ctx.fill();
    }
  }

  function drawMinimalPlaceholderLayer(center, radius) {
    if (!state.globalLandDotsWarned) {
      console.warn("Atlas is using a minimal temporary placeholder layer. TODO: run npm run atlas:data to generate land-derived halftone dots.");
      state.globalLandDotsWarned = true;
    }
    const placeholder = [
      [40.7, -73.9],
      [42.4, -76.5],
      [18.48, -67.16],
      [51.5, 0.005],
      [-41.88, -73.98],
      [27.93, 84.4]
    ];
    placeholder.forEach(([lat, lng]) => {
      const p = projectPoint(lat, lng, center, radius);
      if (!p.visible) return;
      ctx.beginPath();
      ctx.fillStyle = "rgba(244, 241, 232, 0.18)";
      ctx.arc(p.x, p.y, 1.7, 0, TAU);
      ctx.fill();
    });
  }

  function drawRegionalLandHalftone(center, radius, lod) {
    if (lod < 1 || !state.globalLandDotsReady || !state.active || typeof state.active.resolvedLat !== "number") return;
    const anchor = state.active.atlasType === "projected" ? findProject(state.active.parentSlug) : state.active;
    if (!anchor) return;
    const spread = lod === 1 ? 9 : 4.2;
    for (const dot of state.globalLandDots) {
      const distance = Math.hypot(dot.lat - anchor.resolvedLat, (dot.lng - anchor.resolvedLng) * Math.cos(anchor.resolvedLat * Math.PI / 180));
      if (distance > spread) continue;
      const p = projectPoint(dot.lat, dot.lng, center, radius);
      if (!p.visible) continue;
      const opacity = clamp((1 - distance / spread) * (lod === 1 ? 0.42 : 0.62), 0, 0.62);
      ctx.beginPath();
      ctx.fillStyle = `rgba(244, 241, 232, ${opacity})`;
      ctx.arc(p.x, p.y, lod === 1 ? 1.25 : 0.82, 0, TAU);
      ctx.fill();
    }
  }

  function drawTethers(center, radius, lod) {
    state.resolved.forEach((item) => {
      if (!isAtlasProjectVisible(item)) return;
      if (!item.tether) return;
      const activeRelation = state.active?.slug === item.slug || state.highlightedCallout?.slug === item.slug;
      if (lod === 0 && !activeRelation) return;
      const start = projectPoint(item.tether.lat, item.tether.lng, center, radius);
      const end = projectProject(item, center, radius);
      if (!start.visible || !end.visible) return;
      ctx.beginPath();
      ctx.strokeStyle = activeRelation ? "rgba(244, 241, 232, 0.78)" : "rgba(244, 241, 232, 0.24)";
      ctx.lineWidth = activeRelation ? 1.4 : 1;
      ctx.setLineDash([2, 5]);
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  function drawMarkers(center, radius, lod) {
    state.resolved.forEach((item) => {
      if (!isAtlasProjectVisible(item)) return;
      const p = projectProject(item, center, radius);
      if (!p.visible) return;
      if (item.atlasType === "projected" && lod === 0 && state.active?.slug !== item.slug) return;
      const active = state.active?.slug === item.slug || state.highlightedCallout?.slug === item.slug;
      const projectedOpacity = item.atlasType === "projected" ? (lod === 1 ? 0.42 : 0.72) : 1;
      const size = active ? 7 : item.atlasType === "projected" ? 4.8 : 5.5;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.globalAlpha = projectedOpacity;
      ctx.strokeStyle = "rgba(244, 241, 232, 0.9)";
      ctx.fillStyle = item.atlasType === "projected" ? "rgba(244, 241, 232, 0.08)" : "rgba(244, 241, 232, 0.88)";
      ctx.lineWidth = active ? 1.8 : 1;
      drawMarkerShape(item.markerShape, size);
      if (active) {
        ctx.beginPath();
        ctx.arc(0, 0, size + 9, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  function drawLocalSite() {
    const site = state.localSite;
    const geojson = state.geojsonCache.get(site.slug);
    const pointCloud = state.pointCloudCache.get(site.slug);
    state.localDrawBudget = LOCAL_FEATURE_POINT_CAP;
    drawLocalHalftoneField(site, Boolean(geojson || pointCloud)); // local GeoJSON/point-context halftone base layer
    if (pointCloud) drawPointCloud(pointCloud, site); // optional provisional context point cloud, never generated in browser
    if (geojson) drawGeojson(geojson, site); // local GeoJSON halftone linework and fills
    drawLocalMarker(site);
    positionPinsForLocal(site);
  }

  function drawPointCloud(points, site) {
    const scale = 0.42 * state.localZoom;
    const yaw = 0.38;
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    points.slice(0, LOCAL_POINT_CLOUD_CAP).forEach((point) => {
      const local = localPointFromContext(point, site);
      if (!local) return;
      const rx = local.x * cosYaw - local.y * sinYaw;
      const ry = local.x * sinYaw + local.y * cosYaw;
      const x = state.width / 2 + state.localPanX + rx * scale;
      const y = state.height / 2 + state.localPanY - ry * scale - (local.z || 0) * scale * 0.72;
      if (x < -20 || x > state.width + 20 || y < -20 || y > state.height + 20) return;
      const style = pointCloudStyle(point.type || point.class || "");
      ctx.beginPath();
      ctx.fillStyle = style.fill;
      ctx.arc(x, y, style.size * clamp(state.localZoom, 0.8, 2.2), 0, TAU);
      ctx.fill();
    });
  }

  function localPointFromContext(point, site) {
    if (Number.isFinite(point.x) && Number.isFinite(point.y)) {
      return { x: point.x, y: point.y, z: Number.isFinite(point.z) ? point.z : Number(point.elevation) || 0 };
    }
    const lng = Number(point.lng ?? point.lon);
    const lat = Number(point.lat);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = 111320 * Math.cos(site.resolvedLat * Math.PI / 180);
    return {
      x: (lng - site.resolvedLng) * metersPerDegreeLng,
      y: (lat - site.resolvedLat) * metersPerDegreeLat,
      z: Number.isFinite(point.z) ? point.z : Number(point.elevation) || 0
    };
  }

  function pointCloudStyle(type) {
    if (type.includes("roof")) return { fill: "rgba(244, 241, 232, 0.78)", size: 0.72 };
    if (type.includes("wall") || type.includes("building")) return { fill: "rgba(244, 241, 232, 0.62)", size: 0.62 };
    if (type.includes("road") || type.includes("path")) return { fill: "rgba(244, 241, 232, 0.5)", size: 0.52 };
    if (type.includes("water")) return { fill: "rgba(244, 241, 232, 0.24)", size: 0.56 };
    return { fill: "rgba(244, 241, 232, 0.42)", size: 0.58 };
  }

  function drawLocalHalftoneField(site, hasGeojson) {
    const spacing = hasGeojson ? 16 / state.localZoom : 24 / state.localZoom;
    const size = hasGeojson ? 0.85 : 1.25;
    const cx = state.width / 2 + state.localPanX;
    const cy = state.height / 2 + state.localPanY;
    ctx.fillStyle = "rgba(244, 241, 232, 0.2)";
    for (let y = -spacing; y < state.height + spacing; y += spacing) {
      for (let x = -spacing; x < state.width + spacing; x += spacing) {
        const sx = Math.round((x - cx) / spacing);
        const sy = Math.round((y - cy) / spacing);
        const noise = seededNoise(sx, sy);
        if (noise < (hasGeojson ? 0.2 : 0.42)) continue;
        ctx.beginPath();
        ctx.globalAlpha = hasGeojson ? 0.24 : 0.16;
        ctx.arc(x, y, size * (0.7 + noise), 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawGeojson(geojson, site) {
    const features = geojson.type === "FeatureCollection" ? geojson.features || [] : [{ type: "Feature", geometry: geojson, properties: {} }];
    features.forEach((feature) => {
      const kind = String(feature.properties?.featureClass || feature.properties?.kind || feature.properties?.type || feature.properties?.layer || "").toLowerCase();
      const style = featureStyle(kind);
      ctx.strokeStyle = style.stroke;
      ctx.fillStyle = style.fill;
      ctx.lineWidth = style.width;
      drawGeometry(feature.geometry, site, style);
    });
  }

  function drawGeometry(geometry, site, style) {
    if (state.localDrawBudget <= 0) return;
    if (!geometry) return;
    if (geometry.type === "GeometryCollection") {
      (geometry.geometries || []).forEach((item) => drawGeometry(item, site, style));
      return;
    }
    const coordinates = geometry.coordinates || [];
    if (geometry.type === "Point") {
      const p = localPoint(coordinates[1], coordinates[0], site);
      if (state.localDrawBudget <= 0) return;
      state.localDrawBudget -= 1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, TAU);
      ctx.fill();
    } else if (geometry.type === "LineString") {
      drawLine(coordinates, site, style);
    } else if (geometry.type === "MultiLineString") {
      coordinates.forEach((line) => drawLine(line, site, style));
    } else if (geometry.type === "Polygon") {
      coordinates.forEach((ring, index) => drawLine(ring, site, style, index === 0));
    } else if (geometry.type === "MultiPolygon") {
      coordinates.flat().forEach((ring) => drawLine(ring, site, style, true));
    }
  }

  function drawLine(coordinates, site, style, close = false) {
    const line = decimateCoordinates(coordinates);
    if (!line.length) return;
    const points = line.map((coord) => localPoint(coord[1], coord[0], site));
    drawDottedPolyline(points, style, close);
    if (style.fill !== "transparent" && close && style.interior) {
      fillPolygonWithDots(points, style);
    }
  }

  function drawDottedPolyline(points, style, close = false) {
    const path = close ? [...points, points[0]] : points;
    const spacing = style.spacing || 8;
    for (let index = 1; index < path.length; index += 1) {
      const a = path[index - 1];
      const b = path[index];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      const steps = Math.max(1, Math.floor(length / spacing));
      for (let step = 0; step <= steps; step += 1) {
        const t = step / steps;
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;
        if (state.localDrawBudget <= 0) return;
        state.localDrawBudget -= 1;
        ctx.beginPath();
        ctx.fillStyle = style.stroke;
        ctx.arc(x, y, style.dotSize || 1, 0, TAU);
        ctx.fill();
      }
    }
  }

  function fillPolygonWithDots(points, style) {
    const bbox = points.reduce((box, point) => ({
      minX: Math.min(box.minX, point.x),
      minY: Math.min(box.minY, point.y),
      maxX: Math.max(box.maxX, point.x),
      maxY: Math.max(box.maxY, point.y)
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    const spacing = style.fillSpacing || 12;
    for (let y = bbox.minY; y <= bbox.maxY; y += spacing) {
      for (let x = bbox.minX; x <= bbox.maxX; x += spacing) {
        const noise = seededNoise(Math.round(x * 10), Math.round(y * 10));
        if (noise < 0.42 || !pointInScreenPolygon({ x, y }, points)) continue;
        if (state.localDrawBudget <= 0) return;
        state.localDrawBudget -= 1;
        ctx.beginPath();
        ctx.fillStyle = style.fill;
        ctx.arc(x, y, 0.85 + noise * 0.7, 0, TAU);
        ctx.fill();
      }
    }
  }

  function pointInScreenPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || Number.EPSILON) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function drawLocalMarker(site) {
    const x = state.width / 2 + state.localPanX;
    const y = state.height / 2 + state.localPanY;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "rgba(244, 241, 232, 0.95)";
    ctx.fillStyle = "rgba(244, 241, 232, 0.95)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, TAU);
    ctx.stroke();

    if (state.highlightedCallout) {
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(58, -42);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeRect(52, -50, 12, 12);
    }
    ctx.restore();
  }

  function positionPinsForLocal(site) {
    state.resolved.forEach((item) => {
      const button = state.pins.get(item.slug);
      if (!button) return;
      if (!isAtlasProjectVisible(item)) {
        button.classList.add("is-hidden");
        return;
      }
      const isSite = item.slug === site.slug;
      const isCallout = state.highlightedCallout?.slug === item.slug;
      button.classList.toggle("is-hidden", !isSite && !isCallout);
      button.style.left = `${state.width / 2 + state.localPanX + (isCallout ? 58 : 0)}px`;
      button.style.top = `${state.height / 2 + state.localPanY + (isCallout ? -42 : 0)}px`;
    });
  }

  function localPoint(lat, lng, site) {
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = 111320 * Math.cos(site.resolvedLat * Math.PI / 180);
    const scale = 0.42 * state.localZoom;
    return {
      x: state.width / 2 + state.localPanX + (lng - site.resolvedLng) * metersPerDegreeLng * scale,
      y: state.height / 2 + state.localPanY - (lat - site.resolvedLat) * metersPerDegreeLat * scale
    };
  }

  function projectProject(item, center, radius) {
    if (typeof item.resolvedLat !== "number" || typeof item.resolvedLng !== "number") {
      return { visible: false, x: 0, y: 0, depth: 0 };
    }
    if (item.atlasType === "projected" && item.tether) {
      const parentPoint = projectPoint(item.tether.lat, item.tether.lng, center, radius);
      const dx = parentPoint.x - center.x;
      const dy = parentPoint.y - center.y;
      const length = Math.max(1, Math.hypot(dx, dy));
      const radial = { x: dx / length, y: dy / length };
      const tangentSign = (item.projectionAngle || 0) >= 0 ? 1 : -1;
      const tangent = { x: -radial.y * tangentSign, y: radial.x * tangentSign };
      const moonRadius = radius * clamp(item.moonRadius || 1.55, 1.55, 1.85);
      const tangentOffset = radius * 0.12;
      const margin = 30;
      const rawX = center.x + radial.x * moonRadius + tangent.x * tangentOffset;
      const rawY = center.y + radial.y * moonRadius + tangent.y * tangentOffset;
      return {
        visible: parentPoint.visible,
        x: clamp(rawX, margin, Math.max(margin, state.width - margin)),
        y: clamp(rawY, margin, Math.max(margin, state.height - margin)),
        depth: parentPoint.depth
      };
    }
    return projectPoint(item.resolvedLat, item.resolvedLng, center, radius);
  }

  function projectPoint(lat, lng, center, radius) {
    const phi = lat * Math.PI / 180;
    const theta = lng * Math.PI / 180 + state.yaw;
    const cosPhi = Math.cos(phi);
    const x = cosPhi * Math.sin(theta);
    const y = Math.sin(phi);
    const z = cosPhi * Math.cos(theta);
    const tiltCos = Math.cos(AXIAL_TILT_RAD * AXIAL_TILT_LEAN);
    const tiltSin = Math.sin(AXIAL_TILT_RAD * AXIAL_TILT_LEAN);
    const screenX = x * tiltCos + y * tiltSin;
    const screenY = -x * tiltSin + y * tiltCos;
    return {
      x: center.x + screenX * radius,
      y: center.y - screenY * radius,
      visible: z > -0.08,
      depth: clamp((z + 1) / 2, 0.12, 1)
    };
  }

  function positionPins(center, radius, lod) {
    state.resolved.forEach((item) => {
      const button = state.pins.get(item.slug);
      if (!button) return;
      const p = projectProject(item, center, radius);
      const hiddenProjected = item.atlasType === "projected" && lod === 0 && state.active?.slug !== item.slug;
      button.style.left = `${p.x}px`;
      button.style.top = `${p.y}px`;
      button.classList.toggle("is-active", state.active?.slug === item.slug);
      button.classList.toggle("is-hidden", !p.visible || hiddenProjected || !isAtlasProjectVisible(item));
    });
  }

  stage.addEventListener("pointerdown", (event) => {
    markInteraction();
    if (event.target instanceof Element && event.target.closest(".atlas-ui-pin")) return;
    stage.setPointerCapture(event.pointerId);
    stage.classList.add("is-dragging");
    state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (state.pointers.size === 2) {
      const points = Array.from(state.pointers.values());
      state.pinchDistance = pointDistance(points[0], points[1]);
      state.pinchZoom = state.mode === "local" ? state.targetLocalZoom : state.targetZoom;
      state.dragging = false;
      state.pointer = null;
      return;
    }
    state.dragging = true;
    state.pointer = { x: event.clientX, y: event.clientY };
    state.velocityYaw = 0;
    state.velocityPitch = 0;
  });

  stage.addEventListener("pointermove", (event) => {
    if (state.dragging || state.pointers.size) markInteraction();
    if (state.pointers.has(event.pointerId)) {
      state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (state.pointers.size >= 2) {
      const points = Array.from(state.pointers.values()).slice(0, 2);
      const distance = pointDistance(points[0], points[1]);
      const nextZoom = clamp(state.pinchZoom * (distance / Math.max(1, state.pinchDistance)), 0.72, state.mode === "local" ? 8 : 2.65);
      if (state.mode === "local") state.targetLocalZoom = nextZoom;
      else state.targetZoom = nextZoom;
      return;
    }
    if (!state.dragging || !state.pointer) return;
    const dx = event.clientX - state.pointer.x;
    const dy = event.clientY - state.pointer.y;
    if (state.mode === "local") {
      state.localPanX += dx;
      state.localPanY += dy;
    } else {
      state.targetYaw += dx * 0.006;
      state.targetPitch = 0;
      state.velocityYaw = clamp(dx * 0.0009, -0.035, 0.035);
      state.velocityPitch = 0;
    }
    state.pointer = { x: event.clientX, y: event.clientY };
  });

  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);

  function endDrag(event) {
    state.pointers.delete(event.pointerId);
    state.pinchDistance = 0;
    state.pinchZoom = state.mode === "local" ? state.targetLocalZoom : state.targetZoom;
    if (state.pointers.size === 1) {
      state.pointer = Array.from(state.pointers.values())[0];
      state.dragging = true;
      return;
    }
    state.dragging = false;
    state.pointer = null;
    stage.classList.remove("is-dragging");
  }

  stage.addEventListener("wheel", (event) => {
    event.preventDefault();
    markInteraction();
    const direction = event.deltaY > 0 ? -1 : 1;
    if (state.mode === "local") {
      if (direction < 0 && state.targetLocalZoom <= 0.86) {
        returnToGlobe();
        return;
      }
      state.targetLocalZoom = clamp(state.targetLocalZoom + direction * 0.35, 0.7, 8);
      return;
    }
    state.targetZoom = clamp(state.targetZoom + direction * 0.16, 0.72, 2.65);
    if (state.targetZoom > 2.42 && state.active?.atlasType === "sited") {
      openLocalSite(state.active);
    }
  }, { passive: false });

  window.addEventListener("resize", resize, { passive: true });
  if ("ResizeObserver" in window) {
    new ResizeObserver(resize).observe(stage);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      state.isInView = entries.some((entry) => entry.isIntersecting);
    }, { threshold: 0.01 }).observe(stage);
  }
  window.addEventListener("portfolio-atlas-filter", (event) => {
    const slugs = Array.isArray(event.detail?.slugs) ? event.detail.slugs : [];
    state.filterSlugs = event.detail?.activeTheme === "all"
      ? null
      : new Set(slugs.map((slug) => projectToAtlasSlug[slug] || slug));
    updateFilteredList();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && (state.mode === "local" || currentLod() > 0)) {
      returnToGlobe();
      return;
    }
    if (event.key === "Escape" && !preview.hidden) {
      preview.hidden = true;
      state.previewProject = null;
      state.lastTouchPreviewSlug = "";
      state.pins.forEach((button) => button.classList.remove("is-preview"));
    }
  });

  function currentLod() {
    if (state.mode === "local") return 3;
    if (state.zoom >= 2.2) return 2;
    if (state.zoom >= 1.42) return 1;
    return 0;
  }

  function currentViewState() {
    if (state.mode === "local") return VIEW_STATES.LOCAL_SITE;
    const lod = currentLod();
    if (lod >= 2) return VIEW_STATES.SITE_APPROACH;
    if (lod === 1) return VIEW_STATES.REGIONAL;
    return VIEW_STATES.FAR_GLOBE;
  }

  function lodLabel(lod) {
    return ["Far Earth", "Regional Approach", "Site Approach", "Local Site Detail"][lod] || "Atlas";
  }

  function drawMarkerShape(shape, size) {
    if (shape === "square") {
      ctx.strokeRect(-size, -size, size * 2, size * 2);
    } else if (shape === "hollow-circle") {
      ctx.beginPath();
      ctx.arc(0, 0, size + 1, 0, TAU);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, TAU);
      ctx.fill();
    }
  }

  function featureStyle(kind) {
    if (kind.includes("water") || kind.includes("shore") || kind.includes("coast")) {
      return { stroke: "rgba(244, 241, 232, 0.34)", fill: "rgba(244, 241, 232, 0.035)", dotSize: 0.8, spacing: 9 };
    }
    if (kind.includes("road") || kind.includes("path")) {
      return { stroke: "rgba(244, 241, 232, 0.66)", fill: "transparent", dotSize: kind.includes("path") ? 0.7 : 0.95, spacing: kind.includes("path") ? 9 : 7 };
    }
    if (kind.includes("building") || kind.includes("footprint")) {
      return { stroke: "rgba(244, 241, 232, 0.78)", fill: "rgba(244, 241, 232, 0.12)", dotSize: 1, spacing: 6, interior: true, fillSpacing: 12 };
    }
    if (kind.includes("landuse") || kind.includes("park") || kind.includes("leisure")) {
      return { stroke: "rgba(244, 241, 232, 0.32)", fill: "rgba(244, 241, 232, 0.045)", dotSize: 0.7, spacing: 12, interior: true, fillSpacing: 20 };
    }
    return { stroke: "rgba(244, 241, 232, 0.48)", fill: "transparent", dotSize: 0.85, spacing: 10 };
  }

  function findProject(slug) {
    return state.resolved.find((project) => project.slug === slug);
  }

  function localSiteTarget(project) {
    if (!project) return null;
    if (project.atlasType === "sited" && siteGeojsonSlugs.has(project.slug)) return project;
    if (project.atlasType === "projected") {
      const parent = findProject(project.parentSlug);
      return parent && siteGeojsonSlugs.has(parent.slug) ? parent : null;
    }
    return null;
  }

  function projectImageFor(project) {
    return project?.atlasImage || project?.image || project?.coverImage || project?.workThumbnail ||
      project?.heroImage || project?.renderImage || projectImages[project?.slug] || "";
  }

  function projectUrl(slug) {
    return `project.html?id=${encodeURIComponent(atlasToProjectSlug[slug] || slug)}`;
  }

  function isAtlasProjectVisible(project) {
    return !state.filterSlugs || state.filterSlugs.has(project.slug);
  }

  function updateFilteredList() {
    list.querySelectorAll("[data-atlas-list-item]").forEach((item) => {
      const slug = item.getAttribute("data-atlas-list-item") || "";
      item.hidden = Boolean(state.filterSlugs && !state.filterSlugs.has(slug));
    });
  }

  function decimateCoordinates(coordinates) {
    if (coordinates.length <= 900) return coordinates;
    const step = Math.ceil(coordinates.length / 900);
    return coordinates.filter((_, index) => index % step === 0 || index === coordinates.length - 1);
  }

  function markInteraction() {
    state.lastInteraction = Date.now();
  }

  function coordinateText(project) {
    if (typeof project.resolvedLat !== "number" || typeof project.resolvedLng !== "number") return "";
    return `${project.resolvedLat.toFixed(6)}, ${project.resolvedLng.toFixed(6)}`;
  }

  function offsetCoordinate(lat, lng, distance, angleDegrees) {
    const angle = angleDegrees * Math.PI / 180;
    return {
      lat: clamp(lat + Math.sin(angle) * distance, -82, 82),
      lng: wrapLng(lng + Math.cos(angle) * distance / Math.max(0.28, Math.cos(lat * Math.PI / 180)))
    };
  }

  function unsitedCoordinate(index) {
    return {
      lat: -18 - index * 2.6,
      lng: 126 + index * 7.4
    };
  }

  function seededNoise(x, y) {
    const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return value - Math.floor(value);
  }

  function pointDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function wrapLng(value) {
    let next = value;
    while (next < -180) next += 360;
    while (next > 180) next -= 360;
    return next;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
