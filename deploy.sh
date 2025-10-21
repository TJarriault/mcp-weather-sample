#!/bin/bash

# Build and deployment script for MCP Weather Sample
# Usage: ./deploy.sh [build|deploy|all]

set -e

# Colors for logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="mcp-weather-sample"
IMAGE_TAG="latest"
NAMESPACE="default"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to build Docker image
build_image() {
    log_info "Building Docker image..."
    
    # Check that Dockerfile exists
    if [[ ! -f "Dockerfile" ]]; then
        log_error "Dockerfile not found in current directory"
        exit 1
    fi
    
    # Build the image
    docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .
    
    if [[ $? -eq 0 ]]; then
        log_info "Image built successfully: ${IMAGE_NAME}:${IMAGE_TAG}"
    else
        log_error "Failed to build image"
        exit 1
    fi
}

# Function to deploy to Kubernetes
deploy_to_k8s() {
    log_info "Deploying to Kubernetes..."
    
    # Check that kubectl is available
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check that cluster is accessible
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Unable to connect to Kubernetes cluster"
        exit 1
    fi
    
    # Apply Kubernetes manifests
    if [[ -f "k8s-all-in-one.yaml" ]]; then
        log_info "Applying k8s-all-in-one.yaml manifest..."
        kubectl apply -f k8s-all-in-one.yaml
    elif [[ -d "k8s" ]]; then
        log_info "Applying manifests from k8s/ directory..."
        kubectl apply -f k8s/
    else
        log_error "No Kubernetes manifests found"
        exit 1
    fi
    
    # Wait for deployment to be ready
    log_info "Waiting for deployment to be available..."
    kubectl rollout status deployment/mcp-weather-app --timeout=300s
    
    if [[ $? -eq 0 ]]; then
        log_info "Deployment successful!"
        
        # Display service information
        log_info "Service information:"
        kubectl get services mcp-weather-service
        
        log_info "Pod information:"
        kubectl get pods -l app=mcp-weather-app
        
        # Instructions to access the service
        echo ""
        log_info "To access the service locally:"
        echo "kubectl port-forward service/mcp-weather-service 8080:80"
        echo "Then open: http://localhost:8080/health"
        echo ""
        log_info "To test the deployment:"
        echo "./test/test-k8s-deployment.sh"
        
    else
        log_error "Deployment failed"
        exit 1
    fi
}

# Function to cleanup deployment
cleanup() {
    log_info "Cleaning up deployment..."
    
    if [[ -f "k8s-all-in-one.yaml" ]]; then
        kubectl delete -f k8s-all-in-one.yaml --ignore-not-found=true
    elif [[ -d "k8s" ]]; then
        kubectl delete -f k8s/ --ignore-not-found=true
    fi
    
    log_info "Cleanup completed"
}

# Function to display help
show_help() {
    echo "Usage: $0 [build|deploy|all|cleanup|help]"
    echo ""
    echo "Commands:"
    echo "  build     - Build Docker image"
    echo "  deploy    - Deploy to Kubernetes"
    echo "  all       - Build and deploy"
    echo "  cleanup   - Remove deployment"
    echo "  help      - Display this help"
    echo ""
    echo "Environment variables:"
    echo "  IMAGE_NAME  - Image name (default: mcp-weather-sample)"
    echo "  IMAGE_TAG   - Image tag (default: latest)"
    echo "  NAMESPACE   - Kubernetes namespace (default: default)"
}

# Argument processing
case "${1:-all}" in
    "build")
        build_image
        ;;
    "deploy")
        deploy_to_k8s
        ;;
    "all")
        build_image
        deploy_to_k8s
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac

log_info "Script completed successfully!"