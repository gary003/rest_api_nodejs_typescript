# REST API nodejs - typescript

## Skills

- Languages: **Typescript**, Markdown, JSON
- **Clean architecture** (onion architecture)
- CI/CD pipeline with **Github actions** && **Docker**
  - docker-compose.yaml
  - Dockerfile
  - Test, build docker image, deploy docker image to **Docker hub**
- Testing using **Sinon.js** and **Mocha**
  - Mocks
  - Coverage
  - Unit tests
  - Integration tests with **Testcontainers** and **Supertest**
- Persistence with **Typeorm**
  - Entities handling
  - Table join
  - Table lock
  - Transactions (rollback and commit)
- Observability **Opentelemetry**
  - Logs with **Promtail** && **Loki**
  - Metrics with **Prometheus**
  - Traces with **Tempo**
  - Dashboard with **Grafana**
- Streams
  - Pipeline handling
  - Transformation
  - Async generators
- Documentation with **Swagger**
- Logging with **Winston**
- Validation using **Zod**

## Description

This repository is a backend rest api portfolio that has a few routes (CRUD) aiming to keep at-hand backend development techniques and show off dev skills.
To make things easier for github users, there in no need for a .env, easier to test and deploy for external users who want to try it.

## Prerequisites

- Having git installed

- Having npm(v6+) & npx installed

- Having docker(v27+) installed

  !! A docker group must be created, then your user(as a sudoer) musty be added to it.
  Otherwise you'll have trouble launching the tests !!

  Link to install and configure docker properly : https://medium.com/devops-technical-notes-and-manuals/how-to-run-docker-commands-without-sudo-28019814198f

  Don't forgot to restart your computer or session for the changes to be available on all shells

## Git Installation

- Clone the project

  `git clone https://github.com/gary003/rest_api_nodejs_typescript.git`

- Go into the project directory

  `cd rest_api_nodejs_typescript`

- Install the dependences

  `npm install`

## Start API

- Launch the app & DB (mysql)

  In a shell, at the root directory of the project, type

  `npm run start` or `docker compose up`

- OpenAPI (swagger)

  Copy this url in a browser (adapt the port if needed)

  `localhost:8080`

## Tests + Coverage

- Launch global tests

  `npm run test`

## Developer

- Gary Johnson
  - Mail: gary.johnson.top@gmail.com
  - Github: https://github.com/gary003
  - LinkedIn: https://www.linkedin.com/in/gary-johnson-0168b985/

## License

[MIT]
