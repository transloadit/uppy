#!/usr/bin/env bash
set -o pipefail
set -o errexit
set -o nounset
# set -o xtrace

# Set magic variables for current FILE & DIR
__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
__kube="${__dir}"

# Store the new image in docker hub
docker build --quiet -t transloadit/uppy-server:latest -t transloadit/uppy-server:$TRAVIS_COMMIT .;
docker login -u="$DOCKER_USERNAME" -p="$DOCKER_PASSWORD";
docker push transloadit/uppy-server:$TRAVIS_COMMIT;
docker push transloadit/uppy-server:latest;

echo $CA_CRT | base64 --decode -i > ${HOME}/ca.crt

gcloud config set container/use_client_certificate True
export CLOUDSDK_CONTAINER_USE_CLIENT_CERTIFICATE=True

kubectl config set-cluster transloadit-gke-cluster --embed-certs=true --server=${CLUSTER_ENDPOINT} --certificate-authority=${HOME}/ca.crt
kubectl config set-credentials travis-uppy --token=$SA_TOKEN
kubectl config set-context travis --cluster=$CLUSTER_NAME --user=travis-uppy --namespace=uppy
kubectl config use-context travis
# Should be already removed. Using it temporarily.
rm -f "${__kube}/uppy-server/uppy-env.yaml"
echo $UPPY_ENV | base64 --decode > "${__kube}/uppy-server/uppy-env.yaml"

kubectl config current-context

kubectl apply -f "${__kube}/uppy-server/uppy-env.yaml"
sleep 10s # This cost me some precious debugging time.
kubectl apply -f "${__kube}/uppy-server/uppy-server-kube.yaml"
kubectl apply -f "${__kube}/uppy-server/uppy-server-redis.yaml"
kubectl set image statefulset uppy-server --namespace=uppy uppy-server=docker.io/transloadit/uppy-server:$TRAVIS_COMMIT
sleep 10s

kubectl get pods --namespace=uppy
kubectl get service --namespace=uppy
kubectl get deployment --namespace=uppy

function cleanup {
    printf "Cleaning up...\n"
    rm -vf "${__kube}/uppy-server/uppy-env.yaml"
    printf "Cleaning done."
}

trap cleanup EXIT