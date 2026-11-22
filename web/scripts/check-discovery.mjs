// Verify the generated HTML/XML that will actually be served by GitHub Pages.
// Run after a demo export: node scripts/check-discovery.mjs [export-directory]
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(process.argv[2] ?? fileURLToPath(new URL("../out", import.meta.url)));
const base = "https://safetymp.github.io/Healthcare-Data-Exchange/";
const routes = ["", "patients", "consent", "identity", "activity", "ai-triage"];
const expectedTitles = [
  "Healthcare Data Exchange | Research consent and pilot case",
  "Patient access | Healthcare Data Exchange",
  "Consent management | Healthcare Data Exchange",
  "Identity matching | Healthcare Data Exchange",
  "Demo activity | Healthcare Data Exchange",
  "AI oversight example | Healthcare Data Exchange",
];
const htmlEntities = { "&amp;": "&", "&quot;": '"', "&#x27;": "'", "&#39;": "'", "&apos;": "'", "&lt;": "<", "&gt;": ">" };
// One pass preserves encoded entities (e.g. &amp;quot; becomes &quot;, not a quote).
const decode = (value) => value.replace(/&(?:amp|quot|#x27|#39|apos|lt|gt);/g, (entity) => htmlEntities[entity]);
assert.equal(decode("&amp;quot; &quot; &amp;amp;"), '&quot; " &amp;');
function tags(html, name) {
  return Array.from(html.matchAll(new RegExp(`<${name}\\b[^>]*>`, "gi")), ([tag]) => Object.fromEntries(Array.from(tag.matchAll(/([\w:-]+)="([^"]*)"/g), (match) => [match[1], decode(match[2])])));
}
const canonicals = [];
for (const [index, route] of routes.entries()) {
  const html = readFileSync(resolve(root, route, "index.html"), "utf8");
  const head = html.match(/<head>([\s\S]*?)<\/head>/i)?.[1];
  assert.ok(head, `${route || "/"}: static head is present`);
  const title = decode(head.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  assert.equal(title, expectedTitles[index]);
  const meta = tags(head, "meta");
  const links = tags(head, "link");
  const named = (name) => meta.find((entry) => entry.name === name)?.content;
  const property = (name) => meta.find((entry) => entry.property === name)?.content;
  const canonical = base;
  if (route) {
    assert.match(named("robots") ?? "", /noindex/);
    assert.deepEqual(links.filter(entry => entry.rel === "canonical").map(entry => entry.href), [base]);
    continue;
  }
  assert.deepEqual(links.filter((entry) => entry.rel === "canonical").map((entry) => entry.href), [canonical]);
  assert.ok((named("description") ?? "").length > 60, `${route}: descriptive snippet`);
  assert.doesNotMatch(named("robots") ?? "", /noindex|nofollow/);
  assert.equal(property("og:url"), canonical);
  assert.equal(property("og:title"), title);
  assert.equal(property("og:description"), named("description"));
  assert.equal(property("og:image"), `${base}social-preview.png`);
  assert.equal(property("og:image:width"), "1280");
  assert.equal(property("og:image:height"), "640");
  assert.equal(named("twitter:card"), "summary_large_image");
  assert.equal(named("twitter:image"), `${base}social-preview.png`);
  assert.ok(links.some((entry) => entry.rel === "describedby" && entry.href === `${base}llms.txt` && entry.type === "text/plain"));
  assert.ok(links.some((entry) => entry.rel === "icon" && entry.href === `${base}favicon.svg`));
  const blocks = Array.from(html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi), (match) => JSON.parse(match[1]));
  assert.equal(blocks.length, 1, `${route}: one actual JSON-LD script`);
  assert.equal(blocks[0]["@graph"].find((entry) => entry["@type"] === "WebSite")?.url, base);
  const app = blocks[0]["@graph"].find((entry) => entry["@type"] === "SoftwareApplication");
  assert.equal(app?.url, base);
  assert.equal(app.aggregateRating, undefined);
  assert.equal(app.review, undefined);
  canonicals.push(canonical);
}
const sitemap = readFileSync(resolve(root, "sitemap.xml"), "utf8");
const locations = Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), (match) => decode(match[1]));
assert.deepEqual(locations.sort(), canonicals.sort(), "sitemap contains only the public business case");
assert.doesNotMatch(sitemap, /<lastmod>/, "do not invent freshness timestamps");
const image = readFileSync(resolve(root, "social-preview.png"));
assert.equal(image.subarray(1, 4).toString(), "PNG");
assert.equal(image.readUInt32BE(16), 1280);
assert.equal(image.readUInt32BE(20), 640);
assert.ok(existsSync(resolve(root, "favicon.svg")));
assert.ok(existsSync(resolve(root, "llms.txt")), "supplemental guide is present");
const rootGuide = readFileSync(new URL("../../llms.txt", import.meta.url), "utf8");
const publicGuide = readFileSync(new URL("../public/llms.txt", import.meta.url), "utf8");
assert.equal(publicGuide, rootGuide, "root and public supplemental guides are byte-identical");
assert.equal(readFileSync(resolve(root, "llms.txt"), "utf8"), publicGuide, "exported supplemental guide matches the tracked source");
assert.equal(existsSync(resolve(root, "robots.txt")), false, "project-path robots.txt would not govern origin crawling");
console.log("Discovery export verified: business case metadata, five compatibility noindex pages, JSON-LD, sitemap and public assets.");
