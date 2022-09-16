import { Router, Request, Response } from "express"
import { deleteUserById, getAllUsers, getUserWalletInfo, saveNewUser } from "../../services/user/index"

const userRouter = Router()

userRouter
  .route("/")
  .get(async (_: Request, res: Response) => {
    const results = await getAllUsers().catch((err) => console.log(err))

    if (!results) return res.status(500).json("Impossible to retreive any user")

    return res.status(200).json(results)
  })
  .post(async (req: Request, res: Response) => {
    const { userId, firstname, lastname } = req.body

    const result = await saveNewUser(userId, firstname, lastname).catch((err) => console.log(err))

    if (!result) return res.status(500).json("Impossible to save the new user")

    return res.status(200).json(result)
  })

userRouter
  .route("/:userId")
  .get(async (req: Request, res: Response) => {
    const result = await getUserWalletInfo(req.params.userId).catch((err) => console.log(err))

    if (!result) return res.status(500).json("Impossible to retreive any user")

    return res.status(200).json(result)
  })
  .delete(async (req: Request, res: Response) => {
    const result = await deleteUserById(req.params.userId).catch((err) => console.log(err))

    if (!result) return res.status(500).json("Impossible to delete the user")

    return res.status(200).json(result)
  })

export default userRouter
