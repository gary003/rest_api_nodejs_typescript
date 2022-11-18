import chai from "chai"
import { createSandbox, SinonSandbox } from "sinon"
import { moneyTypes } from "../../src/services/user/dto"
import { addCurrency, deleteUserById, getAllUsers, getUserWalletInfo, saveNewUser, transfertMoney } from "../../src/services/user/index"

import * as mod from "../../src/dataServices/typeorm/user"

describe("Unit tests user", () => {
  let sandbox: SinonSandbox

  describe("services > user > index > saveNewUser", () => {
    beforeEach(() => {
      sandbox = createSandbox()
    })

    afterEach(() => {
      sandbox.restore()
    })

    it("should create a new user", async () => {
      const fakeUser = {
        userId: "fake_22ef5564-0234-11ed-b939-0242ac120002",
        firstname: "fake_Eugene",
        lastname: "fake_Porter",
        wallet: {
          walletId: "fake_515f73c2-027d-11ed-b939-0242ac120002",
          hardCurrency: 2000,
          softCurrency: 2000,
        },
      }

      const fakeSaveNewUserDB = sandbox.stub(mod, "saveNewUserDB").returns(Promise.resolve(fakeUser))

      const response = await saveNewUser(fakeUser.userId, fakeUser.firstname, fakeUser.lastname).catch((err) => console.log(err))
      // console.log(response)

      if (!response) throw new Error("Error - invalid response from serviceDB")

      chai.assert.exists(response, "Should get the correct response")
      chai.assert.strictEqual(response.userId, fakeUser.userId, "Should get the correct userId")
      chai.assert.isTrue(fakeSaveNewUserDB.calledOnce)
    })
  })

  describe("services > user > index > addCurrency", () => {
    beforeEach(() => {
      sandbox = createSandbox()
    })

    afterEach(() => {
      sandbox.restore()
    })

    it("should fail (negative amount)", async () => {
      const amountToAdd = -55

      try {
        await addCurrency("22ef5564-0234-11ed-b939-0242ac120002", moneyTypes.soft_currency, amountToAdd)
        throw new Error("Should never happen")
      } catch (err) {
        // console.log(response)
        chai.assert.isNotNull(err, "Should get an error")
        chai.assert.equal(err, "Error: The amount to add must be at least equal to 1")
      }
    })

    it("should fail (wrong currency type)", async () => {
      const amountToAdd = 150

      try {
        await addCurrency("22ef5564-0234-11ed-b939-0242ac120002", "fake_currency_type" as moneyTypes, amountToAdd)
        throw new Error("Should never happen")
      } catch (err) {
        // console.log(response)
        chai.assert.isNotNull(err, "Should get an error")
      }
    })
  })

  describe("services > user > index > getAllUsers", () => {
    it("should retreive all the users from DB", async () => {
      const response = await getAllUsers().catch((err) => console.log(err))
      // console.log(response)
      if (!response) throw new Error("Error - invalid response from serviceDB")

      chai.assert.isArray(response, "Should get the list in an array format")
    })
  })

  describe("services > user > index > getUserById", () => {
    it("should retreive a single user from DB", async () => {
      const userToFetch: string = "22ef5564-0234-11ed-b939-0242ac120002"

      const response = await getUserWalletInfo(userToFetch).catch((err) => console.log(err))
      // console.log(response)

      if (!response) throw new Error("Error - invalid response from serviceDB")

      chai.assert.exists(response, "Should get a valid response from DB")
      chai.assert.equal(response.userId, userToFetch, "Should get a valid response with a userId")
    })

    it("should fail retreiving a single user (user does not exists in DB)", async () => {
      const userToFetch: string = "785555-0234-11ed-b939-0242ac1200026"

      try {
        const user = await getUserWalletInfo(userToFetch)
        // console.log(user)
        throw new Error("Should never happen")
      } catch (err) {
        // console.log(response)
        chai.assert.exists(err, "Should get an err from DB")
        chai.assert.equal(err, "Error: No user found !")
      }
    })
  })

  describe("services > user > index > deleteUserById", () => {
    beforeEach(() => {
      sandbox = createSandbox()
    })

    afterEach(() => {
      sandbox.restore()
    })
    it("should delete a single user from DB by its id", async () => {
      const userToFetch: string = "22ef5564-0234-11ed-b939-0242ac120002"

      const fakeDeleteUserByIdDB = sandbox.stub(mod, "deleteUserByIdDB").returns(Promise.resolve(true))

      const response = await deleteUserById(userToFetch).catch((err) => console.log(err))
      // console.log(response)
      if (!response) throw new Error("Error - invalid response from serviceDB")

      chai.assert.exists(response, "Should get a valid response from DB")
      chai.assert.isTrue(response, "Should get true response from DB")
      chai.assert.isTrue(fakeDeleteUserByIdDB.calledOnce)
    })
  })

  describe("services > user > index > transfertMoney", () => {
    beforeEach(() => {
      sandbox = createSandbox()
    })

    afterEach(() => {
      sandbox.restore()
    })
    it("should transfert money", async () => {
      const res = await transfertMoney(moneyTypes.soft_currency, "35269564-0234-11ed-b939-0242ac120002", "68965564-0234-11ed-b939-0242ac120002", 15)
      // console.log({ res })

      chai.assert.exists(res, "Should transfert money")
    })
  })
})
