import { userInfo } from '../../../infrastructure/persistance/user/dto'

export type apiResponseGetAllUserType = {
  data: userInfo[]
}

export type apiResponseGetUserType = {
  data: userInfo
}

export type apiResponseDeleteUserType = {
  data: boolean
}

export type apiResponseCreateUserType = apiResponseGetUserType
