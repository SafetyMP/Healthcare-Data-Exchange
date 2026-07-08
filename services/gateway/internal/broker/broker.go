package broker

import (
	appconfig "github.com/SafetyMP/Healthcare-Data-Exchange/services/gateway/internal/config"
)

// Broker is the identity broker stub (ADR 0006): federated lookup to home cell only.
type Broker struct {
	routing *appconfig.Routing
}

func New(routing *appconfig.Routing) *Broker {
	return &Broker{routing: routing}
}

// Resolve returns a routing token for subject ID and/or preferred identifier.
// No PHI is logged or returned beyond opaque subject reference + jurisdiction.
func (b *Broker) Resolve(subjectID, identifier string) (appconfig.RoutingToken, bool) {
	return b.routing.ResolveRouting(subjectID, identifier)
}
