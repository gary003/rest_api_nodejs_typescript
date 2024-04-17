import * as modUserDB from "../../dataServices/typeorm/user"
import * as modWalletDB from "../../dataServices/typeorm/wallet"
import * as modUser from "../../services/user/index"
import * as modConnection from "../../dataServices/typeorm/connection/connectionFile"
import { moneyTypes } from "../../domain"
import { createSandbox, SinonSandbox } from "sinon"
import { describe, it } from "mocha"
import chai from "chai"
import { addCurrency, deleteUserById, getAllUsers, getUserWalletInfo, saveNewUser, transferMoney, transferMoneyParamsValidator, transferMoneyWithRetry } from "../../services/user/index"
import { moneyTransferParamsValidatorErrors, transferMoneyErrors, userFunctionsErrors, transferMoneyWithRetryErrors } from "../../services/user/error.dto"
import { QueryRunner } from "typeorm"
import { userInfo } from "../../dataServices/typeorm/user/dto"
import logger from "../../helpers/logger"

describe("Unit tests user", () => {
  let sandbox: SinonSandbox = createSandbox()

  describe("services > user > index > saveNewUser", () => {
    beforeEach(() => {
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

      const fakeSaveNewUserDB = sandbox.stub(modUserDB, "saveNewUserDB").returns(Promise.resolve(fakeUser))

      try {
        const response = await saveNewUser(fakeUser.userId, fakeUser.firstname, fakeUser.lastname)

        chai.assert.exists(response, "Should get the correct response")
        chai.assert.strictEqual(response.userId, fakeUser.userId, "Should get the correct userId")
        chai.assert.isTrue(fakeSaveNewUserDB.calledOnce)
      } catch (err) {
        chai.assert.fail("Should not happen - no error in catch expected")
      }
    })
    it("should fail creating a new user", async () => {
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

      const fakeSaveNewUserDB = sandbox.stub(modUserDB, "saveNewUserDB").rejects(null)
      const mockErrorLogger = sandbox.stub(logger, "error")

      try {
        await saveNewUser(fakeUser.userId, fakeUser.firstname, fakeUser.lastname)
        chai.assert.fail("Unexpected success")
      } catch (err) {
        const errInfo = JSON.parse(err.message)
        chai.assert.equal(errInfo.message, userFunctionsErrors.ErrorCreatingUser.message)
        sandbox.assert.calledOnce(fakeSaveNewUserDB)
        sandbox.assert.calledOnce(mockErrorLogger)
      }
    })
  })

  describe("services > user > index > addCurrency", () => {
    beforeEach(() => {
      sandbox.restore()
    })
    it("should succeed adding currency", async () => {
      const mockGetUserWalletInfo = sandbox.stub(modUserDB, "getUserWalletInfoDB").resolves({ Wallet: { walletId: "12345" } } as unknown as userInfo)
      const mockUpdateWalletByWalletId = sandbox.stub(modWalletDB, "updateWalletByWalletId").resolves(true)

      const amountToAdd = 150
      try {
        const res = await addCurrency("22ef5564-0234-11ed-b939-0242ac120002", moneyTypes.soft_currency, amountToAdd)
        chai.assert.isTrue(res)
        sandbox.assert.calledOnce(mockGetUserWalletInfo)
        sandbox.assert.calledOnce(mockUpdateWalletByWalletId)
      } catch (err) {
        // logger.debug(err)
        chai.assert.fail("Should not get an error")
      }
    })
    it("should fail (negative amount)", async () => {
      const amountToAdd = -55

      try {
        await addCurrency("22ef5564-0234-11ed-b939-0242ac120002", moneyTypes.soft_currency, amountToAdd)
        chai.assert.fail("Unexpected success")
      } catch (err) {
        chai.assert.isNotNull(err, "Should get an error")

        const errInfo = JSON.parse(err.message)
        // logger.debug(errInfo)
        chai.assert.equal(errInfo.message, moneyTransferParamsValidatorErrors.ErrorInvalidAmount.message)
      }
    })
    it("should fail (wrong currency type)", async () => {
      const amountToAdd = 150
      try {
        await addCurrency("22ef5564-0234-11ed-b939-0242ac120002", "fake_currency_type" as moneyTypes, amountToAdd)
        chai.assert.fail("Unexpected success - Should never happen")
      } catch (err) {
        // logger.debug(err)
        chai.assert.isNotNull(err, "Should get an error")
      }
    })
  })

  describe("services > user > index > getAllUsers", () => {
    beforeEach(() => {
      sandbox.restore()
    })
    it("should retrieve all the users from DB", async () => {
      try {
        const response = await getAllUsers()
        // logger.debug(JSON.stringify(response))

        chai.assert.isArray(response, "Should get the list in an array format")
      } catch (err) {
        // logger.debug(`Error occurred in services > user > index > getAllUsers: ${err}`)
        chai.assert.fail("Fail - Should retreive all users")
      }
    })
  })

  describe("services > user > index > getUserById", () => {
    beforeEach(() => {
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
        // logger.debug(`Error occurred in services > user > index > getUserById: ${err}`)
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
        const errorInfo = JSON.parse(err.message)
        // logger.debug(err)
        chai.assert.exists(err, "Should get an err from DB")
        chai.assert.equal(errorInfo.message, userFunctionsErrors.ErrorFetchingUserInfo.message)
      }
    })
  })

  describe("services > user > index > deleteUserById", () => {
    beforeEach(() => {
      sandbox.restore()
    })
    it("should delete a single user from DB by its id", async () => {
      const userToFetch: string = "22ef5564-0234-11ed-b939-0242ac120002"

      const mockDeleteUserByIdDB = sandbox.stub(modUserDB, "deleteUserByIdDB").returns(Promise.resolve(true))
      // const mockDeleteWalletByIdDB = sandbox.stub(modWalletDB, "").returns(Promise.resolve(true))

      try {
        const response = await deleteUserById(userToFetch)
        // logger.debug(JSON.stringify(response))

        chai.assert.exists(response, "Should get a valid response from DB")
        chai.assert.isTrue(response, "Should get true response from DB")
        chai.assert.isTrue(mockDeleteUserByIdDB.calledOnce)
        // chai.assert.isTrue(mockDeleteWalletByIdDB.calledOnce)
      } catch (err) {
        // logger.debug(`Error occurred in services > user > index > deleteUserById: ${err}`)
        chai.assert.fail("Fail - Unable to delete the user")
      }
    })
  })

  describe("services > user > index > transferMoneyParamsValidator", () => {
    beforeEach(() => {
      sandbox.restore()
    })
    it("Should return the 2 users info objects correctly", async () => {
      const validCurrency = moneyTypes.soft_currency
      const fakeUserGiver = {
        userId: "fake_22ef5564-0234-11ed-b939-0242ac120002",
        firstname: "fake_Eugene",
        lastname: "fake_Porter",
        Wallet: {
          walletId: "fake_515f73c2-027d-11ed-b939-0242ac120002",
          hardCurrency: 2000,
          softCurrency: 2000, // Sufficient funds
        },
      }

      const fakeUserRecipient = {
        userId: "fake_22ef5564-0234-11ed-b939-0242ac120002",
        firstname: "fake_Eugene",
        lastname: "fake_Porter",
        Wallet: {
          walletId: "fake_515f73c2-027d-11ed-b939-0242ac120002",
          hardCurrency: 2000,
          softCurrency: 2000,
        },
      }

      const mockFetchUserDB = sandbox.stub(modUserDB, "getUserWalletInfoDB")
      mockFetchUserDB.onFirstCall().resolves(fakeUserGiver)
      mockFetchUserDB.onSecondCall().resolves(fakeUserRecipient)

      const amount = 100

      const [giverUserInfo, recipientUserInfo] = await transferMoneyParamsValidator(validCurrency, fakeUserGiver.userId, fakeUserRecipient.userId, amount)

      chai.assert.isObject(giverUserInfo)
      chai.assert.isObject(recipientUserInfo)
    })
    it("Should throw an error for invalid currency type", async () => {
      const fakeUserGiver = {
        userId: "fake_22ef5564-0234-11ed-b939-0242ac120002",
        firstname: "fake_Eugene",
        lastname: "fake_Porter",
        wallet: {
          walletId: "fake_515f73c2-027d-11ed-b939-0242ac120002",
          hardCurrency: 2000,
          softCurrency: 2000,
        },
      }

      const fakeUserRecipient = {
        userId: "fake_22ef5564-0234-11ed-b939-0242ac120002",
        firstname: "fake_Eugene",
        lastname: "fake_Porter",
        wallet: {
          walletId: "fake_515f73c2-027d-11ed-b939-0242ac120002",
          hardCurrency: 2000,
          softCurrency: 2000,
        },
      }

      const mockFetchUserDB = sandbox.stub(modUserDB, "getUserWalletInfoDB")
      mockFetchUserDB.onFirstCall().resolves(fakeUserGiver)
      mockFetchUserDB.onSecondCall().resolves(fakeUserRecipient)

      const invalidCurrency = "invalid_currency"
      const amount = 100

      try {
        await transferMoneyParamsValidator(invalidCurrency as moneyTypes, fakeUserGiver.userId, fakeUserRecipient.userId, amount)
        chai.assert.fail("Expected error for invalid currency")
      } catch (err) {
        const errInfo = JSON.parse(err.message)
        chai.assert.equal(errInfo.message, moneyTransferParamsValidatorErrors.ErrorCurrencyType.message)
        sandbox.assert.notCalled(mockFetchUserDB)
      }
    })
    it("Should throw an error for insufficient funds", async () => {
      const validCurrency = moneyTypes.soft_currency
      const fakeUserGiver = {
        userId: "fake_22ef5564-0234-11ed-b939-0242ac120002",
        firstname: "fake_Eugene",
        lastname: "fake_Porter",
        Wallet: {
          walletId: "fake_515f73c2-027d-11ed-b939-0242ac120002",
          hardCurrency: 2000,
          softCurrency: 100, // Insufficient funds
        },
      }

      const fakeUserRecipient = {
        userId: "fake_22ef5564-0234-11ed-b939-0242ac120002",
        firstname: "fake_Eugene",
        lastname: "fake_Porter",
        Wallet: {
          walletId: "fake_515f73c2-027d-11ed-b939-0242ac120002",
          hardCurrency: 2000,
          softCurrency: 2000,
        },
      }

      const mockFetchUserDB = sandbox.stub(modUserDB, "getUserWalletInfoDB")
      mockFetchUserDB.onFirstCall().resolves(fakeUserGiver)
      mockFetchUserDB.onSecondCall().resolves(fakeUserRecipient)

      const amount = 200 // Attempt to transfer more than available

      try {
        await transferMoneyParamsValidator(validCurrency, fakeUserGiver.userId, fakeUserRecipient.userId, amount)
        chai.assert.fail("Expected error for insufficient funds")
      } catch (err) {
        const errInfo = JSON.parse(err.message)
        chai.assert.equal(errInfo.message, moneyTransferParamsValidatorErrors.ErrorInsufficientFunds.message)
        sandbox.assert.calledOnce(mockFetchUserDB)
      }
    })
    it("Should throw an error if retrieving giver user info fails", async () => {
      const validCurrency = moneyTypes.soft_currency
      const fakeUserRecipient = {
        userId: "fake_22ef5564-0234-11ed-b939-0242ac120002",
        firstname: "fake_Eugene",
        lastname: "fake_Porter",
        Wallet: {
          walletId: "fake_515f73c2-027d-11ed-b939-0242ac120002",
          hardCurrency: 2000,
          softCurrency: 2000,
        },
      }

      const fakeUserGiver = {
        // Define fake giver object but don't use it
        userId: "fake_giver_id",
        firstname: "fake_Eugene",
        lastname: "fake_Porter",
        Wallet: {
          walletId: "fake_515f73c2-027d-11ed-b939-0242ac120002",
          hardCurrency: 2000,
          softCurrency: 2000,
        },
      }

      const mockFetchUserDB = sandbox.stub(modUserDB, "getUserWalletInfoDB")
      mockFetchUserDB.onFirstCall().rejects(null)
      mockFetchUserDB.onSecondCall().rejects(null)

      const amount = 100

      try {
        await transferMoneyParamsValidator(validCurrency, "fake_giver_id", fakeUserRecipient.userId, amount) // Use a fake giver ID
        chai.assert.fail("Expected error retrieving giver user info")
      } catch (err) {
        const errInfo = JSON.parse(err.message)
        chai.assert.equal(errInfo.message, moneyTransferParamsValidatorErrors.ErrorUserInfo.message) // Verify specific error message
        sandbox.assert.calledOnce(mockFetchUserDB)
      }
    })
    it("Should throw an error if retrieving receiver user info fails", async () => {
      const validCurrency = moneyTypes.soft_currency
      const fakeUserRecipient = {
        userId: "fake_22ef5564-0234-11ed-b939-0242ac120002",
        firstname: "fake_Eugene",
        lastname: "fake_Porter",
        Wallet: {
          walletId: "fake_515f73c2-027d-11ed-b939-0242ac120002",
          hardCurrency: 2000,
          softCurrency: 2000,
        },
      }

      const fakeUserGiver = {
        // Define fake giver object but don't use it
        userId: "fake_giver_id",
        firstname: "fake_Eugene",
        lastname: "fake_Porter",
        Wallet: {
          walletId: "fake_515f73c2-027d-11ed-b939-0242ac120002",
          hardCurrency: 2000,
          softCurrency: 2000,
        },
      }

      const mockFetchUserDB = sandbox.stub(modUserDB, "getUserWalletInfoDB")
      mockFetchUserDB.onFirstCall().resolves(fakeUserGiver)
      mockFetchUserDB.onSecondCall().rejects(null)

      const amount = 100

      try {
        await transferMoneyParamsValidator(validCurrency, "fake_giver_id", fakeUserRecipient.userId, amount) // Use a fake giver ID
        chai.assert.fail("Expected error retrieving giver user info")
      } catch (err) {
        const errInfo = JSON.parse(err.message)
        chai.assert.equal(errInfo.message, moneyTransferParamsValidatorErrors.ErrorUserInfo.message) // Verify specific error message
        sandbox.assert.calledTwice(mockFetchUserDB)
      }
    })
  })

  describe("services > user > index > transferMoney", () => {
    beforeEach(() => {
      sandbox.restore()
    })
    it("Successful transfer", async () => {
      // Mock all the dependent functions
      const mockTransferMoneyParamsValidator = sandbox.stub(modUser, "transferMoneyParamsValidator").resolves([{ Wallet: { walletId: "1234", softCurrency: 123 } }, { Wallet: { walletId: "4321", softCurrency: 300 } }] as unknown as userInfo[])
      const mockCreateAndStartTransaction = sandbox.stub(modConnection, "createAndStartTransaction").resolves({ someTransactionObject: true } as unknown as QueryRunner)
      const mockAcquireLockOnWallet = sandbox.stub(modConnection, "acquireLockOnWallet").resolves(true)
      const mockUpdateWalletByWalletIdTransaction = sandbox.stub(modWalletDB, "updateWalletByWalletIdTransaction").resolves(true) // Assuming update functions return success indicator (modify as needed)
      const mockRollBackAndQuitTransactionRunner = sandbox.stub(modConnection, "rollBackAndQuitTransactionRunner")
      const mockCommitAndQuitTransactionRunner = sandbox.stub(modConnection, "commitAndQuitTransactionRunner")
      const mockErrorLogger = sandbox.stub(logger, "error")

      // Call the transferMoneyWithRetry function
      const result = await transferMoney(moneyTypes.soft_currency, "giver123", "recipient456", 100)

      // Verify all the mocked functions were called as expected
      sandbox.assert.calledOnce(mockTransferMoneyParamsValidator)
      sandbox.assert.calledWithExactly(mockTransferMoneyParamsValidator, moneyTypes.soft_currency, "giver123", "recipient456", 100)

      sandbox.assert.calledOnce(mockCreateAndStartTransaction)

      sandbox.assert.calledTwice(mockAcquireLockOnWallet)
      sandbox.assert.calledWith(mockAcquireLockOnWallet, { someTransactionObject: true } as unknown as QueryRunner, "1234") // Replace with actual wallet ID logic
      sandbox.assert.calledWith(mockAcquireLockOnWallet, { someTransactionObject: true } as unknown as QueryRunner, "4321") // Replace with actual wallet ID logic

      sandbox.assert.calledTwice(mockUpdateWalletByWalletIdTransaction)
      // Replace these assertions with the expected arguments and return values based on your implementation
      sandbox.assert.calledWith(mockUpdateWalletByWalletIdTransaction, { someTransactionObject: true } as unknown as QueryRunner, "1234", moneyTypes.soft_currency, 23)
      sandbox.assert.calledWith(mockUpdateWalletByWalletIdTransaction, { someTransactionObject: true } as unknown as QueryRunner, "4321", moneyTypes.soft_currency, 400)

      sandbox.assert.notCalled(mockRollBackAndQuitTransactionRunner) // No rollback expected in successful case

      sandbox.assert.calledOnce(mockCommitAndQuitTransactionRunner)

      sandbox.assert.notCalled(mockErrorLogger)

      // Expect the result to be true (successful transfer)
      chai.assert.isTrue(result)
    })

    it("Transfer failure due to transferMoneyParamsValidator error", async () => {
      const mockTransferMoneyParamsValidator = sandbox.stub(modUser, "transferMoneyParamsValidator").throws(new Error("Validation Error"))
      const mockCreateAndStartTransaction = sandbox.stub(modConnection, "createAndStartTransaction").resolves({ someTransactionObject: true } as unknown as QueryRunner)

      try {
        await transferMoney(moneyTypes.soft_currency, "giver123", "recipient456", 100)
        // Should not reach here if transferMoneyParamsValidator throws
        chai.assert.fail("Unexpected successful transfer")
      } catch (err) {
        chai.assert.equal(err.message, "Validation Error")
        sandbox.assert.calledOnce(mockTransferMoneyParamsValidator)
        sandbox.assert.notCalled(mockCreateAndStartTransaction)
      }
    })
    it("Transfer failure due to createAndStartTransaction error", async () => {
      const mockTransferMoneyParamsValidator = sandbox.stub(modUser, "transferMoneyParamsValidator").resolves([{}, {}] as unknown as userInfo[])
      const mockCreateAndStartTransaction = sandbox.stub(modConnection, "createAndStartTransaction").rejects(new Error("Transaction Error"))
      const mockAcquireLockOnWallet = sandbox.stub(modConnection, "acquireLockOnWallet")
      const mockErrorLogger = sandbox.stub(logger, "error")

      try {
        await transferMoney(moneyTypes.soft_currency, "giver123", "recipient456", 100)
        chai.assert.fail("Unexpected successful transfer")
      } catch (err) {
        const errInfo = JSON.parse(err.message)
        chai.assert.equal(errInfo.message, transferMoneyErrors.ErrorTransactionCreation.message)
        sandbox.assert.calledOnce(mockTransferMoneyParamsValidator)
        sandbox.assert.calledOnce(mockCreateAndStartTransaction)
        sandbox.assert.called(mockErrorLogger)
        sandbox.assert.notCalled(mockAcquireLockOnWallet)
      }
    })
    it("Transfer failure due to acquireLockOnWallet failure (giver)", async () => {
      const mockTransferMoneyParamsValidator = sandbox.stub(modUser, "transferMoneyParamsValidator").resolves([{ Wallet: { walletId: "1234", softCurrency: 123 } }, { Wallet: { walletId: "4321", softCurrency: 300 } }] as unknown as userInfo[])
      const mockCreateAndStartTransaction = sandbox.stub(modConnection, "createAndStartTransaction").resolves({ someTransactionObject: true } as unknown as QueryRunner)
      const mockAcquireLockOnWallet = sandbox.stub(modConnection, "acquireLockOnWallet")
      mockAcquireLockOnWallet.onFirstCall().resolves(false)
      mockAcquireLockOnWallet.onSecondCall().resolves(true)
      const mockUpdateWalletByWalletIdTransaction = sandbox.stub(modWalletDB, "updateWalletByWalletIdTransaction").resolves(true) // Assuming update functions return success indicator (modify as needed)
      const mockErrorLogger = sandbox.stub(logger, "error")

      try {
        await transferMoney(moneyTypes.soft_currency, "giver123", "recipient456", 100)
        // Should not reach here if acquireLockOnWallet fails
        chai.assert.fail("Unexpected successful transfer")
      } catch (err) {
        const errorInfo = JSON.parse(err.message)
        chai.assert.equal(errorInfo.message, transferMoneyErrors.ErrorLockAcquisition.message)
        sandbox.assert.calledOnce(mockTransferMoneyParamsValidator)
        sandbox.assert.calledOnce(mockCreateAndStartTransaction)
        sandbox.assert.called(mockErrorLogger)
        sandbox.assert.calledTwice(mockAcquireLockOnWallet)
        sandbox.assert.calledWith(mockAcquireLockOnWallet, { someTransactionObject: true } as unknown as QueryRunner, "1234") // Replace with actual logic
        sandbox.assert.calledWith(mockAcquireLockOnWallet, { someTransactionObject: true } as unknown as QueryRunner, "4321") // Replace with actual logic
        sandbox.assert.notCalled(mockUpdateWalletByWalletIdTransaction) // Not called due to earlier error
      }
    })
    it("Transfer failure due to acquireLockOnWallet failure (recipient)", async () => {
      const mockTransferMoneyParamsValidator = sandbox.stub(modUser, "transferMoneyParamsValidator").resolves([{ Wallet: { walletId: "1234", softCurrency: 123 } }, { Wallet: { walletId: "4321", softCurrency: 300 } }] as unknown as userInfo[])
      const mockCreateAndStartTransaction = sandbox.stub(modConnection, "createAndStartTransaction").resolves({ someTransactionObject: true } as unknown as QueryRunner)
      const mockAcquireLockOnWallet = sandbox.stub(modConnection, "acquireLockOnWallet")
      mockAcquireLockOnWallet.onFirstCall().resolves(true)
      mockAcquireLockOnWallet.onSecondCall().resolves(false)
      const mockUpdateWalletByWalletIdTransaction = sandbox.stub(modWalletDB, "updateWalletByWalletIdTransaction").resolves(true) // Assuming update functions return success indicator (modify as needed)
      const mockErrorLogger = sandbox.stub(logger, "error")

      try {
        await transferMoney(moneyTypes.soft_currency, "giver123", "recipient456", 100)
        // Should not reach here if update fails
        chai.assert.fail("Unexpected successful transfer")
      } catch (err) {
        const errorInfo = JSON.parse(err.message)
        chai.assert.equal(errorInfo.message, transferMoneyErrors.ErrorLockAcquisition.message)
        sandbox.assert.calledOnce(mockTransferMoneyParamsValidator)
        sandbox.assert.calledOnce(mockCreateAndStartTransaction)
        sandbox.assert.called(mockErrorLogger)
        sandbox.assert.calledTwice(mockAcquireLockOnWallet)
        sandbox.assert.calledWith(mockAcquireLockOnWallet, { someTransactionObject: true } as unknown as QueryRunner, "1234")
        sandbox.assert.calledWith(mockAcquireLockOnWallet, { someTransactionObject: true } as unknown as QueryRunner, "4321")
        sandbox.assert.notCalled(mockUpdateWalletByWalletIdTransaction)
      }
    })
  })

  describe("services > user > index > transferMoneyWithRetry", () => {
    beforeEach(() => {
      sandbox.restore()
    })
    it("Successful transfer (no retry)", async () => {
      // Mock the transferMoney function to always succeed
      const mockTransferMoney = sandbox.stub(modUser, "transferMoney").resolves(true)

      // Call the transferMoneyWithRetry function
      const result = await transferMoneyWithRetry(moneyTypes.soft_currency, "giver123", "recipient456", 100, 300)

      // Verify the transferMoney function was called once
      sandbox.assert.calledOnce(mockTransferMoney)
      sandbox.assert.calledWithExactly(mockTransferMoney, moneyTypes.soft_currency, "giver123", "recipient456", 100)

      // Expect the result to be true (successful transfer)
      chai.assert.isTrue(result)
    })
    it("Successful transfer (with 1 retry)", async () => {
      // Mock the transferMoney function to fail twice and succeed on the third try
      const mockTransferMoney = sandbox.stub(modUser, "transferMoney")
      mockTransferMoney.onFirstCall().rejects(new Error("Error - Lock - Network error"))
      mockTransferMoney.onSecondCall().resolves(true)
      const mockWarnLogger = sandbox.stub(logger, "warn")

      // Call the transferMoneyWithRetry function
      const result = await transferMoneyWithRetry(moneyTypes.soft_currency, "giver123", "recipient456", 100, 300)

      // Verify the transferMoney function was called three times
      sandbox.assert.calledTwice(mockTransferMoney)
      sandbox.assert.calledWithExactly(mockTransferMoney, moneyTypes.soft_currency, "giver123", "recipient456", 100)
      sandbox.assert.calledOnce(mockWarnLogger)

      // Expect the result to be true (successful transfer after retry)
      chai.assert.isTrue(result)
    })
    it("Failure - Transfer fail (non-retryable error)", async () => {
      // Mock the transferMoney function to throw a non-retryable error
      const mockTransferMoney = sandbox.stub(modUser, "transferMoney").throws(new Error("Insufficient funds"))

      // Call the transferMoneyWithRetry function
      try {
        await transferMoneyWithRetry(moneyTypes.soft_currency, "giver123", "recipient456", 100, 300)
      } catch (err) {
        chai.assert(err.message.includes("Insufficient funds"))
        sandbox.assert.calledOnce(mockTransferMoney)
        chai.assert(mockTransferMoney.calledWithExactly(moneyTypes.soft_currency, "giver123", "recipient456", 100))
      }
    })
    it("Failure - Transfer fail (with retryable error followed by non-retryable error)", async () => {
      // Mock the transferMoney function to fail twice and succeed on the third try
      const mockTransferMoney = sandbox.stub(modUser, "transferMoney")
      mockTransferMoney.onFirstCall().throws(new Error("Error - Lock - Network error"))
      mockTransferMoney.onSecondCall().throws(new Error("Network error"))
      mockTransferMoney.onThirdCall().resolves(true)
      const mockWarnLogger = sandbox.stub(logger, "warn")

      // Call the transferMoneyWithRetry function
      try {
        await transferMoneyWithRetry(moneyTypes.soft_currency, "giver123", "recipient456", 100, 300)
      } catch (error) {
        chai.assert.isTrue(error.message.includes("Network error"))
        sandbox.assert.calledTwice(mockTransferMoney)
        sandbox.assert.calledWithExactly(mockTransferMoney, moneyTypes.soft_currency, "giver123", "recipient456", 100)
        sandbox.assert.calledOnce(mockWarnLogger)
      }
    })
    it("Failure - Transfer fail (Maximum retries exceeded)", async () => {
      const mockTransferMoney = sandbox.stub(modUser, "transferMoney")
      mockTransferMoney.onFirstCall().throws(new Error("Error - Lock - Network error"))
      mockTransferMoney.onSecondCall().throws(new Error("Error - Lock - Network error"))
      mockTransferMoney.onThirdCall().throws(new Error("Error - Lock - Network error"))
      // mockTransferMoney.onCall(4).throws(new Error("Error - Lock - Network error"))
      // mockTransferMoney.onCall(5).throws(new Error("Error - Lock - Network error"))
      // mockTransferMoney.onCall(6).throws(new Error("Error - Lock - Network error"))
      // mockTransferMoney.onCall(7).resolves(true)
      const mockWarnLogger = sandbox.stub(logger, "warn")

      // Call the transferMoneyWithRetry function
      const maxAttempt = 3
      const amountToTransfer = 130
      const delay = 10
      try {
        await transferMoneyWithRetry(moneyTypes.soft_currency, "giver123", "recipient456", amountToTransfer, delay, maxAttempt)
      } catch (err) {
        const errorInfo = JSON.parse(err.message)
        chai.assert.isTrue(errorInfo.message === transferMoneyWithRetryErrors.ErrorMaxRetry.message)
        sandbox.assert.callCount(mockTransferMoney, maxAttempt)
        sandbox.assert.calledWithExactly(mockTransferMoney, moneyTypes.soft_currency, "giver123", "recipient456", amountToTransfer)
        sandbox.assert.callCount(mockWarnLogger, maxAttempt)
      }
    })
  })
})
