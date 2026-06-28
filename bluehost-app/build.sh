#!/bin/bash
# =============================================================================
# QMS Pharma - Bluehost Unified Build Script
# =============================================================================
# Syncs source files from all 7 MFEs into a single Angular app,
# then builds for production deployment on Bluehost.
#
# Usage:
#   ./build.sh          # Full sync + build
#   ./build.sh sync     # Sync sources only (no build)
#   ./build.sh build    # Build only (skip sync)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
APP_SRC="$SCRIPT_DIR/src/app"

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[SYNC]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }

# ---------------------------------------------------------------------------
# sync_module: rsync a module's source into the unified app
# $1 = source MFE directory name (e.g., "capa-mfe")
# $2 = source subdirectory under src/app/ (e.g., "capa")
# $3 = destination subdirectory under bluehost-app/src/app/ (e.g., "capa")
# ---------------------------------------------------------------------------
sync_module() {
  local mfe_dir="$1"
  local src_subdir="$2"
  local dest_subdir="$3"
  local src_path="$PROJECT_ROOT/$mfe_dir/src/app/$src_subdir"

  if [ ! -d "$src_path" ]; then
    warn "Source not found: $src_path — skipping"
    return
  fi

  mkdir -p "$APP_SRC/$dest_subdir"
  rsync -a --delete \
    --exclude='*.spec.ts' \
    --exclude='node_modules' \
    "$src_path/" "$APP_SRC/$dest_subdir/"
  log "Synced $mfe_dir/$src_subdir → $dest_subdir"
}

# ---------------------------------------------------------------------------
# sync_shell: rsync shell-app components (auth, admin, tools, etc.)
# $1 = subdirectory under shell-app/src/app/
# ---------------------------------------------------------------------------
sync_shell() {
  local subdir="$1"
  local src_path="$PROJECT_ROOT/shell-app/src/app/$subdir"

  if [ ! -d "$src_path" ]; then
    warn "Shell source not found: $src_path — skipping"
    return
  fi

  mkdir -p "$APP_SRC/$subdir"
  rsync -a --delete \
    --exclude='*.spec.ts' \
    --exclude='node_modules' \
    "$src_path/" "$APP_SRC/$subdir/"
  log "Synced shell-app/$subdir"
}

# ---------------------------------------------------------------------------
# do_sync: Synchronize all sources
# ---------------------------------------------------------------------------
do_sync() {
  info "Syncing sources from all MFEs into unified app..."
  echo ""

  # ── Shell-app shared components ──
  log "=== Shell App (shared services & components) ==="
  sync_shell "auth"
  sync_shell "admin"
  sync_shell "profile"
  sync_shell "tasks"
  sync_shell "tools"
  sync_shell "pages"
  sync_shell "notifications"

  # Copy shell-app's app.component.ts (the main layout)
  if [ -f "$PROJECT_ROOT/shell-app/src/app/app.component.ts" ]; then
    cp "$PROJECT_ROOT/shell-app/src/app/app.component.ts" "$APP_SRC/app.component.ts"
    log "Synced shell-app/app.component.ts"
  fi

  echo ""
  log "=== Individual MFE Modules ==="

  # ── CAPA MFE ──
  sync_module "capa-mfe" "capa" "capa"

  # ── Deviation MFE ──
  sync_module "deviation-mfe" "deviation" "deviation"

  # ── Change Control MFE ──
  sync_module "change-control-mfe" "change-control" "change-control"

  # ── Document MFE ──
  sync_module "document-mfe" "document" "document"

  # ── Training MFE ──
  sync_module "training-mfe" "training" "training"

  echo ""
  log "=== QMS Core MFE (bundled modules) ==="

  # ── QMS Core MFE shared services ──
  sync_module "qms-core-mfe" "shared" "shared"

  # ── QMS Core MFE (6 modules) ──
  sync_module "qms-core-mfe" "risk" "risk"
  sync_module "qms-core-mfe" "audit" "audit"
  sync_module "qms-core-mfe" "supplier" "supplier"
  sync_module "qms-core-mfe" "complaint" "complaint"
  sync_module "qms-core-mfe" "nonconformance" "nonconformance"
  sync_module "qms-core-mfe" "equipment" "equipment"

  echo ""
  # Copy favicon if missing
  if [ ! -f "$SCRIPT_DIR/src/favicon.ico" ] && [ -f "$PROJECT_ROOT/shell-app/src/favicon.ico" ]; then
    cp "$PROJECT_ROOT/shell-app/src/favicon.ico" "$SCRIPT_DIR/src/favicon.ico"
    log "Copied favicon.ico"
  fi

  info "Source sync complete!"
}

# ---------------------------------------------------------------------------
# do_build: Install deps and build for production
# ---------------------------------------------------------------------------
do_build() {
  info "Installing dependencies..."
  cd "$SCRIPT_DIR"
  npm install

  info "Building for production..."
  npx ng build --configuration production

  # Copy .htaccess to dist output (in case angular.json asset copy didn't work)
  if [ -f "$SCRIPT_DIR/src/.htaccess" ]; then
    # Find the browser output directory
    local dist_dir="$SCRIPT_DIR/dist/qms-pharma/browser"
    if [ ! -d "$dist_dir" ]; then
      dist_dir="$SCRIPT_DIR/dist/qms-pharma"
    fi
    if [ -d "$dist_dir" ]; then
      cp "$SCRIPT_DIR/src/.htaccess" "$dist_dir/.htaccess"
      log "Copied .htaccess to dist"
    fi
  fi

  echo ""
  info "========================================"
  info "  Build complete!"
  info "========================================"
  info ""
  info "Deploy contents of: dist/qms-pharma/browser/"
  info "Upload all files to your Bluehost public_html directory."
  info ""
  info "Before deploying, update the API URL in:"
  info "  src/environments/environment.prod.ts"
  info "  → Set apiBaseUrl to your GCP backend URL"
  info ""
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
case "${1:-}" in
  sync)
    do_sync
    ;;
  build)
    do_build
    ;;
  *)
    do_sync
    echo ""
    do_build
    ;;
esac
