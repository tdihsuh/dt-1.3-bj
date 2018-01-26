#!/bin/sh
ENV=$1
VERSION=$2

if [[ $VERSION == '' ]]; then
  VERSION=$RANDOM
fi

echo $ENV
echo $VERSION

docker build -t heimaocha-backend:$VERSION -f DockerFile ./

if [[ $(docker ps -a | grep heimaocha-backend) != '' ]]; then
  docker rm -f $(docker ps -a | grep heimaocha-backend)
fi

docker run  -d -P --name heimaocha-backend-$VERSION heimaocha-backend:$VERSION pm2-docker start ecosystem.alipay_config.js --env $ENV
