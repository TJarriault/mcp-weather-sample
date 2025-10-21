#!/bin/bash

# Permissions update script for MCP Weather Sample
# Usage: ./update-permissions.sh

set -e

# Colors for logs
GREEN='\033[0;32m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_info "Updating script permissions..."

# Main scripts
chmod +x deploy.sh

# Test scripts
find test/ -name "*.sh" -exec chmod +x {} \;

# Claude configuration scripts
find claude-configuration/ -name "*.sh" -exec chmod +x {} \;

log_info "Permissions updated:"
echo "✅ deploy.sh"
echo "✅ test/test-k8s-deployment.sh"
echo "✅ test/test_local_cities.sh"
echo "✅ test/test_search.sh"
echo "✅ test/start.sh"
echo "✅ claude-configuration/install_claude_config.sh"
echo "✅ claude-configuration/validate_claude_http.sh"

log_info "All scripts are now executable!"