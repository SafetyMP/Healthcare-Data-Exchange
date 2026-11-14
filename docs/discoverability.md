# Project discovery

Healthcare Data Exchange has two entry points: a guided synthetic browser demo
and a separate FHIR/OPA/OPAL reference backend. Repository and site descriptions
use that distinction so people and software agents can determine what runs.

## Repository surfaces

The [README](../README.md) leads with the demo, walkthrough, audience paths,
execution modes and checks. [Repository metadata](../.github/repository-metadata.json)
records the intended GitHub description, homepage and topics; settings must be
applied separately. Community files route contributions, support and private
security reports. [CITATION.cff](../CITATION.cff) supplies project citation metadata;
cite the commit or release actually used. Current main is not a new release.

[Social assets](assets/README.md) include a shared 1280×640 PNG. GitHub's
repository social preview requires a separate upload; committing the image does
not apply that setting. See [maintainer settings](maintainer-github-settings.md).

These choices follow GitHub guidance for [READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes),
[topics](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics),
[citations](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-citation-files)
and [social previews](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview).

## Public demo surfaces

All six public routes have server-rendered titles and descriptions, absolute
canonical URLs under the GitHub Pages project path, Open Graph/Twitter cards and
a shared social image. The static export contains readable initial content and
ordinary navigation links. The walkthrough requires JavaScript.

The [sitemap generator](../web/src/app/sitemap.ts) publishes
`https://safetymp.github.io/Healthcare-Data-Exchange/sitemap.xml` with all six
canonical routes and no invented modification dates. Descriptive
`WebSite` and `SoftwareApplication` JSON-LD identify the educational software,
source and license, without ratings, endorsements or clinical claims. This is
not a claim of rich-result eligibility.

The live gateway build uses local-reference descriptions and `noindex, nofollow`;
it does not advertise itself as the hosted simulation. This metadata is not
an authentication or access-control mechanism.

Implementation follows Next.js [metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata),
[sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
and [JSON-LD](https://nextjs.org/docs/app/guides/json-ld) guidance, and Google's
[JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics),
[canonical URL](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls),
[sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
and [structured data](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) guidance.

## Agent entry points

[AGENTS.md](../AGENTS.md) and the [agent guide](agent-guide.md) explain code paths,
mode boundaries, protected surfaces and validation. Copilot instructions add
path-specific guidance. The curated [llms.txt](../llms.txt) is also served
[beside the demo](../web/public/llms.txt) at
`https://safetymp.github.io/Healthcare-Data-Exchange/llms.txt` and linked from
HTML using `rel="describedby"`.

`llms.txt` is a supplemental [community proposal](https://llmstxt.org/), not a
universal agent protocol, crawler permission file or ranking requirement.
Google's [AI search guidance](https://developers.google.com/search/docs/appearance/ai-features)
does not require special AI text files or schema. Clear, accessible and accurate
content remains the foundation.

## Verification and limits

From `web/`, run `npm run verify:demo`. It includes metadata source tests and a
check of the actual export's six HTML heads, canonicals, sitemap, schema and
public assets. After deployment, inspect public HTML and asset URLs and verify
that the successful Pages run belongs to the merged commit.

No project-path `robots.txt` is supplied: the applicable file would be at
`https://safetymp.github.io/robots.txt`, outside this project's Pages path.
[Robots rules apply at the host root](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt).
No account-level site configuration, Search Console property or indexing
submission is created by this update. Builds and HTTP responses establish
publication, not search indexing, ranking, agent citation or customer adoption.
