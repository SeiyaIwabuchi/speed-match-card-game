#!/bin/bash
cd /home/ec2-user/speedmatch/container/dev
sudo docker-compose --env-file /home/ec2-user/speedmatch-config.env build
sudo docker-compose --env-file /home/ec2-user/speedmatch-config.env up -d