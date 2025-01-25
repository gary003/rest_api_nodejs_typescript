require('dotenv').config()
import { expect } from 'chai'
import { describe, it } from 'mocha'
import app from '../../src/app'
import request from 'supertest'
import { createSandbox, SinonSandbox } from 'sinon'

describe('Application tests for app file (app.ts)', () => {
  describe('src > app > handleNotFound', () => {
    const sandbox: SinonSandbox = createSandbox()

    beforeEach(() => {
      sandbox.restore()
    })
    it('should return 404 if route is not found', async () => {
      const response = await request(app).get('/api/wrong_route')
      const result = JSON.parse(response.text)
      expect(response.status).equal(404)
      expect(result.message).equal('Not Found')
    })
  })
})
