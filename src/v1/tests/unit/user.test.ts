import chai from "chai"
import { createSandbox, SinonSandbox } from "sinon"
import { addCurrency, deleteUserById, getAllUsers, getUserWalletInfo, saveNewUser, transfertMoney } from "../../services/user/index"
import * as mod from "../../dataServices/typeorm/user"
import { moneyTypes } from "../../domain"
import logger from "../../helpers/logger"

describe("Unit tests user", () => {
  let sandbox: SinonSandbox = createSandbox()

  describe("services > user > index > saveNewUser", () => {
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

      try {
        const response = await saveNewUser(fakeUser.userId, fakeUser.firstname, fakeUser.lastname)
        logger.debug(JSON.stringify(response))

        chai.assert.exists(response, "Should get the correct response")
        chai.assert.strictEqual(response.userId, fakeUser.userId, "Should get the correct userId")
        chai.assert.isTrue(fakeSaveNewUserDB.calledOnce)
      } catch (err) {
        logger.debug(`Error occurred in services > user > index > saveNewUser: ${err}`)
      }
    })
  })

  describe("services > user > index > addCurrency", () => {
    afterEach(() => {
      sandbox.restore()
    })

    it("should fail (negative amount)", async () => {
      const amountToAdd = -55

      try {
        await addCurrency("22ef5564-0234-11ed-b939-0242ac120002", moneyTypes.soft_currency, amountToAdd)
        throw new Error("Should never happen")
      } catch (err) {
        logger.debug(err)
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
        logger.debug(err)
        chai.assert.isNotNull(err, "Should get an error")
      }
    })
  })

  describe("services > user > index > getAllUsers", () => {
    afterEach(() => {
      sandbox.restore()
    })
    it("should retrieve all the users from DB", async () => {
      try {
        const response = await getAllUsers()
        // logger.debug(JSON.stringify(response))

        chai.assert.isArray(response, "Should get the list in an array format")
      } catch (err) {
        logger.debug(`Error occurred in services > user > index > getAllUsers: ${err}`)
        chai.assert.fail("Fail - Should retreive all users")
      }
    })
  })

  describe("services > user > index > getUserById", () => {
    afterEach(() => {
      sandbox.restore()
    })
    it("should retrieve a single user from DB", async () => {
      const userToFetch: string = "22ef5564-0234-11ed-b939-0242ac120002"

      try {
        const response = await getUserWalletInfo(userToFetch)
        // logger.debug(JSON.stringify(response))

        chai.assert.exists(response, "Should get a valid response from DB")
        chai.assert.equal(response.userId, userToFetch, "Should get a valid response with a userId")
      } catch (err) {
        logger.debug(`Error occurred in services > user > index > getUserById: ${err}`)
        chai.assert.fail("Fail - should retreive a user")
      }
    })

    it("should fail retrieving a single user (user does not exist in DB)", async () => {
      const userToFetch: string = "785555-0234-11ed-b939-0242ac1200026"

      try {
        const user = await getUserWalletInfo(userToFetch)
        // logger.debug(JSON.stringify(user))
        chai.assert.fail("Should never happen")
      } catch (err) {
        logger.debug(err)
        chai.assert.exists(err, "Should get an err from DB")
        chai.assert.equal(err, "Error: No user found !")
      }
    })
  })

  describe("services > user > index > deleteUserById", () => {
    afterEach(() => {
      sandbox.restore()
    })
    it("should delete a single user from DB by its id", async () => {
      const userToFetch: string = "22ef5564-0234-11ed-b939-0242ac120002"

      const fakeDeleteUserByIdDB = sandbox.stub(mod, "deleteUserByIdDB").returns(Promise.resolve(true))

      try {
        const response = await deleteUserById(userToFetch)
        logger.debug(JSON.stringify(response))

        chai.assert.exists(response, "Should get a valid response from DB")
        chai.assert.isTrue(response, "Should get true response from DB")
        chai.assert.isTrue(fakeDeleteUserByIdDB.calledOnce)
      } catch (err) {
        logger.debug(`Error occurred in services > user > index > deleteUserById: ${err}`)
        chai.assert.fail("Fail - Unable to delete the user")
      }
    })
  })

  describe("services > user > index > transfertMoney", () => {
    afterEach(() => {
      sandbox.restore()
    })
    it("should transfer money", async () => {
      try {
        const res = await transfertMoney(moneyTypes.soft_currency, "35269564-0234-11ed-b939-0242ac120002", "68965564-0234-11ed-b939-0242ac120002", 5)
        // logger.debug(JSON.stringify(response))

        chai.assert.exists(res, "Should transfer money")
      } catch (err) {
        logger.debug(`Error occurred in services > user > index > transfertMoney: ${err}`)
        chai.assert.fail("Fail - The transaction should go through")
      }
    })
  })
})
