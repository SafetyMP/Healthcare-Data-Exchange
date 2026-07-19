# FHIR sample resources

Synthetic Patient resources for local demo and adversarial loads. **No real PHI.**

## US cell (`us/`)

- Profile: [US Core Patient](http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient) (US Core IG **6.1.0**).
- Data floor: **USCDI v3** demographics subset only — not full USCDI coverage.
- Honesty CapabilityStatement: [`../capability/us-cell.json`](../capability/us-cell.json) (served at gateway `GET /v1/fhir/metadata`).

## EU cell (`eu/`)

- Base FHIR R4 Patient (EHDS / MyHealth@EU full profile set is phased).

## Loading

`./scripts/demo.sh` and `./scripts/adversarial.sh` PUT these into HAPI EU (`:8080`) and HAPI US (`:8083`).
