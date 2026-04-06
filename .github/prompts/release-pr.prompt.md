---
description: "Create a release PR: bump version, update READMEs, RELEASES.md, gruntfile, and commit"
agent: "agent"
---

# Create Release PR

Prepare a release by incrementing the version and updating all required files. Do NOT create a new branch — use the current branch.

## Step 1: Increment the Version

**IMPORTANT: You MUST run the setVersion command FIRST and wait for it to complete BEFORE reading `version.json`.** Do NOT read `version.json` beforehand — the current value is the *old* version. The script increments the version, and only after it finishes will `version.json` contain the correct new version.

Run the following command from the repo root to bump the version based on the `next` field in `version.json`:

```
npm run setVersion -- -next
```

After the command completes, THEN read `version.json` to determine the new version number (the `release` field). This is referred to as `X.Y.Z` in the steps below. Do NOT assume you know the version from any prior reading of the file.

## Step 2: Update AISKU/README.md CDN Version Table

In [AISKU/README.md](../AISKU/README.md), find the `## CDN Version Release Summary (with Size tracking)` table.

Add a new row for `X.Y.Z` immediately after the nightly row and before the previous release entry. Use this exact format (substitute the actual version):

```
| X.Y.Z:  | [![full size size](https://js.monitor.azure.com/scripts/b/ai.X.Y.Z.js.svg)](https://js.monitor.azure.com/scripts/b/ai.X.Y.Z.js.svg)| ![minified size size](https://js.monitor.azure.com/scripts/b/ai.X.Y.Z.min.js.svg) | ![gzip size](https://js.monitor.azure.com/scripts/b/ai.X.Y.Z.min.js.gzip.svg)
```

Remove the oldest version row from the v3.x section to keep the table from growing unbounded (keep the last ~25 v3.x entries). Do NOT remove any v2.x entries.

## Step 3: Update RELEASES.md

In [RELEASES.md](../RELEASES.md):

1. **Create a new release heading** at the top of the file (after the initial note and before any existing release entries), using format:
   ```
   ## X.Y.Z (Month DDth, YYYY)
   ```
   Use today's date. The new release section is always inserted at the top — above all existing entries including any beta/alpha/pre-release entries.

2. **Include Significant Changes**: If this release includes significant new features, breaking changes, behavioral changes, package deprecations, or other notable updates, add a `### Significant Changes (since PREV_VERSION)` section (where `PREV_VERSION` is the previous full release version) summarizing them. Review the existing beta/pre-release entry (if any) for content that should be carried forward (duplicated) into the new release. This section should be human-readable and describe the impact to users.

   **You MUST always thoroughly review every PR/commit since the previous release** to identify all significant changes — do not rely solely on what was already written in the beta or unreleased sections. PRs that introduce new features, change behavior, deprecate packages, modify default configuration values, or improve reliability/performance should all be included as significant changes even if they were not called out in prior sections.

   If any packages have been merged, deprecated, or are now published only as compatibility shims, add a `### Package Deprecation` section describing which packages are affected, that they are still published as shims, and that consumers should migrate to the new package.

   If any of the significant changes were previously included in a beta/alpha/pre-release, add a blockquote note immediately after the heading:
   ```
   > The following are the significant changes since the previous full release (PREV_VERSION). Some of these changes were previously included in the X.Y.Z-beta release.
   ```
   This makes it clear why content may appear duplicated across release entries.

3. **Include Breaking Changes and Potential Breaking Changes**: If the existing unreleased or beta sections contain `### Breaking Changes` or `### Potential Breaking Changes` or `### Potential behavioral changes` sections, duplicate them into the new release section. Do NOT remove them from the original beta/pre-release entry.

4. **Build the Changelog**: Combine:
   - All entries currently under `## Unreleased Changes (from Main)` changelog
   - All entries from any beta/pre-release section changelog (e.g., `## X.Y.Z-beta`) — these should be **duplicated** into the new release, NOT moved
   - Review git history since the last release tag for any significant PRs that may have been missed
   - Do NOT include PRs that only bump dependency versions (e.g., "bump @microsoft/xxx from A to B")
   - Each entry should be a clickable link: `- #NNNN Description` where `#NNNN` links to the GitHub PR

   **CRITICAL: NEVER strip or remove sub-bullet details from changelog entries.** If an entry in the Unreleased section or a prior release includes sub-bullets with additional context (e.g., potential breaking changes, enhancement notes, configuration details), those sub-bullets MUST be preserved exactly as-is in the new release changelog. Do not flatten detailed entries into single-line summaries.

5. **Add a comparison link** at the end of the new release section:
   ```
   **Full Changelog**: https://github.com/microsoft/ApplicationInsights-JS/compare/PREV_VERSION...X.Y.Z
   ```
   Where `PREV_VERSION` is the previous release version tag.

6. **Clean up the Unreleased section only**: Remove or comment out the `## Unreleased Changes (from Main)` section content. Leave behind a commented placeholder:
   ```
   <!-- ## Unreleased Changes -->
   ```

   **CRITICAL: NEVER delete or remove any existing release entries from RELEASES.md** — this includes beta, alpha, RC, and all prior full releases. Even if a beta/pre-release contains the same changes as the new full release, the beta entry must remain in the file. The only section that gets removed is the `## Unreleased Changes (from Main)` section.

   Even when told to use version X.Y.Z as the "previous release" for changelog purposes, this only affects which PRs to include in the new entry and the comparison link — it does NOT mean you should delete any intervening release entries (beta, alpha, etc.) from the file.

## Step 4: Update gruntfile.js perfTestVersions

In [gruntfile.js](../gruntfile.js), update the `perfTestVersions` array to include the new version:

```javascript
const perfTestVersions=["X.Y.Z"];
```

Replace the existing version value — this array should contain only the new release version.

## Step 5: Run lint-fix

Run the following command to ensure all files are properly formatted:

```
npm run lint-fix
```

## Step 6: Commit

Stage all changes and commit with the message:

```
[Release] Increase version to X.Y.Z
```

If there are significant changes worth calling out (breaking changes, major new features), add them as additional lines after the subject line. It is valid for this commit to have no additional body content beyond the subject.

Do NOT push the branch — just create the local commit.

## Step 7: Validate the Build

Run the full clean build to ensure no build issues:

```
npm run fullCleanBuild
```

- **If running from GitHub Actions, automation, or a CI environment**: Run this command directly before creating the PR. Resolve any unexpected build failures before proceeding.
- **If running interactively from VS Code or Visual Studio**: This command cannot be run from within the editor because open editors and extensions hold file locks that will cause the clean build step to fail. Instead, inform the user that they need to **manually** run `npm run fullCleanBuild` from a **separate terminal** (e.g., Windows Terminal, PowerShell, or Command Prompt) pointed at the repo root, and resolve any issues before creating the PR.
