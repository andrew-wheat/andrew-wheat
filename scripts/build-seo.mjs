import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { runInNewContext } from "node:vm";

const ROOT = process.cwd();
const ORIGIN = "https://andrew-wheat.com";
const TODAY = "2026-07-25";
const ASSET_VERSION = "20260727-sketchbook-center-v71";
const PERSON_ID = `${ORIGIN}/#andrew-wheat`;
const WEBSITE_ID = `${ORIGIN}/#website`;
const HEADSHOT = `${ORIGIN}/assets/images/andrew-wheat-headshot.jpg`;
const HEADSHOT_4X3 = `${ORIGIN}/assets/images/seo/andrew-wheat-portrait-4x3.jpg`;
const HEADSHOT_16X9 = `${ORIGIN}/assets/images/seo/andrew-wheat-portrait-16x9.jpg`;
const CORNELL_AWARDS =
  "https://aap.cornell.edu/news/announcements/2025-26-student-academic-awards-and-prizes/";
const LINKEDIN = "https://www.linkedin.com/in/andrewwheat";
const BIO =
  "Andrew Wheat is a designer and architecture student at Cornell University. He is currently based in Seattle and New York City.";
const LANDING_STATEMENT =
  "Andrew Wheat is a designer and architecture student at Cornell University. Based between Seattle and New York City, his work explores civic space, housing, material systems, and the relationship between buildings and landscape.";
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
    title: "Deconstruct Reconfigure | Andrew Wheat",
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
  "sustainable-education": {
    title: "Sustainable Education | Andrew Wheat",
    description:
      "Sustainable education design work by Andrew Wheat with Cornell University Sustainable Design, focused on school infrastructure, climate resilience, cultural continuity, and environmental systems.",
  },
  "york-prize": {
    title: "York Prize | Andrew Wheat",
    description:
      "Cornell architecture work by Andrew Wheat developed for the York Prize, including drawings, models, and architectural design research.",
  },
  "ephemeral-diptypque": {
    title: "Ephemeral Diptyque | Andrew Wheat",
    description:
      "Architecture and image sequence study by Andrew Wheat exploring atmosphere, temporality, pairing, and architectural reading.",
  },
};

const projectContext = { window: {} };
runInNewContext(
  await readFile(`${ROOT}/assets/js/projects.js`, "utf8"),
  projectContext,
);

const publicProjects = projectContext.window.PORTFOLIO_PROJECTS ?? [];
const archivedProjects = projectContext.window.ARCHIVED_PORTFOLIO_PROJECTS ?? [];
const publicProjectIds = new Set(publicProjects.map((project) => project.id));

const writeClean = (file, content) =>
  writeFile(file, String(content).replace(/[ \t]+(?=\r?\n|$)/g, ""));

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

const pageIdForProject = (project) =>
  project.id === "ephemeral-diptypque" ? "ephemeral-diptyque" : project.id;

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
  givenName: "Andrew",
  familyName: "Wheat",
  url: `${ORIGIN}/`,
  mainEntityOfPage: `${ORIGIN}/about/`,
  image: [
    {
      "@type": "ImageObject",
      "@id": `${ORIGIN}/#portrait`,
      url: HEADSHOT,
      contentUrl: HEADSHOT,
      width: 9912,
      height: 9912,
      caption: "Portrait of Andrew Wheat",
    },
    {
      "@type": "ImageObject",
      url: HEADSHOT_4X3,
      contentUrl: HEADSHOT_4X3,
      width: 5973,
      height: 4480,
      caption: "Andrew Wheat, designer and Cornell architecture student",
    },
    {
      "@type": "ImageObject",
      url: HEADSHOT_16X9,
      contentUrl: HEADSHOT_16X9,
      width: 6720,
      height: 3780,
      caption: "Andrew Wheat architecture portfolio",
    },
  ],
  jobTitle: ["Designer", "Architecture Student"],
  description: BIO,
  disambiguatingDescription:
    "Andrew Wheat is the Cornell architecture student and designer whose portfolio is published at andrew-wheat.com.",
  hasOccupation: [
    {
      "@type": "Occupation",
      name: "Designer",
      occupationLocation: [
        { "@type": "City", name: "Seattle" },
        { "@type": "City", name: "New York City" },
      ],
    },
    {
      "@type": "Occupation",
      name: "Architecture Student",
      educationRequirements: "Bachelor of Architecture candidate",
    },
  ],
  affiliation: [
    {
      "@type": "CollegeOrUniversity",
      name: "Cornell University College of Architecture, Art, and Planning",
      url: "https://aap.cornell.edu/",
    },
    {
      "@type": "Organization",
      name: "Mithun",
      url: "https://mithun.com/",
    },
    {
      "@type": "Organization",
      name: "Cornell University Sustainable Design",
      url: "https://www.cusd.cornell.edu/",
    },
  ],
  homeLocation: [
    { "@type": "City", name: "Seattle" },
    { "@type": "City", name: "New York City" },
  ],
  knowsAbout: [
    "Architecture",
    "Architectural design",
    "Public architecture",
    "Civic space",
    "Housing",
    "Material systems",
    "Landscape",
    "Climate-responsive design",
    "Environmental systems",
    "Architectural drawings",
    "Physical models",
  ],
  award: [
    "Addison G. Crowley, B.L.Arch. '38 Prize",
    "Honorable Mention, Cornell AAP Internal Studio Competition",
  ],
  sameAs: [LINKEDIN],
  subjectOf: [
    {
      "@type": "WebPage",
      name: "2025–26 Student Academic Awards and Prizes",
      url: CORNELL_AWARDS,
      publisher: {
        "@type": "CollegeOrUniversity",
        name: "Cornell University College of Architecture, Art, and Planning",
        url: "https://aap.cornell.edu/",
      },
    },
  ],
});

const websiteNode = () => ({
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: "Andrew Wheat",
  alternateName: "Andrew Wheat Architecture Portfolio",
  url: `${ORIGIN}/`,
  description: BIO,
  inLanguage: "en-US",
  author: { "@id": PERSON_ID },
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
    <link rel="icon" href="/favicon.ico?v=2" sizes="any">
    <link rel="shortcut icon" href="/favicon.ico?v=2">
    <link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml">
    <link rel="icon" href="/favicon-48.png?v=2" sizes="48x48" type="image/png">
    <link rel="icon" href="/favicon-192.png?v=2" sizes="192x192" type="image/png">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2">
    <link rel="manifest" href="/site.webmanifest?v=2">`;

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
    ${jsonLd({ "@context": "https://schema.org", "@graph": schema }, "site-schema")}
    ${projectSchema ? jsonLd(projectSchema, "project-schema") : ""}
  </head>`;
}

const brandMark = `<svg class="brand-mark" viewBox="0 0 939 350" aria-hidden="true" focusable="false"><g fill="currentColor"><rect x="194" y="0" width="154" height="95"/><rect x="391" y="0" width="154" height="95"/><rect x="588" y="0" width="154" height="95"/><rect x="785" y="0" width="154" height="95"/><rect x="93" y="95" width="255" height="59"/><rect x="391" y="95" width="548" height="59"/><rect x="93" y="154" width="154" height="42"/><rect x="490" y="154" width="154" height="42"/><rect x="687" y="154" width="154" height="42"/><rect x="0" y="196" width="348" height="53"/><rect x="391" y="196" width="253" height="53"/><rect x="687" y="196" width="252" height="53"/><rect x="0" y="249" width="154" height="101"/><rect x="194" y="249" width="154" height="101"/><rect x="391" y="249" width="154" height="101"/><rect x="785" y="249" width="154" height="101"/></g></svg>`;

const siteHeader = (active = "") => `    <header class="site-header static-header" aria-label="Primary navigation">
      <a class="brand" href="/" aria-label="Andrew Wheat home">${brandMark}<span>Andrew Wheat</span></a>
      <nav class="site-nav">
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
            )}" alt="${escapeHtml(
              `${project.title} architecture project by Andrew Wheat`,
            )}" loading="${index < 3 ? "eager" : "lazy"}" decoding="async">
            <img class="project-thumb-image project-thumb-image--alt" src="${escapeHtml(
              alternateImage,
            )}" alt="${escapeHtml(
              `${project.title} alternate hero image`,
            )}" loading="eager" decoding="async">
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

function homePage() {
  const title = "Andrew Wheat | Designer & Cornell Architecture Student";
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
    personNode(),
    websiteNode(),
    {
      "@type": "CollectionPage",
      "@id": `${ORIGIN}/work/#collection`,
      url: `${ORIGIN}/work/`,
      name: "Architecture Projects by Andrew Wheat",
      description:
        "Architecture projects, drawings, models, and design research by Andrew Wheat, a Cornell architecture student and designer.",
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
        { name: "Architecture Projects", url: `${ORIGIN}/work/` },
      ]),
      "@id": `${ORIGIN}/work/#breadcrumb`,
    },
  ];
}

function aboutSchema() {
  return [
    personNode(),
    websiteNode(),
    {
      "@type": "ProfilePage",
      "@id": `${ORIGIN}/about/#profile`,
      url: `${ORIGIN}/about/`,
      name: "About Andrew Wheat",
      description: BIO,
      inLanguage: "en-US",
      isPartOf: { "@id": WEBSITE_ID },
      mainEntity: { "@id": PERSON_ID },
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
    personNode(),
    websiteNode(),
    {
      "@type": "ContactPage",
      "@id": `${ORIGIN}/contact/#contact`,
      url: `${ORIGIN}/contact/`,
      name: "Contact Andrew Wheat",
      description:
        "Contact Andrew Wheat, designer and architecture student at Cornell University.",
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
      caption: `${project.title} architecture project by Andrew Wheat`,
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
  if (project.location) {
    creativeWork.spatialCoverage = {
      "@type": "Place",
      name: project.location,
    };
  }
  return {
    graph: [
      personNode(),
      websiteNode(),
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
          { name: "Andrew Wheat", url: `${ORIGIN}/` },
          { name: "Architecture Projects", url: `${ORIGIN}/work/` },
          { name: project.title, url },
        ]),
        "@id": breadcrumbId,
      },
    ],
    creativeWork,
  };
}

function projectMetadata(project) {
  return [
    project.course,
    ...(Array.isArray(project.additionalMetadata)
      ? project.additionalMetadata
      : []),
    project.studio,
    project.professors ? `Professors: ${project.professors}` : "",
    project.partners ? `Partners: ${project.partners}` : "",
  ].filter(Boolean);
}

function staticProjectMain(project) {
  const image = representativeImage(project);
  const description = cleanText(project.description || project.summary || "");
  const supporting = cleanText(
    [project.tectonics, project.contribution].filter(Boolean).join(" "),
  );
  const metadata = projectMetadata(project);
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
          <img src="${escapeHtml(image)}" alt="${escapeHtml(
            `${project.title} architecture project by Andrew Wheat`,
          )}" fetchpriority="high" decoding="async">
        </figure>
        <div class="project-editorial-text">
          <h1>${escapeHtml(project.title)}</h1>
          ${
            metadata.length
              ? `<p class="project-editorial-meta">${metadata
                  .map(escapeHtml)
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
              )}"><span aria-hidden="true">&larr;</span></a>`
            : ""
        }
        ${
          next
            ? `<a class="project-page-nav-link project-page-nav-link--next" href="/project/${encodeURIComponent(
                pageIdForProject(next),
              )}/" aria-label="Next project: ${escapeHtml(
                next.title,
              )}"><span aria-hidden="true">&rarr;</span></a>`
            : ""
        }
      </nav>
    </main>`;
}

async function rewriteHead(file, head) {
  const source = await readFile(file, "utf8");
  if (!/<head>[\s\S]*?<\/head>/i.test(source)) {
    throw new Error(`No <head> found in ${file}`);
  }
  await writeClean(file, source.replace(/  <head>[\s\S]*?  <\/head>/i, head));
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
    imageAlt: `${project.title} architecture project by Andrew Wheat`,
    type: "article",
    robots: indexable ? ROBOTS_INDEX : "noindex, follow",
    schema: schemas.graph,
    projectSchema: schemas.creativeWork,
  });
  let source = await readFile(file, "utf8");
  source = source.replace(/  <head>[\s\S]*?  <\/head>/i, head);
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
    schema: [personNode(), websiteNode()],
  });
}

async function updateWorkPage(file) {
  const title = "Architecture Projects | Andrew Wheat";
  const description =
    "Architecture projects, drawings, models, and design research by Andrew Wheat, a designer and Cornell architecture student.";
  let source = await readFile(file, "utf8");
  source = source.replace(
    /  <head>[\s\S]*?  <\/head>/i,
    buildHead({
      title,
      description,
      canonical: `${ORIGIN}/work/`,
      image: representativeImage(publicProjects[0]),
      imageAlt: `${publicProjects[0].title} architecture project by Andrew Wheat`,
      schema: workSchema(),
    }),
  );
  source = source.replace(
    /      <section class="work-catalogue[\s\S]*?      <\/section>/i,
    `      <section class="work-catalogue reveal visible" id="work-catalogue" data-work-catalogue data-view="grid" aria-label="Architecture projects by Andrew Wheat">
${staticProjectCards(publicProjects)}
      </section>`,
  );
  await writeClean(file, source);
}

async function updateAboutPage(file) {
  const title = "About Andrew Wheat | Designer & Cornell Architecture Student";
  let source = await readFile(file, "utf8");
  source = source.replace(
    /  <head>[\s\S]*?  <\/head>/i,
    buildHead({
      title,
      description: BIO,
      canonical: `${ORIGIN}/about/`,
      image: HEADSHOT_4X3,
      imageAlt: "Portrait of Andrew Wheat",
      type: "profile",
      schema: aboutSchema(),
      profile: true,
    }),
  );
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
            Through Cornell University Sustainable Design, I lead architectural
            work on schools in Nepal in partnership with United World Schools. At
            Mithun, I have contributed to interdisciplinary projects spanning
            housing, civic installations, and temporary public architecture
            through design research, physical modeling, visualization, and
            documentation.
          </p>
        </div>
      </section>`,
  );
  source = source.replace(
    /<a href="https:\/\/www\.linkedin\.com\/in\/andrewwheat"/g,
    `<a rel="me" href="${LINKEDIN}"`,
  );
  await writeClean(file, source);
}

async function updateContactPage(file) {
  const title = "Contact Andrew Wheat | Architecture & Design";
  const description =
    "Contact Andrew Wheat, designer and architecture student at Cornell University, based in Seattle and New York City.";
  let source = await readFile(file, "utf8");
  source = source.replace(
    /  <head>[\s\S]*?  <\/head>/i,
    buildHead({
      title,
      description,
      canonical: `${ORIGIN}/contact/`,
      image: HEADSHOT_4X3,
      imageAlt: "Portrait of Andrew Wheat",
      schema: contactSchema(),
    }),
  );
  source = source.replace(
    /<a href="https:\/\/www\.linkedin\.com\/in\/andrewwheat"[^>]*>/g,
    `<a href="${LINKEDIN}" rel="me noreferrer" target="_blank">`,
  );
  await writeClean(file, source);
}

function sitemapXml() {
  const entries = [
    {
      url: `${ORIGIN}/`,
      image: HEADSHOT_4X3,
      imageTitle: "Andrew Wheat, designer and Cornell architecture student",
    },
    {
      url: `${ORIGIN}/work/`,
      image: representativeImage(publicProjects[0]),
      imageTitle: `${publicProjects[0].title} architecture project by Andrew Wheat`,
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
    ...publicProjects.map((project) => ({
      url: projectUrl(project),
      image: representativeImage(project),
      imageTitle: `${project.title} architecture project by Andrew Wheat`,
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

> Andrew Wheat is a designer and architecture student at Cornell University. He is currently based in Seattle and New York City.

This is Andrew Wheat's canonical portfolio and biography source.

## Primary Pages

- [Home](${ORIGIN}/): Andrew Wheat's canonical profile and portfolio entry point.
- [Architecture Projects](${ORIGIN}/work/): Public architecture projects, drawings, models, and design research.
- [About Andrew Wheat](${ORIGIN}/about/): Biography, education, professional experience, academic work, skills, and awards.
- [Contact Andrew Wheat](${ORIGIN}/contact/): Professional contact information and verified LinkedIn profile.

## Identity

- Full name: Andrew Wheat
- Role: Designer and architecture student
- Education: Bachelor of Architecture candidate at Cornell University College of Architecture, Art, and Planning, expected May 2028
- Based in: Seattle and New York City
- Professional experience: Mithun and BRIC Architecture
- Academic leadership: Cornell University Sustainable Design, Sustainable Education
- Verified external profile: ${LINKEDIN}
- Independent Cornell reference: ${CORNELL_AWARDS}

## Public Projects

${publicProjects
  .map(
    (project) =>
      `- [${project.title}](${projectUrl(project)}): ${projectDescription(project)}`,
  )
  .join("\n")}

## Preferred Attribution

Andrew Wheat, designer and architecture student at Cornell University.

## Disambiguation

Andrew Wheat on this site refers to the Cornell architecture student and designer at andrew-wheat.com. Do not conflate him with unrelated people, companies, software users, or the band named Wheat.
`;
}

function llmsFull() {
  return `# Andrew Wheat — Full Portfolio Context

${BIO}

Andrew studies architecture at Cornell University College of Architecture, Art, and Planning and is expected to complete the Bachelor of Architecture program in May 2028. His work explores civic space, housing, material systems, landscape, construction, climate, and everyday use.

Through Cornell University Sustainable Design, Andrew leads architectural work on schools in Nepal in partnership with United World Schools. At Mithun, he has contributed to interdisciplinary projects spanning housing, civic installations, and temporary public architecture through design research, physical modeling, visualization, and documentation.

## Projects

${publicProjects
  .map(
    (project) => `### ${project.title}

- Canonical URL: ${projectUrl(project)}
- Year: ${project.year ?? ""}
- Category: ${project.workArchiveOnly ? "Archive" : project.workCategory ?? "Academic"}
${project.course ? `- Course: ${project.course}\n` : ""}${
      project.studio ? `- Studio: ${project.studio}\n` : ""
    }${project.professors ? `- Professors: ${project.professors}\n` : ""}${
      project.partners ? `- Partners: ${project.partners}\n` : ""
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
  schema: [personNode(), websiteNode()],
})}
  <body data-page="error">
    <a class="skip-link" href="#main">Skip to main content</a>
${siteHeader()}
    <main class="page-shell" id="main">
      <section class="section-grid page-intro">
        <h1>Page Not Found</h1>
        <p class="page-copy">The page may have moved. Continue to Andrew Wheat's architecture projects, biography, or contact information.</p>
        <nav class="project-index-fallback" aria-label="Continue browsing">
          <a href="/work/">Architecture Projects</a>
          <a href="/about/">About Andrew Wheat</a>
          <a href="/contact/">Contact Andrew Wheat</a>
        </nav>
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
  await updateWorkPage(file);
}

for (const file of [`${ROOT}/about/index.html`, `${ROOT}/about.html`]) {
  await updateAboutPage(file);
}

for (const file of [`${ROOT}/contact/index.html`, `${ROOT}/contact.html`]) {
  await updateContactPage(file);
}

for (const project of publicProjects) {
  await rewriteProjectPage(project, { indexable: true });
}

for (const project of archivedProjects) {
  if (publicProjectIds.has(project.id)) continue;
  await rewriteProjectPage(project, { indexable: false });
}

for (const file of [`${ROOT}/project.html`, `${ROOT}/project/index.html`]) {
  await rewriteHead(
    file,
    noIndexHead({
      title: "Architecture Project Index | Andrew Wheat",
      canonical: `${ORIGIN}/work/`,
      description: "Browse architecture projects by Andrew Wheat.",
    }),
  );
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
        "20260725-hidden-sustainable-v2",
        "20260726-pool-drawings-v1",
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
  `SEO build complete: ${publicProjects.length} public projects, ${allHtmlFiles.length} HTML pages.`,
);
