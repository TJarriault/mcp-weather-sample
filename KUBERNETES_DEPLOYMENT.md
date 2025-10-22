# Kubernetes Deployment - MCP Weather Sample

This guide explains how to containerize and deploy the MCP Weather Sample application on a Kubernetes cluster.

## Prerequisites

- Docker installed and functional
- kubectl configured to access your Kubernetes cluster
- A Kubernetes cluster available (local or remote)
- Nginx Ingress Controller installed (for ingress)

## File Structure

```
├── Dockerfile                 # Optimized multi-stage Docker image
├── .dockerignore             # Files to exclude from Docker build
├── build-deploy-container.sh                 # Automated build and deployment script
├── k8s-all-in-one.yaml      # Complete Kubernetes manifest
└── k8s/                      # Separate Kubernetes manifests
    ├── configmap.yaml        # Application configuration
    ├── deployment.yaml       # Deployment with 3 replicas
    ├── service.yaml          # ClusterIP service
    └── ingress.yaml          # Ingress for external exposure
```

## Application Configuration

The application is configured for:
- **Listening Port**: 8080 (configurable via ENV PORT)
- **Available Endpoints**:
  - `/health` - Health check
  - `/mcp` - Main MCP endpoint
- **Replicas**: 3 instances by default
- **Resources**:
  - Requests: 100m CPU, 128Mi RAM
  - Limits: 500m CPU, 512Mi RAM

## Quick Deployment

### Option 1: Automated Script (recommended)

#### Requirement
For minikube Deploy a local registry
```bash
docker run -d -p 5000:5000 --name registry registry:2
```

#### Build & Deploy
```bash
# Complete build and deployment
./build-deploy-container.sh all

# Or separately
./build-deploy-container.sh build
./build-deploy-container.sh deploy
```

### Option 2: Manual Commands

```bash
# 1. Build Docker image
docker build -t mcp-weather-sample:latest .

# 2. Deploy to Kubernetes
kubectl apply -f k8s-all-in-one.yaml

# 3. Verify deployment
kubectl rollout status deployment/mcp-weather-app
```

## Accessing the Application

### Local (port-forward)
```bash
kubectl port-forward service/mcp-weather-service 8080:80
```
Then access: <http://localhost:8080/health>

### Via Ingress (with domain)

1. Modify the host in `k8s/ingress.yaml` or `k8s-all-in-one.yaml`
2. Configure your DNS to point to your ingress IP  
3. Access via: <http://your-domain.com/health>

## Deployment Verification

```bash
# Pod status
kubectl get pods -l app=mcp-weather-app

# Pod logs
kubectl logs -l app=mcp-weather-app -f

# Service status
kubectl get service mcp-weather-service

# Ingress status
kubectl get ingress mcp-weather-ingress
```

## Functionality Tests

```bash
# Test health check
curl http://localhost:8080/health

# Test MCP endpoint (requires session)
curl -X POST http://localhost:8080/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'
```

## Cleanup

```bash
# Via script
./build-deploy-container.sh cleanup

# Or manually
kubectl delete -f k8s/.
```

## Customization

### Environment Variables

Modify the ConfigMap in `k8s/configmap.yaml`:

```yaml
data:
  NODE_ENV: "production"
  PORT: "8080"
  LOG_LEVEL: "info"
```

### Scaling

```bash
# Adjust number of replicas
kubectl scale deployment mcp-weather-app --replicas=5
```

### Resources

Modify limits in `k8s/deployment.yaml` according to your needs:

```yaml
resources:
  requests:
    memory: "256Mi"  # Increase if necessary
    cpu: "200m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

## Monitoring and Health Checks

The application includes Kubernetes probes:

- **Startup Probe**: Verifies initial startup (30 attempts)
- **Liveness Probe**: Checks if app is alive (restarts on failure)
- **Readiness Probe**: Checks if app is ready to receive traffic

## Security

- Image uses a non-root user
- Development dependencies are excluded from final image
- Multi-stage build to minimize attack surface
- Integrated health check for monitoring

## Troubleshooting

### Pod won't start

```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

### Service inaccessible

```bash
kubectl describe service mcp-weather-service
kubectl get endpoints mcp-weather-service
```

### Ingress not working

```bash
kubectl describe ingress mcp-weather-ingress
kubectl get ingress
```
