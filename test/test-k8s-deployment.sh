#!/bin/bash

# Test script for MCP Weather Sample deployed on Kubernetes
# Usage: ./test-k8s-deployment.sh [local|ingress] [host]

set -e

# Configuration
DEFAULT_HOST="localhost:8080"
TIMEOUT=5

# Colors for logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to test health check
test_health_check() {
    local host=$1
    log_info "Testing health check on http://${host}/health"
    
    local response
    response=$(curl -s -w "%{http_code}" --max-time $TIMEOUT "http://${host}/health" 2>/dev/null)
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [[ "$http_code" == "200" ]]; then
        log_success "Health check OK (HTTP $http_code)"
        echo "Response: $body"
        return 0
    else
        log_error "Health check failed (HTTP $http_code)"
        echo "Response: $body"
        return 1
    fi
}

# Function to test MCP endpoint
test_mcp_endpoint() {
    local host=$1
    log_info "Testing MCP endpoint on http://${host}/mcp"
    
    local payload='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'
    
    local response
    response=$(curl -s -w "%{http_code}" --max-time $TIMEOUT \
        -X POST "http://${host}/mcp" \
        -H "Content-Type: application/json" \
        -d "$payload" 2>/dev/null)
    
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [[ "$http_code" == "200" ]]; then
        log_success "MCP endpoint OK (HTTP $http_code)"
        echo "Response: $body" | head -c 200
        echo "..."
        return 0
    else
        log_error "MCP endpoint failed (HTTP $http_code)"
        echo "Response: $body"
        return 1
    fi
}

# Function to check pod status
check_pods_status() {
    log_info "Checking pod status..."
    
    if ! command -v kubectl &> /dev/null; then
        log_warn "kubectl not available, cannot check pods"
        return 0
    fi
    
    local pods
    pods=$(kubectl get pods -l app=mcp-weather-app --no-headers 2>/dev/null)
    
    if [[ -z "$pods" ]]; then
        log_error "No pods found with label app=mcp-weather-app"
        return 1
    fi
    
    echo "$pods"
    
    local ready_pods
    ready_pods=$(echo "$pods" | grep "1/1" | wc -l)
    local total_pods
    total_pods=$(echo "$pods" | wc -l)
    
    if [[ "$ready_pods" -eq "$total_pods" ]]; then
        log_success "All pods are ready ($ready_pods/$total_pods)"
        return 0
    else
        log_warn "Ready pods: $ready_pods/$total_pods"
        return 1
    fi
}

# Function to check service status
check_service_status() {
    log_info "Checking service status..."
    
    if ! command -v kubectl &> /dev/null; then
        log_warn "kubectl not available, cannot check service"
        return 0
    fi
    
    local service
    service=$(kubectl get service mcp-weather-service --no-headers 2>/dev/null)
    
    if [[ -z "$service" ]]; then
        log_error "Service mcp-weather-service not found"
        return 1
    fi
    
    echo "$service"
    log_success "Service available"
    return 0
}

# Function to setup port-forward if needed
setup_port_forward() {
    log_info "Setting up port-forward..."
    
    # Check if port is already listening
    if netstat -tuln 2>/dev/null | grep -q ":8080 "; then
        log_info "Port 8080 already listening, assuming port-forward is active"
        return 0
    fi
    
    # Start port-forward in background
    kubectl port-forward service/mcp-weather-service 8080:80 &
    local pf_pid=$!
    
    # Wait for port-forward to be ready
    sleep 3
    
    if kill -0 $pf_pid 2>/dev/null; then
        log_success "Port-forward active (PID: $pf_pid)"
        echo $pf_pid > /tmp/mcp-test-portforward.pid
        return 0
    else
        log_error "Port-forward failed"
        return 1
    fi
}

# Function to cleanup port-forward
cleanup_port_forward() {
    if [[ -f "/tmp/mcp-test-portforward.pid" ]]; then
        local pf_pid
        pf_pid=$(cat /tmp/mcp-test-portforward.pid)
        if kill -0 $pf_pid 2>/dev/null; then
            log_info "Stopping port-forward (PID: $pf_pid)"
            kill $pf_pid
        fi
        rm -f /tmp/mcp-test-portforward.pid
    fi
}

# Main test function
run_tests() {
    local host=$1
    local test_mode=$2
    
    echo "======================================="
    echo "MCP Weather Sample Deployment Test"
    echo "======================================="
    echo "Host: $host"
    echo "Mode: $test_mode"
    echo ""
    
    local tests_passed=0
    local total_tests=0
    
    # Test 1: Pod status
    if [[ "$test_mode" == "local" ]]; then
        ((total_tests++))
        if check_pods_status; then
            ((tests_passed++))
        fi
        echo ""
    fi
    
    # Test 2: Service status
    if [[ "$test_mode" == "local" ]]; then
        ((total_tests++))
        if check_service_status; then
            ((tests_passed++))
        fi
        echo ""
    fi
    
    # Test 3: Health check
    ((total_tests++))
    if test_health_check "$host"; then
        ((tests_passed++))
    fi
    echo ""
    
    # Test 4: MCP endpoint
    ((total_tests++))
    if test_mcp_endpoint "$host"; then
        ((tests_passed++))
    fi
    echo ""
    
    # Results
    echo "======================================="
    if [[ $tests_passed -eq $total_tests ]]; then
        log_success "All tests passed ($tests_passed/$total_tests)"
        echo "✅ Application is deployed and working correctly!"
        return 0
    else
        log_error "Some tests failed ($tests_passed/$total_tests)"
        echo "❌ Issues detected in deployment"
        return 1
    fi
}

# Function to display help
show_help() {
    echo "Usage: $0 [local|ingress] [host]"
    echo ""
    echo "Modes:"
    echo "  local    - Test via port-forward (default)"
    echo "  ingress  - Test via ingress/LoadBalancer"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Local test with port-forward"
    echo "  $0 local                              # Local test with port-forward"
    echo "  $0 ingress mcp-weather.example.com    # Test via ingress"
    echo "  $0 ingress 192.168.1.100:8080         # Test via IP:port"
}

# Argument processing
TEST_MODE="${1:-local}"
HOST="${2:-$DEFAULT_HOST}"

case "$TEST_MODE" in
    "local")
        # For local mode, setup port-forward if needed
        if ! netstat -tuln 2>/dev/null | grep -q ":8080 "; then
            if ! setup_port_forward; then
                log_error "Unable to setup port-forward"
                exit 1
            fi
            # Add trap to cleanup on exit
            trap cleanup_port_forward EXIT
        fi
        HOST="localhost:8080"
        ;;
    "ingress")
        if [[ -z "$2" ]]; then
            log_error "Host required for ingress mode"
            show_help
            exit 1
        fi
        ;;
    "help"|"-h"|"--help")
        show_help
        exit 0
        ;;
    *)
        log_error "Unknown mode: $TEST_MODE"
        show_help
        exit 1
        ;;
esac

# Execute tests
run_tests "$HOST" "$TEST_MODE"