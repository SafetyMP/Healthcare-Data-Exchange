package consent

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

// Client proxies consent admin actions to the consent-service (ADR 0008).
// The gateway stays the single entry point; consent state + OPAL sync live in
// the consent-service.
type Client struct {
	baseURL    string
	httpClient *http.Client
}

func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

// Set grants or revokes consent for a subject/purpose and returns the
// consent-service response body and status code.
func (c *Client) Set(ctx context.Context, subject, action, purpose string) (map[string]any, int, error) {
	u := fmt.Sprintf("%s/v1/consent/%s/%s?purpose=%s",
		c.baseURL, url.PathEscape(subject), url.PathEscape(action), url.QueryEscape(purpose))
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, u, nil)
	if err != nil {
		return nil, 0, err
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, 0, err
	}
	defer resp.Body.Close()

	var out map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, resp.StatusCode, err
	}
	return out, resp.StatusCode, nil
}
