import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { runInNewContext } from "node:vm";

const ROOT = process.cwd();
const ORIGIN = "https://andrew-wheat.com";
const TODAY = "2026-08-03";
const ASSET_VERSION = "20260815-ncsu-year-v132";
const PERSON_ID = `${ORIGIN}/#andrew-wheat`;
const WEBSITE_ID = `${ORIGIN}/#website`;
const HEADSHOT_4X3 = `${ORIGIN}/assets/images/seo/andrew-wheat-portrait-4x3.jpg`;
const HEADSHOT = HEADSHOT_4X3;
const CORNELL_AWARDS =
  "https://aap.cornell.edu/news/announcements/2025-26-student-academic-awards-and-prizes/";
const LINKEDIN = "https://www.linkedin.com/in/andrewwheat";
const INSTAGRAM = "https://www.instagram.com/awheat_arch/";
const MITHUN = "https://mithun.com/";
const BRIC_ARCHITECTURE = "https://www.bric-arch.com/";
const CUSD = "https://cusd.cornell.edu/";
const CORNELL_ARCHITECTURE =
  "https://aap.cornell.edu/architecture/bachelor-of-architecture/";
const BIO =
  "Andrew Wheat is a designer and Bachelor of Architecture student at Cornell University working across civic architecture, housing, material systems, and landscape.";
const ABOUT_DESCRIPTION =
  "Andrew Wheat is a Cornell Bachelor of Architecture student whose work explores civic space, housing, material systems, climate, and landscape.";
const LANDING_STATEMENT = BIO;
const TECHNICAL_SKILL_GROUPS = [
  {
    label: "Modeling and analysis",
    skills: [
      ["Revit", 3],
      ["Rhino", 5],
      ["Grasshopper", 3],
      ["AutoCAD", 3],
      ["SketchUp", 5],
      ["BIM Modeling", 3],
      ["ClimateStudio", 4],
      ["HTFlux", 5],
    ],
  },
  {
    label: "Visualization and graphics",
    skills: [
      ["V-Ray", 5],
      ["Enscape", 5],
      ["Lumion", 5],
      ["Twinmotion", 5],
      ["Photoshop", 5],
      ["Illustrator", 5],
      ["InDesign", 5],
      ["Lightroom", 5],
    ],
  },
  {
    label: "Fabrication and making",
    skills: [
      ["Laser cutting", 5],
      ["3D printing", 4],
      ["CNC milling", 4],
      ["carpentry", 4],
      ["metalwork", 3],
      ["soldering", 2],
      ["casting", 5],
      ["textile work", 3],
      ["precision physical modeling", 5],
    ],
  },
];
const SELECTED_COLLECTION_META = {
  drawings: {
    title: "Drawings | Andrew Wheat",
    heading: "Drawings",
    description:
      "Selected architectural line drawings by Andrew Wheat, including sections, sectional perspectives, detail sections, elevations, and axonometric studies.",
  },
  models: {
    title: "Models | Andrew Wheat",
    heading: "Models",
    description:
      "Selected architectural models by Andrew Wheat, including physical models, material studies, fabrication, and assembly.",
  },
  photography: {
    title: "Photography | Andrew Wheat",
    heading: "Photography",
    description:
      "Selected architectural and observational photography by Andrew Wheat, documenting buildings, landscapes, materials, and atmosphere.",
  },
  sketchbook: {
    title: "Sketchbook | Andrew Wheat",
    heading: "Sketchbook",
    description:
      "Selected sketches and architectural drawings by Andrew Wheat, tracing design studies, plans, spatial observations, and working ideas.",
  },
  renderings: {
    title: "Renderings | Andrew Wheat",
    heading: "Renderings",
    description:
      "Selected architectural renderings by Andrew Wheat, including interior, exterior, atmospheric, and visualization studies.",
  },
};
const ROBOTS_INDEX =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
const PROJECT_SEO = {
  "hunters-point": {
    title: "Hunter's Point Cooperative Housing | Andrew Wheat",
    description:
      "Cooperative housing project by Andrew Wheat focused on shared production, public exchange, circulation, workshops, housing, and civic life in Hunters Point.",
  },
  "wood-street-pool": {
    title: "Wood Street Pool | Andrew Wheat",
    description:
      "Public natatorium and civic landscape project by Andrew Wheat, integrating community recreation, water systems, planted roofs, geothermal strategies, and mass timber architecture.",
  },
  "enfield-food-pantry": {
    title: "Enfield Food Pantry | Andrew Wheat",
    description:
      "Architecture project by Andrew Wheat focused on food access, civic gathering, environmental performance, materiality, and community infrastructure.",
  },
  "deconstruct-reconfigure": {
    title: "[de]construct + [re]configure | Andrew Wheat",
    description:
      "Produce stand and material reuse project by Andrew Wheat exploring assembly, disassembly, reuse, public exchange, and community food infrastructure.",
  },
  "borinquen-healing-center": {
    title: "Borinquen Healing Center | Andrew Wheat",
    description:
      "Architecture project by Andrew Wheat focused on care, recovery, public space, material atmosphere, and community health.",
  },
  "a-chair-is-a-toy": {
    title: "A Chair is a Toy! | Andrew Wheat",
    description:
      "Furniture and design study by Andrew Wheat exploring play, use, structure, and the boundary between object and architecture.",
  },
  "design-district-canteen": {
    title: "Design District Canteen | Andrew Wheat",
    description:
      "Architecture project by Andrew Wheat focused on food, gathering, structure, materiality, and public interior space.",
  },
  "curanto-cookhouse": {
    title: "Curanto Cookhouse | Andrew Wheat",
    description:
      "Architecture project by Andrew Wheat focused on cooking, ceremony, material assembly, landscape, and communal gathering.",
  },
  "woven-pavilion": {
    title: "Woven Pavilion | Andrew Wheat",
    description:
      "Pavilion project by Andrew Wheat exploring enclosure, light, assembly, texture, and temporary public space.",
  },
};

const projectContext = { window: {} };
runInNewContext(
  await readFile(`${ROOT}/assets/js/projects.js`, "utf8"),
  projectContext,
);

const publicProjects = projectContext.window.PORTFOLIO_PROJECTS ?? [];
const archivedProjects = (projectContext.window.ARCHIVED_PORTFOLIO_PROJECTS ?? []).filter(
  (project) => !project.siteHidden,
);
const publicProjectIds = new Set(publicProjects.map((project) => project.id));

const selectedContext = { window: {} };
runInNewContext(
  await readFile(`${ROOT}/assets/js/selected-collections.js`, "utf8"),
  selectedContext,
);
const selectedCollections = selectedContext.window.SELECTED_COLLECTIONS ?? {};
const selectedCollectionOrder = ["drawings", "models", "photography", "sketchbook", "renderings"].filter(
  (collection) => Array.isArray(selectedCollections[collection]),
);

const normalizeInterfaceLanguage = (content) =>
  String(content)
    .replace(
      /(<a\b[^>]*href="\/work\/"[^>]*>)Projects(<\/a>)/gi,
      "$1work$2",
    )
    .replace(/<img(?![^>]*\bdata-image-skeleton\b)/gi, "<img data-image-skeleton")
    .replace(
      /(\/assets\/(?:css\/styles\.css|js\/(?:projects|image-optimizations|selected-collections|main)\.js)\?v=)[^"'&]+/gi,
      `$1${ASSET_VERSION}`,
    )
    .replace(
      /\s*<script src="\/assets\/js\/hunters-point-animation-data\.js[^"]*"><\/script>/gi,
      "",
    );

const writeClean = (file, content) =>
  writeFile(
    file,
    normalizeInterfaceLanguage(content).replace(/[ \t]+(?=\r?\n|$)/g, ""),
  );

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const xmlEscape = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const cleanText = (value = "") =>
  String(value)
    .replace(/\s+/g, " ")
    .trim();

const technicalSkillsSection = () => `        <section class="cv-section" aria-labelledby="skills-title">
          <h3 id="skills-title">Technical Skills</h3>
          <div class="cv-skills">
${TECHNICAL_SKILL_GROUPS.map(
  ({ label, skills }) => `            <div class="cv-skill-line" role="list" aria-label="${escapeHtml(label)}">
${skills
  .map(
    ([name, level]) => `              <span class="cv-skill" role="listitem" tabindex="0" aria-label="${escapeHtml(name)}, proficiency ${level} out of 5">
                <span class="cv-skill-name" aria-hidden="true">${escapeHtml(name)}</span>
                <span class="cv-skill-meter" aria-hidden="true">
${Array.from(
  { length: 5 },
  (_, index) =>
    `                  <span class="cv-skill-square${index < level ? " is-filled" : ""}"></span>`,
).join("\n")}
                </span>
              </span>`,
  )
  .join("\n")}
            </div>`,
)
  .join("\n")}
          </div>
        </section>`;

const pageIdForProject = (project) => project.id;

const projectUrl = (project) =>
  `${ORIGIN}/project/${encodeURIComponent(pageIdForProject(project))}/`;

const absoluteUrl = (path) => {
  if (!path) return `${ORIGIN}/assets/images/work-covers/wood-street-pool.webp`;
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(`/${String(path).replace(/^\/+/, "")}`, `${ORIGIN}/`).href;
};

const representativeImage = (project) => {
  const source =
    project.workListThumbnail ||
    project.workThumbnail ||
    (project.overviewImage
      ? `${project.imageBase ?? ""}${project.overviewImage}`
      : "") ||
    (project.heroImage ? `${project.imageBase ?? ""}${project.heroImage}` : "") ||
    (project.thumbnail ? `${project.imageBase ?? ""}${project.thumbnail}` : "");
  return absoluteUrl(source);
};

const projectOpeningImage = (project) =>
  absoluteUrl(
    project.overviewImage
      ? `${project.imageBase ?? ""}${project.overviewImage}`
      : project.heroImage
        ? `${project.imageBase ?? ""}${project.heroImage}`
        : representativeImage(project),
  );

const projectOpeningAlt = (project) =>
  project.overviewImageAlt || `${project.title} opening project image`;

const projectWorkAlt = (project) =>
  project.workImageAlt || `${project.title} architecture project by Andrew Wheat`;

const projectDescription = (project) =>
  cleanText(
    PROJECT_SEO[project.id]?.description ||
      project.summary ||
      project.description ||
      `Architecture project by Andrew Wheat, completed in ${project.year ?? ""}.`,
  );

const personNode = () => ({
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Andrew Wheat",
  url: `${ORIGIN}/`,
  jobTitle: "Designer",
  description: BIO,
  affiliation: {
    "@type": "CollegeOrUniversity",
    name: "Cornell University",
    sameAs: "https://www.cornell.edu/",
  },
  image: {
    "@type": "ImageObject",
    "@id": `${ORIGIN}/#portrait`,
    url: HEADSHOT,
    contentUrl: HEADSHOT,
    width: 9912,
    height: 9912,
    caption: "Portrait of Andrew Wheat",
  },
  sameAs: [LINKEDIN, INSTAGRAM],
});

const websiteNode = () => ({
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "Andrew Wheat",
  alternateName: "Andrew Wheat Architecture and Design",
  url: `${ORIGIN}/`,
  publisher: { "@id": PERSON_ID },
});

const breadcrumbNode = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

const jsonLd = (data, id = "") =>
  `<script${id ? ` id="${id}"` : ""} type="application/ld+json">\n${JSON.stringify(
    data,
    null,
    2,
  )}\n    </script>`;

const commonDiscoveryLinks = `
    <link rel="author" href="/about/">
    <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml">
    <link rel="alternate" type="text/plain" title="AI-readable site summary" href="/llms.txt">
    <link rel="icon" href="/favicon.ico?v=3" sizes="any">
    <link rel="shortcut icon" href="/favicon.ico?v=3">
    <link rel="icon" href="/favicon.svg?v=3" type="image/svg+xml">
    <link rel="icon" href="/favicon-48.png?v=3" sizes="48x48" type="image/png">
    <link rel="icon" href="/favicon-192.png?v=3" sizes="192x192" type="image/png">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3">
    <link rel="manifest" href="/site.webmanifest?v=3">`;

function buildHead({
  title,
  description,
  canonical,
  image,
  imageAlt,
  type = "website",
  robots = ROBOTS_INDEX,
  schema = [],
  profile = false,
  projectSchema = null,
}) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeCanonical = escapeHtml(canonical);
  const safeImage = escapeHtml(image);
  const safeImageAlt = escapeHtml(imageAlt);
  return `  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}">
    <meta name="author" content="Andrew Wheat">
    <meta name="robots" content="${escapeHtml(robots)}">
    <meta name="googlebot" content="${escapeHtml(robots)}">
    <meta name="bingbot" content="${escapeHtml(robots)}">
    <meta name="theme-color" content="#ffffff">
    <meta name="format-detection" content="telephone=no">
    <link rel="canonical" href="${safeCanonical}">
    ${commonDiscoveryLinks.trim()}
    <meta property="og:type" content="${escapeHtml(type)}">
    <meta property="og:site_name" content="Andrew Wheat">
    <meta property="og:locale" content="en_US">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDescription}">
    <meta property="og:url" content="${safeCanonical}">
    <meta property="og:image" content="${safeImage}">
    <meta property="og:image:secure_url" content="${safeImage}">
    <meta property="og:image:alt" content="${safeImageAlt}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDescription}">
    <meta name="twitter:image" content="${safeImage}">
    <meta name="twitter:image:alt" content="${safeImageAlt}">
    ${
      profile
        ? `<meta property="profile:first_name" content="Andrew">
    <meta property="profile:last_name" content="Wheat">`
        : ""
    }
    <link rel="stylesheet" href="/assets/css/styles.css?v=${ASSET_VERSION}">
    ${schema.length ? jsonLd({ "@context": "https://schema.org", "@graph": schema }, "site-schema") : ""}
    ${projectSchema ? jsonLd(projectSchema, "project-schema") : ""}
  </head>`;
}

const brandMark = `<svg class="brand-mark" viewBox="0 0 939 350" aria-hidden="true" focusable="false"><g fill="currentColor"><rect x="194" y="0" width="154" height="95"/><rect x="391" y="0" width="154" height="95"/><rect x="588" y="0" width="154" height="95"/><rect x="785" y="0" width="154" height="95"/><rect x="93" y="95" width="255" height="59"/><rect x="391" y="95" width="548" height="59"/><rect x="93" y="154" width="154" height="42"/><rect x="490" y="154" width="154" height="42"/><rect x="687" y="154" width="154" height="42"/><rect x="0" y="196" width="348" height="53"/><rect x="391" y="196" width="253" height="53"/><rect x="687" y="196" width="252" height="53"/><rect x="0" y="249" width="154" height="101"/><rect x="194" y="249" width="154" height="101"/><rect x="391" y="249" width="154" height="101"/><rect x="785" y="249" width="154" height="101"/></g></svg>`;

const siteHeader = (active = "", selectedCollection = "") => `    <header class="site-header static-header" aria-label="Primary navigation">
      <a class="brand" href="/" aria-label="Andrew Wheat home">${brandMark}<span>Andrew Wheat</span></a>
      <nav class="site-nav">
        <div class="nav-folder nav-folder--selected">
          <button class="nav-primary-link nav-folder-trigger" type="button" data-nav-section="selected"${
            active === "selected" ? ' aria-current="page"' : ""
          } aria-expanded="false" aria-haspopup="true">selected</button>
          <div class="nav-dropdown" aria-label="Selected collections">
            ${selectedCollectionOrder
              .map(
                (collection) =>
                  `<a class="nav-dropdown-link" data-selected-category="${escapeHtml(collection)}"${
                    selectedCollection === collection ? ' aria-current="page"' : ""
                  } href="/selected/${escapeHtml(collection)}/">${escapeHtml(collection)}</a>`,
              )
              .join("\n            ")}
          </div>
        </div>
        <a class="nav-primary-link" data-nav-section="work"${
          active === "work" ? ' aria-current="page"' : ""
        } href="/work/">work</a>
        <div class="nav-folder nav-folder--info">
          <button class="nav-primary-link nav-folder-trigger" type="button" data-nav-section="info"${
            active === "about" || active === "contact" ? ' aria-current="page"' : ""
          } aria-expanded="false" aria-haspopup="true">info</button>
          <div class="nav-dropdown" aria-label="Information">
            <a class="nav-dropdown-link" data-info-page="about"${
              active === "about" ? ' aria-current="page"' : ""
            } href="/about/">about</a>
            <a class="nav-dropdown-link" data-info-page="contact"${
              active === "contact" ? ' aria-current="page"' : ""
            } href="/contact/">contact</a>
          </div>
        </div>
      </nav>
    </header>`;

const siteFooter = `    <footer class="site-copyright" aria-label="Copyright">
      &copy; Andrew Wheat 2026
    </footer>`;

const scriptTags = (includeImageOptimizations = true) => `    <script src="/assets/js/projects.js?v=${ASSET_VERSION}"></script>
    ${
      includeImageOptimizations
        ? `<script src="/assets/js/image-optimizations.js?v=${ASSET_VERSION}"></script>\n    `
        : ""
    }<script src="/assets/js/selected-collections.js?v=${ASSET_VERSION}"></script>
    <script src="/assets/js/main.js?v=${ASSET_VERSION}"></script>`;

const sitePageNavigation = ({
  previousHref,
  previousTitle,
  nextHref,
  nextTitle,
  ariaLabel = "Site page navigation",
}) => `      <nav class="project-page-nav" aria-label="${escapeHtml(ariaLabel)}">
        <a class="project-page-nav-link project-page-nav-link--previous" href="${escapeHtml(previousHref)}" aria-label="Previous page: ${escapeHtml(previousTitle)}" data-project-title="${escapeHtml(previousTitle)}"><span aria-hidden="true">&larr;</span></a>
        <a class="project-page-nav-link project-page-nav-link--next" href="${escapeHtml(nextHref)}" aria-label="Next page: ${escapeHtml(nextTitle)}" data-project-title="${escapeHtml(nextTitle)}"><span aria-hidden="true">&rarr;</span></a>
      </nav>`;

function upsertSitePageNavigation(source, navigation) {
  return source
    .replace(/\n\s*<nav class="project-page-nav" aria-label="Site page navigation">[\s\S]*?<\/nav>(?=\s*<\/main>)/i, "")
    .replace(/\n\s*<\/main>/i, `\n${sitePageNavigation(navigation)}\n    </main>`);
}

function staticProjectCards(projects) {
  return projects
    .map((project, index) => {
      const image = representativeImage(project);
      const alternateImage = absoluteUrl(
        project.workThumbnailAlt || `assets/images/work-heroes-alt/${project.id}.webp`,
      );
      return `        <a class="project-card" data-project-id="${escapeHtml(
        project.id,
      )}" href="/project/${encodeURIComponent(pageIdForProject(project))}/">
          <figure class="project-thumb">
            <img class="project-thumb-image project-thumb-image--base" src="${escapeHtml(
              image,
            )}" alt="${escapeHtml(projectWorkAlt(project))}" loading="${index < 3 ? "eager" : "lazy"}" decoding="async">
            <img class="project-thumb-image project-thumb-image--alt" src="${escapeHtml(
              alternateImage,
            )}" alt="" loading="eager" decoding="async">
          </figure>
          <figure class="project-thumb-list">
            <img src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async">
          </figure>
          <div class="project-card-text">
            <span class="project-number">${String(index + 1).padStart(2, "0")}</span>
            <h2>${escapeHtml(project.title)}</h2>
            <p class="project-card-meta">${escapeHtml(project.year ?? "")}</p>
          </div>
        </a>`;
    })
    .join("\n");
}

const selectedCollectionUrl = (collection) =>
  `${ORIGIN}/selected/${encodeURIComponent(collection)}/`;

const selectedCollectionImage = (collection) => {
  const firstItem = selectedCollections[collection]?.[0];
  return absoluteUrl(firstItem?.src || HEADSHOT_4X3);
};

const selectedItemCaption = (collection, item) =>
  item.captionTitle ||
  (collection === "photography" && item.location
    ? `Photograph at ${item.location}`
    : item.title || SELECTED_COLLECTION_META[collection].heading);

const selectedItemAlt = (collection, item) => {
  const caption = selectedItemCaption(collection, item);
  return `${caption} by Andrew Wheat`;
};

function selectedCollectionSchema(collection) {
  const meta = SELECTED_COLLECTION_META[collection];
  const items = selectedCollections[collection] || [];
  const url = selectedCollectionUrl(collection);
  return [
    {
      "@type": ["CollectionPage", "ImageGallery"],
      "@id": `${url}#webpage`,
      url,
      name: meta.title,
      description: meta.description,
      isPartOf: { "@id": WEBSITE_ID },
      author: { "@id": PERSON_ID },
      primaryImageOfPage: {
        "@type": "ImageObject",
        contentUrl: selectedCollectionImage(collection),
      },
      hasPart: items.map((item, index) => ({
        "@type": "ImageObject",
        position: index + 1,
        contentUrl: absoluteUrl(item.src),
        caption: selectedItemCaption(collection, item),
        creator: { "@id": PERSON_ID },
      })),
    },
    breadcrumbNode([
      { name: "Home", url: `${ORIGIN}/` },
      { name: "Selected", url: `${ORIGIN}/selected/` },
      { name: meta.heading, url },
    ]),
  ];
}

function selectedCollectionPage(collection) {
  const meta = SELECTED_COLLECTION_META[collection];
  const items = selectedCollections[collection] || [];
  const canonical = selectedCollectionUrl(collection);
  const image = selectedCollectionImage(collection);
  const collectionIndex = selectedCollectionOrder.indexOf(collection);
  const previousCollection = selectedCollectionOrder[collectionIndex - 1];
  const nextCollection = selectedCollectionOrder[collectionIndex + 1];
  const previousHref = previousCollection ? `/selected/${previousCollection}/` : "/work/";
  const nextHref = nextCollection ? `/selected/${nextCollection}/` : "/work/";
  const previousTitle = previousCollection
    ? SELECTED_COLLECTION_META[previousCollection].heading
    : "Work";
  const nextTitle = nextCollection ? SELECTED_COLLECTION_META[nextCollection].heading : "Work";
  return `<!doctype html>
<html lang="en">
${buildHead({
  title: meta.title,
  description: meta.description,
  canonical,
  image,
  imageAlt: `${meta.heading} by Andrew Wheat`,
  schema: selectedCollectionSchema(collection),
})}
  <body data-page="selected" data-selected-collection="${escapeHtml(collection)}">
    <a class="skip-link" href="#selected-collection">Skip to ${escapeHtml(meta.heading)}</a>
${siteHeader("selected", collection)}
    <main class="selected-shell" id="selected-collection" data-selected-shell>
      <h1 class="selected-page-title" data-selected-title>${escapeHtml(meta.heading)}</h1>
      <p class="selected-status" data-selected-status>${escapeHtml(meta.description)}</p>
      <section class="selected-scatter selected-crawl-list has-items" data-selected-canvas aria-label="${escapeHtml(meta.heading)} collection">
${items
  .map((item, index) => {
    const caption = selectedItemCaption(collection, item);
    return `        <figure class="selected-image-card" data-selected-key="${escapeHtml(item.key || String(index + 1))}">
          <img src="${escapeHtml(item.src)}" alt="${escapeHtml(selectedItemAlt(collection, item))}" width="${Number(item.width) || 1}" height="${Number(item.height) || 1}" loading="${index < 3 ? "eager" : "lazy"}" decoding="async">
          <figcaption class="selected-crawl-caption">${escapeHtml(caption)}</figcaption>
        </figure>`;
  })
  .join("\n")}
      </section>
${sitePageNavigation({
  previousHref,
  previousTitle,
  nextHref: collection === "renderings" ? "/about/" : nextHref,
  nextTitle: collection === "renderings" ? "About" : nextTitle,
  ariaLabel: "Selected collection navigation",
})}
    </main>
${siteFooter}
${scriptTags()}
  </body>
</html>
`;
}

function selectedHubPage() {
  const title = "Selected Work | Andrew Wheat";
  const description =
    "Browse selected architectural drawings, models, photography, sketchbook work, and renderings by Andrew Wheat.";
  return `<!doctype html>
<html lang="en">
${buildHead({
  title,
  description,
  canonical: `${ORIGIN}/selected/`,
  image: selectedCollectionImage("models"),
  imageAlt: "Selected work by Andrew Wheat",
  robots: "noindex, follow",
  schema: [],
})}
  <body data-page="selected">
    <a class="skip-link" href="#selected-collection">Skip to selected collections</a>
${siteHeader("selected")}
    <main class="selected-shell" id="selected-collection" data-selected-shell>
      <h1 class="selected-page-title" data-selected-title>selected</h1>
      <p class="selected-status" data-selected-status>${escapeHtml(description)}</p>
      <nav class="selected-directory" aria-label="Selected collections">
${selectedCollectionOrder
  .map(
    (collection) =>
      `        <a href="/selected/${escapeHtml(collection)}/">${escapeHtml(SELECTED_COLLECTION_META[collection].heading)}</a>`,
  )
  .join("\n")}
      </nav>
    </main>
${siteFooter}
${scriptTags()}
  </body>
</html>
`;
}

function homePage() {
  const title = "Andrew Wheat | Architecture & Design";
  const schema = [
    personNode(),
    websiteNode(),
    {
      "@type": "WebPage",
      "@id": `${ORIGIN}/#webpage`,
      url: `${ORIGIN}/`,
      name: title,
      description: BIO,
      inLanguage: "en-US",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": PERSON_ID },
      mainEntity: { "@id": PERSON_ID },
      primaryImageOfPage: { "@id": `${ORIGIN}/#portrait` },
      dateModified: TODAY,
    },
  ];
  return `<!doctype html>
<html lang="en">
${buildHead({
  title,
  description: BIO,
  canonical: `${ORIGIN}/`,
  image: HEADSHOT_4X3,
  imageAlt: "Portrait of Andrew Wheat",
  type: "profile",
  schema,
  profile: true,
})}
  <body data-page="landing-minimal">
    <a class="skip-link" href="#main">Skip to introduction</a>
${siteHeader()}

    <main class="minimal-landing" id="main">
      <a class="minimal-landing-visual" href="/project/wood-street-pool/" aria-label="View the Wood Street Pool project">
        <img
          src="/assets/images/Projects/Wood%20Street%20Pool/hero%202.png?v=20260726-beam-detail"
          alt="Wood Street Pool natatorium interior"
          width="3840"
          height="2160"
          fetchpriority="high"
          decoding="async"
        >
      </a>
      <div class="minimal-landing-content">
        <h1 class="minimal-landing-copy">${escapeHtml(LANDING_STATEMENT)}</h1>
        <a class="minimal-landing-link" href="/work/">view work</a>
      </div>
    </main>
${scriptTags()}
  </body>
</html>
`;
}

function workSchema() {
  return [
    {
      "@type": "CollectionPage",
      "@id": `${ORIGIN}/work/#collection`,
      url: `${ORIGIN}/work/`,
      name: "Architecture Work by Andrew Wheat",
      description:
        "Architecture projects, drawings, models, and design research by Andrew Wheat across civic space, housing, material systems, and landscape.",
      inLanguage: "en-US",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": PERSON_ID },
      mainEntity: {
        "@type": "ItemList",
        itemListElement: publicProjects.map((project, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: projectUrl(project),
          name: project.title,
        })),
      },
      breadcrumb: { "@id": `${ORIGIN}/work/#breadcrumb` },
      dateModified: TODAY,
    },
    {
      ...breadcrumbNode([
        { name: "Andrew Wheat", url: `${ORIGIN}/` },
        { name: "Work", url: `${ORIGIN}/work/` },
      ]),
      "@id": `${ORIGIN}/work/#breadcrumb`,
    },
  ];
}

function aboutSchema() {
  return [
    {
      "@type": "ProfilePage",
      "@id": `${ORIGIN}/about/#profile-page`,
      url: `${ORIGIN}/about/`,
      name: "About Andrew Wheat",
      description: ABOUT_DESCRIPTION,
      inLanguage: "en-US",
      isPartOf: { "@id": WEBSITE_ID },
      mainEntity: {
        "@id": PERSON_ID,
        "@type": "Person",
        name: "Andrew Wheat",
      },
      primaryImageOfPage: { "@id": `${ORIGIN}/#portrait` },
      breadcrumb: { "@id": `${ORIGIN}/about/#breadcrumb` },
      dateCreated: "2026-07-05",
      dateModified: TODAY,
    },
    {
      ...breadcrumbNode([
        { name: "Andrew Wheat", url: `${ORIGIN}/` },
        { name: "About", url: `${ORIGIN}/about/` },
      ]),
      "@id": `${ORIGIN}/about/#breadcrumb`,
    },
  ];
}

function contactSchema() {
  return [
    {
      "@type": "ContactPage",
      "@id": `${ORIGIN}/contact/#contact`,
      url: `${ORIGIN}/contact/`,
      name: "Contact Andrew Wheat",
      description:
        "Contact Andrew Wheat for professional inquiries, collaborations, or academic correspondence.",
      inLanguage: "en-US",
      isPartOf: { "@id": WEBSITE_ID },
      about: { "@id": PERSON_ID },
      breadcrumb: { "@id": `${ORIGIN}/contact/#breadcrumb` },
      dateModified: TODAY,
    },
    {
      ...breadcrumbNode([
        { name: "Andrew Wheat", url: `${ORIGIN}/` },
        { name: "Contact", url: `${ORIGIN}/contact/` },
      ]),
      "@id": `${ORIGIN}/contact/#breadcrumb`,
    },
  ];
}

function projectSchema(project, image, description) {
  const url = projectUrl(project);
  const pageId = `${url}#webpage`;
  const workId = `${url}#project`;
  const breadcrumbId = `${url}#breadcrumb`;
  const keywords = [
    project.title,
    "Andrew Wheat",
    "architecture",
    "Cornell University",
    project.type,
    ...(project.themes ?? []),
  ]
    .filter(Boolean)
    .join(", ");
  const creativeWork = {
    "@context": "https://schema.org",
    "@type": ["CreativeWork", "VisualArtwork"],
    "@id": workId,
    name: project.title,
    url,
    description,
    image: {
      "@type": "ImageObject",
      url: image,
      contentUrl: image,
      caption: projectWorkAlt(project),
      representativeOfPage: true,
    },
    dateCreated: project.year || undefined,
    artform: "Architecture",
    artMedium: [
      "Architectural drawings",
      "Physical models",
      "Digital visualization",
    ],
    genre: "Architecture",
    keywords,
    creator: { "@id": PERSON_ID },
    author: { "@id": PERSON_ID },
    copyrightHolder: { "@id": PERSON_ID },
    mainEntityOfPage: { "@id": pageId },
    isPartOf: { "@id": `${ORIGIN}/work/#collection` },
    about: [project.type, ...(project.themes ?? [])].filter(Boolean),
  };
  if (project.award) {
    creativeWork.award = project.award;
  }
  if (project.location) {
    creativeWork.spatialCoverage = {
      "@type": "Place",
      name: project.location,
    };
  }
  return {
    graph: [
      {
        "@type": "WebPage",
        "@id": pageId,
        url,
        name: `${project.title} | Andrew Wheat`,
        description,
        inLanguage: "en-US",
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": workId },
        mainEntity: { "@id": workId },
        primaryImageOfPage: image,
        breadcrumb: { "@id": breadcrumbId },
        dateModified: TODAY,
      },
      {
        ...breadcrumbNode([
          { name: "Home", url: `${ORIGIN}/` },
          { name: "Work", url: `${ORIGIN}/work/` },
          { name: project.title, url },
        ]),
        "@id": breadcrumbId,
      },
    ],
    creativeWork,
  };
}

function projectMetadata(project) {
  const criticNames = projectCritics(project);
  const collaboratorNames = peopleList(project.partners);
  return [
    project.course,
    ...(Array.isArray(project.additionalMetadata)
      ? project.additionalMetadata
      : []),
    project.studio,
    criticNames.length
      ? `${criticNames.length === 1 ? "Critic" : "Critics"}: ${criticNames.join(", ")}`
      : "",
    collaboratorNames.length
      ? `${collaboratorNames.length === 1 ? "Collaborator" : "Collaborators"}: ${collaboratorNames.join(", ")}`
      : "",
  ].filter(Boolean);
}

function projectCritics(project) {
  const names = peopleList(project.professors);
  const normalizedNames = names.map((name) => name.toLowerCase());
  const pairedCritics = [
    normalizedNames.findIndex((name) => name.includes("marta") && name.includes("wisniewska")),
    normalizedNames.findIndex((name) => name.includes("tom") && name.includes("carruthers")),
  ];
  if (pairedCritics.every((index) => index >= 0)) {
    return pairedCritics.map((index) => names[index]);
  }
  return names.slice(0, 1);
}

function peopleList(value) {
  return String(value || "")
    .split(/\s*(?:,|\+|&|\band\b)\s*/i)
    .map((name) => name.trim())
    .filter(Boolean);
}

function staticProjectMain(project) {
  const image = projectOpeningImage(project);
  const description = cleanText(project.description || project.summary || "");
  const supporting = cleanText(
    [project.tectonics, project.contribution].filter(Boolean).join(" "),
  );
  const metadata = projectMetadata(project);
  const award = project.award
    ? `<em>${escapeHtml(project.award)}</em>`
    : "";
  const index = publicProjects.findIndex((item) => item.id === project.id);
  const previous =
    index >= 0
      ? publicProjects[(index - 1 + publicProjects.length) % publicProjects.length]
      : null;
  const next =
    index >= 0 ? publicProjects[(index + 1) % publicProjects.length] : null;
  return `    <main class="project-shell" id="project-content" data-project-detail data-project-id="${escapeHtml(
    project.id,
  )}">
      <section class="project-editorial-hero reveal visible">
        <figure class="project-editorial-cover">
          <img src="${escapeHtml(image)}" alt="${escapeHtml(projectOpeningAlt(project))}" fetchpriority="high" decoding="async">
        </figure>
        <div class="project-editorial-text">
          <h1>${escapeHtml(project.title)}</h1>
          ${
            metadata.length
              || award
              ? `<p class="project-editorial-meta">${[
                  ...metadata.map(escapeHtml),
                  award,
                ]
                  .filter(Boolean)
                  .join("<br>")}</p>`
              : ""
          }
          <p>${escapeHtml(description)}</p>
          ${supporting ? `<p>${escapeHtml(supporting)}</p>` : ""}
        </div>
      </section>
      ${
        project.question
          ? `<section class="project-annotations" aria-label="Project framework"><p class="project-question-subtitle">${escapeHtml(
              project.question,
            )}</p></section>`
          : ""
      }
      <nav class="project-page-nav" aria-label="Project navigation">
        ${
          previous
            ? `<a class="project-page-nav-link project-page-nav-link--previous" href="/project/${encodeURIComponent(
                pageIdForProject(previous),
              )}/" aria-label="Previous project: ${escapeHtml(
                previous.title,
              )}" data-project-title="${escapeHtml(previous.title)}"><span aria-hidden="true">&larr;</span></a>`
            : ""
        }
        ${
          next
            ? `<a class="project-page-nav-link project-page-nav-link--next" href="/project/${encodeURIComponent(
                pageIdForProject(next),
              )}/" aria-label="Next project: ${escapeHtml(
                next.title,
              )}" data-project-title="${escapeHtml(next.title)}"><span aria-hidden="true">&rarr;</span></a>`
            : ""
        }
      </nav>
    </main>`;
}

async function rewriteProjectPage(project, { indexable }) {
  const slug = pageIdForProject(project);
  const file = `${ROOT}/project/${slug}/index.html`;
  if (!existsSync(file)) return;
  const url = projectUrl(project);
  const image = representativeImage(project);
  const description = projectDescription(project);
  const schemas = projectSchema(project, image, description);
  const head = buildHead({
    title: PROJECT_SEO[project.id]?.title || `${project.title} | Andrew Wheat`,
    description,
    canonical: url,
    image,
    imageAlt: projectWorkAlt(project),
    type: "article",
    robots: indexable ? ROBOTS_INDEX : "noindex, follow",
    schema: schemas.graph,
    projectSchema: schemas.creativeWork,
  });
  let source = await readFile(file, "utf8");
  source = source.replace(/  <head>[\s\S]*?  <\/head>/i, head);
  source = source.replace(
    /    <header class="site-header[\s\S]*?    <\/header>/i,
    siteHeader("work"),
  );
  source = source.replace(
    /    <main class="project-shell[\s\S]*?    <\/main>/i,
    staticProjectMain(project),
  );
  await writeClean(file, source);
}

function noIndexHead({ title, canonical, description }) {
  return buildHead({
    title,
    description,
    canonical,
    image: HEADSHOT_4X3,
    imageAlt: "Portrait of Andrew Wheat",
    robots: "noindex, follow",
    schema: [],
  });
}

async function updateWorkPage(file, { legacy = false } = {}) {
  const title = "Work | Andrew Wheat";
  const description =
    "Architecture projects, drawings, models, and design research by Andrew Wheat across civic space, housing, material systems, and landscape.";
  let source = await readFile(file, "utf8");
  source = source.replace(
    /  <head>[\s\S]*?  <\/head>/i,
    buildHead({
      title,
      description,
      canonical: `${ORIGIN}/work/`,
      image: representativeImage(publicProjects[0]),
      imageAlt: projectWorkAlt(publicProjects[0]),
      robots: legacy ? "noindex, follow" : ROBOTS_INDEX,
      schema: legacy ? [] : workSchema(),
    }),
  );
  source = source.replace(
    /    <header class="site-header[\s\S]*?    <\/header>/i,
    siteHeader("work"),
  );
  source = source.replace(
    /      <section class="work-catalogue[\s\S]*?      <\/section>/i,
    `      <section class="work-catalogue reveal visible" id="work-catalogue" data-work-catalogue data-view="grid" aria-label="Architecture work by Andrew Wheat">
${staticProjectCards(publicProjects)}
      </section>`,
  );
  source = source
    .replace(/<h1>Projects<\/h1>/i, "<h1>work</h1>")
    .replace(/aria-label="Filter projects by category"/i, 'aria-label="Filter work by category"')
    .replace(/\s*<noscript>[\s\S]*?<\/noscript>/i, "");
  source = upsertSitePageNavigation(source, {
    previousHref: "/contact/",
    previousTitle: "Contact",
    nextHref: "/selected/drawings/",
    nextTitle: "Drawings",
  });
  await writeClean(file, source);
}

async function updateAboutPage(file, { legacy = false } = {}) {
  const title = "About Andrew Wheat";
  let source = await readFile(file, "utf8");
  source = source.replace(
    /  <head>[\s\S]*?  <\/head>/i,
    buildHead({
      title,
      description: ABOUT_DESCRIPTION,
      canonical: `${ORIGIN}/about/`,
      image: HEADSHOT_4X3,
      imageAlt: "Portrait of Andrew Wheat",
      type: "profile",
      robots: legacy ? "noindex, follow" : ROBOTS_INDEX,
      schema: legacy ? [] : aboutSchema(),
      profile: true,
    }),
  );
  source = source.replace(
    /    <header class="site-header[\s\S]*?    <\/header>/i,
    siteHeader("about"),
  );
  source = source.replace(/<h1>About(?: Andrew Wheat)?<\/h1>/i, "<h1>About</h1>");
  source = source.replace(
    /        <div class="about-statement">[\s\S]*?        <\/div>\s*      <\/section>/i,
    `        <div class="about-statement">
          <p>
            I'm a Bachelor of Architecture student at Cornell interested in how
            architecture can give greater presence to public and collective life.
            My work explores civic space, housing, material systems, and the
            relationship between buildings and landscape, with particular
            attention to how construction, climate, and everyday use shape
            spatial experience.
          </p>
          <p>
            Through Cornell University Sustainable Design, I contribute to
            interdisciplinary design initiatives and student leadership. At Mithun,
            I have contributed to projects spanning
            housing, civic installations, and temporary public architecture
            through design research, physical modeling, visualization, and
            documentation.
          </p>
        </div>
      </section>`,
  );
  source = source.replace(
    /        <section class="cv-section" aria-labelledby="skills-title">[\s\S]*?        <\/section>/i,
    technicalSkillsSection(),
  );
  source = source
    .replace(
      /<h4>(?:<a\b[^>]*>)?Cornell University \| Bachelor of Architecture(?:<\/a>)?<\/h4>/i,
      `<h4><a class="cv-title-link" href="${CORNELL_ARCHITECTURE}" target="_blank" rel="noopener noreferrer">Cornell University | Bachelor of Architecture</a></h4>`,
    )
    .replace(
      /<h4>(?:<a\b[^>]*>)?Mithun, Inc\.(?:<\/a>)? \| Architectural Intern<\/h4>/i,
      `<h4><a class="cv-title-link" href="${MITHUN}" target="_blank" rel="noopener noreferrer">Mithun, Inc.</a> | Architectural Intern</h4>`,
    )
    .replace(
      /<h4>(?:<a\b[^>]*>)?BRIC Architecture, Inc\.(?:<\/a>)? \| Architectural Intern<\/h4>/i,
      `<h4><a class="cv-title-link" href="${BRIC_ARCHITECTURE}" target="_blank" rel="noopener noreferrer">BRIC Architecture, Inc.</a> | Architectural Intern</h4>`,
    )
    .replace(
      /<h4>(?:<a\b[^>]*>)?Cornell University Sustainable Design(?:<\/a>)? \| Executive Board<\/h4>/i,
      `<h4><a class="cv-title-link" href="${CUSD}" target="_blank" rel="noopener noreferrer">Cornell University Sustainable Design</a> | Executive Board</h4>`,
    )
    .replace(
      /<h4>(?:<a\b[^>]*>)?Addison G\. Crowley, B\.L\.Arch\. (?:&#39;|')38 Prize(?:<\/a>)?<\/h4>/i,
      `<h4><a class="cv-title-link" href="${CORNELL_AWARDS}" target="_blank" rel="noopener noreferrer">Addison G. Crowley, B.L.Arch. '38 Prize</a></h4>`,
    );
  source = source.replace(
    /<a href="https:\/\/www\.linkedin\.com\/in\/andrewwheat"/g,
    `<a rel="me" href="${LINKEDIN}"`,
  );
  source = upsertSitePageNavigation(source, {
    previousHref: "/selected/renderings/",
    previousTitle: "Renderings",
    nextHref: "/contact/",
    nextTitle: "Contact",
  });
  await writeClean(file, source);
}

async function updateContactPage(file, { legacy = false } = {}) {
  const title = "Contact Andrew Wheat";
  const description =
    "Contact Andrew Wheat for professional inquiries, collaborations, or academic correspondence.";
  let source = await readFile(file, "utf8");
  source = source.replace(
    /  <head>[\s\S]*?  <\/head>/i,
    buildHead({
      title,
      description,
      canonical: `${ORIGIN}/contact/`,
      image: HEADSHOT_4X3,
      imageAlt: "Portrait of Andrew Wheat",
      robots: legacy ? "noindex, follow" : ROBOTS_INDEX,
      schema: legacy ? [] : contactSchema(),
    }),
  );
  source = source.replace(
    /    <header class="site-header[\s\S]*?    <\/header>/i,
    siteHeader("contact"),
  );
  source = source
    .replace(/<h1>Contact(?: Andrew Wheat)?<\/h1>/i, "<h1>Contact</h1>")
    .replace(/\s*<section class="contact-copy[\s\S]*?<\/section>/i, "")
    .replace(
      /\n      <section class="contact-list/i,
      `
      <section class="contact-copy reveal" aria-label="Contact Andrew Wheat">
        <p>For professional inquiries, collaborations, or academic correspondence, contact Andrew Wheat by <a href="mailto:ajw288@cornell.edu">email at ajw288@cornell.edu</a> or connect on <a href="${LINKEDIN}" rel="me noreferrer" target="_blank">LinkedIn</a>.</p>
      </section>

      <section class="contact-list`,
    );
  source = source.replace(
    /href="https:\/\/www\.linkedin\.com\/in\/andrewwheat"/g,
    `href="${LINKEDIN}"`,
  );
  source = source.replace(/\s+data-contact-email="[^"]*"/gi, "");
  source = upsertSitePageNavigation(source, {
    previousHref: "/about/",
    previousTitle: "About",
    nextHref: "/work/",
    nextTitle: "Work",
  });
  await writeClean(file, source);
}

function sitemapXml() {
  const entries = [
    {
      url: `${ORIGIN}/`,
      image: HEADSHOT_4X3,
      imageTitle: "Andrew Wheat | Architecture & Design",
    },
    {
      url: `${ORIGIN}/work/`,
      image: representativeImage(publicProjects[0]),
      imageTitle: projectWorkAlt(publicProjects[0]),
    },
    {
      url: `${ORIGIN}/about/`,
      image: HEADSHOT,
      imageTitle: "Portrait of Andrew Wheat",
    },
    {
      url: `${ORIGIN}/contact/`,
      image: HEADSHOT_4X3,
      imageTitle: "Andrew Wheat",
    },
    ...selectedCollectionOrder.map((collection) => ({
      url: selectedCollectionUrl(collection),
      image: selectedCollectionImage(collection),
      imageTitle: `${SELECTED_COLLECTION_META[collection].heading} by Andrew Wheat`,
    })),
    ...publicProjects.map((project) => ({
      url: projectUrl(project),
      image: representativeImage(project),
      imageTitle: projectWorkAlt(project),
    })),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries
  .map(
    (entry) => `  <url>
    <loc>${xmlEscape(entry.url)}</loc>
    <lastmod>${TODAY}</lastmod>
    <image:image>
      <image:loc>${xmlEscape(entry.image)}</image:loc>
      <image:title>${xmlEscape(entry.imageTitle)}</image:title>
    </image:image>
  </url>`,
  )
  .join("\n")}
</urlset>
`;
}

function llmsSummary() {
  return `# Andrew Wheat

> ${BIO}

This is Andrew Wheat's canonical portfolio and biography source.

## Primary Pages

- [Home](${ORIGIN}/): Andrew Wheat's canonical profile and portfolio entry point.
- [Work](${ORIGIN}/work/): Public architecture work, drawings, models, and design research.
- [About Andrew Wheat](${ORIGIN}/about/): Biography, education, professional experience, academic work, skills, and awards.
- [Contact Andrew Wheat](${ORIGIN}/contact/): Professional contact information and verified LinkedIn profile.
- [Models](${ORIGIN}/selected/models/): Selected physical models, material studies, and fabrication work.
- [Photography](${ORIGIN}/selected/photography/): Selected architectural and observational photography.
- [Sketchbook](${ORIGIN}/selected/sketchbook/): Selected sketches, drawings, and design studies.
- [Renderings](${ORIGIN}/selected/renderings/): Selected architectural visualization work.

## Identity

- Full name: Andrew Wheat
- Role: Designer and Bachelor of Architecture student
- Education: Bachelor of Architecture candidate at Cornell University College of Architecture, Art, and Planning, expected May 2028
- Based in: Seattle and New York City
- Professional experience: Mithun and BRIC Architecture
- Academic leadership: Cornell University Sustainable Design
- Verified external profile: ${LINKEDIN}
- Independent Cornell reference: ${CORNELL_AWARDS}

## Public Work

${publicProjects
  .map(
    (project) =>
      `- [${project.title}](${projectUrl(project)}): ${projectDescription(project)}`,
  )
  .join("\n")}

## Preferred Attribution

Andrew Wheat, designer and Bachelor of Architecture student at Cornell University.

## Disambiguation

Andrew Wheat on this site refers to the Cornell architecture student and designer at andrew-wheat.com. Do not conflate him with unrelated people, companies, software users, or the band named Wheat.
`;
}

function llmsFull() {
  return `# Andrew Wheat — Full Portfolio Context

${BIO}

Andrew studies architecture at Cornell University College of Architecture, Art, and Planning and is expected to complete the Bachelor of Architecture program in May 2028. His work explores civic space, housing, material systems, landscape, construction, climate, and everyday use.

Through Cornell University Sustainable Design, Andrew contributes to interdisciplinary design initiatives and student leadership. At Mithun, he has contributed to projects spanning housing, civic installations, and temporary public architecture through design research, physical modeling, visualization, and documentation.

## Work

${publicProjects
  .map(
    (project) => `### ${project.title}

- Canonical URL: ${projectUrl(project)}
- Year: ${project.year ?? ""}
- Category: ${project.workArchiveOnly ? "Archive" : project.workCategory ?? "Academic"}
${project.course ? `- Course: ${project.course}\n` : ""}${
      project.studio ? `- Studio: ${project.studio}\n` : ""
    }${
      projectCritics(project).length
        ? `- ${projectCritics(project).length === 1 ? "Critic" : "Critics"}: ${projectCritics(project).join(", ")}\n`
        : ""
    }${
      project.partners
        ? `- ${peopleList(project.partners).length === 1 ? "Collaborator" : "Collaborators"}: ${peopleList(project.partners).join(", ")}\n`
        : ""
    }${
      project.award ? `- Award: ${project.award}\n` : ""
    }
${projectDescription(project)}

${cleanText(project.description ?? "")}
`,
  )
  .join("\n")}

## Canonical Sources

- Portfolio: ${ORIGIN}/
- Biography: ${ORIGIN}/about/
- Work index: ${ORIGIN}/work/
- Contact: ${ORIGIN}/contact/
- LinkedIn: ${LINKEDIN}
- Cornell AAP award reference: ${CORNELL_AWARDS}
`;
}

function notFoundMark() {
  const digitPatterns = {
    0: [
      "11111",
      "10001",
      "10001",
      "10001",
      "10001",
      "10001",
      "11111",
    ],
    4: [
      "10001",
      "10001",
      "10001",
      "11111",
      "00001",
      "00001",
      "00001",
    ],
  };
  const digits = [4, 0, 4];
  const square = 52;
  const moduleGap = 14;
  const digitGap = 56;
  const pitch = square + moduleGap;
  const digitWidth = square * 5 + moduleGap * 4;
  const height = square * 7 + moduleGap * 6;
  const width = digitWidth * digits.length + digitGap * (digits.length - 1);
  const squares = digits.flatMap((digit, digitIndex) => {
    const offsetX = digitIndex * (digitWidth + digitGap);
    return digitPatterns[digit].flatMap((row, rowIndex) =>
      [...row].flatMap((cell, columnIndex) =>
        cell === "1"
          ? [
              `<rect x="${offsetX + columnIndex * pitch}" y="${rowIndex * pitch}" width="${square}" height="${square}"/>`,
            ]
          : [],
      ),
    );
  });

  return `<svg class="error-mark" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="error-mark-title" focusable="false">
          <title id="error-mark-title">404</title>
          <g fill="currentColor" shape-rendering="crispEdges">
            ${squares.join("\n            ")}
          </g>
        </svg>`;
}

function notFoundPage() {
  const title = "Page Not Found | Andrew Wheat";
  return `<!doctype html>
<html lang="en">
${buildHead({
  title,
  description: "The requested page could not be found on Andrew Wheat's architecture portfolio.",
  canonical: `${ORIGIN}/404.html`,
  image: HEADSHOT_4X3,
  imageAlt: "Portrait of Andrew Wheat",
  robots: "noindex, follow",
  schema: [],
})}
  <body data-page="error">
    <a class="skip-link" href="#main">Skip to main content</a>
${siteHeader()}
    <main class="page-shell error-shell" id="main">
      <section class="error-page">
        ${notFoundMark()}
        <div class="error-content">
          <h1>page not found</h1>
          <p>The page may have moved or no longer exists.</p>
          <nav class="error-links" aria-label="Continue browsing">
            <a href="/work/">work</a>
            <a href="/">home</a>
          </nav>
        </div>
      </section>
    </main>
${siteFooter}
${scriptTags(false)}
  </body>
</html>
`;
}

function legacyProjectIndexPage() {
  return `<!doctype html>
<html lang="en">
${noIndexHead({
  title: "Work | Andrew Wheat",
  canonical: `${ORIGIN}/work/`,
  description: "Browse architecture work by Andrew Wheat.",
})}
  <body data-page="project">
    <a class="skip-link" href="#main">Skip to work</a>
${siteHeader("work")}
    <main class="page-shell error-shell" id="main">
      <section class="error-page">
        <div class="error-content">
          <h1>work has moved</h1>
          <p>Browse the current architecture portfolio on the Work page.</p>
          <nav class="error-links" aria-label="Continue browsing">
            <a href="/work/">view work</a>
          </nav>
        </div>
      </section>
    </main>
${siteFooter}
${scriptTags(false)}
  </body>
</html>
`;
}

await writeClean(`${ROOT}/index.html`, homePage());

for (const file of [`${ROOT}/work/index.html`, `${ROOT}/work.html`]) {
  await updateWorkPage(file, { legacy: file.endsWith("work.html") });
}

for (const file of [`${ROOT}/about/index.html`, `${ROOT}/about.html`]) {
  await updateAboutPage(file, { legacy: file.endsWith("about.html") });
}

for (const file of [`${ROOT}/contact/index.html`, `${ROOT}/contact.html`]) {
  await updateContactPage(file, { legacy: file.endsWith("contact.html") });
}

await writeClean(`${ROOT}/selected/index.html`, selectedHubPage());
for (const collection of selectedCollectionOrder) {
  const directory = `${ROOT}/selected/${collection}`;
  await mkdir(directory, { recursive: true });
  await writeClean(`${directory}/index.html`, selectedCollectionPage(collection));
}

for (const project of publicProjects) {
  await rewriteProjectPage(project, { indexable: true });
}

for (const project of archivedProjects) {
  if (publicProjectIds.has(project.id)) continue;
  await rewriteProjectPage(project, { indexable: false });
}

for (const file of [`${ROOT}/project.html`, `${ROOT}/project/index.html`]) {
  await writeClean(file, legacyProjectIndexPage());
}

await writeClean(
  `${ROOT}/robots.txt`,
  `# Andrew Wheat portfolio: public pages are available to search and AI crawlers.
User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`,
);
await writeClean(`${ROOT}/sitemap.xml`, sitemapXml());
await writeClean(`${ROOT}/llms.txt`, llmsSummary());
await writeClean(`${ROOT}/llms-full.txt`, llmsFull());
await writeClean(`${ROOT}/404.html`, notFoundPage());

const allHtmlFiles = [
  "index.html",
  "work.html",
  "about.html",
  "contact.html",
  "project.html",
  "work/index.html",
  "about/index.html",
  "contact/index.html",
  "project/index.html",
  "selected/index.html",
  ...selectedCollectionOrder.map(
    (collection) => `selected/${collection}/index.html`,
  ),
  ...publicProjects.map(
    (project) => `project/${pageIdForProject(project)}/index.html`,
  ),
  ...archivedProjects.map(
    (project) => `project/${pageIdForProject(project)}/index.html`,
  ),
].filter(
  (file, index, source) =>
    source.indexOf(file) === index && existsSync(`${ROOT}/${file}`),
);

for (const relativeFile of allHtmlFiles) {
  const file = `${ROOT}/${relativeFile}`;
  const source = await readFile(file, "utf8");
  await writeClean(
    file,
    source
      .replace(
        /202607(?:11|25|26)-[a-z0-9-]+/g,
        "__CURRENT_ASSET_VERSION__",
      )
      .replaceAll("20260725-seo-crawl-v14", ASSET_VERSION)
      .replaceAll("20260726-pool-plan-svg-v1", ASSET_VERSION)
      .replaceAll("20260725-project-spacing-v13", ASSET_VERSION)
      .replaceAll("20260725-title-case-v12", ASSET_VERSION)
      .replaceAll(
        "20260711-enfield-online-refresh",
        "20260726-wood-pool-heroes-v2",
      )
      .replaceAll(
        "20260726-wood-pool-hero-v1",
        "20260726-pool-floor-plans-v1",
      )
      .replaceAll(
        "20260726-wood-pool-heroes-v2",
        "20260726-pool-floor-plans-v1",
      )
      .replaceAll(
        "20260726-deconstruct-work-image-v1",
        "20260726-pool-drawings-v1",
      )
      .replaceAll(
        "20260726-pool-floor-plans-v1",
        "20260726-pool-svg-drawings-v1",
      )
      .replaceAll(
        "20260726-pool-drawings-v1",
        "20260726-pool-svg-drawings-v1",
      )
      .replaceAll(
        "20260726-pool-svg-drawings-v1",
        "20260726-pool-plan-svgs-v1",
      )
      .replaceAll(
        "20260726-pool-plan-svgs-v1",
        "20260726-pool-drawing-svgs-v2",
      )
      .replaceAll(
        "20260726-pool-drawing-svgs-v2",
        "20260726-pool-drawing-svgs-v3",
      )
      .replaceAll(
        "20260726-pool-drawing-svgs-v3",
        "20260726-landing-position-lock-v1",
      )
      .replaceAll(
        "20260726-landing-position-lock-v1",
        "20260726-landing-standard-header-v2",
      )
      .replaceAll(
        "20260726-landing-standard-header-v2",
        "20260726-landing-standard-header-v3",
      )
      .replaceAll(
        "20260726-landing-standard-header-v3",
        "20260726-hunters-model-refresh-v1",
      )
      .replaceAll(
        "20260726-hunters-model-refresh-v1",
        "20260726-hunters-model-size-v2",
      )
      .replaceAll(
        "20260726-hunters-model-size-v2",
        "20260726-selected-launch-v1",
      )
      .replaceAll(
        "20260726-selected-launch-v1",
        "20260726-selected-launch-v2",
      )
      .replaceAll(
        "20260726-selected-launch-v2",
        "20260726-selected-editorial-v3",
      )
      .replaceAll(
        "20260726-selected-editorial-v3",
        "20260726-selected-editorial-v4",
      )
      .replaceAll(
        "20260726-selected-editorial-v4",
        "20260726-selected-editorial-v5",
      )
      .replaceAll(
        "20260726-selected-editorial-v5",
        "20260726-selected-editorial-v6",
      )
      .replaceAll(
        "20260726-selected-editorial-v6",
        "20260726-selected-editorial-v7",
      )
      .replaceAll(
        "20260726-selected-editorial-v7",
        "20260726-selected-editorial-v8",
      )
      .replaceAll(
        "20260726-selected-editorial-v8",
        "20260726-selected-editorial-v9",
      )
      .replaceAll(
        "20260726-selected-editorial-v9",
        "20260726-selected-editorial-v10",
      )
      .replaceAll(
        "20260726-selected-editorial-v10",
        "20260726-selected-editorial-v11",
      )
      .replaceAll(
        "20260726-selected-editorial-v11",
        "20260726-selected-editorial-v12",
      )
      .replaceAll(
        "20260726-selected-editorial-v12",
        "20260726-selected-editorial-v13",
      )
      .replaceAll(
        "20260726-selected-editorial-v13",
        "20260726-selected-editorial-v14",
      )
      .replaceAll(
        "20260726-selected-editorial-v14",
        "20260726-selected-editorial-v15",
      )
      .replaceAll(
        "20260726-selected-editorial-v15",
        "20260726-selected-editorial-v16",
      )
      .replaceAll(
        "20260726-selected-editorial-v16",
        "20260726-selected-editorial-v17",
      )
      .replaceAll(
        "20260726-selected-editorial-v17",
        "20260726-selected-editorial-v18",
      )
      .replaceAll(
        "20260726-selected-editorial-v18",
        "20260726-selected-editorial-v19",
      )
      .replaceAll(
        "20260726-selected-editorial-v19",
        "20260726-selected-editorial-v20",
      )
      .replaceAll(
        "20260726-selected-editorial-v20",
        "20260726-selected-editorial-v21",
      )
      .replaceAll(
        "20260726-selected-editorial-v21",
        "20260726-selected-editorial-v22",
      )
      .replaceAll(
        "20260726-selected-editorial-v22",
        "20260726-selected-editorial-v23",
      )
      .replaceAll(
        "20260726-selected-editorial-v23",
        "20260726-selected-editorial-v24",
      )
      .replaceAll(
        "20260726-selected-editorial-v24",
        "20260726-selected-editorial-v25",
      )
      .replaceAll(
        "20260726-selected-editorial-v25",
        "20260726-selected-editorial-v26",
      )
      .replaceAll(
        "20260726-selected-editorial-v26",
        "20260726-selected-editorial-v27",
      )
      .replaceAll(
        "20260726-selected-editorial-v27",
        "20260726-selected-editorial-v28",
      )
      .replaceAll(
        "20260726-selected-editorial-v28",
        "20260726-selected-editorial-v29",
      )
      .replaceAll(
        "20260726-selected-editorial-v29",
        "20260726-selected-editorial-v30",
      )
      .replaceAll("__CURRENT_ASSET_VERSION__", ASSET_VERSION),
  );
}

console.log(
  `SEO build complete: ${publicProjects.length} public work entries, ${allHtmlFiles.length} HTML pages.`,
);
