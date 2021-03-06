FROM node:9.5.0-alpine

RUN apk update && apk add python make musl-dev gcc g++

WORKDIR /home/node/app
COPY package.json /home/node/app/package.json
RUN npm install

CMD npm start
COPY . /home/node/app/
RUN npm test
