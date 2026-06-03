export type {
  CasePathEntry,
  EntityPathEntry,
  FieldPathEntry,
  InternalRefKind,
  PathTarget,
  ReferenceContext,
  ReferenceIndex,
  ResolvedRef,
  SectionPathEntry,
} from "./types";

export {
  BARE_DOT_PATH_RE,
  extractInternalRefs,
  isDotPath,
  normalizeDotPath,
  parseWikilinkInner,
} from "./parse";

export {
  buildCasePath,
  buildEntityPath,
  buildReferenceIndex,
  CASE_SECTION_KEYS,
  caseRootSlug,
  entityRootSlug,
  formatAliasedWikilink,
  formatDefaultEntityWikilink,
  resolvePathFromIndex,
} from "./path";
export type { CaseSectionKey } from "./path";

export { resolveInternalRef, resolveWikilinkInner } from "./resolve";
