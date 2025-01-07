require('dotenv').config()
import chai from 'chai'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import app from '../../../../../../src/app'
import { DockerComposeEnvironment, StartedDockerComposeEnvironment, Wait } from 'testcontainers'
import request from 'supertest'
// import logger from '../../../../../../src/v1/helpers/logger'

describe('Functional tests for user', () => {
  let environment: StartedDockerComposeEnvironment

  const original_uri = process.env.DB_URI

  const testUserId: string = 'cc2c990b6-029c-11ed-b939-0242ac12002'
  const urlBase: string = 'api/v1'

  before(async () => {
    const composeFilePath = '.'
    const composeFile = 'docker-compose.yaml'

    process.env.TESTCONTAINERS_LOCKDIR = './src/v1/inrastrusture/docker'

    // logger.info("starting test env for user (db) from docker-compose")

    try {
      environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
        .withWaitStrategy('app-1', Wait.forLogMessage('app running on'))
        .withWaitStrategy('db-1', Wait.forLogMessage('ready for connections')) // Common MySQL ready message
        .up(['app', 'db'])
    } catch (error) {
      chai.assert.fail(`Error the container test environment set-up failed - ${error}`)
    }

    // logger.info("Docker Compose test environment started for functional tests on user/")

    const dbContainer = environment.getContainer('db-1')

    const dbPort = Number(process.env.DB_PORT) || 3306

    // Using MySQL protocol and default MySQL port
    const dbUri = `${process.env.DB_DRIVER}://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${dbContainer.getHost()}:${dbContainer.getMappedPort(dbPort)}/${process.env.DB_DATABASE_NAME}`

    process.env.DB_URI = dbUri

    // Add a small delay to ensure DB is really ready
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // logger.info(`uri: ${dbUri}`)
  })

  after(async () => {
    await environment.down()

    // Cancel the modification of the env variable
    process.env.DB_URI = original_uri

    // logger.info("Docker Compose test environment stopped for functional tests on user/.")

    return true
  })

  describe('src > v1 > application > route > user > GET (getting all the users)', () => {
    it('Should get all users from DB', async () => {
      const response = await request(app).get(`/${urlBase}/user/`).set('Accept', 'application/json').expect('Content-Type', /json/)

      const body = JSON.parse(response.text)

      expect(body.data).to.be.an('array')
      expect(body.data).length.above(0)
    })
  })

  describe('src > v1 > application > route > user > POST (adding a new user)', () => {
    it('should add a new user', async () => {
      const newUser = {
        userId: testUserId,
        firstname: 'test_Rosita',
        lastname: 'test_Espinosa'
      }

      const response = await request(app).post(`/${urlBase}/user/`).send(newUser).set('Accept', 'application/json').expect('Content-Type', /json/)

      const body = JSON.parse(response.text)

      // logger.debug(JSON.stringify(body))

      expect(body.data).to.not.be.empty
      expect(body.data.userId).to.equal(testUserId)
    })
  })

  describe('src > v1 > application > route > user > GET (single user)', () => {
    it('should return a single user', async () => {
      const response = await request(app).get(`/${urlBase}/user/${testUserId}`).set('Accept', 'application/json').expect('Content-Type', /json/)

      const body = JSON.parse(response.text)

      expect(body.data).to.have.property('userId')
    })
    it('should fail returning a single user ( wrong parameter in route )', async () => {
      const wrongUserId = 123

      const response = await request(app).get(`/${urlBase}/user/${wrongUserId}`).set('Accept', 'application/json').expect('Content-Type', /json/)

      const body = JSON.parse(response.text)

      expect(body).to.have.property('errorParamUserId')
    })
  })

  describe('src > v1 > application > route > user > DELETE', () => {
    it('should delete a specified user', async () => {
      const response = await request(app).get(`/${urlBase}/user/${testUserId}`).set('Accept', 'application/json').expect('Content-Type', /json/)

      const body = JSON.parse(response.text)

      expect(body.data).to.not.be.null
      expect(body.data.userId).to.be.equal(testUserId)
    })
  })
})
