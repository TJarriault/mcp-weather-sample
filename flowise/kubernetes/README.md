retrieve IP from your minikube : $(minikube ip)
replace IP on flowise-ingress

```shell
MINIP=`minikube ip`
```

REPLACE IP ON INGRESS file
```shell
sed -i "s/CHANGEME/$MINIP/g" ingress-flowise.yaml
```
