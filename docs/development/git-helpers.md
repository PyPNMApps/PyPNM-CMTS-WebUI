# Git Helpers

## Purpose

These helper scripts support common local save, push, and branch-history workflows for `PyPNM-WebUI`.

## Standard Save And Commit

Stage changes, run checks, and create a commit:

```bash
./tools/git/git-save.sh --commit-msg "message"
```

Default `git-save.sh` behavior:

1. runs `npm run lint`
2. runs `npm run test`
3. runs `npm run build`
4. bumps only the `BUILD` segment of `VERSION`
5. syncs `package.json` and `package-lock.json` to the derived npm version
6. stages repository changes
7. creates the timestamped commit

The build bump is part of the save commit. It is not left dirty in the working tree.

Stage changes, run checks, create a commit, and push:

```bash
./tools/git/git-save.sh --commit-msg "message" --push
```

## Quick Commit And Push

Use the combined save/push helper for shorter flows:

```bash
./tools/git/git-push.sh --commit-msg "message"
```

## History Rewrite

For destructive branch-history rewrite workflows only:

```bash
./tools/git/git-reset-branch-history.sh --help
```

Use history rewrite only when the branch policy requires it.
