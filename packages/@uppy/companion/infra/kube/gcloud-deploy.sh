#!/usr/bin/env bash
set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

# Set magic variables for current FILE & DIR
__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__kube="${__dir}"
__companion="$(dirname "$(dirname "${__kube}")")"
# Install kubectl
curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.11.2/bin/linux/amd64/kubectl
chmod +x ./kubectl
mkdir -p ${HOME}/.local/bin/
export PATH="${HOME}/.local/bin/:$PATH"
mv ./kubectl ${HOME}/.local/bin/


# Store the new image in docker hub
docker build -t transloadit/companion:latest -t transloadit/companion:$TRAVIS_COMMIT -f packages/@uppy/companion/Dockerfile packages/@uppy/companion;
docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD";
docker push transloadit/companion:$TRAVIS_COMMIT;
docker push transloadit/companion:latest;


echo "Create directory..."
mkdir ${HOME}/.kube
echo "Writing KUBECONFIG to file..."
echo $KUBECONFIGVAR | base64 --decode -i > ${HOME}/.kube/config
echo "KUBECONFIG file written"

sleep 10s # This cost me some precious debugging time.
kubectl apply -f "${__kube}/companion/companion-kube.yaml"
kubectl apply -f "${__kube}/companion/companion-redis.yaml"
kubectl set image statefulset companion --namespace=uppy companion=docker.io/transloadit/companion:$TRAVIS_COMMIT
sleep 10s

kubectl get pods --namespace=uppy
kubectl get service --namespace=uppy
kubectl get deployment --namespace=uppy

function cleanup {
    printf "Cleaning up...\n"
    rm -vf ${HOME}/.kube/config
    printf "Cleaning done."
}

trap cleanup EXIT