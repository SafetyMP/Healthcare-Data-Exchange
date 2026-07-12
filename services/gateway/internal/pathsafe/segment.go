package pathsafe

import (
	"errors"
	"fmt"
	"path/filepath"
	"regexp"
	"strings"
)

var segmentPattern = regexp.MustCompile(`^[a-zA-Z0-9._-]+$`)

// ValidateSegment rejects path traversal and unsafe filesystem segment names.
func ValidateSegment(name, label string) error {
	if name == "" {
		return fmt.Errorf("%s must not be empty", label)
	}
	if strings.Contains(name, "..") || strings.ContainsAny(name, `/\`) {
		return fmt.Errorf("%s contains path separators", label)
	}
	if !segmentPattern.MatchString(name) {
		return fmt.Errorf("%s contains invalid characters", label)
	}
	return nil
}

// SafeJoin resolves child paths under base and rejects escapes.
func SafeJoin(base string, segments ...string) (string, error) {
	cleanBase := filepath.Clean(base)
	if !filepath.IsAbs(cleanBase) {
		abs, err := filepath.Abs(cleanBase)
		if err != nil {
			return "", err
		}
		cleanBase = abs
	}
	if cleanBase == "" {
		return "", errors.New("base directory must not be empty")
	}
	full := cleanBase
	for i, segment := range segments {
		label := fmt.Sprintf("segment[%d]", i)
		if err := ValidateSegment(segment, label); err != nil {
			return "", err
		}
		full = filepath.Join(full, segment)
	}
	rel, err := filepath.Rel(cleanBase, full)
	if err != nil {
		return "", err
	}
	if rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return "", errors.New("resolved path escapes base directory")
	}
	return full, nil
}
