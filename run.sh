#!/bin/bash

sudo docker compose down -v

sudo docker compose up -d --build & 

PID=$!

wait $PID

sudo docker exec agrivision_backend python3 init_db.py

sudo docker exec agrivision_backend python3 seed.py