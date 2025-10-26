#!/bin/bash
source /home/ec2-user/speedmatch-config.sh
cd /home/ec2-user/speedmatch/container/dev
sudo docker-compose build
sudo docker-compose up -d