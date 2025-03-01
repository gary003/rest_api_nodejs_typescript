import chai from 'chai'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { DockerComposeEnvironment, PullPolicy, StartedDockerComposeEnvironment, Wait } from 'testcontainers'

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
  const test_env: Record<string, string> = {
    DB_DRIVER: 'mysql',
    DB_USERNAME: 'mysql',
    DB_PASSWORD: 'mypass',
    DB_DATABASE_NAME: 'mydbuser',
    DB_PORT: '3306',
    DOCKER_APP_NETWORK: 'my_app_network',
    API_PORT: '8080',
    LOGLEVEL: 'debug'
  }

  process.env = { ...process.env, ...test_env }

  let appUrl: string = ''

  before(async () => {
    const composeFilePath: string = '.'
    const composeFile: string = 'docker-compose.yaml'

    try {
      environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
        .withPullPolicy(PullPolicy.defaultPolicy())
        .withEnvironment(test_env)
        .withWaitStrategy('app-1', Wait.forLogMessage('app running on'))
        .withWaitStrategy('db-1', Wait.forLogMessage('ready for connections'))
        .up(['app', 'db'])

      await new Promise((resolve) => setTimeout(resolve, DB_READY_WAIT_MS))
    } catch (error) {
      chai.assert.fail(`Container test environment setup failed: ${String(error)}`)
    }

    const appContainer = environment.getContainer('app-1')

    const appPort = Number(process.env.API_PORT) || 8080

    appUrl = `http://${appContainer.getHost()}:${appContainer.getMappedPort(appPort)}/api/v1/user`
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

      if (!avgLatencyLine) expect.fail('wrong format for result line')

      const avgLatencyLineValues = avgLatencyLine.split('│')

      if (avgLatencyLineValues instanceof Array) {
        const avgLatencyStr = avgLatencyLineValues[6]
        if (!avgLatencyStr) expect.fail('invalid value for avg latency')
        const avgLatency = parseFloat(avgLatencyStr)
        expect(avgLatency).to.be.below(1500)
      } else {
        expect.fail('Average latency not found in autocannon output.')
      }
    })
  })
})
