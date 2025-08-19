FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN ["npm", "install" ]

COPY . .

EXPOSE 8080

RUN [ "npm", "run", "build:app" ]

# CMD [ "npm", "run", "docker:launch:tracing" ]

CMD [ "npm", "run", "docker:launch:app" ]
