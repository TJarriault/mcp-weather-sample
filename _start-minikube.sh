minikube start
minikube addons enable metrics-server
minikube dashboard &

eval $(minikube docker-env)

# Configure Kubectl
#kubectl config use-context weather
kubectl config set-context --current --namespace=weather
