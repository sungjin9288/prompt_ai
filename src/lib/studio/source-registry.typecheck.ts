import {
  promptStudioDraftSourceVariants,
  promptStudioDraftSources,
  type PromptStudioDraftSource,
} from "@/lib/prompt";
import type { PromptStudioSourceRegistryKey } from "@/lib/studio/source-registry";

type AssertNever<T extends never> = T;
type DuplicateTupleValue<
  Values extends readonly unknown[],
  Seen = never,
> = Values extends readonly [infer Current, ...infer Rest]
  ? Current extends Seen
    ? Current
    : DuplicateTupleValue<Rest, Seen | Current>
  : never;
type RegistrySource = PromptStudioSourceRegistryKey;
type MissingRegistrySource = Exclude<PromptStudioDraftSource, RegistrySource>;
type UnknownRegistrySource = Exclude<RegistrySource, PromptStudioDraftSource>;
type DuplicateDraftSource = DuplicateTupleValue<typeof promptStudioDraftSources>;
type DuplicateDraftSourceVariant = DuplicateTupleValue<
  typeof promptStudioDraftSourceVariants
>;

export type RegistryCoversEveryDraftSource =
  AssertNever<MissingRegistrySource>;
export type RegistryOnlyUsesKnownDraftSources =
  AssertNever<UnknownRegistrySource>;
export type RegistryDraftSourceListHasNoDuplicates =
  AssertNever<DuplicateDraftSource>;
export type RegistryDraftSourceVariantListHasNoDuplicates =
  AssertNever<DuplicateDraftSourceVariant>;
