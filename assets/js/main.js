(function () {
  const projects = window.PORTFOLIO_PROJECTS || [];
  const words = window.ARCHITECTURE_WORDS || [];
  const optimizedImages = window.PORTFOLIO_OPTIMIZED_IMAGES || {};
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const workThemeMap = [
    ["Assembly", ["wood-street-pool", "enfield-food-pantry", "design-district-canteen", "curanto-cookhouse", "woven-pavilion", "hunters-point"]],
    ["Balance", ["a-chair-is-a-toy", "borinquen-healing-center"]],
    ["Body", ["wood-street-pool", "borinquen-healing-center", "a-chair-is-a-toy", "woven-pavilion"]],
    ["Care", ["hunters-point", "wood-street-pool", "enfield-food-pantry", "borinquen-healing-center"]],
    ["Circulation", ["hunters-point", "wood-street-pool", "borinquen-healing-center", "design-district-canteen", "curanto-cookhouse", "woven-pavilion"]],
    ["Climate", ["wood-street-pool", "enfield-food-pantry", "curanto-cookhouse"]],
    ["Commons", ["hunters-point", "wood-street-pool", "enfield-food-pantry", "curanto-cookhouse", "design-district-canteen"]],
    ["Community", ["hunters-point", "wood-street-pool", "enfield-food-pantry", "curanto-cookhouse", "design-district-canteen", "deconstruct-reconfigure"]],
    ["Competition", ["york-prize", "deconstruct-reconfigure", "a-chair-is-a-toy"]],
    ["Configuration", ["hunters-point", "deconstruct-reconfigure", "a-chair-is-a-toy", "curanto-cookhouse"]],
    ["Deconstruction", ["deconstruct-reconfigure", "curanto-cookhouse", "hunters-point"]],
    ["Form", ["borinquen-healing-center", "woven-pavilion", "design-district-canteen", "a-chair-is-a-toy", "york-prize"]],
    ["Frame", ["hunters-point", "enfield-food-pantry", "design-district-canteen", "curanto-cookhouse", "woven-pavilion"]],
    ["Gathering", ["hunters-point", "enfield-food-pantry", "wood-street-pool", "design-district-canteen", "curanto-cookhouse", "woven-pavilion"]],
    ["Ground", ["wood-street-pool", "enfield-food-pantry", "borinquen-healing-center", "curanto-cookhouse", "woven-pavilion"]],
    ["Housing", ["hunters-point"]],
    ["Infrastructure", ["wood-street-pool", "hunters-point", "enfield-food-pantry", "design-district-canteen", "curanto-cookhouse", "borinquen-healing-center"]],
    ["Light", ["woven-pavilion", "curanto-cookhouse", "design-district-canteen", "wood-street-pool"]],
    ["Movement", ["wood-street-pool", "hunters-point", "borinquen-healing-center", "woven-pavilion", "a-chair-is-a-toy"]],
    ["Performance", ["a-chair-is-a-toy", "design-district-canteen", "woven-pavilion", "curanto-cookhouse", "hunters-point"]],
    ["Play", ["a-chair-is-a-toy", "wood-street-pool", "design-district-canteen", "woven-pavilion"]],
    ["Production", ["deconstruct-reconfigure", "hunters-point", "curanto-cookhouse"]],
    ["Resilience", ["hunters-point", "wood-street-pool", "enfield-food-pantry", "deconstruct-reconfigure", "curanto-cookhouse"]],
    ["Ritual", ["curanto-cookhouse", "woven-pavilion", "wood-street-pool"]],
    ["Texture", ["curanto-cookhouse", "woven-pavilion", "york-prize"]],
    ["Threshold", ["curanto-cookhouse", "wood-street-pool", "hunters-point", "enfield-food-pantry", "woven-pavilion", "york-prize", "design-district-canteen"]],
    ["Use", ["hunters-point", "wood-street-pool", "enfield-food-pantry", "design-district-canteen", "curanto-cookhouse", "a-chair-is-a-toy", "deconstruct-reconfigure", "borinquen-healing-center"]]
  ];

  function planSvg(project, variant, options = {}) {
    const title = escapeHtml(project.title);
    const showTitle = options.showTitle !== false;
    const lines = {
      bar: '<rect x="16" y="30" width="168" height="42"/><line x1="45" y1="30" x2="45" y2="72"/><line x1="78" y1="30" x2="78" y2="72"/><line x1="121" y1="30" x2="121" y2="72"/><line x1="156" y1="30" x2="156" y2="72"/>',
      courtyard: '<rect x="24" y="16" width="152" height="88"/><rect x="70" y="38" width="60" height="42"/><line x1="24" y1="56" x2="70" y2="56"/><line x1="130" y1="56" x2="176" y2="56"/>',
      grid: '<rect x="20" y="20" width="160" height="84"/><line x1="20" y1="48" x2="180" y2="48"/><line x1="20" y1="76" x2="180" y2="76"/><line x1="60" y1="20" x2="60" y2="104"/><line x1="100" y1="20" x2="100" y2="104"/><line x1="140" y1="20" x2="140" y2="104"/>',
      cells: '<circle cx="55" cy="48" r="28"/><circle cx="100" cy="70" r="32"/><circle cx="145" cy="45" r="25"/><line x1="79" y1="60" x2="72" y2="58"/><line x1="126" y1="56" x2="119" y2="61"/>',
      frame: '<rect x="18" y="18" width="164" height="92"/><rect x="42" y="40" width="44" height="48"/><rect x="114" y="40" width="44" height="48"/><line x1="86" y1="64" x2="114" y2="64"/>',
      strata: '<path d="M12 86 C48 54, 72 102, 112 66 S166 38, 190 72"/><path d="M12 104 C48 72, 80 116, 116 86 S168 58, 190 90"/><path d="M12 68 C54 36, 82 84, 120 50 S166 22, 190 54"/>',
      archive: '<rect x="28" y="22" width="48" height="68"/><rect x="86" y="34" width="38" height="56"/><rect x="134" y="18" width="38" height="72"/><line x1="28" y1="104" x2="172" y2="104"/>',
      theater: '<path d="M26 96 C54 26, 146 26, 174 96"/><path d="M52 96 C74 50, 126 50, 148 96"/><line x1="100" y1="34" x2="100" y2="108"/><line x1="26" y1="96" x2="174" y2="96"/>',
      assembly: '<polygon points="34,26 92,26 92,74 34,74"/><polygon points="108,44 168,44 168,96 108,96"/><line x1="92" y1="52" x2="108" y2="62"/><line x1="92" y1="74" x2="108" y2="84"/>',
      porous: '<rect x="18" y="18" width="164" height="90"/><circle cx="58" cy="52" r="14"/><circle cx="105" cy="76" r="18"/><circle cx="145" cy="48" r="12"/><line x1="58" y1="66" x2="105" y2="58"/><line x1="119" y1="64" x2="145" y2="60"/>'
    };

    const svg = [
      '<svg viewBox="0 0 200 124" role="img" aria-label="Plan placeholder for ',
      title,
      '" xmlns="http://www.w3.org/2000/svg">',
      '<rect x="1" y="1" width="198" height="122" fill="none"/>',
      '<g fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke">',
      lines[variant] || lines.grid,
      "</g>",
      showTitle
        ? '<text x="16" y="116" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="8" fill="currentColor">'
        : "",
      showTitle ? title : "",
      showTitle ? "</text>" : "",
      "</svg>"
    ].join("");

    return svg;
  }

  function heroSvg(project, index, explicitImage = "") {
    const heroImage = explicitImage || project.heroImage || project.thumbnail;
    if (heroImage && !/\.pdf$/i.test(heroImage)) {
      const imageSrc = optimizedSrc(heroImage.includes("/") ? heroImage : `${project.imageBase || ""}${heroImage}`);
      return [
        '<article class="hero-slide hero-slide--image" aria-label="',
        escapeHtml(project.title),
        '">',
        '<img class="hero-image" src="',
        escapeHtml(imageSrc),
        '" alt="',
        escapeHtml(project.title),
        '" loading="',
        index === 0 ? "eager" : "lazy",
        '">',
        "</article>"
      ].join("");
    }

    const variant = project.shape || "grid";
    const plan = planSvg(project, variant)
      .replace("<svg ", '<svg class="hero-plan" ')
      .replace('viewBox="0 0 200 124"', 'viewBox="0 0 200 124"');
    const rhythm = index % 2 === 0 ? "0deg" : "180deg";

    return [
      '<article class="hero-slide" style="--slide-rotation:',
      rhythm,
      '" aria-label="',
      escapeHtml(project.title),
      '">',
      '<div class="hero-slide-grid">',
      plan,
      plan,
      plan,
      plan,
      "</div>",
      "</article>"
    ].join("");
  }

  function cadavrePlanMarkup(project) {
    const planMap = {
      "curanto-cookhouse": {
        src: "assets/images/cadavre plans/processed/cadavre-curanto-cookhouse.svg",
        shape: "tall"
      },
      "hunters-point": {
        src: "assets/images/cadavre plans/processed/cadavre-hunters-point.svg",
        shape: "wide"
      },
      "wood-street-pool": {
        src: "assets/images/cadavre plans/processed/cadavre-wood-street-pool.png",
        shape: "square"
      }
    };
    const plan = planMap[project.id];
    if (!plan) return "";
    return [
      '<img class="cadavre-plan-image cadavre-plan-image--',
      escapeHtml(plan.shape),
      '" src="',
      escapeHtml(plan.src),
      '" alt="',
      escapeHtml(project.title),
      ' plan">'
    ].join("");
  }

  function renderHero() {
    const carousel = document.querySelector("[data-hero-carousel]");
    if (!carousel) return;

    const byId = new Map(projects.map((project) => [project.id, project]));
    const orderedHeroEntries = [
      ["borinquen-healing-center", "Andrew Wheat_ajw288_Problem 03C_Final Model (15).png"],
      ["hunters-point", "hero.png"],
      ["hunters-point", "Front Facade Render More Saturated.png"],
      ["enfield-food-pantry", "Work Cover Photo.png"],
      ["enfield-food-pantry", "ZOOMED OUT RENDER FINAL edited tall.png"],
      ["deconstruct-reconfigure", "MODEL 01 cropped.png"],
      ["curanto-cookhouse", "hero.jpg"],
      ["curanto-cookhouse", "hero 2.jpg"],
      ["wood-street-pool", "hero.png"],
      ["wood-street-pool", "hero 2.png"],
      ["a-chair-is-a-toy", "main hero shot.png"],
      ["design-district-canteen", "Model Front View Shot 01.png"],
      ["york-prize", "Andrew Wheat_ajw288_01C_York Model (1).jpg"],
      ["woven-pavilion", "hero.jpg"]
    ];
    const slidesToRender = orderedHeroEntries
      .map(([id, image], index) => {
        const project = byId.get(id);
        return project ? heroSvg(project, index, image) : "";
      })
      .filter(Boolean);

    carousel.innerHTML = slidesToRender.join("");
    const slides = Array.from(carousel.querySelectorAll(".hero-slide"));
    const images = Array.from(carousel.querySelectorAll(".hero-image"));
    let active = 0;

    function updateHeight() {
      const image = images[active];
      if (!image) return;
      const height = image.complete && image.naturalWidth
        ? (carousel.clientWidth / image.naturalWidth) * image.naturalHeight
        : image.getBoundingClientRect().height;
      if (height > 0) carousel.style.height = `${Math.ceil(height)}px`;
    }

    function setActive(next) {
      slides.forEach((slide, index) => slide.classList.toggle("active", index === next));
      active = next;
      updateHeight();
    }

    images.forEach((image) => {
      if (image.complete) return;
      image.addEventListener("load", updateHeight, { once: true });
    });

    setActive(0);
    window.addEventListener("resize", updateHeight, { passive: true });
    if (!reduceMotion && slides.length > 1) {
      window.setInterval(() => setActive((active + 1) % slides.length), 4600);
    }
  }

  function renderWordMarquee() {
    const tracks = Array.from(document.querySelectorAll("[data-word-marquee]"));
    if (!tracks.length) return;
    const terms = words.length ? words : ["connection"];

    tracks.forEach((track, trackIndex) => {
      let offset = trackIndex * 3;
      const visibleCount = Math.min(Number.parseInt(track.dataset.visibleCount || "4", 10), terms.length);

      function visibleTerms() {
        return Array.from({ length: visibleCount }, (_, index) => terms[(offset + index) % terms.length]);
      }

      function renderTerms() {
        const tokens = visibleTerms().flatMap((word, index) =>
          index === visibleCount - 1
            ? [word]
            : [word, "+"]
        );
        track.innerHTML = tokens
          .map((token, index) =>
            `<span class="marquee-token" style="--token-index:${index}">${escapeHtml(token)}</span>`
          )
          .join("");

        window.requestAnimationFrame(() => {
          Array.from(track.querySelectorAll(".marquee-token")).forEach((token) => token.classList.add("is-visible"));
        });
      }

      renderTerms();

      if (reduceMotion || terms.length <= visibleCount) return;
      window.setInterval(() => {
        Array.from(track.querySelectorAll(".marquee-token")).forEach((token) => token.classList.remove("is-visible"));
        window.setTimeout(() => {
          offset = (offset + 1) % terms.length;
          renderTerms();
        }, 850);
      }, 6200 + trackIndex * 500);
    });
  }

  function initCustomCursor() {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const cursor = document.createElement("div");
    cursor.className = "site-cursor";
    cursor.setAttribute("aria-hidden", "true");
    document.body.appendChild(cursor);
    document.body.classList.add("has-custom-cursor");

    let pointerX = 0;
    let pointerY = 0;
    let pointerDown = false;
    let ticking = false;

    function scheduleMove() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        cursor.style.transform = `translate(${pointerX}px, ${pointerY}px) translate(-50%, -50%)`;
        ticking = false;
      });
    }

    function updateMode(target) {
      const element = target instanceof Element ? target : null;
      const isRotate = Boolean(element?.closest(".rotate-handle"));
      const isResize = Boolean(element?.closest(".resize-handle"));
      const isInteractive = Boolean(element?.closest("a, button, select, input, textarea"));

      cursor.classList.toggle("is-rotate", isRotate);
      cursor.classList.toggle("is-resize", isResize && !isRotate);
      cursor.classList.toggle("is-active", pointerDown || (isInteractive && !isRotate && !isResize));
    }

    window.addEventListener("pointermove", (event) => {
      if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      cursor.classList.add("is-visible");
      updateMode(event.target);
      scheduleMove();
    }, { passive: true });

    window.addEventListener("pointerdown", (event) => {
      if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      pointerDown = true;
      updateMode(event.target);
    }, { passive: true });

    window.addEventListener("pointerup", (event) => {
      if (event.pointerType && event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      pointerDown = false;
      updateMode(event.target);
    }, { passive: true });

    document.addEventListener("mouseleave", () => {
      cursor.classList.remove("is-visible");
    });

    document.addEventListener("mouseenter", () => {
      cursor.classList.add("is-visible");
    });
  }

  function initMobileMenu() {
    document.querySelectorAll(".site-header").forEach((header) => {
      const nav = header.querySelector(".site-nav");
      if (!nav || header.querySelector(".menu-toggle")) return;

      const button = document.createElement("button");
      const navId = nav.id || `site-nav-${Math.random().toString(36).slice(2, 8)}`;
      nav.id = navId;
      button.className = "menu-toggle";
      button.type = "button";
      button.setAttribute("aria-label", "Open menu");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-controls", navId);
      button.innerHTML = '<span></span><span></span>';
      header.insertBefore(button, nav);

      button.addEventListener("click", () => {
        const isOpen = header.classList.toggle("is-menu-open");
        button.setAttribute("aria-expanded", String(isOpen));
        button.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      });

      nav.addEventListener("click", (event) => {
        if (!(event.target instanceof Element) || !event.target.closest("a")) return;
        header.classList.remove("is-menu-open");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "Open menu");
      });
    });
  }

  function renderHalftoneTitle() {
    const titles = Array.from(document.querySelectorAll("[data-halftone-title]"));
    titles.forEach((title) => {
      if (title.closest(".cadavre-title")) {
        createSlicedTitle(title);
      } else {
        createHalftoneTitle(title);
      }
    });
  }

  function createSlicedTitle(title) {
    const text = title.dataset.halftoneText || title.textContent.trim();
    const progressDelay = Number.parseFloat(title.dataset.halftoneDelay || "0") || 0;
    const scrollSource = title.closest("[data-cadavre-intro]") || title;
    let ticking = false;
    let pieces = [];
    let progress = 0;

    buildPieces();

    function buildPieces() {
      title.classList.remove("is-ready");
      title.classList.add("sliced-title");

      const letters = Array.from(text);
      const piecesPerLetter = 4;
      let pieceIndex = 0;
      const fragmentMarkup = letters
        .map((letter, letterIndex) => {
          const letterPieces = Array.from({ length: piecesPerLetter }, (_, localIndex) => {
            const block = createLetterBlockShape(localIndex, letterIndex, text.length);
            const wordCenterX = ((letterIndex + block.centerX / 100) / letters.length) * 100;
            pieceIndex += 1;

            return [
              '<span class="sliced-title-piece sliced-title-piece--',
              block.kind,
              '" aria-hidden="true" style="clip-path: polygon(',
              block.clip,
              ')" data-piece="',
              pieceIndex,
              '" data-center-x="',
              wordCenterX.toFixed(2),
              '" data-center-y="',
              block.centerY.toFixed(2),
              '">',
              escapeHtml(letter),
              "</span>"
            ].join("");
          }).join("");

          return [
            '<span class="sliced-letter">',
            '<span class="sliced-letter-fill" aria-hidden="true">',
            escapeHtml(letter),
            "</span>",
            letterPieces,
            "</span>"
          ].join("");
        })
        .join("");

      title.innerHTML = [
        '<span class="sliced-title-normal">',
        escapeHtml(text),
        "</span>",
        '<span class="sliced-title-pieces" aria-hidden="true">',
        fragmentMarkup,
        "</span>"
      ].join("");

      pieces = Array.from(title.querySelectorAll(".sliced-title-piece")).map((piece, index) => {
        const noiseA = seededNoise(index + text.length * 3, text.length);
        const noiseB = seededNoise(index + text.length * 5, index * 2);
        const centerX = Number.parseFloat(piece.dataset.centerX || "50");
        const centerY = Number.parseFloat(piece.dataset.centerY || "50");
        const fromLeft = centerX < 50;
        const fromTop = centerY < 50;
        const horizontalDistance = 220 + noiseA * 420;
        const verticalDistance = 90 + noiseB * 260;
        const crossDrift = (seededNoise(index * 17, text.length) - 0.5) * 210;

        return {
          element: piece,
          dx: (fromLeft ? -1 : 1) * horizontalDistance,
          dy: (fromTop ? -1 : 1) * verticalDistance + crossDrift,
          rotation: (fromLeft ? -1 : 1) * (8 + noiseA * 28),
          delay: noiseA * 0.22
        };
      });

      title.classList.add("is-ready");
      update();
    }

    function update() {
      const rect = scrollSource.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
      const cadavreTitle = title.closest(".cadavre-title");
      const rawProgress = reduceMotion
        ? 1
        : cadavreTitle
          ? getCadavreSequenceProgress(scrollSource, viewportHeight)
          : getLocalTitleProgress(rect, viewportHeight);
      const assembleProgress = cadavreTitle ? clamp(rawProgress / 0.42, 0, 1) : rawProgress;
      progress = clamp((assembleProgress - progressDelay) / (1 - progressDelay), 0, 1);

      const resolve = easeInOutCubic(progress);
      const joinProgress = easeInOutCubic(clamp((rawProgress - 0.42) / 0.18, 0, 1));
      if (cadavreTitle) {
        updateCadavreJoin(cadavreTitle, joinProgress);
        updateCadavreScrollLayer(cadavreTitle, rawProgress, joinProgress);
      }
      title.style.setProperty("--sliced-normal-opacity", "0");

      pieces.forEach((piece) => {
        const localProgress = clamp((resolve - piece.delay * 0.34) / (1 - piece.delay * 0.34), 0, 1);
        const gather = easeOutCubic(localProgress);
        const lockAssembled = joinProgress > 0.96;
        const x = lockAssembled ? 0 : piece.dx * (1 - gather);
        const y = lockAssembled ? 0 : piece.dy * (1 - gather);
        const rotation = lockAssembled ? 0 : piece.rotation * (1 - gather);

        piece.element.style.opacity = "1";
        piece.element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${rotation.toFixed(2)}deg)`;
      });
    }

    function getLocalTitleProgress(rect, viewportHeight) {
      const start = viewportHeight * 0.48;
      const end = viewportHeight * -0.14;
      return clamp((start - rect.top) / (start - end), 0, 1);
    }

    function getCadavreSequenceProgress(source, viewportHeight) {
      const board = document.querySelector(".contents-board");
      const sourceRect = source.getBoundingClientRect();
      const boardRect = board?.getBoundingClientRect();
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const startScroll = scrollY + sourceRect.top - viewportHeight * 0.52;
      const endScroll = boardRect
        ? scrollY + boardRect.top - viewportHeight * 0.38
        : startScroll + viewportHeight * 1.45;
      const range = Math.max(endScroll - startScroll, viewportHeight * 0.9);

      return clamp((scrollY - startScroll) / range, 0, 1);
    }

    function scheduleUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });

    function updateCadavreJoin(cadavreTitle, joinProgress) {
      const topLine = cadavreTitle.querySelector(".cadavre-title-line--left");
      const bottomLine = cadavreTitle.querySelector(".cadavre-title-line--right");
      if (!topLine || !bottomLine || !topLine.classList.contains("is-ready") || !bottomLine.classList.contains("is-ready")) {
        return;
      }

      const topText = topLine.dataset.halftoneText || topLine.textContent.trim();
      const bottomText = bottomLine.dataset.halftoneText || bottomLine.textContent.trim();
      const prefixText = topText.slice(0, -1);
      const sharedLetter = topText.slice(-1);
      const prefixWidth = measureRenderedText(topLine, prefixText);
      const sharedWidth = measureRenderedText(topLine, sharedLetter);
      const bottomWidth = measureRenderedText(bottomLine, bottomText);
      const joinedWidth = prefixWidth + bottomWidth;
      const sharedCenter = prefixWidth + sharedWidth / 2;
      const finalShiftX = joinedWidth / 2 - sharedCenter;
      const topHeight = topLine.getBoundingClientRect().height || Number.parseFloat(window.getComputedStyle(topLine).fontSize) || 0;
      const initialGap = (Number.parseFloat(window.getComputedStyle(topLine).fontSize) || 0) * 0.62;

      cadavreTitle.style.setProperty("--cadavre-shift-x", `${lerp(0, finalShiftX, joinProgress).toFixed(3)}px`);
      cadavreTitle.style.setProperty("--cadavre-line-gap", `${lerp(initialGap, -topHeight, joinProgress).toFixed(3)}px`);
      cadavreTitle.style.setProperty("--cadavre-line-x", `${lerp(0, prefixWidth, joinProgress).toFixed(3)}px`);
      cadavreTitle.style.setProperty("--cadavre-line-height", "0.86");
    }

    function updateCadavreScrollLayer(cadavreTitle, rawProgress, joinProgress) {
      const lockup = cadavreTitle.closest("[data-cadavre-lockup]");
      if (!lockup) return;
      const joined = joinProgress > 0.985;
      const board = document.querySelector(".contents-board");
      const boardTop = board?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;

      lockup.classList.remove("is-difference-layer");
      lockup.style.setProperty("--cadavre-fall-y", "0px");
      lockup.style.setProperty("--cadavre-blur", "0px");
      lockup.style.setProperty("--cadavre-fade", "1");

      if (joined && boardTop < viewportHeight * 0.62 && lockup.dataset.sequenceComplete !== "true") {
        lockup.dataset.sequenceComplete = "true";
        document.dispatchEvent(new CustomEvent("cadavre:title-complete"));
      }
    }

    function measureRenderedText(element, value) {
      const computed = window.getComputedStyle(element);
      const fontSize = Number.parseFloat(computed.fontSize) || 96;
      const fontWeight = computed.fontWeight || "900";
      const fontFamily = computed.fontFamily || "Arial, Helvetica, sans-serif";
      const fontStyle = computed.fontStyle || "normal";
      const canvas = measureRenderedText.canvas || (measureRenderedText.canvas = document.createElement("canvas"));
      const context = canvas.getContext("2d");
      if (!context) return 0;
      context.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      return context.measureText(value).width;
    }

    function createLetterBlockShape(localIndex, letterIndex, seed) {
      const shapes = [
        { kind: "top-block", points: [[-4, -4], [104, -4], [99, 54], [-2, 48]], centerX: 50, centerY: 24 },
        { kind: "left-block", points: [[-4, 38], [57, 34], [52, 104], [-4, 104]], centerX: 26, centerY: 70 },
        { kind: "right-block", points: [[45, 31], [104, 36], [104, 104], [50, 101]], centerX: 76, centerY: 69 },
        { kind: "cross-block", points: [[9, 46], [94, 42], [100, 74], [4, 78]], centerX: 52, centerY: 60 }
      ];
      const source = shapes[localIndex] || shapes[0];
      const skew = (seededNoise(letterIndex * 31 + localIndex * 7, seed) - 0.5) * 4;
      const lift = (seededNoise(letterIndex * 37 + localIndex * 11, seed) - 0.5) * 4;
      const points = source.points.map(([x, y], pointIndex) => [
        x + skew * (pointIndex % 2 === 0 ? 1 : -0.5),
        y + lift * (pointIndex < 2 ? 1 : -0.5)
      ]);

      return {
        centerX: source.centerX,
        centerY: source.centerY,
        kind: source.kind,
        clip: points
          .map(([x, y]) => `${clamp(x, -8, 108).toFixed(2)}% ${clamp(y, -8, 108).toFixed(2)}%`)
          .join(", ")
      };
    }
  }

  function createHalftoneTitle(title) {
    const mode = title.dataset.halftoneMode || "hover";
    const text = title.dataset.halftoneText || title.textContent.trim();
    const progressDelay = Number.parseFloat(title.dataset.halftoneDelay || "0") || 0;
    const scrollSource = title.closest("[data-cadavre-intro]") || title;
    let ticking = false;
    let buildTicking = false;
    let dots = [];
    let circles = [];
    let svg = null;
    let progress = 0;

    buildDots();

    function buildDots() {
      title.classList.remove("is-ready");
      title.classList.add("halftone-title");

      const computed = window.getComputedStyle(title);
      const fontSize = Number.parseFloat(computed.fontSize) || 96;
      const fontWeight = computed.fontWeight || "900";
      const fontFamily = computed.fontFamily || "Arial, Helvetica, sans-serif";
      const fontStyle = computed.fontStyle || "normal";
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;

      context.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      const metrics = context.measureText(text);
      const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.74;
      const descent = metrics.actualBoundingBoxDescent || fontSize * 0.22;
      const margin = Math.ceil(fontSize * 0.24);
      const width = Math.ceil(metrics.width + margin * 2);
      const height = Math.ceil(ascent + descent + margin * 2);
      const baseline = margin + ascent;
      const step = clamp(fontSize * 0.075, 5.5, 10.5);
      const centerX = width / 2;
      const centerY = height / 2;

      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#000";
      context.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      context.textBaseline = "alphabetic";
      context.fillText(text, margin, baseline);

      const imageData = context.getImageData(0, 0, width, height).data;
      dots = [];

      for (let y = margin * 0.28; y < height - margin * 0.16; y += step) {
        for (let x = margin * 0.18; x < width - margin * 0.12; x += step) {
          const alpha = sampleAlpha(imageData, width, height, x, y);
          if (alpha < 0.18) continue;

          const interior = getInteriorDensity(imageData, width, height, x, y, step);
          const directionX = x - centerX;
          const directionY = y - centerY;
          const distance = Math.max(Math.hypot(directionX, directionY), 1);
          const jitter = seededNoise(x, y);
          const drift = fontSize * (0.2 + jitter * 0.46);

          dots.push({
            x,
            y,
            r: step * (0.12 + interior * 0.46),
            finalR: step * (0.2 + interior * 1.12),
            dx: (directionX / distance) * drift + (jitter - 0.5) * fontSize * 0.38,
            dy: (directionY / distance) * drift + (seededNoise(y, x) - 0.5) * fontSize * 0.3,
            delay: jitter * 0.18
          });
        }
      }

      title.innerHTML = [
        '<span class="halftone-normal">',
        escapeHtml(text),
        "</span>",
        '<svg class="halftone-svg" aria-hidden="true" focusable="false" viewBox="0 0 ',
        width,
        " ",
        height,
        '" preserveAspectRatio="xMidYMid meet"></svg>'
      ].join("");

      title.style.setProperty("--halftone-width", `${width}px`);
      title.style.setProperty("--halftone-height", `${height}px`);
      title.classList.add("is-ready");
      svg = title.querySelector(".halftone-svg");
      if (!svg) return;
      svg.innerHTML = dots
        .map((dot, index) =>
          [
            '<circle cx="',
            dot.x.toFixed(2),
            '" cy="',
            dot.y.toFixed(2),
            '" r="0" opacity="0" data-dot="',
            index,
            '"></circle>'
          ].join("")
        )
        .join("");
      circles = Array.from(svg.querySelectorAll("circle"));
      update();
    }

    function update() {
      if (mode === "scroll") {
        const rect = scrollSource.getBoundingClientRect();
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
        const start = viewportHeight * 0.86;
        const end = viewportHeight * 0.18;
        const rawProgress = reduceMotion ? 1 : clamp((start - rect.top) / (start - end), 0, 1);
        progress = clamp((rawProgress - progressDelay) / (1 - progressDelay), 0, 1);
      } else {
        progress = 1;
      }

      const normalOpacity = mode === "scroll" ? easeInOutCubic(clamp((progress - 0.88) / 0.12, 0, 1)) : 1;
      const dotOpacity = mode === "scroll" ? clamp(1 - (progress - 0.72) / 0.24, 0, 1) : 0;
      const resolve = easeInOutCubic(progress);

      title.style.setProperty("--halftone-normal-opacity", normalOpacity.toFixed(3));

      dots.forEach((dot, index) => {
        const circle = circles[index];
        if (!circle) return;
        const localResolve = clamp((resolve - dot.delay * 0.38) / (1 - dot.delay * 0.38), 0, 1);
        const gather = easeOutCubic(localResolve);
        const radius = lerp(dot.finalR, dot.r, gather);
        const opacity = dotOpacity * clamp(1.08 - gather * 0.16, 0, 1);

        circle.setAttribute("cx", (dot.x + dot.dx * (1 - gather)).toFixed(2));
        circle.setAttribute("cy", (dot.y + dot.dy * (1 - gather)).toFixed(2));
        circle.setAttribute("r", radius.toFixed(2));
        circle.setAttribute("opacity", opacity.toFixed(3));
      });
    }

    function scheduleUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }

    function scheduleBuild() {
      if (buildTicking) return;
      buildTicking = true;
      window.requestAnimationFrame(() => {
        buildDots();
        buildTicking = false;
      });
    }

    if (mode === "scroll") {
      window.addEventListener("scroll", scheduleUpdate, { passive: true });
    }
    window.addEventListener("resize", scheduleBuild, { passive: true });
  }

  function renderPlanField() {
    const field = document.querySelector("[data-plan-field]");
    if (!field) return;
    const scatterSlots = createScatterSlots(projects.length);
    field.innerHTML = projects
      .map((project, index) => {
        const scatter = scatterSlots[index] || { x: project.position?.x ?? 50, y: project.position?.y ?? 50 };
        const rotation = randomBetween(-17, 17);
        const stackX = 50 + ((index % 5) - 2) * 1.25 + Math.floor(index / 5) * 0.75;
        const stackY = 51 + ((index % 4) - 1.5) * 1.25 - Math.floor(index / 5) * 0.6;
        const stackRotation = (index % 2 === 0 ? -1 : 1) * (2.5 + (index % 5) * 1.15);
        const grainA = 18 + ((index * 23) % 64);
        const grainB = 21 + ((index * 31) % 58);
        const grainRot = 72 + ((index * 37) % 96);
        const windX = randomBetween(-9, 9);
        const windY = randomBetween(-7, 7);
        const windRotation = randomBetween(-16, 16);
        const delay = randomBetween(120, 680) + index * 34;
        const duration = randomBetween(1700, 2900);
        return [
          '<button class="plan-fragment" type="button" style="--x:',
          stackX,
          "%;--y:",
          stackY,
          "%;--rotation:",
          stackRotation,
          ";--grain-a:",
          grainA,
          "%;--grain-b:",
          grainB,
          "%;--grain-rot:",
          grainRot,
          'deg" data-project-id="',
          project.id,
          '" data-target-x="',
          scatter.x,
          '" data-target-y="',
          scatter.y,
          '" data-target-rotation="',
          rotation,
          '" data-stack-x="',
          stackX,
          '" data-stack-y="',
          stackY,
          '" data-stack-rotation="',
          stackRotation,
          '" data-wind-x="',
          windX,
          '" data-wind-y="',
          windY,
          '" data-wind-rotation="',
          windRotation,
          '" data-delay="',
          delay,
          '" data-duration="',
          duration,
          '" aria-label="Open ',
          escapeHtml(project.title),
          '">',
          cadavrePlanMarkup(project) || planSvg(project, project.shape, { showTitle: false }),
          '<span class="rotate-handle rotate-handle--nw" aria-hidden="true"></span>',
          '<span class="rotate-handle rotate-handle--ne" aria-hidden="true"></span>',
          '<span class="rotate-handle rotate-handle--se" aria-hidden="true"></span>',
          '<span class="rotate-handle rotate-handle--sw" aria-hidden="true"></span>',
          '<span class="resize-handle resize-handle--nw" aria-hidden="true"></span>',
          '<span class="resize-handle resize-handle--ne" aria-hidden="true"></span>',
          '<span class="resize-handle resize-handle--se" aria-hidden="true"></span>',
          '<span class="resize-handle resize-handle--sw" aria-hidden="true"></span>',
          "</button>"
        ].join("");
      })
      .join("");
    enableDragging(field);
  }

  function enableDragging(field) {
    const fragments = Array.from(field.querySelectorAll(".plan-fragment"));
    let topLayer = 20;

    const controllers = fragments.map((fragment) => {
      const rotateHandles = Array.from(fragment.querySelectorAll(".rotate-handle"));
      const resizeHandles = Array.from(fragment.querySelectorAll(".resize-handle"));
      let pointerId = null;
      let action = null;
      let moved = false;
      let hasScattered = false;
      let scatterTimer = null;
      let animationFrame = null;
      let dragBounds = null;
      let startPointerX = 0;
      let startPointerY = 0;
      let startCenterX = 0;
      let startCenterY = 0;
      let startRotation = 0;
      let startAngle = 0;
      let startDistance = 1;
      let startWidth = 0;
      let baseWidth = fragment.offsetWidth;
      let userControlled = false;
      const target = {
        x: Number.parseFloat(fragment.dataset.targetX) || 50,
        y: Number.parseFloat(fragment.dataset.targetY) || 50,
        rotation: Number.parseFloat(fragment.dataset.targetRotation) || 0
      };
      const wind = {
        x: Number.parseFloat(fragment.dataset.windX) || 0,
        y: Number.parseFloat(fragment.dataset.windY) || 0,
        rotation: Number.parseFloat(fragment.dataset.windRotation) || 0
      };
      const stack = {
        x: Number.parseFloat(fragment.dataset.stackX) || 50,
        y: Number.parseFloat(fragment.dataset.stackY) || 50,
        rotation: Number.parseFloat(fragment.dataset.stackRotation) || 0
      };
      const delay = Number.parseFloat(fragment.dataset.delay) || 0;
      const duration = Number.parseFloat(fragment.dataset.duration) || 2200;
      const state = {
        x: 0,
        y: 0,
        width: baseWidth,
        rotation: stack.rotation
      };

      placeAt(stack);

      rotateHandles.forEach((rotateHandle) => {
        rotateHandle.addEventListener("pointerdown", (event) => {
          startGesture("rotate", event, rotateHandle);
        });

        rotateHandle.addEventListener("pointermove", (event) => {
          if (action !== "rotate" || pointerId !== event.pointerId) return;
          state.rotation = normalizeRotation(startRotation + pointerAngle(event) - startAngle);
          moved = true;
          applyState();
        });

        rotateHandle.addEventListener("pointerup", (event) => {
          endGesture(event, rotateHandle);
        });

        rotateHandle.addEventListener("pointercancel", (event) => {
          endGesture(event, rotateHandle);
        });
      });

      resizeHandles.forEach((resizeHandle) => {
        resizeHandle.addEventListener("pointerdown", (event) => {
          startGesture("resize", event, resizeHandle);
        });

        resizeHandle.addEventListener("pointermove", (event) => {
          if (action !== "resize" || pointerId !== event.pointerId) return;
          const ratio = pointerDistance(event) / startDistance;
          const maxWidth = Math.min(1800, Math.max(field.clientWidth * 1.28, 860));
          const nextWidth = clamp(startWidth * ratio, 110, maxWidth);
          state.width = nextWidth;
          moved = true;
          applyState();
        });

        resizeHandle.addEventListener("pointerup", (event) => {
          endGesture(event, resizeHandle);
        });

        resizeHandle.addEventListener("pointercancel", (event) => {
          endGesture(event, resizeHandle);
        });
      });

      fragment.addEventListener("pointerdown", (event) => {
        if (event.target.closest(".rotate-handle, .resize-handle")) return;
        startGesture("drag", event, fragment);
      });

      fragment.addEventListener("pointermove", (event) => {
        if (action !== "drag" || pointerId !== event.pointerId) return;
        const dx = event.clientX - startPointerX;
        const dy = event.clientY - startPointerY;
        if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
        const bounds = dragBounds || getPageDragBounds();
        state.x = clamp(startCenterX + dx, bounds.minX, bounds.maxX);
        state.y = clamp(startCenterY + dy, bounds.minY, bounds.maxY);
        applyState();
      });

      fragment.addEventListener("pointerup", (event) => {
        if (action !== "drag" || pointerId !== event.pointerId) return;
        const shouldOpen = !moved;
        endGesture(event, fragment);
        if (shouldOpen) {
          window.location.href = `project.html?id=${fragment.dataset.projectId}`;
        }
      });

      fragment.addEventListener("pointercancel", (event) => {
        endGesture(event, fragment);
      });

      function startGesture(nextAction, event, captureTarget) {
        event.preventDefault();
        event.stopPropagation();
        userControlled = true;
        cancelScatter();
        pointerId = event.pointerId;
        action = nextAction;
        moved = nextAction !== "drag";
        startPointerX = event.clientX;
        startPointerY = event.clientY;
        startCenterX = state.x;
        startCenterY = state.y;
        startRotation = state.rotation;
        startAngle = pointerAngle(event);
        startDistance = Math.max(pointerDistance(event), 1);
        startWidth = state.width;
        dragBounds = nextAction === "drag" ? getPageDragBounds() : null;
        fragment.classList.toggle("dragging", nextAction === "drag");
        fragment.classList.toggle("rotating", nextAction === "rotate");
        fragment.classList.toggle("resizing", nextAction === "resize");
        fragment.style.zIndex = String(++topLayer);
        if (captureTarget.setPointerCapture) {
          captureTarget.setPointerCapture(pointerId);
        }
      }

      function endGesture(event, captureTarget, clearClasses = true) {
        if (pointerId !== event.pointerId) return;
        if (clearClasses) {
          fragment.classList.remove("dragging", "rotating", "resizing");
        }
        if (captureTarget.hasPointerCapture?.(event.pointerId)) {
          captureTarget.releasePointerCapture(event.pointerId);
        }
        pointerId = null;
        action = null;
        dragBounds = null;
      }

      function scatter(jump = false) {
        if (hasScattered || userControlled || action) return;
        hasScattered = true;

        if (jump) {
          placeAt(target);
          return;
        }

        const startState = { ...state };
        const targetPoint = percentPoint(target);
        const targetRotation = normalizeRotation(target.rotation + wind.rotation * 0.18);

        scatterTimer = window.setTimeout(() => {
          const startTime = performance.now();

          function step(now) {
            if (userControlled || action) return;
            const progress = clamp((now - startTime) / duration, 0, 1);
            const spread = easeOutCubic(progress);
            state.x = lerp(startState.x, targetPoint.x, spread);
            state.y = lerp(startState.y, targetPoint.y, spread);
            state.rotation = normalizeRotation(lerp(startState.rotation, targetRotation, spread));

            state.width = baseWidth;
            applyState();

            if (progress < 1) {
              animationFrame = window.requestAnimationFrame(step);
            } else {
              state.x = targetPoint.x;
              state.y = targetPoint.y;
              state.rotation = targetRotation;
              applyState();
              animationFrame = null;
            }
          }

          animationFrame = window.requestAnimationFrame(step);
        }, delay);
      }

      function refreshBaseWidth() {
        if (userControlled) return;
        fragment.style.width = "";
        baseWidth = fragment.offsetWidth;
        state.width = baseWidth;
        if (hasScattered) {
          placeAt(target);
        } else {
          placeAt(stack);
        }
      }

      function applyState() {
        fragment.style.left = `${state.x}px`;
        fragment.style.top = `${state.y}px`;
        fragment.style.width = `${state.width}px`;
        fragment.style.setProperty("--rotation", state.rotation);
        fragment.dataset.rotation = String(state.rotation);
      }

      function placeAt(point) {
        const pixelPoint = percentPoint(point);
        state.x = pixelPoint.x;
        state.y = pixelPoint.y;
        state.rotation = normalizeRotation(point.rotation || 0);
        state.width = baseWidth;
        applyState();
      }

      function pointerAngle(event) {
        const fieldRect = field.getBoundingClientRect();
        const centerX = fieldRect.left + state.x;
        const centerY = fieldRect.top + state.y;
        return (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI;
      }

      function pointerDistance(event) {
        const fieldRect = field.getBoundingClientRect();
        const centerX = fieldRect.left + state.x;
        const centerY = fieldRect.top + state.y;
        return Math.hypot(event.clientX - centerX, event.clientY - centerY);
      }

      function percentPoint(point) {
        return {
          x: (field.clientWidth * point.x) / 100,
          y: (field.clientHeight * point.y) / 100
        };
      }

      function getPageDragBounds() {
        const fieldRect = field.getBoundingClientRect();
        const fieldPageLeft = fieldRect.left + window.scrollX;
        const fieldPageTop = fieldRect.top + window.scrollY;
        const pageWidth = document.documentElement.clientWidth;
        const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        const allowance = state.width * 0.58;

        return {
          minX: -fieldPageLeft - allowance,
          maxX: pageWidth - fieldPageLeft + allowance,
          minY: -fieldPageTop - allowance,
          maxY: pageHeight - fieldPageTop + allowance
        };
      }

      function cancelScatter() {
        window.clearTimeout(scatterTimer);
        if (animationFrame) {
          window.cancelAnimationFrame(animationFrame);
        }
        scatterTimer = null;
        animationFrame = null;
      }

      return {
        scatter,
        refreshBaseWidth,
        placeAtTarget: () => placeAt(target)
      };
    });

    function releaseStack(jump = false) {
      field.classList.add("scattered");
      controllers.forEach((controller) => controller.scatter(jump));
    }

    let hasReleasedStack = false;
    function releaseStackOnce(jump = false) {
      if (hasReleasedStack) return;
      hasReleasedStack = true;
      window.setTimeout(() => releaseStack(jump), reduceMotion ? 0 : 280);
    }

    document.addEventListener("cadavre:title-complete", () => releaseStackOnce(reduceMotion), { once: true });

    if (reduceMotion) {
      releaseStackOnce(true);
    }

    window.addEventListener(
      "resize",
      () => {
        controllers.forEach((controller) => controller.refreshBaseWidth());
      },
      { passive: true }
    );

    function lerp(start, end, progress) {
      return start + (end - start) * progress;
    }

    function normalizeRotation(value) {
      let rotation = ((value + 180) % 360) - 180;
      if (rotation < -180) rotation += 360;
      return Math.round(rotation * 10) / 10;
    }
  }

  function renderCompactIndex() {
    const index = document.querySelector("[data-compact-index]");
    if (!index) return;
    index.innerHTML = projects
      .slice(0, 6)
      .map(
        (project, projectIndex) => `
          <a class="index-row" href="project.html?id=${project.id}">
            <span>${String(projectIndex + 1).padStart(2, "0")}</span>
            <span>${escapeHtml(project.title)}</span>
            <span>${escapeHtml(project.type)}</span>
            <span>${escapeHtml(project.year)}</span>
          </a>
        `
      )
      .join("");
  }

  function renderCatalogue() {
    const catalogue = document.querySelector("[data-work-catalogue]");
    if (!catalogue) return;
    const filter = document.querySelector("[data-theme-filter]");
    const availableProjectIds = new Set(projects.map((project) => project.id));
    const themeEntries = workThemeMap
      .map(([label, ids]) => [label, ids.filter((id) => availableProjectIds.has(id))])
      .filter(([, ids]) => ids.length);
    const themeLookup = new Map(themeEntries);
    const allThemes = themeEntries.map(([label]) => label);
    let activeTheme = "all";
    if (filter) {
      filter.innerHTML =
        '<option value="all">All themes</option>' +
        allThemes.map((theme) => `<option value="${theme}">${theme}</option>`).join("");
    }

    function draw() {
      activeTheme = filter?.value || activeTheme || "all";
      const visible =
        activeTheme === "all"
          ? projects
          : projects.filter((project) => (themeLookup.get(activeTheme) || []).includes(project.id));

      catalogue.innerHTML = visible.map(projectCard).join("");
      updateThemeButtons();
    }

    function setTheme(theme) {
      activeTheme = theme;
      if (filter) filter.value = theme;
      draw();
    }

    function updateThemeButtons() {
      document.querySelectorAll("[data-theme-token]").forEach((button) => {
        button.classList.toggle("active", button.dataset.themeToken === activeTheme);
      });
    }

    function renderThemeMarquee() {
      const track = document.querySelector("[data-work-theme-track]");
      if (!track || !allThemes.length) return;
      const viewport = track.closest(".marquee-window") || track.parentElement;
      let edgeVelocity = 0;
      let scrollFrame = 0;

      const tokens = allThemes.flatMap((theme, index) =>
        index === allThemes.length - 1
          ? [{ type: "theme", value: theme }]
          : [{ type: "theme", value: theme }, { type: "plus", value: "+" }]
      );
      track.innerHTML = tokens
        .map((token, index) => {
          if (token.type === "plus") {
            return `<span class="marquee-token marquee-plus is-visible" style="--token-index:${index}">+</span>`;
          }
          return `<button type="button" class="marquee-token marquee-filter is-visible" data-theme-token="${escapeHtml(token.value)}" style="--token-index:${index}">${escapeHtml(token.value)}</button>`;
        })
        .join("");
      updateThemeButtons();

      function scrollStep() {
        if (!viewport || Math.abs(edgeVelocity) < 0.1) {
          scrollFrame = 0;
          return;
        }
        viewport.scrollLeft += edgeVelocity;
        scrollFrame = window.requestAnimationFrame(scrollStep);
      }

      function setEdgeVelocity(event) {
        if (!viewport) return;
        const rect = viewport.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const edge = Math.min(170, rect.width * 0.26);
        const maxSpeed = 18;
        if (x < edge) {
          edgeVelocity = -maxSpeed * (1 - x / edge);
        } else if (x > rect.width - edge) {
          edgeVelocity = maxSpeed * (1 - (rect.width - x) / edge);
        } else {
          edgeVelocity = 0;
        }
        if (!scrollFrame && Math.abs(edgeVelocity) >= 0.1) {
          scrollFrame = window.requestAnimationFrame(scrollStep);
        }
      }

      viewport?.addEventListener("pointermove", setEdgeVelocity, { passive: true });
      viewport?.addEventListener("pointerleave", () => {
        edgeVelocity = 0;
      }, { passive: true });

      track.addEventListener("click", (event) => {
        const button = event.target instanceof Element ? event.target.closest("[data-theme-token]") : null;
        if (!button) return;
        setTheme(button.dataset.themeToken || "all");
      });
    }

    document.querySelectorAll("[data-theme-token='all']").forEach((button) => {
      button.addEventListener("click", () => setTheme("all"));
    });

    filter?.addEventListener("change", () => setTheme(filter.value || "all"));
    document.querySelectorAll("[data-view-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        document.querySelectorAll("[data-view-mode]").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        catalogue.dataset.view = button.dataset.viewMode;
      });
    });

    renderThemeMarquee();
    draw();
  }

  function projectCard(project, index) {
    const projectNumber = projects.indexOf(project) + 1;
    const thumbnail = project.workThumbnail || project.thumbnail;
    return `
      <a class="project-card" data-project-id="${escapeHtml(project.id)}" href="project.html?id=${project.id}">
        <figure class="project-thumb">
          ${thumbnail ? projectImage(project, thumbnail, project.title) : planSvg(project, project.shape)}
        </figure>
        <div class="project-card-text">
          <span class="project-number">${String(projectNumber).padStart(2, "0")}</span>
          <h2>${escapeHtml(project.title)}</h2>
          <p class="project-card-meta">${escapeHtml(project.year)} / ${escapeHtml(project.type)}</p>
          ${project.summary ? `<p class="project-card-summary">${escapeHtml(project.summary)}</p>` : ""}
        </div>
      </a>
    `;
  }

  function renderProjectDetail() {
    const root = document.querySelector("[data-project-detail]");
    if (!root) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id") || projects[0]?.id;
    const project = projects.find((item) => item.id === id) || projects[0];

    if (!project) {
      root.innerHTML = '<section class="section-grid page-intro"><h1>Project not found.</h1></section>';
      return;
    }

    document.title = `${project.title} | Andrew Wheat`;
    root.dataset.projectId = project.id;
    if (Array.isArray(project.story) && project.story.length) {
      root.innerHTML = projectEditorialDetail(project);
      return;
    }

    root.innerHTML = `
      <section class="project-hero reveal">
        <div class="project-hero-drawing">
          ${
            project.heroImage
              ? projectImage(project, project.heroImage, `${project.title} hero image`)
              : planSvg(project, project.shape)
          }
        </div>
        <div class="project-hero-text">
          <p class="section-kicker">${escapeHtml(project.type)}</p>
          <h1>${escapeHtml(project.title)}</h1>
          ${project.summary ? `<p class="project-summary">${escapeHtml(project.summary)}</p>` : ""}
          ${project.description ? `<p class="project-description">${escapeHtml(project.description)}</p>` : ""}
        </div>
      </section>
      <section class="project-meta reveal" aria-label="Project metadata">
        <div><span>Year</span>${escapeHtml(project.year)}</div>
        ${project.course ? `<div><span>Course</span>${escapeHtml(project.course)}</div>` : ""}
        ${project.studio ? `<div><span>Studio</span>${escapeHtml(project.studio)}</div>` : ""}
        <div><span>${escapeHtml(professorLabel(project))}</span>${escapeHtml(professorDisplay(project) || project.themes.join(", "))}</div>
        ${project.partners ? `<div><span>Partners</span>${escapeHtml(project.partners)}</div>` : ""}
        <div><span>Themes</span>${project.themes.map(escapeHtml).join(", ")}</div>
      </section>
      <section class="project-process reveal">
        ${project.question ? `<article class="project-question-subtitle"><p>${escapeHtml(project.question)}</p></article>` : ""}
        <article>
          <p class="section-kicker">${project.tectonics ? "Tectonics" : "Next"}</p>
          <p>${escapeHtml(project.tectonics || "Replace these placeholders with drawings, model images, process studies, and final documentation.")}</p>
        </article>
        ${
          project.contribution
            ? `<article><p class="section-kicker">Contribution</p><p>${escapeHtml(project.contribution)}</p></article>`
            : ""
        }
      </section>
      <section class="project-gallery reveal" aria-label="Project images">
        ${projectGallery(project)}
      </section>
      ${projectNavigation(project)}
    `;
  }

  function projectEditorialDetail(project) {
    const openingImage = project.overviewImage || project.story[0]?.src || project.heroImage || project.thumbnail;
    const storyImages = project.story.filter((image) => image.src !== openingImage);

    return `
      <section class="project-editorial-hero reveal">
        <figure class="project-editorial-cover">
          ${openingImage ? projectImage(project, openingImage, `${project.title} opening image`) : planSvg(project, project.shape)}
        </figure>
        <div class="project-editorial-text">
          <h1>${escapeHtml(project.title)}</h1>
          ${projectMetadataLines(project)}
          <p>${escapeHtml([project.summary, project.description].filter(Boolean).join(" "))}</p>
          <p>${escapeHtml([project.tectonics, project.contribution].filter(Boolean).join(" "))}</p>
        </div>
      </section>
      ${
        project.preQuestionImage
          ? `<section class="project-pre-question reveal">
              <figure>
                ${projectImage(project, project.preQuestionImage, project.preQuestionImageAlt || project.title)}
              </figure>
            </section>`
          : ""
      }
      ${
        project.question
          ? `<section class="project-annotations" aria-label="Project framework">
              <p class="project-question-subtitle reveal">${escapeHtml(project.question)}</p>
            </section>`
          : ""
      }
      <section class="project-story" aria-label="${escapeHtml(project.title)} documentation">
        ${storyImages.map((image, index) => projectStoryFrame(project, image, index)).join("")}
      </section>
      ${projectNavigation(project)}
    `;
  }

  function projectNavigation(project) {
    if (projects.length < 2) return "";
    const index = projects.findIndex((item) => item.id === project.id);
    if (index < 0) return "";
    const previous = projects[(index - 1 + projects.length) % projects.length];
    const next = projects[(index + 1) % projects.length];

    return `
      <nav class="project-page-nav" aria-label="Project navigation">
        <a class="project-page-nav-link project-page-nav-link--previous" href="project.html?id=${escapeHtml(previous.id)}" aria-label="Previous project: ${escapeHtml(previous.title)}">
          <span aria-hidden="true">←</span>
        </a>
        <a class="project-page-nav-link project-page-nav-link--next" href="project.html?id=${escapeHtml(next.id)}" aria-label="Next project: ${escapeHtml(next.title)}">
          <span aria-hidden="true">→</span>
        </a>
      </nav>
    `;
  }

  function ensureProjectNavigation() {
    if (document.body.dataset.page !== "project") return;
    if (document.querySelector(".project-page-nav")) return;
    const root = document.querySelector("[data-project-detail]");
    const id = new URLSearchParams(window.location.search).get("id");
    const project = projects.find((item) => item.id === id) || projects[0];
    if (!root || !project) return;
    root.insertAdjacentHTML("beforeend", projectNavigation(project));
  }

  function projectAnnotation(label, text, index) {
    return `
      <article class="project-annotation reveal" style="--annotation-index: ${index}">
        ${label ? `<p class="annotation-label">${escapeHtml(label)}</p>` : ""}
        <p>${escapeHtml(text)}</p>
      </article>
    `;
  }

  function projectMetadataLines(project) {
    const lines = [
      project.course,
      ...(Array.isArray(project.additionalMetadata) ? project.additionalMetadata : []),
      project.studio,
      project.professors ? `${professorLabel(project)}: ${professorDisplay(project)}` : "",
      project.partners ? `${project.partners.includes("+") ? "Partners" : "Partner"}: ${project.partners}` : ""
    ].filter(Boolean);

    const awardLine = project.award ? `<em>${escapeHtml(project.award)}</em>` : "";
    const renderedLines = [...lines.map(escapeHtml), awardLine].filter(Boolean);

    return renderedLines.length
      ? `<p class="project-editorial-meta">${renderedLines.join("<br>")}</p>`
      : "";
  }

  function professorLabel(project) {
    return project.id === "hunters-point" ? "Professors" : "Professor";
  }

  function professorDisplay(project) {
    if (!project.professors) return "";
    if (project.id === "hunters-point") return project.professors;
    return project.professors.split(/\s*(?:,|\+|&| and )\s*/i)[0].trim();
  }

  function projectStoryFrame(project, image, index) {
    const layout = image.layout || "image";
    const media = layout === "hunters-context-animation"
      ? huntersPointAnimation(project)
      : layout === "wood-pool-iso-large"
      ? woodPoolSiteIso(project, image)
      : layout === "wood-pool-mech-system"
      ? woodPoolMechSystem(project, image)
      : image.text
      ? projectStoryText(image)
      : Array.isArray(image.items)
        ? `<div class="project-story-board">${image.items
            .map(
              (item, itemIndex) => `
                <div class="project-story-item project-story-item--${escapeHtml(item.className || "item")}" style="--item-index: ${itemIndex}">
                  ${
                    item.text
                      ? `<p>${escapeHtml(item.text).replace(/\n/g, "<br>")}</p>`
                      : projectMedia(project, item.src, item.caption || image.caption || project.title)
                  }
                </div>
              `
            )
            .join("")}</div>`
        : projectMedia(project, image.src, image.caption || project.title);

    const revealClass = layout === "hunters-context-animation" ? "" : " reveal";

    return `
      <figure class="project-story-frame project-story-frame--${escapeHtml(layout)}${revealClass}" style="--story-index: ${index}">
        ${media}
      </figure>
    `;
  }

  function huntersPointAnimation(project) {
    const layerBase = `${project.imageBase || ""}animation-layers/`;
    const image = (className, src, alt, attrs = "") => `
      <img class="${className}" src="${escapeHtml(layerBase + src)}" alt="${escapeHtml(alt)}" loading="lazy" ${attrs}>
    `;

    return `
      <div class="hunters-diagram-scroll" data-hunters-diagram-scroll data-layer-base="${escapeHtml(layerBase)}">
        <div class="hunters-diagram-sticky">
          <div class="hunters-diagram-stage" data-hunters-diagram-stage>
            ${image("hunters-diagram-reference", "full-diagram-reference.png", "Full Hunter's Point reference diagram", "data-final-reference")}

            <div class="hunters-diagram-layer hunters-diagram-layer--vector" data-svg-layer="industrial"></div>
            ${image("hunters-diagram-layer hunters-diagram-layer--raster", "industrial-production-step-1.png", "", "data-raster-layer=\"industrial\"")}
            ${image("hunters-diagram-layer hunters-diagram-layer--text hunters-diagram-layer--text-industrial", "industrial-production-step-1.png", "", "data-text-layer=\"industrial\"")}

            <div class="hunters-diagram-layer hunters-diagram-layer--vector" data-svg-layer="scattered"></div>
            ${image("hunters-diagram-layer hunters-diagram-layer--raster", "scattered-consumption-step-2.png", "", "data-raster-layer=\"scattered\"")}
            ${image("hunters-diagram-layer hunters-diagram-layer--text hunters-diagram-layer--text-scattered", "scattered-consumption-step-2.png", "", "data-text-layer=\"scattered\"")}

            ${image("hunters-diagram-layer hunters-diagram-layer--raster hunters-diagram-layer--base", "site-base.png", "", "data-raster-layer=\"base\"")}

            <div class="hunters-diagram-layer hunters-diagram-layer--vector" data-svg-layer="info"></div>
            ${image("hunters-diagram-layer hunters-diagram-layer--raster", "site-information-step-3.png", "", "data-raster-layer=\"info\"")}
            ${image("hunters-diagram-layer hunters-diagram-layer--text hunters-diagram-layer--text-info", "site-information-step-3.png", "", "data-text-layer=\"info\"")}

            <div class="hunters-diagram-layer hunters-diagram-layer--vector" data-svg-layer="interwoven"></div>
            ${image("hunters-diagram-layer hunters-diagram-layer--raster", "interwoven-production-step-4.png", "", "data-raster-layer=\"interwoven\"")}
            ${image("hunters-diagram-layer hunters-diagram-layer--text hunters-diagram-layer--text-interwoven", "interwoven-production-step-4.png", "", "data-text-layer=\"interwoven\"")}

            ${image("hunters-diagram-final", "full-diagram-reference.png", "", "data-final-layer")}
          </div>
        </div>
      </div>
    `;
  }

  function initHuntersPointAnimation() {
    const scrollArea = document.querySelector("[data-hunters-diagram-scroll]");
    if (!scrollArea) return;

    const finalLayer = scrollArea.querySelector("[data-final-layer]");
    const layerBase = scrollArea.dataset.layerBase || "";
    const layerConfigs = [
      {
        id: "industrial",
        start: 0.025,
        end: 0.225,
        svg: `${layerBase}Industrial Production step 1.svg`,
        lineColors: ["#bf3f3f"]
      },
      {
        id: "scattered",
        start: 0.19,
        end: 0.405,
        svg: `${layerBase}Scattered Consumption step 2.svg`,
        lineColors: ["#f49f4a"]
      },
      {
        id: "base",
        start: 0.37,
        end: 0.565
      },
      {
        id: "info",
        start: 0.535,
        end: 0.745,
        svg: `${layerBase}Site Information step 3.svg`,
        lineColors: []
      },
      {
        id: "interwoven",
        start: 0.715,
        end: 0.925,
        svg: `${layerBase}Interwoven Production step 4.svg`,
        lineColors: ["#8f64a5", "#c187df"]
      }
    ];

    const layers = new Map();
    let ticking = false;
    let ready = false;

    layerConfigs.forEach((config) => {
      layers.set(config.id, {
        config,
        vector: scrollArea.querySelector(`[data-svg-layer="${config.id}"]`),
        raster: scrollArea.querySelector(`[data-raster-layer="${config.id}"]`),
        textRaster: scrollArea.querySelector(`[data-text-layer="${config.id}"]`),
        lines: [],
        reveals: [],
        arrowheads: new Set()
      });
    });

    Promise.all(layerConfigs.filter((config) => config.svg).map(loadSvgLayer))
      .then(() => {
        ready = true;
        update();
        window.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("resize", scheduleUpdate, { passive: true });
      })
      .catch(() => {
        if (finalLayer) finalLayer.style.opacity = "1";
      });

    async function loadSvgLayer(config) {
      const layer = layers.get(config.id);
      if (!layer?.vector) return;

      const source = window.HP_ANIMATION_SVGS?.[config.id] || await fetchSvg(config.svg);
      const parsed = new DOMParser().parseFromString(source, "image/svg+xml");
      const svg = document.importNode(parsed.documentElement, true);
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.setAttribute("aria-hidden", "true");
      layer.vector.appendChild(svg);

      const defs = ensureDefs(svg);
      const dynamicGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      dynamicGroup.classList.add("hp-vector-dynamic");
      svg.appendChild(dynamicGroup);

      const candidates = Array.from(svg.querySelectorAll("path, line, polyline")).flatMap((element) => {
        if (!isAnimatedLine(element, config)) return [];
        const length = getElementLength(element);
        if (!length) return [];
        return [{
          element,
          length,
          start: getPointAt(element, 0),
          end: getPointAt(element, length),
          center: getElementCenter(element)
        }];
      });

      const arrowsByElement = new Map();
      candidates.forEach((candidate) => {
        const arrows = findEndpointArrowheads(candidate, candidates);
        arrowsByElement.set(candidate.element, arrows);
        if (arrows.start) layer.arrowheads.add(arrows.start.element);
        if (arrows.end) layer.arrowheads.add(arrows.end.element);
      });

      candidates.forEach((candidate, index) => {
        if (layer.arrowheads.has(candidate.element)) {
          candidate.element.style.opacity = "0";
          return;
        }

        candidate.element.style.opacity = "0";
        layer.lines.push(createDynamicLine(candidate, arrowsByElement.get(candidate.element), dynamicGroup, defs, index));
      });

      Array.from(svg.querySelectorAll("path, line, polyline, polygon, rect, circle, ellipse, text")).forEach((element) => {
        if (element.tagName.toLowerCase() === "text") {
          element.style.opacity = "0";
          return;
        }
        if (layer.arrowheads.has(element)) return;
        if (isAnimatedLine(element, config)) return;

        if (isVisibleElement(element)) {
          element.classList.add("hp-vector-reveal");
          layer.reveals.push(element);
        }
      });
    }

    async function fetchSvg(url) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Could not load ${url}`);
      return response.text();
    }

    function isAnimatedLine(element, config) {
      const tag = element.tagName.toLowerCase();
      if (!["path", "line", "polyline"].includes(tag)) return false;
      const stroke = normalizeSvgColor(element.getAttribute("stroke"));
      const strokeWidth = Number.parseFloat(element.getAttribute("stroke-width") || "0");
      if (!stroke || stroke === "none" || strokeWidth <= 0) return false;
      return config.lineColors.includes(stroke);
    }

    function isVisibleElement(element) {
      const fill = normalizeSvgColor(element.getAttribute("fill"));
      const stroke = normalizeSvgColor(element.getAttribute("stroke"));
      const hasVisibleFill = fill && fill !== "none" && fill !== "#ffffff";
      const hasVisibleStroke = stroke && stroke !== "none" && stroke !== "#ffffff";
      return hasVisibleFill || hasVisibleStroke;
    }

    function ensureDefs(svg) {
      let defs = svg.querySelector("defs");
      if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svg.insertBefore(defs, svg.firstChild);
      }
      return defs;
    }

    function createDynamicLine(candidate, arrows, group, defs, index) {
      const stroke = candidate.element.getAttribute("stroke") || "currentColor";
      const strokeWidth = Number.parseFloat(candidate.element.getAttribute("stroke-width") || "1") || 1;
      const markerId = ensureArrowMarker(defs, stroke, strokeWidth, index);
      const left = createSegmentPath(candidate.element);
      const right = createSegmentPath(candidate.element);

      if (arrows?.start) left.setAttribute("marker-end", `url(#${markerId})`);
      if (arrows?.end) right.setAttribute("marker-end", `url(#${markerId})`);

      group.appendChild(left);
      group.appendChild(right);

      return {
        source: candidate.element,
        length: candidate.length,
        left,
        right
      };
    }

    function createSegmentPath(source) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      [
        "stroke",
        "stroke-width",
        "stroke-opacity",
        "stroke-linecap",
        "stroke-linejoin",
        "stroke-dasharray",
        "stroke-dashoffset",
        "vector-effect"
      ].forEach((name) => {
        const value = source.getAttribute(name);
        if (value !== null) path.setAttribute(name, value);
      });
      path.classList.add("hp-vector-segment");
      path.setAttribute("fill", "none");
      return path;
    }

    function ensureArrowMarker(defs, stroke, strokeWidth, index) {
      const normalizedStroke = normalizeSvgColor(stroke).replace(/[^a-z0-9]/gi, "");
      const markerId = `hp-arrow-${normalizedStroke || "line"}-${String(strokeWidth).replace(".", "-")}-${index}`;
      if (defs.querySelector(`#${window.CSS?.escape ? CSS.escape(markerId) : markerId}`)) return markerId;

      const size = Math.max(6, strokeWidth * 7.5);
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
      marker.setAttribute("id", markerId);
      marker.setAttribute("viewBox", `${-size} ${-size} ${size * 1.25} ${size * 2}`);
      marker.setAttribute("markerWidth", String(size * 1.25));
      marker.setAttribute("markerHeight", String(size * 2));
      marker.setAttribute("refX", "0");
      marker.setAttribute("refY", "0");
      marker.setAttribute("orient", "auto");
      marker.setAttribute("markerUnits", "userSpaceOnUse");

      const arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
      arrow.setAttribute("d", `M ${-size} ${-size * 0.42} L 0 0 L ${-size} ${size * 0.42}`);
      arrow.setAttribute("fill", "none");
      arrow.setAttribute("stroke", stroke);
      arrow.setAttribute("stroke-width", String(strokeWidth));
      arrow.setAttribute("stroke-linecap", "round");
      arrow.setAttribute("stroke-linejoin", "round");
      marker.appendChild(arrow);
      defs.appendChild(marker);

      return markerId;
    }

    function findEndpointArrowheads(candidate, candidates) {
      if (candidate.length < 34) return { start: null, end: null };

      const arrowCandidates = candidates.filter((item) =>
        item.element !== candidate.element &&
        item.length <= 62 &&
        item.length >= 4
      );

      return {
        start: nearestArrow(candidate.start, arrowCandidates),
        end: nearestArrow(candidate.end, arrowCandidates)
      };
    }

    function nearestArrow(point, arrowCandidates) {
      let nearest = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      arrowCandidates.forEach((candidate) => {
        const distance = pointDistance(point, candidate.center);
        if (distance < nearestDistance) {
          nearest = candidate;
          nearestDistance = distance;
        }
      });
      return nearestDistance <= 36 ? nearest : null;
    }

    function update() {
      ticking = false;
      if (!ready) return;

      const progress = reduceMotion ? 1 : getScrollProgress();

      layerConfigs.forEach((config) => {
        const layer = layers.get(config.id);
        if (!layer) return;
        updateLayer(layer, stageProgress(progress, config.start, config.end));
      });

      if (finalLayer) finalLayer.style.opacity = String(easeInOutCubic(stageProgress(progress, 0.93, 1)));
    }

    function updateLayer(layer, local) {
      const { config, vector, raster, textRaster, lines, reveals } = layer;

      if (config.id === "base") {
        if (raster) raster.style.opacity = String(easeOutCubic(local));
        return;
      }

      if (textRaster) textRaster.style.opacity = String(easeOutCubic(stageProgress(local, 0.02, 0.2)));

      const exactOpacity = easeInOutCubic(stageProgress(local, 0.84, 1));
      if (vector) vector.style.opacity = String(clamp(1 - exactOpacity, 0, 1));
      if (raster) raster.style.opacity = String(exactOpacity);

      const lineProgress = easeInOutCubic(stageProgress(local, 0.2, 0.78));
      lines.forEach((line) => setCenterDraw(line, lineProgress));

      const revealBase = stageProgress(local, lines.length ? 0.3 : 0.22, 0.96);
      const revealCount = Math.max(1, reveals.length);
      reveals.forEach((element, index) => {
        const ordered = orderedProgress(revealBase, index, revealCount);
        const opacity = easeOutCubic(ordered);
        element.style.opacity = String(opacity);
        element.style.transform = `scale(${0.975 + opacity * 0.025})`;
      });
    }

    function setCenterDraw(line, progress) {
      const length = line.length;
      if (!length) return;

      if (progress <= 0.001) {
        line.left.setAttribute("d", "");
        line.right.setAttribute("d", "");
        return;
      }

      const center = length / 2;
      const half = center * clamp(progress, 0, 1);
      line.left.setAttribute("d", segmentPath(line.source, center, center - half));
      line.right.setAttribute("d", segmentPath(line.source, center, center + half));
    }

    function segmentPath(source, from, to) {
      const distance = Math.abs(to - from);
      const steps = clamp(Math.ceil(distance / 16), 2, 72);
      const points = [];
      for (let index = 0; index <= steps; index += 1) {
        const amount = index / steps;
        points.push(getPointAt(source, from + (to - from) * amount));
      }
      return points
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(3)} ${point.y.toFixed(3)}`)
        .join(" ");
    }

    function orderedProgress(progress, index, count) {
      if (count <= 1) return clamp(progress, 0, 1);
      const staggerSpace = 0.56;
      const step = staggerSpace / Math.max(1, count - 1);
      const span = 1 - staggerSpace;
      return clamp((progress - index * step) / span, 0, 1);
    }

    function getScrollProgress() {
      const rect = scrollArea.getBoundingClientRect();
      const scrollable = Math.max(1, scrollArea.offsetHeight - window.innerHeight);
      return clamp(-rect.top / scrollable, 0, 1);
    }

    function stageProgress(progress, start, end) {
      return clamp((progress - start) / (end - start), 0, 1);
    }

    function getElementLength(element) {
      if (typeof element.getTotalLength !== "function") return 0;
      try {
        return Math.max(0, element.getTotalLength());
      } catch {
        return 0;
      }
    }

    function getPointAt(element, length) {
      const point = element.getPointAtLength(clamp(length, 0, getElementLength(element)));
      return { x: point.x, y: point.y };
    }

    function getElementCenter(element) {
      const box = element.getBBox();
      return {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2
      };
    }

    function pointDistance(a, b) {
      return Math.hypot(a.x - b.x, a.y - b.y);
    }

    function normalizeSvgColor(value) {
      if (!value) return "";
      const lower = value.trim().toLowerCase();
      if (lower === "black") return "#000000";
      if (lower.length === 4 && lower.startsWith("#")) {
        return `#${lower[1]}${lower[1]}${lower[2]}${lower[2]}${lower[3]}${lower[3]}`;
      }
      return lower;
    }

    function scheduleUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }

  function woodPoolMechSystem(project, image) {
    const systems = Array.isArray(image.systems) ? image.systems : [];
    const paragraphs = String(image.text || "")
      .split(/\n{2,}/)
      .filter(Boolean)
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join("");

    return `
      <div class="wood-mech-system">
        <article class="wood-mech-notes">
          ${image.heading ? `<p class="project-story-text-label">${escapeHtml(image.heading)}</p>` : ""}
          ${paragraphs}
        </article>
        <figure class="wood-mech-axon">
          ${projectImage(project, image.src, image.caption || "Mechanical axonometric")}
        </figure>
        <dl class="wood-mech-key">
          ${systems
            .map(
              (system) => `
                <div>
                  <dt><span style="--system-color: ${escapeHtml(system.color)}"></span>${escapeHtml(system.name)}</dt>
                  ${system.description ? `<dd>${escapeHtml(system.description)}</dd>` : ""}
                </div>
              `
            )
            .join("")}
        </dl>
      </div>
    `;
  }

  function projectStoryText(image) {
    const paragraphs = String(image.text || "")
      .split(/\n{2,}/)
      .filter(Boolean)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
      .join("");

    return `
      <article class="project-story-text project-question-subtitle">
        ${paragraphs}
      </article>
    `;
  }

  function woodPoolSiteIso(project, image) {
    const markers = [
      { number: "1", x: 70.5, y: 55.5 },
      { number: "2", x: 57.3, y: 52.9 },
      { number: "3", x: 49.7, y: 53.4 },
      { number: "4", x: 49.1, y: 37.5 },
      { number: "5", x: 37.2, y: 55.3 },
      { number: "6", x: 38.3, y: 34.6 },
      { number: "7", x: 30.2, y: 8.6 },
      { number: "8", x: 12.7, y: 73.2 },
      { number: "9", x: 79.8, y: 21.2 }
    ];
    const key = [
      "Ithaca Skate Park",
      "Wood Street Cafe",
      "Rooftop Exercise Lawn",
      "Community Garden",
      "Native Pollinator Garden",
      "Existing Oak Grove",
      "Subsidized Apartments",
      "Senior Care Homes",
      "Goodwill"
    ];

    return `
      <div class="wood-site-iso">
        <div class="wood-site-iso-drawing">
          ${projectImage(project, image.src, image.caption || "Wood Street Pool site iso")}
          ${markers.map((marker) => `
            <span class="wood-site-marker" style="--x:${marker.x}%;--y:${marker.y}%;">${marker.number}</span>
          `).join("")}
          <span class="wood-site-route-label wood-site-route-label--pedestrian">Pedestrian Path</span>
          <span class="wood-site-route-label wood-site-route-label--bus">Bus Line</span>
        </div>
        <aside class="wood-site-key" aria-label="Wood Street Pool site key">
          <h2>Site Key</h2>
          <ol>
            ${key.map((item, index) => `
              <li><span>${index + 1}</span>${escapeHtml(item)}</li>
            `).join("")}
          </ol>
          <div class="wood-site-scores" aria-label="Site mobility scores">
            <div><strong>91</strong><span>walk<br>score</span></div>
            <div><strong>89</strong><span>bike<br>score</span></div>
            <div><strong>55</strong><span>transit<br>score</span></div>
          </div>
        </aside>
      </div>
    `;
  }

  function projectImage(project, src, alt = "") {
    const imageSrc = optimizedSrc(src.includes("/") ? src : `${project.imageBase || ""}${src}`);
    return `<img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(alt)}" loading="lazy">`;
  }

  function projectMedia(project, src, alt = "") {
    const mediaSrc = optimizedSrc(src.includes("/") ? src : `${project.imageBase || ""}${src}`);
    if (/\.pdf$/i.test(src)) {
      return `
        <a class="project-file-link" href="${escapeHtml(mediaSrc)}" target="_blank" rel="noreferrer">
          <span>PDF</span>
          ${escapeHtml(alt || src)}
        </a>
      `;
    }

    return projectImage(project, src, alt);
  }

  function optimizedSrc(src) {
    return optimizedImages[src] || src;
  }

  function projectGallery(project) {
    if (Array.isArray(project.images) && project.images.length) {
      return project.images
        .map(
          (image) => `
            <figure>
              ${projectMedia(project, image.src, image.caption || project.title)}
            </figure>
          `
        )
        .join("");
    }

    return `
      <figure>${planSvg(project, project.shape)}</figure>
      <figure>${planSvg(project, "grid")}</figure>
      <figure>${planSvg(project, "strata")}</figure>
    `;
  }

  function revealOnScroll() {
    const reveals = Array.from(document.querySelectorAll(".reveal"));
    if (!reveals.length) return;
    if (reduceMotion) {
      reveals.forEach((node) => node.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );
    reveals.forEach((node) => observer.observe(node));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function createScatterSlots(count) {
    const isNarrow = window.matchMedia("(max-width: 700px)").matches;
    const columns = isNarrow ? 2 : Math.min(4, Math.max(3, Math.ceil(Math.sqrt(count * 1.35))));
    const rows = Math.ceil(count / columns);
    const slots = [];

    for (let index = 0; index < count; index += 1) {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = ((column + 0.5) / columns) * 100 + randomBetween(isNarrow ? -7 : -9, isNarrow ? 7 : 9);
      const y = ((row + 0.5) / rows) * 100 + randomBetween(-8, 8);
      slots.push({
        x: clamp(x, isNarrow ? 18 : 9, isNarrow ? 82 : 91),
        y: clamp(y, 12, 88)
      });
    }

    return shuffle(slots);
  }

  function shuffle(items) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  function randomBetween(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 100) / 100;
  }

  function lerp(start, end, progress) {
    return start + (end - start) * progress;
  }

  function easeOutCubic(progress) {
    return 1 - Math.pow(1 - progress, 3);
  }

  function easeInOutCubic(progress) {
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  function easeInCubic(progress) {
    return progress * progress * progress;
  }

  function seededNoise(x, y) {
    const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return value - Math.floor(value);
  }

  function sampleAlpha(imageData, width, height, x, y) {
    const sampleX = clamp(Math.round(x), 0, width - 1);
    const sampleY = clamp(Math.round(y), 0, height - 1);
    return imageData[(sampleY * width + sampleX) * 4 + 3] / 255;
  }

  function getInteriorDensity(imageData, width, height, x, y, step) {
    const offsets = [
      [0, 0],
      [-step, 0],
      [step, 0],
      [0, -step],
      [0, step],
      [-step * 0.7, -step * 0.7],
      [step * 0.7, -step * 0.7],
      [-step * 0.7, step * 0.7],
      [step * 0.7, step * 0.7]
    ];
    const density =
      offsets.reduce((sum, offset) => sum + sampleAlpha(imageData, width, height, x + offset[0], y + offset[1]), 0) /
      offsets.length;
    return clamp(density, 0, 1);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  initCustomCursor();
  initMobileMenu();
  renderHero();
  renderWordMarquee();
  renderHalftoneTitle();
  renderPlanField();
  renderCompactIndex();
  renderCatalogue();
  renderProjectDetail();
  initHuntersPointAnimation();
  ensureProjectNavigation();
  revealOnScroll();
})();
