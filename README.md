# Backend REST API nodejs/typescript

## Skills description

- Clean architecture (onion architecture)
- Testing using sinon.js and mocha
  - Mocks
  - Coverage
  - Unit tests
  - Functional tests with testcontainers and supertest
- Persistance with typeorm
  - Entities handling
  - Table join
  - Table lock
  - Transaction (rollback and commit)
- Streams
  - Pipeline handling
  - Transformation
  - Async generators
- Documentation with Swagger
- Docker
  - Docker-compose
  - Dockerfile
- Logging with Winston
- Validation using Zod
- Typescript

## Prerequisites

- Having docker(v27+) & docker-compose(v2.20) installed

  !! If your user is not in the sudoers group, you might get some troubles launching the tests !!

- No .env needed . Since this is a portfolio, no .env was created

## Git Installation

- Clone the project
  `git clone https://github.com/gary003/rest_api_nodejs_typescript.git`

- Go into the project directory
  `cd rest_api_nodejs_typescript`

- Install the dependences
  `npm install`

## Start API

- Launch the app & DB (mysql)
  `docker-compose up`

- OpenAPI (swagger)
  Copy this url in a browser (adapt the port if needed)
  `localhost:8080/apiDoc`

## Tests + Coverage

- Launch global tests
  `npm run test`

## Developer

- Gary Johnson <gary.johnson.freelance@gmail.com>

## License

    [MIT]
