package audit

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"os"
	"sync"
	"time"
)

type Event struct {
	Timestamp             time.Time `json:"timestamp"`
	Action                string    `json:"action"`
	SubjectPseudonym      string    `json:"subject_pseudonym"`
	RequesterJurisdiction string    `json:"requester_jurisdiction"`
	Purpose               string    `json:"purpose"`
	Outcome               string    `json:"outcome"`
	Detail                string    `json:"detail,omitempty"`
}

type Sink struct {
	mu   sync.Mutex
	path string
}

func NewSink(path string) *Sink {
	return &Sink{path: path}
}

func Pseudonym(subjectID, tenant string) string {
	sum := sha256.Sum256([]byte(tenant + ":" + subjectID))
	return hex.EncodeToString(sum[:8])
}

func (s *Sink) Append(ev Event) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if ev.Timestamp.IsZero() {
		ev.Timestamp = time.Now().UTC()
	}
	line, err := json.Marshal(ev)
	if err != nil {
		return err
	}
	f, err := os.OpenFile(s.path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o600)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = f.Write(append(line, '\n'))
	return err
}
