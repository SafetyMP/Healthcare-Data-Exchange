package adminauth

import (
	"crypto/subtle"
	"fmt"
	"net/http"
	"os"
	"strings"
)

// Secret returns the configured admin bearer secret (empty when unset).
func Secret() string {
	return strings.TrimSpace(os.Getenv("CHEX_ADMIN_SECRET"))
}

// MustConfigure exits when CHEX_ADMIN_SECRET is unset (fail closed).
func MustConfigure() {
	if Secret() == "" {
		fmt.Fprintln(os.Stderr, "CHEX_ADMIN_SECRET must be set for admin endpoints")
		os.Exit(1)
	}
}

// Authorize returns true when the Authorization header matches the admin secret.
func Authorize(header string) bool {
	secret := Secret()
	if secret == "" {
		return false
	}
	const prefix = "Bearer "
	if !strings.HasPrefix(header, prefix) {
		return false
	}
	token := strings.TrimSpace(strings.TrimPrefix(header, prefix))
	return subtle.ConstantTimeCompare([]byte(token), []byte(secret)) == 1
}

// Deny writes 401 when admin auth fails.
func Deny(w http.ResponseWriter) {
	http.Error(w, "admin authentication required", http.StatusUnauthorized)
}
