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
curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.18.1/bin/linux/amd64/kubectl
chmod +x ./kubectl
mkdir -p ${HOME}/.local/bin/
export PATH="${HOME}/.local/bin/:$PATH"
mv ./kubectl ${HOME}/.local/bin/


# Store the new image in docker hub
docker build -t transloadit/companion:latest -t transloadit/companion:$TRAVIS_COMMIT -f packages/@uppy/companion/Dockerfile packages/@uppy/companion;
docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD";

if [[ -z "${TRAVIS_TAG}" ]]; then
  docker push transloadit/companion:$TRAVIS_COMMIT;
else
  docker push transloadit/companion:$TRAVIS_TAG;
fi

docker push transloadit/companion:latest;


echo "Create directory..."
mkdir ${HOME}/.kube
echo "Writing KUBECONFIG to file..."
echo $KUBECONFIGVAR | python -m base64 -d > ${HOME}/.kube/config
echo "KUBECONFIG file written"

sleep 10s # This cost me some precious debugging time.
kubectl set image statefulset companion --namespace=companion companion=docker.io/transloadit/companion:$TRAVIS_COMMIT
sleep 10s

kubectl get pods --namespace=companion
kubectl get service --namespace=companion
kubectl get deployment --namespace=companion

function cleanup {
    printf "Cleaning up...\n"
    rm -vf ${HOME}/.kube/config
    printf "Cleaning done."
}

trap cleanup EXIT