FROM node:20-bookworm

RUN apt update && \
  apt install npm -y

WORKDIR /app
