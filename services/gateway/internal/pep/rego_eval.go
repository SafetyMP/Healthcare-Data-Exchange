package pep

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// RegoEvaluator evaluates the canonical Rego bundle via the opa CLI.
type RegoEvaluator struct {
	opaBin    string
	policyDir string
	consent   map[string]map[string]bool
}

// NewRegoEvaluator builds an evaluator for tests and integration checks.
func NewRegoEvaluator(opaBin, policyDir string, consent map[string]map[string]bool) *RegoEvaluator {
	if consent == nil {
		consent = map[string]map[string]bool{}
	}
	return &RegoEvaluator{opaBin: opaBin, policyDir: policyDir, consent: consent}
}

func (e *RegoEvaluator) Evaluate(_ context.Context, input PolicyInput) (Decision, error) {
	inputPath, err := writeTempJSON(input)
	if err != nil {
		return Decision{}, err
	}
	defer os.Remove(inputPath)

	consentPath, err := writeTempJSON(map[string]any{"consent": e.consent})
	if err != nil {
		return Decision{}, err
	}
	defer os.Remove(consentPath)

	query := "data.chex.authz"
	cmd := exec.Command(
		e.opaBin,
		"eval",
		"-d", filepath.Join(e.policyDir, "authz.rego"),
		"-d", consentPath,
		"-i", inputPath,
		query,
		"--format", "raw",
	)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	out, err := cmd.Output()
	if err != nil {
		return Decision{}, fmt.Errorf("opa eval: %w: %s", err, stderr.String())
	}

	var result map[string]any
	if err := json.Unmarshal(out, &result); err != nil {
		return Decision{}, err
	}
	return decodeDecision(result)
}

func decodeDecision(result map[string]any) (Decision, error) {
	dec := Decision{}
	if allow, ok := result["allow"].(bool); ok {
		dec.Allow = allow
	}
	if reason, ok := result["deny_reason"].(string); ok {
		dec.DenyReason = reason
	}
	if fields, ok := result["min_necessary_fields"].([]any); ok {
		for _, f := range fields {
			if s, ok := f.(string); ok {
				dec.MinNecessaryFields = append(dec.MinNecessaryFields, s)
			}
		}
	}
	return dec, nil
}

func writeTempJSON(v any) (string, error) {
	data, err := json.Marshal(v)
	if err != nil {
		return "", err
	}
	f, err := os.CreateTemp("", "chex-opa-*.json")
	if err != nil {
		return "", err
	}
	if _, err := f.Write(data); err != nil {
		f.Close()
		os.Remove(f.Name())
		return "", err
	}
	if err := f.Close(); err != nil {
		os.Remove(f.Name())
		return "", err
	}
	return f.Name(), nil
}
