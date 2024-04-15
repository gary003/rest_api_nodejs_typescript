import chai from "chai"
import request from "supertest"
import app from "../../app"
import logger from "../../helpers/logger"
import { expect } from "chai" // Use built-in expect assertion

const urlBase = "/api/v1"

let testUserId: string = "cc2c990b6-029c-11ed-b939-0242ac120002"

describe("Functional Tests API", () => {
  describe("route > user > POST", () => {
    it("should add a new user", async () => {
      const response = await request(app)
        .post(`${urlBase}/user`)
        .send({
          userId: testUserId,
          firstname: "Rosita",
          lastname: "Espinosa",
        })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)

      expect(response.status).to.be.within(200, 299) // Check for successful status code range
      expect(response.body).to.not.be.empty // Verify non-empty response body
      expect(response.body.userId).to.equal(testUserId) // Assert user ID match
    })
  })
  describe("route > user > GET (all users)", () => {
    it("should return an array of all users", async () => {
      const response = await request(app).get(`${urlBase}/user`).set("Accept", "application/json").expect("Content-Type", /json/)

      expect(response.status).to.be.within(200, 299) // Check for successful status code range
      expect(response.body).to.be.an("array") // Verify response is an array

      if (response.body.length > 0) {
        expect(response.body[0]).to.have.property("userId") // Check for userId in first element (if any)
      }
    })
  })

  describe("route > user > GET (single user)", () => {
    it("should return a single user", async () => {
      const response = await request(app).get(`${urlBase}/user/${testUserId}`).set("Accept", "application/json").expect("Content-Type", /json/)

      expect(response.status).to.be.within(200, 299) // Check for successful status code range
      expect(response.body).to.have.property("userId") // Assert user object with userId property
    })
  })

  describe("route > user > DELETE", () => {
    it("should delete a specified user", async () => {
      const response = await request(app).delete(`${urlBase}/user/${testUserId}`).set("Accept", "application/json").expect("Content-Type", /json/)

      expect(response.status).to.be.within(200, 299) // Check for successful status code range
      expect(response.body).to.not.be.null // Verify non-null response body (may be empty on success)
    })
  })
})
