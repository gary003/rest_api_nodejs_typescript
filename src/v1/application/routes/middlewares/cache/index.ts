import { Response, Request } from "express"
import { getValueFromKey } from "../../servicesData/redis"

// Cache middleware
export const cacheMiddleware = async (req: Request, res: Response, next: any) => {
  const { username } = req.params

  const numRepos = await getValueFromKey(username).catch(console.log)

  if (!numRepos) return next()

  console.log("fetching data from Redis...")

  return res.status(200).send(`<h2>Redis: ${username} has ${numRepos} repositories.</h2>`)
}
