kubectl apply -f keycloak.yaml


https://modelcontextprotocol.io/docs/tutorials/security/authorization#python

# Forward
kubectl port-forward svc/keycloak -n keycloak 8443:8443
# Access
http://localhost:8443/
