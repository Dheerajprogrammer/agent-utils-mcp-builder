# Main Branch Rules

## Overview

The `main` branch is the production-ready branch of the project and is protected from direct modifications. All changes must go through the pull request process.

## Rules

### 1. No Direct Pushes

Direct pushes to the `main` branch are not allowed.

All changes must be submitted through a Pull Request (PR).

### 2. Pull Request Required

Every change must:

- Be submitted through a PR
- Include a clear description of the change
- Reference related issues when applicable
- Pass all automated checks before merging

### 3. Code Review Requirements

A PR must receive:

- At least **1 approval** from a maintainer
- No unresolved review comments
- No requested changes remaining

For major architectural changes, **2 maintainer approvals** are recommended.

### 4. Automated Checks

The following checks must pass before merging:

- Build validation
- Unit tests
- Linting
- Type checking
- Security scanning (if configured)

PRs with failing checks cannot be merged.

### 5. Branch Up-to-Date Requirement

Pull requests must be up to date with the latest `main` branch before merging.

### 6. Commit Standards

Commits should follow the Conventional Commits specification:

Examples:

- `feat: add API recorder middleware`
- `fix: resolve websocket reconnect issue`
- `docs: update installation guide`

### 7. Force Push Protection

Force pushes to `main` are prohibited.

### 8. Branch Deletion Protection

The `main` branch cannot be deleted.

### 9. Release Merges

Only maintainers may merge release-related PRs.

Preferred merge strategy:

- Squash and Merge

This keeps project history clean and easier to navigate.

### 10. Security Fixes

Critical security fixes may be merged on an expedited basis by project maintainers after review.

## Recommended GitHub Settings

Enable the following branch protection settings:

- Require a pull request before merging
- Require approvals (minimum 1)
- Dismiss stale approvals when new commits are pushed
- Require status checks to pass
- Require branches to be up to date before merging
- Restrict direct pushes
- Restrict force pushes
- Prevent branch deletion
- Require conversation resolution before merging

## Workflow

Feature Branch → Pull Request → Review → CI Checks → Merge into Main