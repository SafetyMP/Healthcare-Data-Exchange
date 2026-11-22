import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = (path) => ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const siteCode = source("../../src/lib/site.ts");
const sitemapCode = source("../../src/app/sitemap.ts");

function load(mode) {
  const site = {};
  vm.runInNewContext(siteCode, { exports: site, URL, process: { env: { NEXT_PUBLIC_DEMO_MODE: mode } } });
  const sitemap = {};
  vm.runInNewContext(sitemapCode, {
    exports: sitemap,
    require(name) { assert.equal(name, "@/lib/site"); return site; },
  });
  return { site, sitemap };
}

const production = "https://safetymp.github.io/Healthcare-Data-Exchange/";

test("the business case owns public discovery and compatibility forms point back to it", () => {
  const { site, sitemap } = load("true");
  const main = site.pageMetadata("/");
  assert.equal(main.alternates.canonical, production);
  assert.equal(main.openGraph.title, main.title.absolute);
  assert.equal(main.twitter.card, "summary_large_image");
  assert.equal(main.robots.index, true);
  for (const route of site.SITE_ROUTES.filter(path => path !== "/")) {
    const metadata = site.pageMetadata(route);
    assert.equal(metadata.alternates.canonical, production);
    assert.equal(metadata.robots.index, false);
    assert.equal(metadata.openGraph, null);
  }
  assert.equal(sitemap.dynamic, "force-static");
  assert.deepEqual(Array.from(sitemap.default(), entry => entry.url), [production]);
});

test("live mode does not advertise local gateway pages as the hosted simulation", () => {
  for (const mode of [undefined, "false"]) {
    const { site, sitemap } = load(mode);
    for (const route of site.SITE_ROUTES) {
      const metadata = site.pageMetadata(route);
      assert.equal(metadata.alternates, undefined);
      assert.equal(metadata.openGraph, undefined);
      assert.equal(metadata.twitter, undefined);
      assert.equal(metadata.robots.index, false);
      assert.match(metadata.title.absolute, /local|Local/);
    }
    assert.equal(sitemap.default().length, 0);
  }
});

test("structured data describes the educational demo without fabricated endorsements", () => {
  const { site } = load("true");
  const data = site.siteStructuredData();
  assert.equal(data["@context"], "https://schema.org");
  const website = data["@graph"].find((node) => node["@type"] === "WebSite");
  const app = data["@graph"].find((node) => node["@type"] === "SoftwareApplication");
  assert.equal(website.url, production);
  assert.equal(app.url, production);
  assert.equal(app.applicationCategory, "EducationalApplication");
  assert.match(app.description, /separate.*backend reference/);
  assert.match(app.description, /Not a production/);
  assert.equal(app.aggregateRating, undefined);
  assert.equal(app.review, undefined);
  assert.equal(app.awards, undefined);
  assert.equal(app.offers, undefined);
});
