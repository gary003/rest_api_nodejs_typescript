export const validateUserIdParams = async (userId: unknown) => {
  if (typeof userId !== "string") throw new Error("userId params is not a string ")
  if (userId.length < 10) throw new Error("wrong length for ID string ")
  return String(userId)
}
