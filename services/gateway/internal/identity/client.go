package identity

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

// Client calls the identity-broker service for ITI-78-style lookups (ADR 0010).
type Client struct {
	baseURL    string
	httpClient *http.Client
}

func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

// Resolve asks the broker for subject + home jurisdiction by identifier or subject.
// Returns ok=false on miss or transport error so the gateway can fall back to config.
func (c *Client) Resolve(ctx context.Context, subjectID, identifier string) (subject, homeJurisdiction string, ok bool) {
	if c == nil || c.baseURL == "" {
		return "", "", false
	}

	q := url.Values{}
	switch {
	case identifier != "":
		q.Set("identifier", identifier)
	case subjectID != "":
		q.Set("subject", subjectID)
	default:
		return "", "", false
	}

	u := fmt.Sprintf("%s/v1/resolve?%s", c.baseURL, q.Encode())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return "", "", false
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", "", false
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return "", "", false
	}
	if resp.StatusCode != http.StatusOK {
		return "", "", false
	}

	var out struct {
		Subject          string `json:"subject"`
		HomeJurisdiction string `json:"home_jurisdiction"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", "", false
	}
	if out.Subject == "" || out.HomeJurisdiction == "" {
		return "", "", false
	}
	return out.Subject, out.HomeJurisdiction, true
}
