export type OperatorRoute = {
  guide: boolean;
  packet: "a" | "b";
  choice: "confirm" | "verify" | null;
  stage: "rule" | "mirror" | "consent" | "gateway";
};

export function parseOperatorRoute(hash: string): OperatorRoute | null {
  const [section, packet, choice, stage] = hash.split("/");
  if (section !== "#operator" && section !== "#operator-guide") return null;
  return {
    guide: section === "#operator-guide",
    packet: packet === "b" ? "b" : "a",
    choice: choice === "confirm" || choice === "verify" ? choice : null,
    stage: stage === "mirror" || stage === "consent" || stage === "gateway" ? stage : "rule",
  };
}

export function operatorHref(route: OperatorRoute) {
  const parts = [route.guide ? "#operator-guide" : "#operator", route.packet, route.choice ?? "open"];
  if (route.guide) parts.push(route.stage);
  return parts.join("/");
}

export function operatorResult(packet: OperatorRoute["packet"], choice: NonNullable<OperatorRoute["choice"]>) {
  if (packet === "a") return {
    report: choice === "confirm"
      ? "That assurance goes beyond the file. Tell the privacy officer that the withdrawal was recorded and publication was requested. The European gateway’s response is still unknown."
      : "Tell the privacy officer that the source recorded the withdrawal. Leave gateway enforcement unconfirmed until a matching receiver check is available.",
    owner: "The exchange operator owns the open check. Obtain a post-withdrawal result for the same team, record and purpose at the European gateway, then update the privacy officer.",
    unknown: "This file contains no return from the gateway after the withdrawal. Its silence tells us neither that the request succeeded nor that it was denied.",
  };
  return {
    report: choice === "confirm"
      ? "Tell the privacy officer that at 09:08 UTC the European gateway denied the matching research read for lack of consent. With the same inputs and policy, denial is the expected next result."
      : "The requested check is already in the file. Report the matched 09:08 UTC consent denial now. Repeating this check would delay the answer without resolving a new question.",
    owner: "The privacy officer can give Anna the scoped answer. The exchange operator rechecks if the consent, requester, purpose, rule or gateway changes.",
    unknown: "A denial cannot identify which consent update the evaluator received. A missing consent flag also denies the read. This check establishes neither receipt of this particular update nor its arrival time. Other gateways and later reads need their own evidence.",
  };
}
