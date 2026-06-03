/**
 * Heuristics for inverting relationship phrases shown on the target entity.
 * Outgoing links use "{label} {targetName}" — incoming uses "{inverseLabel} {sourceName}".
 */

const RELATIONAL_TAIL =
  /\s+(of|by|for|on|with|to|from|at|in|via|through|under|over)$/i;

/**
 * Event / action verb labels (outgoing: "{verb} {target}").
 * On the target profile, most use passive "{verb} by {source}".
 */
const SYMMETRIC_ACTION_VERBS = new Set([
  "killed",
  "murdered",
  "robbed",
  "beaten",
  "attacked",
  "assaulted",
  "stabbed",
  "shot",
  "wounded",
  "injured",
  "threatened",
  "kidnapped",
  "abducted",
  "imprisoned",
  "detained",
  "arrested",
  "convicted",
  "acquitted",
  "defrauded",
  "scammed",
  "swindled",
  "blackmailed",
  "extorted",
  "bribed",
  "stalked",
  "harassed",
  "abused",
  "molested",
  "raped",
  "betrayed",
  "deceived",
  "impersonated",
  "sued",
  "accused",
  "charged",
  "indicted",
  "witnessed",
  "observed",
  "met",
  "interviewed",
  "contacted",
  "approached",
  "followed",
  "photographed",
  "filmed",
  "recorded",
  "bugged",
  "hacked",
  "breached",
  "leaked",
  "stole",
  "stolen",
  "burgled",
  "vandalized",
  "burned",
  "strangled",
  "drowned",
  "poisoned",
  "suffocated",
  "missing",
  "found",
  "identified",
  "located",
  "apprehended",
]);

/** Mutual / observational — same label on both pages (e.g. "Met James Chen"). */
const NEUTRAL_SYMMETRIC_ACTIONS = new Set([
  "met",
  "interviewed",
  "contacted",
  "approached",
  "associated",
]);

/** Single-word labels that look like participles but are relational (not symmetric). */
const ASYMMETRIC_PARTICIPLE_WORDS = new Set([
  "employed",
  "owned",
  "related",
  "connected",
  "linked",
  "married",
  "engaged",
  "divorced",
  "separated",
  "estranged",
  "associated",
  "affiliated",
  "acquainted",
  "involved",
  "interested",
  "concerned",
  "committed",
  "dedicated",
  "beloved",
  "supposed",
  "alleged",
  "known",
  "unknown",
]);

/** Role nouns without "of" — do not treat as symmetric actions. */
const ROLE_NOUN_WORDS = new Set([
  "girlfriend",
  "boyfriend",
  "husband",
  "wife",
  "fiance",
  "fiancee",
  "fiancé",
  "fiancée",
  "spouse",
  "partner",
  "parent",
  "child",
  "son",
  "daughter",
  "sibling",
  "brother",
  "sister",
  "mother",
  "father",
  "uncle",
  "aunt",
  "nephew",
  "niece",
  "cousin",
  "friend",
  "colleague",
  "coworker",
  "associate",
  "mentor",
  "mentee",
  "student",
  "teacher",
  "employer",
  "employee",
  "client",
  "vendor",
  "owner",
  "tenant",
  "landlord",
  "manager",
  "suspect",
  "witness",
  "victim",
  "perpetrator",
  "informant",
  "source",
  "target",
  "member",
  "affiliate",
  "boss",
  "manager",
  "supervisor",
  "director",
  "secretary",
  "assistant",
  "colleague",
  "intern",
  "employee",
  "employer",
  "contractor",
  "consultant",
  "attorney",
  "lawyer",
  "counsel",
  "solicitor",
  "representative",
  "broker",
  "registrar",
  "ceo",
  "president",
  "executive",
  "cousin",
  "grandmother",
  "grandfather",
  "grandma",
  "grandpa",
  "nephew",
  "niece",
  "uncle",
  "aunt",
]);

/** -ed/-en words that are not event verbs. */
const PARTICIPLE_FALSE_POSITIVES = new Set([
  "bed",
  "red",
  "bred",
  "fed",
  "led",
  "wed",
  "died",
  "lied",
  "tied",
  "vied",
  "need",
  "seed",
  "reed",
  "shed",
  "sped",
  "bled",
  "fled",
  "shed",
  "glad",
  "sad",
  "mad",
  "bad",
  "odd",
  "between",
  "children",
  "women",
  "amen",
  "broken",
  "frozen",
  "golden",
  "wooden",
  "woolen",
  "proven",
  "oven",
  "heaven",
  "kitten",
  "often",
  "garden",
  "warden",
]);

function looksLikePastParticipleVerb(word: string): boolean {
  const w = word.toLowerCase();
  if (w.length < 4) return false;
  if (
    PARTICIPLE_FALSE_POSITIVES.has(w) ||
    ASYMMETRIC_PARTICIPLE_WORDS.has(w) ||
    ROLE_NOUN_WORDS.has(w)
  ) {
    return false;
  }
  if (SYMMETRIC_ACTION_VERBS.has(w)) return true;
  if (/[a-z]+ed$/i.test(w) && !/eed$/i.test(w)) return true;
  if (/[a-z]+en$/i.test(w) && w.length >= 5) return true;
  return false;
}

/**
 * Whether the label is an event/action verb (not a role or relation tail).
 */
export function isSymmetricActionLabel(label: string): boolean {
  const trimmed = label.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  if (SYMMETRIC_ACTION_VERBS.has(lower)) return true;

  const withoutBy = trimmed.match(/^(.+?)\s+by$/i);
  if (withoutBy) {
    return isSymmetricActionLabel(withoutBy[1]);
  }

  if (RELATIONAL_TAIL.test(trimmed)) return false;

  if (!/\s/.test(trimmed)) {
    return looksLikePastParticipleVerb(trimmed);
  }

  return false;
}

function actionVerbStem(label: string): string {
  const trimmed = label.trim();
  const withoutBy = trimmed.match(/^(.+?)\s+by$/i);
  return (withoutBy ? withoutBy[1] : trimmed).trim();
}

/**
 * Inverse label for event verbs on the target entity's page.
 * Harm verbs: "Robbed" → "Robbed by". Neutral verbs: "Met" → "Met".
 * Passive outgoing ("Robbed by") → active "Robbed".
 */
export function inferInverseActionLabel(outgoingLabel: string): string | null {
  const trimmed = outgoingLabel.trim();
  if (!isSymmetricActionLabel(trimmed)) return null;

  const stem = actionVerbStem(trimmed);
  const stemLower = stem.toLowerCase();

  if (/\s+by$/i.test(trimmed)) {
    return stem;
  }

  if (NEUTRAL_SYMMETRIC_ACTIONS.has(stemLower)) {
    return stem;
  }

  return `${stem} by`;
}

/**
 * "{role} of" → full inverse phrase without "of"
 * (e.g. "Boss of" → "Reports to", "Secretary of" → "Assisted by").
 */
const ROLE_OF_PHRASE_INVERSE: Record<string, string> = {
  boss: "Reports to",
  manager: "Reports to",
  supervisor: "Reports to",
  "line manager": "Reports to",
  director: "Reports to",
  head: "Reports to",
  lead: "Reports to",
  chief: "Reports to",
  executive: "Reports to",
  ceo: "Reports to",
  president: "Reports to",
  owner: "Owned by",
  secretary: "Assisted by",
  assistant: "Assisted by",
  pa: "Assisted by",
  aide: "Assisted by",
  intern: "Supervised by",
  trainee: "Supervised by",
  apprentice: "Supervised by",
  employee: "Employed by",
  employer: "Employs",
  contractor: "Contracted by",
  consultant: "Consulted by",
  recruiter: "Recruited by",
  sponsor: "Sponsored by",
  mentor: "Mentored by",
  mentee: "Mentors",
  teacher: "Taught by",
  student: "Teaches",
  coach: "Coached by",
  lawyer: "Represented by",
  attorney: "Represented by",
  counsel: "Represented by",
  solicitor: "Represented by",
  barrister: "Represented by",
  advocate: "Represented by",
  representative: "Represented by",
  agent: "Represented by",
  broker: "Represented by",
  registrar: "Registered by",
  registrant: "Registers",
  client: "Represents",
  customer: "Serves",
  vendor: "Supplied by",
  supplier: "Supplied by",
};

/** Role in "{role} of" → complementary role + " of". */
const ROLE_OF_COMPLEMENTS: Record<string, string> = {
  girlfriend: "boyfriend",
  boyfriend: "girlfriend",
  husband: "wife",
  wife: "husband",
  fiance: "fiancee",
  fiancee: "fiance",
  fiancé: "fiancée",
  fiancée: "fiancé",
  ex: "ex",
  mother: "child",
  father: "child",
  mom: "child",
  dad: "child",
  parent: "child",
  child: "parent",
  son: "parent",
  daughter: "parent",
  stepmother: "stepchild",
  stepfather: "stepchild",
  stepmom: "stepchild",
  stepdad: "stepchild",
  stepchild: "stepparent",
  stepson: "stepparent",
  stepdaughter: "stepparent",
  grandmother: "grandchild",
  grandfather: "grandchild",
  grandparent: "grandchild",
  grandma: "grandchild",
  grandpa: "grandchild",
  grandchild: "grandparent",
  grandson: "grandparent",
  granddaughter: "grandparent",
  "great-grandmother": "great-grandchild",
  "great-grandfather": "great-grandchild",
  "great-grandchild": "great-grandparent",
  uncle: "nephew",
  aunt: "niece",
  nephew: "uncle",
  niece: "aunt",
  cousin: "cousin",
  sibling: "sibling",
  brother: "sibling",
  sister: "sibling",
  twin: "twin",
  "half-brother": "half-sibling",
  "half-sister": "half-sibling",
  "half-sibling": "half-sibling",
  godparent: "godchild",
  godmother: "godchild",
  godfather: "godchild",
  godchild: "godparent",
  ancestor: "descendant",
  descendant: "ancestor",
  "father-in-law": "son-in-law",
  "mother-in-law": "daughter-in-law",
  "son-in-law": "father-in-law",
  "daughter-in-law": "mother-in-law",
  "brother-in-law": "sibling-in-law",
  "sister-in-law": "sibling-in-law",
  landlord: "tenant",
  tenant: "landlord",
  subsidiary: "parent company",
};

/** Roles that stay the same on the other entity's page. */
const SYMMETRIC_ROLE_OF = new Set([
  "friend",
  "friends",
  "partner",
  "partners",
  "spouse",
  "spouses",
  "colleague",
  "colleagues",
  "coworker",
  "coworkers",
  "co-worker",
  "co-workers",
  "teammate",
  "teammates",
  "peer",
  "peers",
  "associate",
  "associates",
  "ally",
  "allies",
  "member",
  "members",
  "affiliate",
  "affiliates",
  "acquaintance",
  "acquaintances",
  "contact",
  "contacts",
  "sibling",
  "siblings",
  "cousin",
  "cousins",
  "relative",
  "relatives",
  "family",
  "roommate",
  "roommates",
  "housemate",
  "housemates",
  "neighbor",
  "neighbour",
  "neighbors",
  "neighbours",
  "classmate",
  "classmates",
  "co-founder",
  "cofounder",
  "co-founders",
  "business partner",
  "business partners",
  "partner in crime",
  "ex",
]);

function applyRoleCasing(sourceRole: string, complementStem: string): string {
  if (sourceRole === sourceRole.toUpperCase()) {
    return complementStem.toUpperCase();
  }
  if (sourceRole[0] === sourceRole[0].toUpperCase()) {
    return complementStem.charAt(0).toUpperCase() + complementStem.slice(1);
  }
  return complementStem;
}

const PHRASE_LOWERCASE_WORDS = new Set([
  "to",
  "of",
  "by",
  "for",
  "on",
  "with",
  "in",
  "at",
]);

function applyPhraseCasing(sourceRole: string, phrase: string): string {
  if (sourceRole === sourceRole.toUpperCase()) {
    return phrase.toUpperCase();
  }
  if (sourceRole[0] === sourceRole[0].toUpperCase()) {
    return phrase
      .split(/\s+/)
      .map((w, i) => {
        const lower = w.toLowerCase();
        if (i > 0 && PHRASE_LOWERCASE_WORDS.has(lower)) return lower;
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(" ");
  }
  return phrase.toLowerCase();
}

const ALLOWED_ROLE_PREFIX = /^(?:ex[-\s]?|former[-\s]?)/i;

function lookupRolePhraseInverse(rolePhrase: string): string | null {
  const trimmed = rolePhrase.trim();
  const lower = trimmed.toLowerCase();

  const direct = ROLE_OF_PHRASE_INVERSE[lower];
  if (direct) {
    return applyPhraseCasing(trimmed, direct);
  }

  const stems = Object.keys(ROLE_OF_PHRASE_INVERSE).sort(
    (a, b) => b.length - a.length,
  );
  for (const stem of stems) {
    if (!lower.endsWith(stem)) continue;
    const prefix = trimmed.slice(0, trimmed.length - stem.length);
    if (prefix && !ALLOWED_ROLE_PREFIX.test(prefix)) continue;
    return applyPhraseCasing(stem, ROLE_OF_PHRASE_INVERSE[stem]);
  }

  return null;
}

/** Match optional prefix + known role stem at end of the role phrase. */
function complementRolePhrase(rolePhrase: string): string | null {
  const trimmed = rolePhrase.trim();
  const lower = trimmed.toLowerCase();

  if (SYMMETRIC_ROLE_OF.has(lower)) {
    return trimmed;
  }

  const direct = ROLE_OF_COMPLEMENTS[lower];
  if (direct) {
    if (direct.includes(" ")) return direct;
    return applyRoleCasing(trimmed, direct);
  }

  const stems = Object.keys(ROLE_OF_COMPLEMENTS).sort(
    (a, b) => b.length - a.length,
  );
  for (const stem of stems) {
    if (!lower.endsWith(stem)) continue;
    const prefix = trimmed.slice(0, trimmed.length - stem.length);
    const complement = ROLE_OF_COMPLEMENTS[stem];
    if (complement.includes(" ")) {
      return prefix ? `${prefix}${complement}` : complement;
    }
    return prefix + applyRoleCasing(stem, complement);
  }

  return null;
}

const ROLE_OF_SUFFIX = /\s+of$/i;

/**
 * Invert a label ending in "… of" (e.g. "Girlfriend of" → "Boyfriend of").
 * Returns null if the label does not match that pattern.
 */
export function invertRoleOfLabel(outgoingLabel: string): string | null {
  const trimmed = outgoingLabel.trim();
  if (!ROLE_OF_SUFFIX.test(trimmed)) return null;

  const rolePhrase = trimmed.replace(ROLE_OF_SUFFIX, "").trim();
  if (!rolePhrase) return null;

  const phraseInverse = lookupRolePhraseInverse(rolePhrase);
  if (phraseInverse) return phraseInverse;

  const complement = complementRolePhrase(rolePhrase);
  if (complement) {
    return `${complement} of`;
  }

  return "Related to";
}
