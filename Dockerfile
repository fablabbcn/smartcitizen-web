FROM node:4.8.7

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN /usr/local/bin/npm -g install gulp

COPY . .

EXPOSE 8080
EXPOSE 3001
CMD [ "gulp","serve" ]
