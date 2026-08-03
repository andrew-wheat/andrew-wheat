const requestedBase = (process.argv[2] || "http://127.0.0.1:4173").replace(/\/+$/, "");
const canonicalOrigin = "https://andrew-wheat.com";
const homepageTitle = "Andrew Wheat | Architecture & Design";
const homepageDescription =
  "Andrew Wheat is a designer and Bachelor of Architecture student at Cornell University working across civic architecture, housing, material systems, and landscape.";
const errors = [];
const warnings = [];

const decodeEntities = (value = "") =>
  String(value)
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");

const getAttributeContent = (html, attribute, value) => {
  const patterns = [
    new RegExp(
      `<meta[^>]+${attribute}=["']${value}["'][^>]+content=["']([^"']*)`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+${attribute}=["']${value}["']`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeEntities(match[1].trim());
  }
  return "";
};

const canonicalFromHtml = (html) => {
  const patterns = [
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeEntities(match[1].trim());
  }
  return "";
};

const titleFromHtml = (html) =>
  decodeEntities((html.match(/<title>(.*?)<\/title>/is)?.[1] || "").trim());

const plainText = (html) =>
  decodeEntities(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );

const schemaNodesFromHtml = (html) => {
  const nodes = [];
  for (const match of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const data = JSON.parse(match[1]);
      if (Array.isArray(data?.["@graph"])) nodes.push(...data["@graph"]);
      else nodes.push(data);
    } catch {
      // Invalid blocks are reported by the main page loop.
    }
  }
  return nodes;
};

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent":
        options.userAgent ||
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    },
  });
  return {
    response,
    text: await response.text(),
  };
}

const localize = (url) => {
  const parsed = new URL(url);
  return `${requestedBase}${parsed.pathname}${parsed.search}`;
};

const { response: robotsResponse, text: robots } = await fetchText(
  `${requestedBase}/robots.txt`,
);
if (robotsResponse.status !== 200) errors.push(`/robots.txt returned ${robotsResponse.status}`);
if (!/User-agent:\s*\*/i.test(robots)) errors.push("robots.txt has no wildcard user-agent");
if (/Disallow:\s*\/\s*$/im.test(robots)) errors.push("robots.txt blocks the entire site");
if (!new RegExp(`Sitemap:\\s*${canonicalOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/sitemap\\.xml`, "i").test(robots)) {
  errors.push("robots.txt does not declare the canonical sitemap");
}

const { response: sitemapResponse, text: sitemap } = await fetchText(
  `${requestedBase}/sitemap.xml`,
);
if (sitemapResponse.status !== 200) errors.push(`/sitemap.xml returned ${sitemapResponse.status}`);
if (!/application\/xml|text\/xml/i.test(sitemapResponse.headers.get("content-type") || "")) {
  warnings.push(`sitemap.xml content type is ${sitemapResponse.headers.get("content-type")}`);
}

const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)]
  .map((match) => decodeEntities(match[1]))
  .filter((url) => !url.includes("/assets/"));
const sitemapImages = [...sitemap.matchAll(/<image:loc>(.*?)<\/image:loc>/g)].map(
  (match) => decodeEntities(match[1]),
);

if (!sitemapUrls.length) errors.push("sitemap.xml contains no page URLs");
for (const path of [
  "/",
  "/work/",
  "/about/",
  "/contact/",
  "/selected/models/",
  "/selected/photography/",
  "/selected/sketchbook/",
  "/selected/renderings/",
  "/project/hunters-point/",
  "/project/wood-street-pool/",
  "/project/enfield-food-pantry/",
  "/project/deconstruct-reconfigure/",
  "/project/borinquen-healing-center/",
  "/project/a-chair-is-a-toy/",
  "/project/design-district-canteen/",
  "/project/curanto-cookhouse/",
  "/project/woven-pavilion/",
]) {
  if (!sitemapUrls.includes(`${canonicalOrigin}${path}`)) {
    errors.push(`sitemap.xml is missing ${path}`);
  }
}
for (const hiddenPath of [
  "/selected/",
  "/project/york-prize/",
]) {
  if (sitemapUrls.includes(`${canonicalOrigin}${hiddenPath}`)) {
    errors.push(`sitemap.xml includes non-indexable route ${hiddenPath}`);
  }
}

for (const retiredPath of [
  "/project/ephemeral-diptyque/",
  "/project/ephemeral-diptypque/",
  "/project/sustainable-education/",
]) {
  const response = await fetch(`${requestedBase}${retiredPath}`, {
    redirect: "manual",
    headers: { "user-agent": "Googlebot/2.1" },
  });
  if (![404, 410].includes(response.status)) {
    errors.push(`Retired route ${retiredPath} returned ${response.status}, expected 404 or 410`);
  }
}

const pages = [];
for (const canonicalUrl of sitemapUrls) {
  const pageUrl = localize(canonicalUrl);
  const { response, text: html } = await fetchText(pageUrl);
  const pathname = new URL(canonicalUrl).pathname;
  const title = titleFromHtml(html);
  const description = getAttributeContent(html, "name", "description");
  const robotsMeta = getAttributeContent(html, "name", "robots");
  const canonical = canonicalFromHtml(html);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  const textLength = plainText(html).length;
  const jsonLdScripts = [...html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )].map((match) => match[1].trim());

  if (response.status !== 200) errors.push(`${pathname} returned ${response.status}`);
  if (!/text\/html/i.test(response.headers.get("content-type") || "")) {
    errors.push(`${pathname} is not served as HTML`);
  }
  if (!title) errors.push(`${pathname} has no title`);
  if (!description) errors.push(`${pathname} has no meta description`);
  if (!canonical) errors.push(`${pathname} has no canonical URL`);
  if ((html.match(/<title\b/gi) || []).length !== 1) {
    errors.push(`${pathname} must contain exactly one title element`);
  }
  if ((html.match(/<meta[^>]+name=["']description["']/gi) || []).length !== 1) {
    errors.push(`${pathname} must contain exactly one meta description`);
  }
  if ((html.match(/<link[^>]+rel=["']canonical["']/gi) || []).length !== 1) {
    errors.push(`${pathname} must contain exactly one canonical link`);
  }
  if (canonical !== canonicalUrl) {
    errors.push(`${pathname} canonical is ${canonical || "(missing)"}, expected ${canonicalUrl}`);
  }
  if (/noindex/i.test(robotsMeta)) errors.push(`${pathname} is noindex but appears in sitemap`);
  if (!/max-image-preview:large/i.test(robotsMeta)) {
    warnings.push(`${pathname} does not request large image previews`);
  }
  if (h1Count !== 1) errors.push(`${pathname} has ${h1Count} H1 elements`);
  for (const property of ["og:title", "og:description", "og:url", "og:image"]) {
    if (!getAttributeContent(html, "property", property)) {
      errors.push(`${pathname} has no ${property} metadata`);
    }
  }
  if (getAttributeContent(html, "property", "og:url") !== canonicalUrl) {
    errors.push(`${pathname} Open Graph URL does not match its canonical URL`);
  }
  if (!getAttributeContent(html, "name", "twitter:card")) {
    errors.push(`${pathname} has no Twitter card metadata`);
  }
  for (const imageTag of html.match(/<img\b[^>]*>/gi) || []) {
    if (!/\balt=["'][^"']*["']/i.test(imageTag)) {
      errors.push(`${pathname} contains an image without an alt attribute`);
    }
  }
  if (textLength < 140) warnings.push(`${pathname} has only ${textLength} characters of static text`);
  if (!jsonLdScripts.length) errors.push(`${pathname} has no JSON-LD`);
  for (const [index, script] of jsonLdScripts.entries()) {
    if (!script) {
      errors.push(`${pathname} JSON-LD block ${index + 1} is empty`);
      continue;
    }
    try {
      JSON.parse(script);
    } catch (error) {
      errors.push(`${pathname} JSON-LD block ${index + 1} is invalid: ${error.message}`);
    }
  }
  if (/project\//.test(pathname) && !plainText(html).includes("Andrew Wheat")) {
    errors.push(`${pathname} lacks static author text`);
  }
  if (/^\/project\//.test(pathname)) {
    if (!schemaNodesFromHtml(html).some((node) => node?.["@type"] === "BreadcrumbList")) {
      errors.push(`${pathname} has no BreadcrumbList JSON-LD`);
    }
  }
  if (pathname === "/" && /http-equiv=["']refresh/i.test(html)) {
    errors.push("The homepage still contains a meta refresh");
  }
  pages.push({ pathname, title, description, canonical, html });
}

const titleOwners = new Map();
for (const page of pages) {
  const owners = titleOwners.get(page.title) || [];
  owners.push(page.pathname);
  titleOwners.set(page.title, owners);
}
for (const [title, owners] of titleOwners) {
  if (owners.length > 1) errors.push(`Duplicate title "${title}" on ${owners.join(", ")}`);
}

const descriptionOwners = new Map();
for (const page of pages) {
  const owners = descriptionOwners.get(page.description) || [];
  owners.push(page.pathname);
  descriptionOwners.set(page.description, owners);
}
for (const [description, owners] of descriptionOwners) {
  if (owners.length > 1) {
    errors.push(`Duplicate description "${description}" on ${owners.join(", ")}`);
  }
}

const canonicalOwners = new Map();
for (const page of pages) {
  const owners = canonicalOwners.get(page.canonical) || [];
  owners.push(page.pathname);
  canonicalOwners.set(page.canonical, owners);
}
for (const [canonical, owners] of canonicalOwners) {
  if (owners.length > 1) {
    errors.push(`Duplicate canonical ${canonical} on ${owners.join(", ")}`);
  }
}

const internalLinks = new Set();
for (const page of pages) {
  for (const match of page.html.matchAll(/<a[^>]+href=["']([^"'#]+)["']/gi)) {
    const href = decodeEntities(match[1]);
    if (/^(mailto:|tel:|javascript:)/i.test(href)) continue;
    const resolved = new URL(href, canonicalOrigin);
    if (resolved.origin === canonicalOrigin) internalLinks.add(resolved.pathname);
  }
}

for (const pathname of internalLinks) {
  const response = await fetch(`${requestedBase}${pathname}`, {
    redirect: "follow",
    headers: { "user-agent": "Googlebot/2.1" },
  });
  if (response.status >= 400) errors.push(`Internal link ${pathname} returned ${response.status}`);
}

for (const imageUrl of new Set(sitemapImages)) {
  const response = await fetch(localize(imageUrl), {
    redirect: "follow",
    headers: { "user-agent": "Googlebot-Image/1.0" },
  });
  if (response.status !== 200) {
    errors.push(`Sitemap image ${new URL(imageUrl).pathname} returned ${response.status}`);
  } else if (!/^image\//i.test(response.headers.get("content-type") || "")) {
    const imagePath = new URL(imageUrl).pathname;
    const type = response.headers.get("content-type") || "";
    if (
      /application\/octet-stream/i.test(type) &&
      /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(imagePath)
    ) {
      warnings.push(`Sitemap image ${imagePath} is served locally as application/octet-stream`);
    } else {
      errors.push(`Sitemap image ${imagePath} has content type ${type}`);
    }
  }
}

for (const path of ["/llms.txt", "/llms-full.txt"]) {
  const { response, text } = await fetchText(`${requestedBase}${path}`, {
    userAgent: "ChatGPT-User/1.0",
  });
  if (response.status !== 200) errors.push(`${path} returned ${response.status}`);
  if (!/text\/plain/i.test(response.headers.get("content-type") || "")) {
    warnings.push(`${path} content type is ${response.headers.get("content-type")}`);
  }
  if (!text.includes("Andrew Wheat")) errors.push(`${path} lacks Andrew Wheat identity text`);
}

const homepage = pages.find((page) => page.pathname === "/");
if (homepage?.title !== homepageTitle) {
  errors.push(`Homepage title is "${homepage?.title || "(missing)"}", expected "${homepageTitle}"`);
}
if (homepage?.description !== homepageDescription) {
  errors.push("Homepage description does not match the requested identifying statement");
}
if (!plainText(homepage?.html || "").includes(homepageDescription)) {
  errors.push("Homepage lacks the identifying statement as crawlable HTML text");
}
for (const href of [
  "/work/",
  "/selected/photography/",
  "/selected/sketchbook/",
  "/about/",
  "/contact/",
]) {
  if (!new RegExp(`<a[^>]+href=["']${href.replaceAll("/", "\\/")}["']`, "i").test(homepage?.html || "")) {
    errors.push(`Homepage destination hierarchy is missing ${href}`);
  }
}

const homepageSchemas = schemaNodesFromHtml(homepage?.html || "");
const personSchema = homepageSchemas.find((node) => node?.["@type"] === "Person");
const websiteSchema = homepageSchemas.find((node) => node?.["@type"] === "WebSite");
if (personSchema?.["@id"] !== `${canonicalOrigin}/#andrew-wheat`) {
  errors.push("Homepage Person JSON-LD has the wrong or missing @id");
}
if (personSchema?.description !== homepageDescription || personSchema?.jobTitle !== "Designer") {
  errors.push("Homepage Person JSON-LD does not match the requested identity fields");
}
if (personSchema?.affiliation?.name !== "Cornell University") {
  errors.push("Homepage Person JSON-LD lacks the Cornell University affiliation");
}
if (websiteSchema?.["@id"] !== `${canonicalOrigin}/#website`) {
  errors.push("Homepage WebSite JSON-LD has the wrong or missing @id");
}
if (websiteSchema?.alternateName !== "Andrew Wheat Architecture and Design") {
  errors.push("Homepage WebSite JSON-LD has the wrong alternateName");
}

const aboutPage = pages.find((page) => page.pathname === "/about/");
const aboutProfile = schemaNodesFromHtml(aboutPage?.html || "").find(
  (node) => node?.["@type"] === "ProfilePage",
);
if (aboutPage?.title !== "About Andrew Wheat") errors.push("About page title is incorrect");
if (aboutProfile?.["@id"] !== `${canonicalOrigin}/about/#profile-page`) {
  errors.push("About page ProfilePage JSON-LD has the wrong or missing @id");
}
if (aboutProfile?.mainEntity?.["@id"] !== `${canonicalOrigin}/#andrew-wheat`) {
  errors.push("About page ProfilePage does not reference the canonical Person entity");
}

for (const [path, expectedTitle] of Object.entries({
  "/work/": "Work | Andrew Wheat",
  "/contact/": "Contact Andrew Wheat",
  "/selected/models/": "Models | Andrew Wheat",
  "/selected/photography/": "Photography | Andrew Wheat",
  "/selected/sketchbook/": "Sketchbook | Andrew Wheat",
  "/selected/renderings/": "Renderings | Andrew Wheat",
})) {
  const page = pages.find((item) => item.pathname === path);
  if (page?.title !== expectedTitle) errors.push(`${path} title is not "${expectedTitle}"`);
}

const contactPage = pages.find((page) => page.pathname === "/contact/");
if (!/href=["']mailto:ajw288@cornell\.edu["']/i.test(contactPage?.html || "")) {
  errors.push("Contact page lacks the verified email link");
}
if (!/href=["']https:\/\/www\.linkedin\.com\/in\/andrewwheat["']/i.test(contactPage?.html || "")) {
  errors.push("Contact page lacks the verified LinkedIn link");
}

for (const path of ["/work.html", "/about.html", "/contact.html"]) {
  const { text: html } = await fetchText(`${requestedBase}${path}`);
  if (!/noindex/i.test(getAttributeContent(html, "name", "robots"))) {
    errors.push(`${path} should be noindex as a legacy duplicate`);
  }
  const expectedCanonical = `${canonicalOrigin}${path.replace(/\.html$/, "/")}`;
  if (canonicalFromHtml(html) !== expectedCanonical) {
    errors.push(`${path} canonical does not point to ${expectedCanonical}`);
  }
}

for (const page of pages) {
  for (const href of [
    "/work/",
    "/selected/photography/",
    "/selected/sketchbook/",
    "/about/",
    "/contact/",
  ]) {
    if (!new RegExp(`<a[^>]+href=["']${href.replaceAll("/", "\\/")}["']`, "i").test(page.html)) {
      errors.push(`${page.pathname} primary navigation is missing ${href}`);
    }
  }
}

if (!homepage?.html.includes("/favicon-48.png?v=2")) {
  errors.push("The homepage does not reference the current versioned favicon");
}

for (const path of ["/favicon.ico?v=2", "/favicon.svg?v=2", "/favicon-48.png?v=2"]) {
  const response = await fetch(`${requestedBase}${path}`, {
    redirect: "follow",
    headers: { "user-agent": "Googlebot/2.1" },
  });
  if (response.status !== 200) {
    errors.push(`${path} returned ${response.status}`);
  } else if (!/^image\//i.test(response.headers.get("content-type") || "")) {
    warnings.push(`${path} content type is ${response.headers.get("content-type")}`);
  }
}

const { response: manifestResponse, text: manifest } = await fetchText(
  `${requestedBase}/site.webmanifest?v=2`,
);
if (manifestResponse.status !== 200) {
  errors.push(`/site.webmanifest?v=2 returned ${manifestResponse.status}`);
}
if (/#0000ff/i.test(manifest)) {
  errors.push("The web manifest still declares the retired blue theme");
}

const notFoundResponse = await fetch(`${requestedBase}/definitely-not-a-real-page-404-check`, {
  redirect: "manual",
  headers: { "user-agent": "Googlebot/2.1" },
});
if (notFoundResponse.status !== 404) {
  warnings.push(`Unknown URLs return ${notFoundResponse.status}, expected 404`);
}

console.log(`SEO audit target: ${requestedBase}`);
console.log(`Public pages: ${pages.length}`);
console.log(`Internal links checked: ${internalLinks.size}`);
console.log(`Sitemap images checked: ${new Set(sitemapImages).size}`);
console.log("Favicon assets checked: 3");
if (warnings.length) {
  console.log("\nWarnings:");
  for (const warning of warnings) console.log(`- ${warning}`);
}
if (errors.length) {
  console.error("\nErrors:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("\nSEO audit passed with no crawl-blocking errors.");
}
