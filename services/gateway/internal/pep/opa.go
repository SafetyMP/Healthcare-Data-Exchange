package pep

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

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

type PolicyInput struct {
	SubjectID             string `json:"subject_id"`
	HomeJurisdiction      string `json:"home_jurisdiction"`
	RequesterJurisdiction string `json:"requester_jurisdiction"`
	Purpose               string `json:"purpose"`
	TEFCAXP               string `json:"tefca_xp"`
	ConsentResearch       bool   `json:"consent_research"`
	CrossBloc             bool   `json:"cross_bloc"`
	CrossBlocPermitted    bool   `json:"cross_bloc_permitted"`
}

type Decision struct {
	Allow              bool     `json:"allow"`
	DenyReason         string   `json:"deny_reason"`
	MinNecessaryFields []string `json:"min_necessary_fields"`
}

type opaResponse struct {
	Result Decision `json:"result"`
}

func (c *Client) Evaluate(ctx context.Context, input PolicyInput) (Decision, error) {
	body, err := json.Marshal(map[string]any{"input": input})
	if err != nil {
		return Decision{}, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/v1/data/chex/authz", bytes.NewReader(body))
	if err != nil {
		return Decision{}, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return Decision{}, err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return Decision{}, err
	}
	if resp.StatusCode != http.StatusOK {
		return Decision{}, fmt.Errorf("opa status %d: %s", resp.StatusCode, string(raw))
	}

	var wrapper opaResponse
	if err := json.Unmarshal(raw, &wrapper); err != nil {
		return Decision{}, err
	}
	return wrapper.Result, nil
}
