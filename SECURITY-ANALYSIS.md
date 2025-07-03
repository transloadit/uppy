# GitHub Actions Security Vulnerability Analysis & Fix

## Vulnerability Summary

**Severity**: High  
**Type**: Secret Exfiltration via GitHub Actions `pull_request_target`  
**Affected File**: `.github/workflows/e2e.yml`  
**Reported By**: Stefano Chierici (Sysdig Security Research)

## Vulnerability Details

### The Problem

The e2e workflow contained a critical security flaw that allowed external attackers to extract repository secrets:

1. **Trigger**: Used `pull_request_target` (line 13) which grants access to repository secrets
2. **Code Execution**: Checked out untrusted PR code with `ref: ${{ github.event.pull_request.head.sha }}` (line 103)  
3. **Secret Exposure**: Exposed all sensitive secrets as environment variables (lines 154-166)

### Attack Vector

An attacker could:
1. Fork the repository
2. Create a malicious pull request with code to exfiltrate secrets (e.g., `echo $COMPANION_AWS_SECRET`)
3. The workflow would execute the attacker's code with full access to secrets
4. Secrets would be leaked through workflow logs or external HTTP requests

### Exposed Secrets

The following secrets were accessible to attackers:
- `COMPANION_AWS_KEY`
- `COMPANION_AWS_SECRET` 
- `COMPANION_AWS_BUCKET`
- `COMPANION_AWS_REGION`
- `COMPANION_UNSPLASH_KEY`
- `COMPANION_UNSPLASH_SECRET` 
- `TRANSLOADIT_KEY`
- `TRANSLOADIT_SECRET`
- `TRANSLOADIT_SERVICE_URL`
- `TRANSLOADIT_TEMPLATE`

### Proof of Compromise

The security researcher successfully extracted:
- `COMPANION_AWS_BUCKET`: "uppy-ci.transloadit.com"
- `COMPANION_AWS_SECRET`: ending in "Kxke"
- `TRANSLOADIT_SECRET`: ending in "6fa0"

## Fix Implementation

### Changes Made

1. **Removed `pull_request_target`**: Replaced with safe `pull_request` trigger
2. **Added Secret Detection**: Workflow now detects if secrets are available
3. **Conditional Execution**: 
   - Full tests with secrets for trusted commits (push to main)
   - Limited UI tests without secrets for external contributors
4. **Safe Fallback**: External contributors can still test core functionality

### Security Benefits

- ✅ **No Secret Access**: External PRs cannot access repository secrets
- ✅ **External Contributor Support**: PRs from forks can still run appropriate tests  
- ✅ **Maintained Functionality**: Full test suite runs on trusted commits
- ✅ **Clear Separation**: Different test modes for different trust levels

### Code Changes

```yaml
# BEFORE (vulnerable)
on:
  pull_request_target:
    types: [opened, synchronize, reopened]

# AFTER (secure)  
on:
  pull_request:
    types: [opened, synchronize, reopened]
```

Added conditional secret handling:
```yaml
- name: Check if secrets are available
  id: check-secrets
  run: |
    if [ -n "${{ secrets.COMPANION_AWS_KEY }}" ]; then
      echo "secrets-available=true" >> $GITHUB_OUTPUT
    else
      echo "secrets-available=false" >> $GITHUB_OUTPUT
    fi

- name: Run end-to-end browser tests (with secrets)
  if: steps.check-secrets.outputs.secrets-available == 'true'
  # ... full test suite with secrets

- name: Run end-to-end browser tests (without secrets - for external contributors)  
  if: steps.check-secrets.outputs.secrets-available == 'false'
  # ... limited UI tests only
```

## Recommendations

### Immediate Actions
- [x] Fix implemented in `.github/workflows/e2e.yml`
- [ ] **CRITICAL**: Rotate all exposed secrets immediately:
  - AWS credentials
  - Transloadit keys  
  - Unsplash API keys
- [ ] Review AWS CloudTrail logs for unauthorized access
- [ ] Monitor Transloadit usage for anomalies

### Long-term Security Measures

1. **Security Review**: Audit all GitHub Actions workflows for similar patterns
2. **Branch Protection**: Consider requiring approval for all external PRs
3. **Secret Scoping**: Use least-privilege access for service accounts
4. **Monitoring**: Set up alerts for unusual secret usage
5. **Documentation**: Update contributor guidelines about CI behavior

## Testing External Contributions

External contributors can now safely:
- Run UI and functional tests without secrets
- Verify their changes don't break core functionality  
- Get meaningful feedback on their contributions
- Submit PRs without security concerns

Full integration tests with external services will run automatically when the PR is merged to main.

## GitHub Actions Security Best Practices

1. **Never use `pull_request_target` with untrusted code checkout**
2. **Use `pull_request` for external contributor workflows**
3. **Implement conditional secret access based on context**
4. **Separate trusted vs untrusted execution environments**
5. **Regular security audits of workflow configurations**

---

**Status**: ✅ Vulnerability Fixed  
**Date**: 2025-01-03  
**Next Review**: After secret rotation completion