import { DataSource } from 'typeorm'
import * as sinon from 'sinon'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import { connectionDB } from '../../../src/v1/infrastructure/database/db_connection/connectionFile'
import * as modConnectionFile from '../../../src/v1/infrastructure/database/db_connection/connectionFile'
import logger from '../../../src/v1/helpers/logger'

describe('Unit tests - infrastructure:database', () => {
  describe('src > v1 > infrastructure > database > db_connection > connectionFile > connectionDB', () => {
    const sandbox = sinon.createSandbox()

    beforeEach(() => {
      sandbox.restore()
    })

    after(() => {
      sandbox.restore()
    })

    it('Should successfully connect to DB on first attempt', async () => {
      const mockConnection = { someConnection: true } as unknown as DataSource
      const mockTryToConnectDB = sandbox.stub().resolves(mockConnection)
      const mockWarnLogger = sandbox.stub(logger, 'warn')

      sandbox.replace(modConnectionFile, 'tryToConnectDB', mockTryToConnectDB)

      const result = await connectionDB()

      sandbox.assert.calledOnce(mockTryToConnectDB)
      sandbox.assert.notCalled(mockWarnLogger)
      expect(result).to.equal(mockConnection)
    })

    it('Should successfully connect to DB after one retry', async () => {
      const mockConnection = { someConnection: 'Ok' } as unknown as DataSource
      const mockTryToConnectDB = sandbox.stub()
      const mockWarnLogger = sandbox.stub(logger, 'warn')

      mockTryToConnectDB.onFirstCall().rejects(new Error('First attempt failed'))
      mockTryToConnectDB.onSecondCall().resolves(mockConnection)

      sandbox.replace(modConnectionFile, 'tryToConnectDB', mockTryToConnectDB)

      const connectionPromise = connectionDB()
      const result = await connectionPromise

      sandbox.assert.calledTwice(mockTryToConnectDB)
      sandbox.assert.calledOnce(mockWarnLogger)
      expect(result).to.equal(mockConnection)
    })

    it('Should Successfully connect to DB on last attempt', async () => {
      const mockConnection = { someConnection: 'Ok3' } as unknown as DataSource
      const mockTryToConnectDB = sandbox.stub()
      const mockWarnLogger = sandbox.stub(logger, 'warn')

      // Setup mock behavior - fail 3 times, succeed on 4th
      mockTryToConnectDB.onFirstCall().rejects(new Error('First attempt failed'))
      mockTryToConnectDB.onSecondCall().rejects(new Error('Second attempt failed'))
      mockTryToConnectDB.onThirdCall().rejects(new Error('Third attempt failed'))
      mockTryToConnectDB.onCall(3).resolves(mockConnection)

      sandbox.replace(modConnectionFile, 'tryToConnectDB', mockTryToConnectDB)

      const connectionPromise = connectionDB()
      const result = await connectionPromise

      sandbox.assert.callCount(mockTryToConnectDB, 4)
      sandbox.assert.calledThrice(mockWarnLogger)
      expect(result).to.equal(mockConnection)
    })

    it('Should Fail after maximum connection attempts', async () => {
      const testError = new Error('Connection failed')
      const mockTryToConnectDB = sandbox.stub().rejects(testError)
      const mockWarnLogger = sandbox.stub(logger, 'warn')
      const mockErrorLogger = sandbox.stub(logger, 'error')

      sandbox.replace(modConnectionFile, 'tryToConnectDB', mockTryToConnectDB)

      const connectionPromise = connectionDB()

      try {
        await connectionPromise
        expect.fail('Should have thrown an error')
      } catch (err) {
        if (!(err instanceof Error)) {
          expect.fail('Should be an Error instance')
        }
        expect(err.message).to.include('Error - Impossible to connect to db after 4 attempts')
        expect(err.message).to.include('Connection failed')
        sandbox.assert.callCount(mockTryToConnectDB, 4) // Initial + 3 retries
        sandbox.assert.calledThrice(mockWarnLogger)
        sandbox.assert.called(mockErrorLogger)
      }
    })

    it('Should successfully respects custom retry parameters', async () => {
      const testError = new Error('Connection failed')
      const mockTryToConnectDB = sandbox.stub().rejects(testError)
      const mockWarnLogger = sandbox.stub(logger, 'warn')
      const mockErrorLogger = sandbox.stub(logger, 'error')

      sandbox.replace(modConnectionFile, 'tryToConnectDB', mockTryToConnectDB)

      // Execute test with custom parameters (2 attempts, 500ms base delay)
      const connectionPromise = connectionDB(1, 2, 500)

      try {
        await connectionPromise
        expect.fail('Should have thrown an error')
      } catch (err) {
        if (!(err instanceof Error)) {
          expect.fail('Should be an Error instance')
        }
        expect(err.message).to.include('Error - Impossible to connect to db after 2 attempts')
        sandbox.assert.callCount(mockTryToConnectDB, 2) // Initial + 1 retry
        sandbox.assert.calledOnce(mockWarnLogger)
        sandbox.assert.calledOnce(mockErrorLogger)
      }
    })
  })
})
