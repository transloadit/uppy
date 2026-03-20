#!/usr/bin/env bash
set -euo pipefail

# setup-service.sh — Generate /etc/companion/companion.env and install the
# systemd unit for Uppy Companion.
#
# Usage:
#   ./setup-service.sh            # interactive: confirm each env var
#   ./setup-service.sh --auto     # non-interactive: copy all COMPANION_* vars
#   ./setup-service.sh --vercel   # also pull from Vercel massif-app-web

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="${SCRIPT_DIR}/companion.service"
ENV_DIR="/etc/companion"
ENV_FILE="${ENV_DIR}/companion.env"
SYSTEMD_DIR="/etc/systemd/system"

# Vercel config — the massif-app-web project holds PUBLIC_COMPANION_URL and
# SUPABASE_JWT_SECRET which map to COMPANION_DOMAIN and COMPANION_SECRET.
# Provider OAuth keys and AWS credentials must come from the shell or manual input.
VERCEL_SCOPE="massif-network"
VERCEL_PROJECT="massif-app-web"
VERCEL_ENVIRONMENT="preview"

AUTO=false
USE_VERCEL=false

# Provider key/secret overrides from CLI flags
CLI_DROPBOX_KEY=""
CLI_DROPBOX_SECRET=""
CLI_GOOGLE_DRIVE_KEY=""
CLI_GOOGLE_DRIVE_SECRET=""
CLI_ONEDRIVE_KEY=""
CLI_ONEDRIVE_SECRET=""

# =============================================================================
# Argument Parsing
# =============================================================================

while [[ $# -gt 0 ]]; do
  case "$1" in
    --auto|-a)    AUTO=true; shift ;;
    --vercel)     USE_VERCEL=true; shift ;;
    --vercel-env) VERCEL_ENVIRONMENT="$2"; shift 2 ;;
    --dropbox-key=*)          CLI_DROPBOX_KEY="${1#*=}"; shift ;;
    --dropbox-secret=*)       CLI_DROPBOX_SECRET="${1#*=}"; shift ;;
    --google-drive-key=*)     CLI_GOOGLE_DRIVE_KEY="${1#*=}"; shift ;;
    --google-drive-secret=*)  CLI_GOOGLE_DRIVE_SECRET="${1#*=}"; shift ;;
    --onedrive-key=*)         CLI_ONEDRIVE_KEY="${1#*=}"; shift ;;
    --onedrive-secret=*)      CLI_ONEDRIVE_SECRET="${1#*=}"; shift ;;
    --help|-h)
      cat <<'USAGE'
Usage: setup-service.sh [OPTIONS]

Options:
  --auto, -a                  Import all COMPANION_* env vars without prompting
  --vercel                    Pull env vars from Vercel (massif-app-web, preview env)
  --vercel-env E              Vercel environment: production|preview|development (default: preview)
  --dropbox-key=KEY           Dropbox OAuth app key
  --dropbox-secret=SECRET     Dropbox OAuth app secret
  --google-drive-key=KEY      Google Drive OAuth client ID
  --google-drive-secret=SECRET  Google Drive OAuth client secret
  --onedrive-key=KEY          OneDrive OAuth app ID
  --onedrive-secret=SECRET    OneDrive OAuth app secret
  --help, -h                  Show this help

Sources (applied in order, later wins):
  1. Current shell environment  (COMPANION_* vars already exported)
  2. CLI flags                  (--dropbox-key, --google-drive-key, etc.)
  3. Vercel project             (--vercel pulls and maps vars)
  4. Interactive prompts        (unless --auto)

Examples:
  sudo ./setup-service.sh                # interactive, from current env
  sudo ./setup-service.sh --vercel       # pull from Vercel, confirm each var
  sudo ./setup-service.sh --auto --vercel  # fully automatic
  sudo ./setup-service.sh --dropbox-key=abc --dropbox-secret=xyz
USAGE
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Run with --help for usage." >&2
      exit 1
      ;;
  esac
done

if [[ $EUID -ne 0 ]]; then
  echo "This script must be run as root (or via sudo)." >&2
  exit 1
fi

# =============================================================================
# Known keys and Vercel→Companion mappings
# =============================================================================

KNOWN_KEYS=(
  NODE_ENV
  COMPANION_PORT
  COMPANION_DOMAIN
  COMPANION_SELF_ENDPOINT
  COMPANION_HIDE_METRICS
  COMPANION_HIDE_WELCOME
  COMPANION_STREAMING_UPLOAD
  COMPANION_TUS_DEFERRED_UPLOAD_LENGTH
  COMPANION_MAX_FILENAME_LENGTH
  COMPANION_PROTOCOL
  COMPANION_DATADIR
  COMPANION_SECRET
  COMPANION_PREAUTH_SECRET
  COMPANION_SECRET_FILE
  # Providers (Google Drive, Dropbox, OneDrive)
  COMPANION_DROPBOX_KEY
  COMPANION_DROPBOX_SECRET
  COMPANION_GOOGLE_KEY
  COMPANION_GOOGLE_SECRET
  COMPANION_ONEDRIVE_KEY
  COMPANION_ONEDRIVE_SECRET
  # AWS / S3
  COMPANION_AWS_KEY
  COMPANION_AWS_SECRET
  COMPANION_AWS_SECRET_FILE
  COMPANION_AWS_BUCKET
  COMPANION_AWS_ENDPOINT
  COMPANION_AWS_REGION
  COMPANION_AWS_PREFIX
  COMPANION_AWS_FORCE_PATH_STYLE
  COMPANION_AWS_DYNAMIC_BUCKET
  COMPANION_AWS_USE_ACCELERATE_ENDPOINT
  COMPANION_AWS_ACL
  COMPANION_AWS_EXPIRES
  # Network / misc
  COMPANION_REDIS_URL
  COMPANION_REDIS_OPTIONS
  COMPANION_UPLOAD_URLS
  COMPANION_ALLOW_LOCAL_URLS
  COMPANION_CLIENT_ORIGINS
  COMPANION_CLIENT_ORIGINS_REGEX
  COMPANION_MAX_FILE_SIZE
  COMPANION_CHUNK_SIZE
  COMPANION_COOKIE_DOMAIN
  COMPANION_ENABLE_URL_ENDPOINT
)

# Mapping: VERCEL_VAR → COMPANION_VAR
# Direct COMPANION_* vars in Vercel are picked up automatically.
declare -A VERCEL_MAP=(
  [PUBLIC_COMPANION_URL]=COMPANION_DOMAIN
  [PUBLIC_SUPABASE_URL]=_INFO_SUPABASE_URL
  [PUBLIC_SUPABASE_ANON_KEY]=_INFO_SUPABASE_ANON_KEY
  [SUPABASE_SERVICE_ROLE_KEY]=_INFO_SUPABASE_SERVICE_ROLE_KEY
  [SUPABASE_JWT_SECRET]=COMPANION_SECRET
)

# Defaults applied unless already set in the environment
: "${COMPANION_AWS_DYNAMIC_BUCKET:=true}"
export COMPANION_AWS_DYNAMIC_BUCKET

# =============================================================================
# Helpers
# =============================================================================

parse_env_file() {
  local file="$1"
  while IFS= read -r line; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// /}" ]] && continue
    local key="${line%%=*}"
    local val="${line#*=}"
    val="${val#\"}" ; val="${val%\"}"
    val="${val#\'}" ; val="${val%\'}"
    [[ "$key" =~ ^(VERCEL_OIDC_TOKEN|NX_|TURBO_) ]] && continue
    printf '%s\t%s\n' "$key" "$val"
  done < "$file"
}

maybe_include() {
  local key="$1" val="$2"
  if $AUTO; then
    env_vars[$key]="$val"
    return
  fi
  read -rp "Include ${key}=${val}? [Y/n] " answer
  case "${answer,,}" in
    n|no) ;;
    *) env_vars[$key]="$val" ;;
  esac
}

# =============================================================================
# Collect env vars
# =============================================================================

declare -A env_vars

# --- Source 1: Current shell environment ---

for key in "${KNOWN_KEYS[@]}"; do
  val="${!key:-}"
  [[ -z "$val" ]] && continue
  maybe_include "$key" "$val"
done

while IFS='=' read -r key val; do
  [[ -z "$key" ]] && continue
  [[ -v "env_vars[$key]" ]] && continue
  maybe_include "$key" "$val"
done < <(env | grep -E '^COMPANION_' | sort)

# --- Source 2: CLI provider flags (override env) ---

[[ -n "$CLI_DROPBOX_KEY" ]]         && env_vars[COMPANION_DROPBOX_KEY]="$CLI_DROPBOX_KEY"
[[ -n "$CLI_DROPBOX_SECRET" ]]      && env_vars[COMPANION_DROPBOX_SECRET]="$CLI_DROPBOX_SECRET"
[[ -n "$CLI_GOOGLE_DRIVE_KEY" ]]    && env_vars[COMPANION_GOOGLE_KEY]="$CLI_GOOGLE_DRIVE_KEY"
[[ -n "$CLI_GOOGLE_DRIVE_SECRET" ]] && env_vars[COMPANION_GOOGLE_SECRET]="$CLI_GOOGLE_DRIVE_SECRET"
[[ -n "$CLI_ONEDRIVE_KEY" ]]        && env_vars[COMPANION_ONEDRIVE_KEY]="$CLI_ONEDRIVE_KEY"
[[ -n "$CLI_ONEDRIVE_SECRET" ]]     && env_vars[COMPANION_ONEDRIVE_SECRET]="$CLI_ONEDRIVE_SECRET"

# --- Source 3: Vercel project ---

if $USE_VERCEL; then
  if ! command -v vercel &>/dev/null; then
    echo "Error: vercel CLI not found. Install with: npm i -g vercel" >&2
    exit 1
  fi

  pull_dir=$(mktemp -d)
  trap 'rm -rf "$pull_dir"' EXIT

  echo "Linking Vercel project '${VERCEL_PROJECT}'..."
  vercel link --yes --project "$VERCEL_PROJECT" --cwd "$pull_dir" \
    --scope "$VERCEL_SCOPE" 2>&1 | grep -v '^\s*$' || true

  vercel_env_file=$(mktemp)
  echo "Pulling ${VERCEL_ENVIRONMENT} env vars from Vercel..."
  vercel env pull "$vercel_env_file" \
    --environment "$VERCEL_ENVIRONMENT" \
    --yes --non-interactive \
    --cwd "$pull_dir" \
    --scope "$VERCEL_SCOPE" 2>&1 | grep -v '^\s*$' || true

  if [[ ! -s "$vercel_env_file" ]]; then
    echo "Warning: Vercel env pull returned empty. Check authentication and project link." >&2
  else
    echo ""
    echo "=== Vercel env vars pulled ==="

    # Pass 1: Direct COMPANION_* vars from Vercel
    while IFS=$'\t' read -r vkey vval; do
      [[ "$vkey" =~ ^COMPANION_ ]] || continue
      [[ -z "$vval" || "$vval" == PLACEHOLDER_* ]] && continue
      echo "  [direct] ${vkey}"
      maybe_include "$vkey" "$vval"
    done < <(parse_env_file "$vercel_env_file")

    # Pass 2: Mapped vars (VERCEL_VAR → COMPANION_VAR)
    while IFS=$'\t' read -r vkey vval; do
      [[ -z "$vval" || "$vval" == PLACEHOLDER_* ]] && continue
      companion_key="${VERCEL_MAP[$vkey]:-}"
      [[ -z "$companion_key" ]] && continue
      if [[ "$companion_key" == _INFO_* ]]; then
        echo "  [info]   ${vkey}=${vval} (not a Companion var, shown for reference)"
        continue
      fi
      if [[ "$companion_key" == "COMPANION_DOMAIN" ]]; then
        vval="${vval#https://}"
        vval="${vval#http://}"
        vval="${vval%/}"
      fi
      echo "  [mapped] ${vkey} → ${companion_key}=${vval}"
      maybe_include "$companion_key" "$vval"
    done < <(parse_env_file "$vercel_env_file")

    # Pass 3: Offer remaining non-VERCEL/non-COMPANION vars
    if ! $AUTO; then
      echo ""
      echo "Other vars found in Vercel project (not auto-mapped):"
      while IFS=$'\t' read -r vkey vval; do
        [[ "$vkey" =~ ^(COMPANION_|VERCEL|NX_|TURBO_) ]] && continue
        [[ -v "VERCEL_MAP[$vkey]" ]] && continue
        [[ -z "$vval" || "$vval" == PLACEHOLDER_* ]] && continue
        read -rp "  Map ${vkey}=${vval} to a COMPANION var? (enter key name or skip): " target
        [[ -z "$target" ]] && continue
        env_vars[$target]="$vval"
      done < <(parse_env_file "$vercel_env_file")
    fi

    echo "=== Done processing Vercel vars ==="
    echo ""
  fi

  rm -f "$vercel_env_file"
fi

# --- Source 4: Interactive additions ---

if ! $AUTO; then
  while true; do
    read -rp "Add another variable? (KEY=VALUE or empty to finish): " line
    [[ -z "$line" ]] && break
    key="${line%%=*}"
    val="${line#*=}"
    env_vars[$key]="$val"
  done
fi

if [[ ${#env_vars[@]} -eq 0 ]]; then
  echo "No environment variables collected. Set COMPANION_* vars before running,"
  echo "or use --vercel to pull from Vercel."
  exit 1
fi

# =============================================================================
# Write env file
# =============================================================================

mkdir -p "$ENV_DIR"

{
  echo "# Generated by setup-service.sh on $(date -Is)"
  echo "# Edit this file to change Companion configuration."
  echo ""
  for key in "${KNOWN_KEYS[@]}"; do
    [[ -v "env_vars[$key]" ]] && echo "${key}=${env_vars[$key]}"
  done
  for key in "${!env_vars[@]}"; do
    printf '%s\n' "${KNOWN_KEYS[@]}" | grep -qx "$key" && continue
    echo "${key}=${env_vars[$key]}"
  done
} > "$ENV_FILE"

chmod 600 "$ENV_FILE"
echo "Environment file written to ${ENV_FILE}"

# =============================================================================
# Install Companion
# =============================================================================

COMPANION_INSTALL_DIR="/opt/companion"
COMPANION_PKG_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
COMPANION_HELPER_SRC="${COMPANION_PKG_DIR}/src/standalone/helper.js"

if [[ ! -x "${COMPANION_INSTALL_DIR}/bin/companion" ]]; then
  echo "Installing @uppy/companion to ${COMPANION_INSTALL_DIR}..."
  mkdir -p "$COMPANION_INSTALL_DIR"
  npm install -g @uppy/companion --prefix "$COMPANION_INSTALL_DIR"
  echo "Companion installed."
else
  echo "Companion already installed at ${COMPANION_INSTALL_DIR}, skipping."
fi

# Patch helper.js with fork's dynamic bucket support
installed_helper="${COMPANION_INSTALL_DIR}/lib/node_modules/@uppy/companion/lib/standalone/helper.js"
if [[ -f "$COMPANION_HELPER_SRC" && -f "$installed_helper" ]]; then
  cp "$COMPANION_HELPER_SRC" "$installed_helper"
  echo "Patched helper.js with dynamic bucket support."
fi

# =============================================================================
# Install service
# =============================================================================

if ! id companion &>/dev/null; then
  useradd --system --no-create-home --shell /usr/sbin/nologin companion
  echo "Created system user: companion"
fi

data_dir="${env_vars[COMPANION_DATADIR]:-/mnt/uppy-server-data}"
mkdir -p "$data_dir"
chown companion:companion "$data_dir"

cp "$SERVICE_FILE" "${SYSTEMD_DIR}/companion.service"

if [[ "$data_dir" != "/mnt/uppy-server-data" ]]; then
  sed -i "s|ReadWritePaths=/mnt/uppy-server-data|ReadWritePaths=${data_dir}|" \
    "${SYSTEMD_DIR}/companion.service"
fi

systemctl daemon-reload
echo ""
echo "Systemd unit installed. Enable and start with:"
echo "  systemctl enable --now companion"
echo ""

# =============================================================================
# Output: web project environment variables
# =============================================================================

companion_domain="${env_vars[COMPANION_DOMAIN]:-localhost:${env_vars[COMPANION_PORT]:-3020}}"
companion_protocol="${env_vars[COMPANION_PROTOCOL]:-http}"
companion_url="${companion_protocol}://${companion_domain}"
companion_secret="${env_vars[COMPANION_SECRET]:-<auto-generated, check journalctl -u companion>}"

echo "==========================================="
echo " Set these in your web project environment:"
echo "==========================================="
echo ""
echo "  PUBLIC_COMPANION_URL=${companion_url}"
echo "  COMPANION_SECRET=${companion_secret}"
echo ""
echo "Provider callback URLs to register with OAuth apps:"
[[ -v "env_vars[COMPANION_DROPBOX_KEY]" ]] && \
  echo "  Dropbox:       ${companion_url}/dropbox/redirect"
[[ -v "env_vars[COMPANION_GOOGLE_KEY]" ]] && \
  echo "  Google Drive:  ${companion_url}/drive/redirect"
[[ -v "env_vars[COMPANION_ONEDRIVE_KEY]" ]] && \
  echo "  OneDrive:      ${companion_url}/onedrive/redirect"
echo ""
if [[ -z "${env_vars[COMPANION_SECRET]:-}" ]]; then
  echo "WARNING: No COMPANION_SECRET was set. Companion will auto-generate a"
  echo "random secret on each restart. Set COMPANION_SECRET in the env file"
  echo "and use the same value in your web project for stable auth tokens."
  echo ""
fi
