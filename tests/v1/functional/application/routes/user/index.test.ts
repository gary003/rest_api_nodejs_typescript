require('dotenv').config()
import chai from 'chai'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import app from '../../../../../../src/app'
import { DockerComposeEnvironment, StartedDockerComposeEnvironment } from 'testcontainers'
import logger from '../../../../../../src/v1/helpers/logger'

import request from 'supertest'

import { StartedGenericContainer } from 'testcontainers/build/generic-container/started-generic-container'

const urlBase: string = 'api/v1'
const testUserId: string = 'cc2c990b6-029c-11ed-b939-0242ac12002'

describe('Functional tests for user', () => {
  let environment: StartedDockerComposeEnvironment
  let dbContainer: StartedGenericContainer
  let dbUri: string

  const original_uri = process.env.DB_URI

  before(async () => {
    const composeFilePath = '.'
    const composeFile = 'docker-compose.yaml'

    process.env.TESTCONTAINERS_LOCKDIR = './src/v1/inrastrusture/docker'

    // logger.info("starting test env for user (db) from docker-compose")

    environment = (await new DockerComposeEnvironment(composeFilePath, composeFile).up(['db']).catch((err) => {
      logger.debug(JSON.stringify(err))
      return null
    })) as unknown as StartedDockerComposeEnvironment

    // logger.info("Docker Compose test environment started for functional tests on user/")

    if (!environment) {
      chai.assert.fail('Error the container test environment set-up failed')
    }

    dbContainer = environment.getContainer('db-1')

    const dbPort = Number(process.env.DB_PORT) || 3306

    // Using MySQL protocol and default MySQL port
    dbUri = `${process.env.DB_DRIVER}://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${dbContainer.getHost()}:${dbContainer.getMappedPort(dbPort)}/${process.env.DB_DATABASE_NAME}`

    process.env.DB_URI = dbUri

    // logger.info(`uri: ${dbUri}`)

    return true
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
      try {
        const response = await request(app).get(`/${urlBase}/user/`).set('Accept', 'application/json').expect('Content-Type', /json/)

        const body = JSON.parse(response.text)

        expect(body.data).to.be.an('array')
        expect(body.data).length.above(0)

        return true
      } catch (error) {
        chai.assert.fail(`Impossible to get a response`)
      }
    })
  })

  describe('src > v1 > application > route > user > POST (adding a new user)', () => {
    it('should add a new user', async () => {
      const newUser = {
        userId: testUserId,
        firstname: 'test_Rosita',
        lastname: 'test_Espinosa'
      }
      try {
        const response = await request(app).post(`/${urlBase}/user/`).send(newUser).set('Accept', 'application/json').expect('Content-Type', /json/)

        const body = JSON.parse(response.text)

        // logger.debug(JSON.stringify(body))

        expect(body.data).to.not.be.empty
        expect(body.data.userId).to.equal(testUserId)

        return true
      } catch (err) {
        chai.assert.fail('Test fail - impossible to add a new user')
      }
    })
  })

  describe('src > v1 > application > route > user > GET (single user)', () => {
    it('should return a single user', async () => {
      try {
        const response = await request(app).get(`/${urlBase}/user/${testUserId}`).set('Accept', 'application/json').expect('Content-Type', /json/)

        const body = JSON.parse(response.text)

        expect(body.data).to.have.property('userId')
      } catch (error) {
        chai.assert.fail('unexpected error found in route route > user > GET (single user)')
      }
    }),
      it('should fail returning a single user ( wrong parameter in route )', async () => {
        const wrongUserId = 123

        const response = await request(app)
          .get(`/${urlBase}/user/${wrongUserId}`)
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .catch((err) => null)

        if (!response) {
          chai.assert.fail('Unexpected error - middleware should have block that userId')
        }

        const body = JSON.parse(response.text)

        expect(body).to.have.property('errorParamUserId')
      })
  })

  describe('src > v1 > application > route > user > DELETE', () => {
    it('should delete a specified user', async () => {
      const response = await request(app)
        .get(`/${urlBase}/user/${testUserId}`)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .catch((err) => null)

      if (!response) chai.assert.fail(`Impossible to delete the user in test user : ${testUserId}`)

      const body = JSON.parse(response.text)

      expect(body.data).to.not.be.null
      expect(body.data.userId).to.be.equal(testUserId)
    })
  })
})
