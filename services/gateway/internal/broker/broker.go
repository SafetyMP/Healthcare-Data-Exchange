package broker

import (
	"context"

	appconfig "github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/config"
)

// RemoteResolver performs federated identifier/subject lookup (identity-broker service).
type RemoteResolver interface {
	Resolve(ctx context.Context, subjectID, identifier string) (subject, homeJurisdiction string, ok bool)
}

// Broker resolves routing tokens via identity-broker when configured, else routing.yaml (ADR 0006/0010).
type Broker struct {
	routing *appconfig.Routing
	remote  RemoteResolver
}

func New(routing *appconfig.Routing, remote RemoteResolver) *Broker {
	return &Broker{routing: routing, remote: remote}
}

// Resolve returns a routing token for subject ID and/or preferred identifier.
// No PHI is logged or returned beyond opaque subject reference + jurisdiction.
func (b *Broker) Resolve(ctx context.Context, subjectID, identifier string) (appconfig.RoutingToken, bool) {
	if b.remote != nil && (identifier != "" || subjectID != "") {
		if sub, home, ok := b.remote.Resolve(ctx, subjectID, identifier); ok {
			resolvedSubject := sub
			if resolvedSubject == "" {
				resolvedSubject = subjectID
			}
			return b.routing.TokenForSubject(resolvedSubject, home)
		}
	}
	return b.routing.ResolveRouting(subjectID, identifier)
}
