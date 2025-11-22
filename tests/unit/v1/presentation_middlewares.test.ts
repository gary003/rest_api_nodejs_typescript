const jwt = require('jsonwebtoken')

import Sinon, * as sinon from 'sinon'
import { describe, it } from 'mocha'
import { Request, Response } from 'express'
import isAdmin from '../../../src/v1/presentation/middlewares/loggedUser/isAdmin'
import isAuthorized from '../../../src/v1/presentation/middlewares/loggedUser/isAuthorized'
import logger from '../../../src/v1/helpers/logger'

describe('Unit tests - presentation:middlewares', () => {
  const sandbox = sinon.createSandbox()

  after(() => {
    sandbox.restore()
  })

  describe('src > v1 > presentation > middlewares > loggedUser > isAdmin', () => {
    beforeEach(() => {
      sandbox.restore()
    })
    it('Should succesfully pass the admin check (user is admin)', async () => {
      // Arrange
      const mockRequest = {
        body: {
          user: { role: 'admin' }
        }
      } as unknown as Request

      const mockResponse = {
        status: sinon.stub().returns({ json: sinon.stub() })
      } as unknown as Response

      const nextFunction = sinon.stub()

      // Act
      isAdmin(mockRequest, mockResponse, nextFunction)

      // Assert
      sinon.assert.calledOnce(nextFunction)
      sinon.assert.notCalled(mockResponse.status as sinon.SinonStub)
    })
    it('Should fail to pass the admin check (user is not admin)', async () => {
      // Arrange
      const mockRequest = {
        body: {
          user: { role: 'std_user' }
        }
      } as unknown as Request

      const jsStub = sinon.stub()
      const mockResponse = {
        status: sinon.stub().returns({ json: jsStub })
      } as unknown as Response

      const nextFunction = sinon.stub()

      isAdmin(mockRequest, mockResponse, nextFunction)

      // Assert
      sinon.assert.notCalled(nextFunction)
      sinon.assert.called(mockResponse.status as sinon.SinonStub)
      sinon.assert.calledWith(mockResponse.status as Sinon.SinonStub, 401)
      sinon.assert.calledOnce(jsStub)
      sinon.assert.calledWith(jsStub, {
        message: 'Middleware user:isAdmin - Unauthorized (not an admin user)'
      })
    })
  })

  describe('src > v1 > presentation > middlewares > loggedUser > isAuthorized', () => {
    beforeEach(() => {
      sandbox.restore()
    })

    it('Should successfully pass authorization with valid token', async () => {
      // Arrange
      const mockUser = { id: 1, role: 'admin', email: 'test@example.com' }
      const mockToken = 'valid.jwt.token'

      const mockRequest = {
        headers: {
          authorization: `Bearer ${mockToken}`
        },
        body: {}
      } as unknown as Request

      const jsonStub = sinon.stub()
      const statusStub = sinon.stub().returns({ json: jsonStub })
      const mockResponse = {
        status: statusStub
      } as unknown as Response

      const nextFunction = sinon.stub()
      // Properly stub jwt.verify to return mockUser as the decoded payload
      const jwtVerifyStub = sandbox.stub(jwt, 'verify').callsFake(() => mockUser)

      // Act
      isAuthorized(mockRequest, mockResponse, nextFunction)

      // Assert
      sinon.assert.calledOnce(jwtVerifyStub)
      sinon.assert.calledWith(jwtVerifyStub, mockToken, process.env.JWT_SECRET_KEY || 'secret')
      sinon.assert.calledOnce(nextFunction)
      sinon.assert.notCalled(statusStub)
      sinon.assert.calledWith(jwtVerifyStub, mockToken, process.env.JWT_SECRET_KEY || 'secret')
      // Verify user was added to request body
      sinon.assert.match(mockRequest.body.user, mockUser)
    })

    it('Should fail authorization when no token is provided', async () => {
      // Arrange
      const mockRequest = {
        headers: {},
        body: {}
      } as unknown as Request

      const jsonStub = sinon.stub()
      const statusStub = sinon.stub().returns({ json: jsonStub })
      const mockResponse = {
        status: statusStub
      } as unknown as Response

      const nextFunction = sinon.stub()

      // Act
      isAuthorized(mockRequest, mockResponse, nextFunction)

      // Assert
      sinon.assert.notCalled(nextFunction)
      sinon.assert.calledOnce(statusStub)
      sinon.assert.calledWith(statusStub, 401)
      sinon.assert.calledOnce(jsonStub)
      sinon.assert.calledWith(jsonStub, {
        message: 'presentation:middleware:isAuthorized, failed to get a valid token'
      })
    })

    it('Should fail authorization when token is expired', async () => {
      // Arrange
      const mockToken = 'expired.jwt.token'
      const expiredAt = new Date()

      const mockRequest = {
        headers: {
          authorization: `Bearer ${mockToken}`
        },
        body: {}
      } as unknown as Request

      const jsonStub = sinon.stub()
      const statusStub = sinon.stub().returns({ json: jsonStub })
      const mockResponse = {
        status: statusStub
      } as unknown as Response

      const nextFunction = sinon.stub()

      // Stub jwt.verify to throw TokenExpiredError
      const tokenExpiredError = new jwt.TokenExpiredError('Token expired', expiredAt)
      const jwtVerifyStub = sandbox.stub(jwt, 'verify').throws(tokenExpiredError)
      const loggerInfoStub = sandbox.stub(logger, 'info')

      // Act
      isAuthorized(mockRequest, mockResponse, nextFunction)

      // Assert
      sinon.assert.calledOnce(jwtVerifyStub)
      sinon.assert.notCalled(nextFunction)
      sinon.assert.calledOnce(statusStub)
      sinon.assert.calledWith(statusStub, 401)
      sinon.assert.calledOnce(jsonStub)
      sinon.assert.calledWith(jsonStub, {
        message: 'presentation:middleware:isAuthorized - Token expired',
        expiredAt: expiredAt
      })
      sinon.assert.calledOnce(loggerInfoStub)
    })

    it('Should fail authorization when token is invalid', async () => {
      // Arrange
      const mockToken = 'invalid.jwt.token'

      const mockRequest = {
        headers: {
          authorization: `Bearer ${mockToken}`
        },
        body: {}
      } as unknown as Request

      const jsonStub = sinon.stub()
      const statusStub = sinon.stub().returns({ json: jsonStub })
      const mockResponse = {
        status: statusStub
      } as unknown as Response

      const nextFunction = sinon.stub()

      // Stub jwt.verify to throw JsonWebTokenError
      const jsonWebTokenError = new jwt.JsonWebTokenError('Invalid token')
      const jwtVerifyStub = sandbox.stub(jwt, 'verify').throws(jsonWebTokenError)
      const loggerInfoStub = sandbox.stub(logger, 'info')

      // Act
      isAuthorized(mockRequest, mockResponse, nextFunction)

      // Assert
      sinon.assert.calledOnce(jwtVerifyStub)
      sinon.assert.notCalled(nextFunction)
      sinon.assert.calledOnce(statusStub)
      sinon.assert.calledWith(statusStub, 401)
      sinon.assert.calledOnce(jsonStub)
      sinon.assert.calledWith(jsonStub, {
        message: 'presentation:middleware:isAuthorized - Invalid token',
        error: 'Invalid token'
      })
      sinon.assert.calledOnce(loggerInfoStub)
    })

    it('Should fail authorization with unexpected error', async () => {
      // Arrange
      const mockToken = 'valid.jwt.token'

      const mockRequest = {
        headers: {
          authorization: `Bearer ${mockToken}`
        },
        body: {}
      } as unknown as Request

      const jsonStub = sinon.stub()
      const statusStub = sinon.stub().returns({ json: jsonStub })
      const mockResponse = {
        status: statusStub
      } as unknown as Response

      const nextFunction = sinon.stub()

      // Stub jwt.verify to throw generic error
      const jwtVerifyStub = sandbox.stub(jwt, 'verify').throws(new Error('Unexpected error'))
      const loggerErrorStub = sandbox.stub(logger, 'error')

      // Act
      isAuthorized(mockRequest, mockResponse, nextFunction)

      // Assert
      sinon.assert.calledOnce(jwtVerifyStub)
      sinon.assert.notCalled(nextFunction)
      sinon.assert.calledOnce(statusStub)
      sinon.assert.calledWith(statusStub, 401)
      sinon.assert.calledOnce(jsonStub)
      sinon.assert.calledWith(jsonStub, {
        message: 'presentation:middleware:isAuthorized - Authentication failed'
      })
      sinon.assert.calledOnce(loggerErrorStub)
    })

    it('Should fail authorization when authorization header has invalid format', async () => {
      // Arrange
      const mockRequest = {
        headers: {
          authorization: 'InvalidFormatWithoutBearer'
        },
        body: {}
      } as unknown as Request

      const jsonStub = sinon.stub()
      const statusStub = sinon.stub().returns({ json: jsonStub })
      const mockResponse = {
        status: statusStub
      } as unknown as Response

      const nextFunction = sinon.stub()

      // Act
      isAuthorized(mockRequest, mockResponse, nextFunction)

      // Assert
      sinon.assert.notCalled(nextFunction)
      sinon.assert.calledOnce(statusStub)
      sinon.assert.calledWith(statusStub, 401)
      sinon.assert.calledOnce(jsonStub)
      sinon.assert.calledWith(jsonStub, {
        message: 'presentation:middleware:isAuthorized, failed to get a valid token'
      })
    })
  })
})
