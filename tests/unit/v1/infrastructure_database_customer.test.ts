import * as modConnection from '../../../src/v1/infrastructure/persistance/database/db_connection/connectionFile'

import { createSandbox, SinonSandbox } from 'sinon'
import { describe, it } from 'mocha'
import chai from 'chai'

import { getAllCustomersDB, customerStreamAdaptor } from '../../../src/v1/infrastructure/persistance/database/customer'
import { Readable } from 'stream'

import logger from '../../../src/v1/helpers/logger'
import { ReadStream } from 'fs'
import { DataSource } from 'typeorm'

describe('Unit tests - infrastructure:database:customer', () => {
  const originalEnv = { ...process.env }

  after(() => {
    sandbox.restore()
    process.env = originalEnv
  })

  const sandbox: SinonSandbox = createSandbox()

  // Dont accidentally fetch real database (use of mocks in the tests) !
  process.env.DB_URI = ''
  process.env.DB_HOST = ''

  describe('src > v1 > infrastructure > database > customer > index > getAllUserDB ', () => {
    beforeEach(() => {
      sandbox.restore()
    })

    it('should successfully retrieve all customers with their wallets', async () => {
      // Prepare mock data
      const mockUsers = [
        {
          customer_id: 'customer1',
          firstname: 'John',
          lastname: 'Doe',
          Wallet: {
            wallet_id: 'wallet1',
            hard_currency: 1000,
            soft_currency: 500
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
        const result = await getAllCustomersDB()

        // Assertions
        chai.assert.exists(result, 'Result should exist')
        chai.assert.isArray(result, 'Result should be an array')
        chai.assert.lengthOf(result, mockUsers.length, 'Result should have the same amount of customers that the mock data')

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
        await getAllCustomersDB()
        chai.assert.fail('Expected an error to be thrown')
      } catch (err) {
        chai.assert.exists(err, 'Error should be thrown')
        chai.assert.instanceOf(err, Error, 'Error should be an Error instance')
        chai.assert.include((err as Error).message, 'Impossible to retrieve any')

        // Verify logger was called with the error
        sandbox.assert.calledOnce(loggerErrorStub)
        sandbox.assert.calledOnce(getConnectionStub)
        sandbox.assert.called(loggerErrorStub)
      }
    })
  })

  describe('src > v1 > infrastructure > database > customer > index > customerStreamAdaptor', () => {
    beforeEach(() => {
      sandbox.restore()
    })

    it('should adapt stream data correctly', async () => {
      // Mock customer DB data from a stream
      const mockChunks = [
        {
          customer_customer_id: 'customer1_id',
          customer_firstname: 'John',
          customer_lastname: 'Doe',
          wallet_customer_id: 'customer1_id',
          wallet_wallet_id: 'wallet1',
          wallet_hard_currency: 1000,
          wallet_soft_currency: 500
        }
      ]

      // Create a readable stream from mock chunks
      const mockStream = Readable.from(mockChunks) as ReadStream // Type assertion: mockStream mimics ReadStream behavior

      const adaptor = customerStreamAdaptor(mockStream)

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
          userId: 'customer1_id',
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
        const adaptor = customerStreamAdaptor(mockStream as never)
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
