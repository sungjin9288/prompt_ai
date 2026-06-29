# Verification Evidence

This directory keeps release or handoff verification records generated from the
shared verification manifest. Local smoke packets belong in `output/smoke` or a
private handoff folder unless they are promoted into a timestamped release
record.

Create a fresh record when a change is ready for review:

```bash
npm run verify:evidence -- --out-dir docs/evidence
```

Each record should show:

- `status: pass`
- every script from the shared verification manifest, including `verify:manifest`,
  `verify:docs`, `verify:secrets`, `lint`, and `build`
- runtime readiness for the intended local, OpenAI, or Supabase mode
- runtime variable rows written as `variable KEY; configured yes/no`, not as
  environment assignments

After creating a record, run:

```bash
npm run verify:secrets
```

Keep only evidence files that support the current release, migration rehearsal,
or handoff. Remove superseded records before committing a grouped change set.
Never paste raw OpenAI keys, Supabase keys, service-role values, or tokens into
these files.
