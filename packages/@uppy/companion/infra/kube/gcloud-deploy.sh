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
curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
chmod +x ./kubectl
mkdir ${HOME}/.local/bin/
export PATH="${HOME}/.local/bin/:$PATH"
mv ./kubectl ${HOME}/.local/bin/


# Store the new image in docker hub
docker build -t kiloreux/uppy-companion:latest -t kiloreux/uppy-companion:$TRAVIS_COMMIT -f packages/@uppy/companion/Dockerfile packages/@uppy/companion;
docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD";
docker push kiloreux/uppy-companion:$TRAVIS_COMMIT;
docker push kiloreux/uppy-companion:latest;


echo "base64 testing..."
echo $TRAVIS|base64 --decode -i
echo "Create directory..."
mkdir ${HOME}/.kube
echo "Writing KUBECONFIG to file..."
echo $KUBECONFIG | base64 --decode -i > ${HOME}/.kube/config

# Should be already removed. Using it temporarily.
rm -f "${__kube}/companion/companion-env.yaml"
echo "Writing COMPANION_ENV to file..."
echo $COMPANION_ENV | base64 --decode > "${__kube}/companion/companion-env.yaml"

kubectl apply -f "${__kube}/companion/companion-env.yaml"
sleep 10s # This cost me some precious debugging time.
kubectl apply -f "${__kube}/companion/companion-kube.yaml"
kubectl apply -f "${__kube}/companion/companion-redis.yaml"
kubectl set image statefulset companion --namespace=uppy companion=docker.io/kiloreux/uppy-companion:$TRAVIS_COMMIT
sleep 10s

kubectl get pods --namespace=uppy
kubectl get service --namespace=uppy
kubectl get deployment --namespace=uppy

function cleanup {
    printf "Cleaning up...\n"
    rm -vf "${__kube}/companion/companion-env.yaml"
    printf "Cleaning done."
}

trap cleanup EXIT