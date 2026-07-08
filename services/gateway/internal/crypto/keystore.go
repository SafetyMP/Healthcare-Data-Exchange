package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

// KeyStore is a software KMS stand-in for per-tenant master keys (ADR 0003).
type KeyStore struct {
	mu       sync.RWMutex
	dir      string
	keys     map[string][]byte
	shredded map[string]bool
}

func NewKeyStore(dir string) (*KeyStore, error) {
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return nil, err
	}
	ks := &KeyStore{dir: dir, keys: make(map[string][]byte), shredded: make(map[string]bool)}
	_ = ks.loadShreddedMarkers()
	return ks, nil
}

func (k *KeyStore) loadShreddedMarkers() error {
	entries, err := os.ReadDir(k.dir)
	if err != nil {
		return err
	}
	for _, e := range entries {
		if strings.HasSuffix(e.Name(), ".shredded") {
			tenant := strings.TrimSuffix(e.Name(), ".shredded")
			k.shredded[tenant] = true
		}
	}
	return nil
}

func (k *KeyStore) EnsureTenant(tenant string) error {
	if k.IsShredded(tenant) {
		return errors.New("tenant shredded")
	}
	k.mu.Lock()
	defer k.mu.Unlock()
	if _, ok := k.keys[tenant]; ok {
		return nil
	}
	path := k.tenantPath(tenant)
	if data, err := os.ReadFile(path); err == nil {
		k.keys[tenant] = data
		return nil
	}
	key := make([]byte, 32)
	if _, err := rand.Read(key); err != nil {
		return err
	}
	if err := os.WriteFile(path, key, 0o600); err != nil {
		return err
	}
	k.keys[tenant] = key
	return nil
}

func (k *KeyStore) Encrypt(tenant, plaintext string) (string, error) {
	k.mu.RLock()
	key, ok := k.keys[tenant]
	k.mu.RUnlock()
	if !ok {
		return "", errors.New("tenant key missing")
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	out := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(out), nil
}

func (k *KeyStore) ShredTenant(tenant string) error {
	k.mu.Lock()
	defer k.mu.Unlock()
	delete(k.keys, tenant)
	path := k.tenantPath(tenant)
	if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
		return err
	}
	marker := filepath.Join(k.dir, tenant+".shredded")
	if err := os.WriteFile(marker, []byte("1"), 0o600); err != nil {
		return err
	}
	k.shredded[tenant] = true
	return nil
}

func (k *KeyStore) IsShredded(tenant string) bool {
	k.mu.RLock()
	defer k.mu.RUnlock()
	return k.shredded[tenant]
}

func (k *KeyStore) HasTenant(tenant string) bool {
	k.mu.RLock()
	defer k.mu.RUnlock()
	if k.shredded[tenant] {
		return false
	}
	_, ok := k.keys[tenant]
	return ok
}

func (k *KeyStore) tenantPath(tenant string) string {
	return filepath.Join(k.dir, tenant+".key")
}
