#!/bin/bash
cd /home/ec2-user/speedmatch/container/dev
sudo docker-compose build --env-file /home/ec2-user/speedmatch-config.env
sudo docker-compose up --env-file /home/ec2-user/speedmatch-config.env -d