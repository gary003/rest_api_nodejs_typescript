import * as modConnection from '../../../src/v1/infrastructure/database/db_connection/connectionFile'

import { createSandbox, SinonSandbox } from 'sinon'
import { describe, it } from 'mocha'
import chai from 'chai'

import { getAllUsersDB, userStreamAdaptor } from '../../../src/v1/infrastructure/database/user'
import { Readable } from 'stream'

import logger from '../../../src/v1/helpers/logger'
import { ReadStream } from 'fs'
import { DataSource } from 'typeorm'

describe('Unit tests - infrastructure:database:user', () => {
  const originalEnv = process.env

  after(() => {
    sandbox.restore()
    process.env = originalEnv
  })

  const sandbox: SinonSandbox = createSandbox()

  // Dont accidently fetch real database (use of mocks in the tests) !
  process.env.DB_URI = ''
  process.env.DB_HOST = ''

  describe('src > v1 > infrastructure > database > user > index > getAllUserDB ', () => {
    beforeEach(() => {
      sandbox.restore()
    })

    it('should successfully retrieve all users with their wallets', async () => {
      // Prepare mock data
      const mockUsers = [
        {
          userId: 'user1',
          firstname: 'John',
          lastname: 'Doe',
          Wallet: {
            walletId: 'wallet1',
            hardCurrency: 1000,
            softCurrency: 500
          }
        }
      ]

      // Create mock connection and repository
      const mockQueryBuilder = {
        innerJoinAndMapOne: sandbox.stub().returnsThis(),
        getMany: sandbox.stub().resolves(mockUsers)
      }

      const mockRepository = {
        createQueryBuilder: sandbox.stub().returns(mockQueryBuilder)
      }

      const mockConnection = {
        getRepository: sandbox.stub().returns(mockRepository)
      }

      // Stub getConnection to return mock connection
      const getConnectionStub = sandbox.stub(modConnection, 'getConnection').resolves(mockConnection as never)

      try {
        const result = await getAllUsersDB()

        // Assertions
        chai.assert.exists(result, 'Result should exist')
        chai.assert.isArray(result, 'Result should be an array')
        chai.assert.lengthOf(result, 1, 'Result should have one user')
        chai.assert.deepEqual(result, mockUsers, 'Result should match mock users')

        // Verify stub calls
        sandbox.assert.calledOnce(getConnectionStub)
        sandbox.assert.calledOnce(mockQueryBuilder.innerJoinAndMapOne)
        sandbox.assert.calledOnce(mockQueryBuilder.getMany)
      } catch (err) {
        chai.assert.fail(`Unexpected error: ${err}`)
      }
    })

    it('should throw an error when database query fails', async () => {
      // Create an error to simulate database failure
      const mockError = new Error('Database connection error')

      // Stub getConnection to return a repository with a failing query
      const mockQueryBuilder = {
        innerJoinAndMapOne: sandbox.stub().returnsThis(),
        getMany: sandbox.stub().rejects(mockError)
      }

      const mockRepository = {
        createQueryBuilder: sandbox.stub().returns(mockQueryBuilder)
      }

      const mockConnection = {
        getRepository: sandbox.stub().returns(mockRepository)
      }

      const getConnectionStub = sandbox.stub(modConnection, 'getConnection').resolves(mockConnection as unknown as DataSource)

      const loggerErrorStub = sandbox.stub(logger, 'error')

      try {
        await getAllUsersDB()
        chai.assert.fail('Expected an error to be thrown')
      } catch (err) {
        chai.assert.exists(err, 'Error should be thrown')
        chai.assert.instanceOf(err, Error, 'Error should be an Error instance')
        chai.assert.include((err as Error).message, 'Impossible to retreive any user')

        // Verify logger was called with the error
        sandbox.assert.calledOnce(loggerErrorStub)
        sandbox.assert.calledOnce(getConnectionStub)
        sandbox.assert.calledWith(loggerErrorStub, mockError)
      }
    })
  })

  describe('src > v1 > infrastructure > database > user > index > userStreamAdaptor', () => {
    beforeEach(() => {
      sandbox.restore()
    })

    it('should adapt stream data correctly', async () => {
      // Mock user DB data for stream
      const mockChunks = [
        {
          user_userId: 'user1',
          user_firstname: 'John',
          user_lastname: 'Doe',
          wallet_walletId: 'wallet1',
          wallet_hardCurrency: 1000,
          wallet_softCurrency: 500
        }
      ]

      // Create a readable stream from mock chunks
      const mockStream = Readable.from(mockChunks) as ReadStream // Type assertion: mockStream mimics ReadStream behavior

      const adaptor = userStreamAdaptor(mockStream)

      // Results from the async generator to test
      const results: string[] = []
      for await (const item of adaptor) {
        results.push(item)
      }

      // Assertions
      chai.assert.lengthOf(results, 1, 'Should process one chunk')
      chai.assert.deepEqual(
        results[0],
        JSON.stringify({
          userId: 'user1',
          firstname: 'John',
          lastname: 'Doe',
          Wallet: {
            walletId: 'wallet1',
            hardCurrency: 1000,
            softCurrency: 500
          }
        }) + '\n',
        'Should correctly adapt and stringify the stream data with a newline'
      )
    })

    it('should handle stream errors', async () => {
      // Create a stream that will throw an error
      const mockStream = new Readable({
        objectMode: true,
        read() {
          this.destroy(new Error('Stream read error'))
        }
      })

      const loggerErrorStub = sandbox.stub(logger, 'error')

      try {
        const adaptor = userStreamAdaptor(mockStream as never)
        await adaptor.next()
        chai.assert.fail('Expected an error to be thrown')
      } catch (err) {
        chai.assert.exists(err, 'Error should be thrown')
        if (!(err instanceof Error)) chai.assert.fail('Error should be an Error instance')
        chai.assert.include(err.message, 'Stream Adaptor error')

        // Verify logger was called with the error
        sandbox.assert.calledOnce(loggerErrorStub)
      }
    })
  })
})
