import chai from "chai"
import request from "supertest"
import app from "../../app"
import logger from "../../helpers/logger"

const urlBase = "/api/v1"

let testUserId: string = "cc2c990b6-029c-11ed-b939-0242ac120002"

describe("Functional Tests API", () => {
  describe("route > user > POST", () => {
    it("should add a new user", (done) => {
      request(app)
        .post(`${urlBase}/user`)
        .send({
          userId: testUserId,
          firstname: "Rosita",
          lastname: "Espinosa",
        })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .end((err, result) => {
          if (err) {
            logger.debug(`Error occurred in route > user > POST: ${err}`)
            return done(err)
          }

          logger.info(result.body)
          chai.assert.isNotEmpty(result.body)
          chai.assert.isTrue(result.body.userId === testUserId)
          testUserId = result.body.userId
          return done()
        })
    })
  })

  describe("route > user > GET", () => {
    it("should return an array of all users", (done) => {
      request(app)
        .get(`${urlBase}/user`)
        .set("Accept", "application/json")
        .end((err, result) => {
          if (err) {
            logger.debug(`Error occurred in route > user > GET: ${err}`)
            return done(err)
          }

          logger.info(result.body)
          chai.assert.isArray(result.body)
          if (result.body.length > 0) {
            chai.assert.exists(result.body[0].userId)
          }
          return done()
        })
    })
  })

  describe("route > user > GET", () => {
    it("should return a single user", (done) => {
      request(app)
        .get(`${urlBase}/user/${testUserId}`)
        .set("Accept", "application/json")
        .end((err, result) => {
          if (err) {
            logger.debug(`Error occurred in route > user > GET: ${err}`)
            return done(err)
          }

          logger.info(result.body)
          chai.assert.exists(result.body.userId)
          return done()
        })
    })
  })

  describe("route > user > DELETE", () => {
    it("should delete a specified user", (done) => {
      request(app)
        .delete(`${urlBase}/user/${testUserId}`)
        .set("Accept", "application/json")
        .end((err, result) => {
          if (err) {
            logger.error(`Error occurred in route > user > DELETE: ${err}`)
            return done(err)
          }

          logger.info(result.body)
          chai.assert.isNotNull(result.body)
          return done()
        })
    })
  })
})
