package handlers

import (
	"net/http"
)

const landingHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Cloud Healthcare Exchange — Gateway</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 52rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; color: #1a1a1a; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    p.note { color: #555; font-size: 0.95rem; }
    code { background: #f4f4f5; padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.9em; }
    ul { padding-left: 1.25rem; }
    li { margin: 0.75rem 0; }
    a { color: #0b5fff; }
    .method { font-weight: 600; font-size: 0.85rem; text-transform: uppercase; color: #444; }
  </style>
</head>
<body>
  <h1>Cloud Healthcare Exchange</h1>
  <p class="note">Reference-slice gateway (JSON API). This page lists demo endpoints — there is no clinician UI yet.</p>
  <p><a href="/health">Health check</a> (<code>GET /health</code>)</p>
  <h2>Demo endpoints</h2>
  <ul>
    <li>
      <span class="method">GET</span>
      <a href="/v1/patients/patient-eu-001?purpose=treatment&amp;requester_jurisdiction=eu-visiting">/v1/patients/patient-eu-001</a>
      — intra-EU treatment read (primary demo)
    </li>
    <li>
      <span class="method">GET</span>
      <code>/v1/patients/patient-eu-001?purpose=research&amp;requester_jurisdiction=eu-home</code>
      — consent denied (expect 403; use curl)
    </li>
    <li>
      <span class="method">POST</span>
      <code>/v1/ai/triage</code> — AI triage stub (JSON body; use curl or <code>./scripts/demo.sh</code>)
    </li>
    <li>
      <span class="method">POST</span>
      <code>/v1/admin/erasure/tenant?tenant=demo-tenant</code>
      — region/tenant crypto-shred demo (run last)
    </li>
  </ul>
  <p class="note">Full E2E: <code>./scripts/demo.sh</code> from the repo root. Hermetic tests: <code>./scripts/verify.sh</code>.</p>
</body>
</html>`

func (s *Server) Landing(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(landingHTML))
}
