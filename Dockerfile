FROM node:4.8.7

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080
EXPOSE 3001
CMD [ "npm", "run", "dev" ]
