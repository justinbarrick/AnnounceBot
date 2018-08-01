#!/bin/bash

set -e

# wait for up to $1 seconds for some command to return true
function wait_for {
    set +x
    set +e

    max_tries=$1
    count=0
    ret=1


    while [ $count -lt $max_tries ] && [ $ret -ne 0 ]; do
        ${@:2}
        ret=$?
        sleep 1
        count=$(($count + 1))
    done

    set -e
    set -x

    return $ret
}

function logs {
  kubectl logs -n announcebot-test -f $(kubectl get pods -n announcebot-test -o go-template --template '{{range .items}}{{.metadata.name}}{{"\n"}}{{end}}')
}

IMAGE=justinbarrick/announcebot
TAG=test-$(date +%s)

docker build -t $IMAGE:$TAG .
docker push $IMAGE:$TAG
kubectl set image -n announcebot-test deployment/announcebot-test-announcebot announcebot=$IMAGE:$TAG

wait_for 30 logs
