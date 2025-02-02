require('dotenv').config()
import chai from 'chai'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import app from '../../../../../../src/app'
import { DockerComposeEnvironment, PullPolicy, StartedDockerComposeEnvironment, Wait } from 'testcontainers'
import request from 'supertest'
import { createSandbox, SinonSandbox } from 'sinon'
import logger from '../../../../../../src/v1/helpers/logger'
import { errorAPIUSER } from '../../../../../../src/v1/application/routes/user/error.dto'
import { moneyTypesO } from '../../../../../../src/v1/domain'

const DB_READY_WAIT_MS = 30000

describe('Functional tests for user', () => {
  const sandbox: SinonSandbox = createSandbox()

  let environment: StartedDockerComposeEnvironment

  const original_DB_HOST = process.env.DB_HOST
  const original_DB_URI = process.env.DB_URI

  delete process.env.DB_HOST
  delete process.env.DB_URI

  let dbUri: string = ''

  // This is a test user id  use through all test (as recispient for transfer tests)
  const testUserId: string = 'cc2c990b6-029c-11ed-b939-0242ac12002'
  let givertUserIdTest: string = ''

  const urlBase: string = 'api/v1'

  before(async () => {
    const composeFilePath = '.'
    const composeFile = 'docker-compose.yaml'

    process.env.TESTCONTAINERS_LOCKDIR = './src/v1/inrastrusture/docker'

    try {
      environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
        .withPullPolicy(PullPolicy.alwaysPull())
        .withWaitStrategy('app-1', Wait.forLogMessage('app running on'))
        .withWaitStrategy('db-1', Wait.forLogMessage('ready for connections'))
        .up(['app', 'db'])

      await new Promise((resolve) => setTimeout(resolve, DB_READY_WAIT_MS))
    } catch (error) {
      logger.error('Docker Compose environment setup failed', error)
      chai.assert.fail(`Container test environment setup failed: ${error}`)
    }

    const dbContainer = environment.getContainer('db-1')

    const dbPort = Number(process.env.DB_PORT) || 3306

    dbUri = `${process.env.DB_DRIVER}://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${dbContainer.getHost()}:${dbContainer.getMappedPort(dbPort)}/${process.env.DB_DATABASE_NAME}`

    process.env.DB_URI = dbUri
  })

  after(async () => {
    await environment.down()

    // Cancel the modification of the env variable
    process.env.DB_HOST = original_DB_HOST
    process.env.DB_URI = original_DB_URI

    // logger.info("Docker Compose test environment stopped for functional tests on user/.")

    return true
  })

  describe('src > v1 > application > route > user > GET (getting all the users)', () => {
    beforeEach(() => {
      sandbox.restore()
    })
    it('Should get all users from DB', async () => {
      const response = await request(app).get(`/${urlBase}/user/`).set('Accept', 'application/json').expect('Content-Type', /json/)

      const body = JSON.parse(response.text)

      givertUserIdTest = body.data[0].userId

      expect(response.statusCode).to.be.within(200, 299)
      expect(body.data).to.be.an('array')
      expect(body.data).length.above(0)
    })
  })

  describe('src > v1 > application > route > user > stream > GET (getting all the users - stream)', () => {
    beforeEach(() => {
      sandbox.restore()
    })
    it('Should get all users from DB from a stream', async () => {
      const resp = await request(app).get(`/${urlBase}/user/stream`)

      if (resp instanceof Error) chai.assert.fail('Error - Impossible to get the data stream from route')

      const users = resp.text.split('\n').slice(0, -1)

      expect(resp.statusCode).to.be.within(200, 299)
      expect(users).to.be.an('array')

      for (const chunk of users) {
        const user = JSON.parse(chunk)
        expect(user).to.have.property('userId')
        expect(user).to.have.property('firstname')
        expect(user).to.have.property('Wallet')
      }
    })
  })

  describe('src > v1 > application > route > user > POST (adding a new user)', () => {
    beforeEach(() => {
      sandbox.restore()
    })
    it('should add a new user', async () => {
      const newUser = {
        userId: testUserId,
        firstname: 'test_Rosita',
        lastname: 'test_Espinosa'
      }

      const response = await request(app).post(`/${urlBase}/user/`).send(newUser).set('Accept', 'application/json').expect('Content-Type', /json/)

      const body = JSON.parse(response.text)

      // logger.debug(JSON.stringify(body))
      expect(response.statusCode).to.be.within(200, 299)

      expect(body.data).to.not.be.empty
      expect(body.data.userId).to.equal(testUserId)
    })
  })

  describe('src > v1 > application > route > user > GET (single user)', () => {
    beforeEach(() => {
      sandbox.restore()
    })
    it('should return a single user', async () => {
      const response = await request(app).get(`/${urlBase}/user/${testUserId}`).set('Accept', 'application/json').expect('Content-Type', /json/)

      const body = JSON.parse(response.text)

      expect(response.statusCode).to.be.within(200, 299)
      expect(body.data).to.have.property('userId')
    })
    it('should fail returning a single user ( wrong parameter in route )', async () => {
      const wrongUserId = 123

      const response = await request(app).get(`/${urlBase}/user/${wrongUserId}`).set('Accept', 'application/json').expect('Content-Type', /json/)

      const body = JSON.parse(response.text)

      expect(response.statusCode).to.be.within(400, 499)
      expect(body).to.have.property('errorParamUserId')
    })
    it('should fail returning a single user ( user dont exists )', async () => {
      const mockErrorLogger = sandbox.stub(logger, 'error')

      const wrongUserId = 'zz2c990b6-029c-11ed-b939-0242ac12002'

      const response = await request(app).get(`/${urlBase}/user/${wrongUserId}`).set('Accept', 'application/json').expect('Content-Type', /json/)

      const body = JSON.parse(response.text)

      expect(response.statusCode).to.be.within(500, 599)
      expect(body.rawError).includes(' Impossible to get any user with that id')

      sandbox.assert.called(mockErrorLogger)
    })
  })

  describe('src > v1 > application > route > user > POST (transfer)', () => {
    beforeEach(() => {
      sandbox.restore()
    })

    it('should successfully transfer money between users', async () => {
      const validTransferData = {
        senderId: givertUserIdTest,
        receiverId: testUserId,
        amount: 7,
        currency: moneyTypesO.hard_currency
      }

      const response = await request(app).post(`/${urlBase}/user/transfer`).send(validTransferData).set('Accept', 'application/json').expect('Content-Type', /json/)

      const body = JSON.parse(response.text)

      expect(response.statusCode).to.be.within(200, 299)
      expect(body).to.have.property('data')
    })

    it('should fail transfering money (missing required fields)', async () => {
      const invalidData = {
        senderId: testUserId
        // missing other required fields
      }

      const response = await request(app).post(`/${urlBase}/user/transfer`).send(invalidData).set('Accept', 'application/json').expect('Content-Type', /json/)

      const body = JSON.parse(response.text)

      expect(response.statusCode).to.be.within(400, 499)
      expect(body).to.deep.equal(errorAPIUSER.errorAPIUserTransfertWrongParams)
    })

    it('should fail transfering money (illegal amount)', async () => {
      const validTransferData = {
        senderId: givertUserIdTest,
        receiverId: testUserId,
        amount: 101,
        currency: moneyTypesO.hard_currency
      }

      const invalidData = {
        ...validTransferData,
        amount: -100
      }

      const response = await request(app).post(`/${urlBase}/user/transfer`).send(invalidData).set('Accept', 'application/json').expect('Content-Type', /json/)

      const body = JSON.parse(response.text)

      expect(response.statusCode).to.be.within(400, 499)
      expect(body).to.deep.equal(errorAPIUSER.errorAPIUserTransferIllegalAmount)
    })
  })

  describe('src > v1 > application > route > user > DELETE', () => {
    beforeEach(() => {
      sandbox.restore()
    })
    it('should delete a specified user', async () => {
      const response = await request(app).delete(`/${urlBase}/user/${testUserId}`).set('Accept', 'application/json').expect('Content-Type', /json/)

      const body = JSON.parse(response.text)

      expect(response.statusCode).to.be.within(200, 299)
      expect(body.data).to.not.be.null
      expect(body.data).to.be.equal(true)
    })
  })
})
