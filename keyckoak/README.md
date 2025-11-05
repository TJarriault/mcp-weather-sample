
```sh
cd keycloak
wget -q -O - https://raw.githubusercontent.com/keycloak/keycloak-quickstarts/refs/heads/main/kubernetes/keycloak-ingress.yaml | \
sed "s/KEYCLOAK_HOST/keycloak.$(minikube ip).nip.io/" | \
kubectl create -f -
```


# Ref documentation : https://modelcontextprotocol.io/docs/tutorials/security/authorization#python

# Forward
kubectl port-forward svc/keycloak -n keycloak 8443:8443
# Access
http://localhost:8443/
