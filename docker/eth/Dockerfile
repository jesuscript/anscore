FROM ubuntu:15.10

RUN apt-get update
RUN apt-get install -y git build-essential python-software-properties python-dev python-pip curl software-properties-common

RUN add-apt-repository -y "ppa:ethereum/ethereum"
RUN add-apt-repository -y "ppa:ethereum/ethereum-dev"
RUN apt-get update
RUN apt-get install -y eth

EXPOSE 30303/udp
EXPOSE 8545


