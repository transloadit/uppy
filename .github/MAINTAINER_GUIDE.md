# Maintainer Guide: Testing External Contributions

## "Safe to Test" Label Workflow

For security reasons, end-to-end (E2E) tests that require secrets (AWS, Unsplash, Transloadit) do not run automatically on pull requests from external contributors (forks). This prevents malicious actors from accessing our API keys and secrets.

### When E2E Tests Run Automatically

E2E tests with secrets run automatically for:
- Pushes to the `main` branch
- Pull requests from branches within the main repository (not forks)

### When E2E Tests Require Manual Approval

E2E tests with secrets require manual approval for:
- Pull requests from external contributors (forks)

### How to Enable E2E Tests for Fork PRs

1. **Review the PR code carefully** - Check that the changes don't contain any malicious code that could exfiltrate secrets
2. **Add the "safe to test" label** - This will trigger the E2E workflow with full access to secrets
3. **Monitor the test results** - Watch for any suspicious activity in the logs

### Security Considerations

⚠️ **Important**: Only add the "safe to test" label after thoroughly reviewing the PR code. Once this label is added, the PR will have access to:
- AWS credentials for file uploads
- Unsplash API keys
- Transloadit API keys and secrets

### Creating the Label

If the "safe to test" label doesn't exist yet, create it in the repository settings:

1. Go to the repository's Issues tab
2. Click on "Labels" next to the search bar
3. Click "New label"
4. Use these settings:
   - **Name**: `safe to test`
   - **Description**: `Allows E2E tests with secrets to run on external PRs`
   - **Color**: `#0075ca` (blue)

### Workflow for Maintainers

1. **New PR from fork arrives** → E2E tests are skipped (no secrets)
2. **Review PR code** → Look for any suspicious changes
3. **Add "safe to test" label** → E2E tests run with full secrets
4. **Tests complete** → Review results and merge if all good
5. **Remove label** (optional) → Label can be removed after merge

### What Happens Without the Label

Without the "safe to test" label, PRs from forks will:
- ✅ Run unit tests (no secrets needed)
- ✅ Run linting and type checking
- ✅ Run other CI checks that don't require secrets
- ❌ Skip E2E tests that require external API access

This ensures basic code quality while maintaining security.