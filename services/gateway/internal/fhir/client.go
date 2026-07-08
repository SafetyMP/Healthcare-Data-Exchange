package fhir

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type Client struct {
	baseURL    string
	httpClient *http.Client
	sampleDir  string
}

func NewClient(baseURL, sampleDir string) *Client {
	return &Client{
		baseURL:   baseURL,
		sampleDir: sampleDir,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *Client) GetPatient(ctx context.Context, id string) (map[string]any, error) {
	if c.baseURL != "" {
		patient, err := c.fetchRemote(ctx, id)
		if err == nil {
			return patient, nil
		}
	}
	return c.loadSample(id)
}

func (c *Client) fetchRemote(ctx context.Context, id string) (map[string]any, error) {
	url := fmt.Sprintf("%s/Patient/%s", c.baseURL, id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/fhir+json")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("fhir status %d: %s", resp.StatusCode, string(body))
	}
	var patient map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&patient); err != nil {
		return nil, err
	}
	return patient, nil
}

func (c *Client) loadSample(id string) (map[string]any, error) {
	path := fmt.Sprintf("%s/eu/%s.json", c.sampleDir, id)
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var patient map[string]any
	if err := json.Unmarshal(data, &patient); err != nil {
		return nil, err
	}
	return patient, nil
}

func FilterFields(patient map[string]any, fields []string) map[string]any {
	if len(fields) == 0 {
		return patient
	}
	allowed := make(map[string]struct{}, len(fields))
	for _, f := range fields {
		allowed[f] = struct{}{}
	}
	out := make(map[string]any)
	for k, v := range patient {
		if _, ok := allowed[k]; ok {
			out[k] = v
		}
	}
	return out
}
