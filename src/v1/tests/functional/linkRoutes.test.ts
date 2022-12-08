import chai from "chai"
import request from "supertest"
import app from "../../app"

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
          // console.log(result.body)
          if (!!err) return done(err)
          chai.assert.isNotEmpty(result.body)
          chai.assert.isTrue(result.body.userId === testUserId)
          // chai.assert.isNotEmpty(result.body.userId)
          testUserId = result.body.userId
          return done()
        })
    })
  })

  describe("route > user > GET", () => {
    it("should return an array of all users", (done) => {
      // with Mocha don't use return (return request(app)) !
      request(app)
        .get(`${urlBase}/user`)
        .set("Accept", "application/json")
        .end((err, result) => {
          // console.log(result.body)
          if (!!err) return done(err)
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
      // with Mocha don't use return (return request(app)) !
      request(app)
        .get(`${urlBase}/user/${testUserId}`)
        .set("Accept", "application/json")
        .end((err, result) => {
          // console.log(result.body)
          if (!!err) return done(err)
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
          // console.log(result.body)
          if (!!err) return done(err)
          chai.assert.isNotNull(result.body)
          return done()
        })
    })
  })
})
