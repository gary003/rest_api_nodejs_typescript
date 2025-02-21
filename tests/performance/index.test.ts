import chai from 'chai'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { DockerComposeEnvironment, PullPolicy, StartedDockerComposeEnvironment, Wait } from 'testcontainers'
import logger from '../../src/v1/helpers/logger'

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const DB_READY_WAIT_MS = 30000

describe('Performance tests - presentation:routes:user', () => {
  // Dont accidently fetch the real database (use the contenerized test environment) !
  process.env.DB_URI = ''
  process.env.DB_HOST = ''

  let environment: StartedDockerComposeEnvironment

  const originalEnv = { ...process.env }

  // This is a portfolio API, in a real project, use a .env !
  const test_env = {
    DB_DRIVER: 'mysql',
    DB_USERNAME: 'mysql',
    DB_PASSWORD: 'mypass',
    DB_DATABASE_NAME: 'mydbuser',
    DB_PORT: '3306',
    DOCKER_APP_NETWORK: 'my_app_network',
    CRYPTO_SECRET_KEY: '2345',
    API_PORT: '8080',
    LOGLEVEL: 'debug'
  }

  process.env = { ...process.env, ...test_env }

  let dbUri: string = ''
  let appUrl: string = ''

  before(async () => {
    const composeFilePath = '.'
    const composeFile = 'docker-compose.yaml'

    // process.env.TESTCONTAINERS_LOCKDIR = '/tmp/testcontainers-node.lock'

    try {
      environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
        .withPullPolicy(PullPolicy.alwaysPull())
        .withEnvironment(test_env)
        .withWaitStrategy('app-1', Wait.forLogMessage('app running on'))
        .withWaitStrategy('db-1', Wait.forLogMessage('ready for connections'))
        .up(['app', 'db'])

      await new Promise((resolve) => setTimeout(resolve, DB_READY_WAIT_MS))
    } catch (error) {
      logger.error('Docker Compose environment setup failed', error)
      chai.assert.fail(`Container test environment setup failed: ${error}`)
    }

    const dbContainer = environment.getContainer('db-1')
    const appContainer = environment.getContainer('app-1')

    const dbPort = Number(process.env.DB_PORT) || 3306
    const appPort = Number(process.env.API_PORT) || 8080

    dbUri = `${process.env.DB_DRIVER}://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${dbContainer.getHost()}:${dbContainer.getMappedPort(dbPort)}/${process.env.DB_DATABASE_NAME}`

    appUrl = `http://${appContainer.getHost()}:${appContainer.getMappedPort(appPort)}/api/v1/user`

    console.log(appUrl)

    process.env.DB_URI = dbUri
  })

  after(async () => {
    await environment.down()

    // Cancel the modification of the env variable
    process.env = originalEnv
    // logger.info("Docker Compose test environment stopped for functional tests on user/.")

    return true
  })

  describe('routes > user > /user GET', () => {
    it('Should maintain stable memory usage under load', async () => {
      const cmd = `npx autocannon -c 50 -d 5 -m GET "${appUrl}"`

      const { stderr } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 })

      // Look for key performance indicators
      expect(stderr).to.include('requests in')
      expect(stderr).not.to.include('errors')

      // Parse the output to get specific metrics
      const avgLatencyLine = stderr.split('\n').at(7)

      if (!avgLatencyLine) chai.assert.fail('wrong format for result line')

      const avgLatencyLineValues = avgLatencyLine.split('│')

      if (avgLatencyLineValues instanceof Array) {
        const avgLatencyStr = avgLatencyLineValues[6]
        if (!avgLatencyStr) chai.assert.fail('invalid value for avg latency')
        const avgLatency = parseFloat(avgLatencyStr)
        expect(avgLatency).to.be.below(100) // Asserting average latency below 100ms
      } else {
        console.error('Average latency not found in autocannon output.')
        expect.fail('Average latency not found in autocannon output.') // This will fail the test
      }
    })
  })
})
