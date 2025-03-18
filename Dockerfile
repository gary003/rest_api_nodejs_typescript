FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN ["npm", "install"]

COPY . .

EXPOSE 8080

RUN ["npm", "run", "build"]

CMD [ "npm", "run", "docker:launch"]

# CMD [ "npm", "run", "docker:launch:dev"]
