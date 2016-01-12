FROM ubuntu:14.04

RUN apt-get update
RUN apt-get install -y git build-essential python-software-properties python-dev python-pip curl software-properties-common

RUN add-apt-repository -y "ppa:ethereum/ethereum"
RUN add-apt-repository -y "ppa:ethereum/ethereum-dev"
RUN apt-get update
RUN apt-get install -y flu
RUN mkdir -p /flu

EXPOSE 40404/udp
EXPOSE 40404
EXPOSE 8545
