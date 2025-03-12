import ip from 'ip'

const localIp = ip.address()

const apiDocumentation = {
  swagger: '2.0',
  host: `${localIp}:${process.env.API_PORT || 8080}`,
  basePath: '/api/v1',
  info: {
    title: 'rest_api_backend_user',
    version: '1'
  },
  schemes: ['http'],
  // use for model definition
  definitions: {
    User: {
      type: 'object',
      properties: {
        userId: {
          description: 'id of user',
          type: 'string'
        },
        walletId: {
          description: 'Each user have a wallet',
          type: 'string'
        },
        firstname: {
          description: 'firstname of the user',
          type: 'string'
        },
        lastname: {
          description: 'The user lastname',
          type: 'string'
        }
      },
      required: ['userId']
    }
  },
  paths: {
    '/user': {
      get: {
        tags: ['user'],
        summary: 'get all users',
        description: 'all users will be retrieve from DB',
        responses: {
          '200': {
            description: 'Successfuly get all users '
          }
        }
      },
      post: {
        tags: ['user'],
        summary: 'Save a new user in database',
        description: 'Save a new user in database',
        parameters: [
          {
            in: 'body',
            name: 'body',
            description: 'The user first and last name',
            required: true,
            schema: {
              type: 'object',
              properties: {
                firstname: {
                  description: 'User’s first name',
                  type: 'string'
                },
                lastname: {
                  description: 'User’s last name',
                  type: 'string'
                }
              },
              required: ['firstname', 'lastname']
            }
          }
        ],
        responses: {
          '200': {
            description: 'Successfully save new user'
          }
        }
      }
    },
    '/user/stream': {
      get: {
        tags: ['user'],
        summary: 'get all users from stream',
        description: 'all users will be retrieve from DB',
        responses: {
          '200': {
            description: 'Successfuly get all users with a stream '
          }
        }
      }
    },
    '/user/{userId}': {
      get: {
        tags: ['user'],
        summary: 'Get a single user',
        description: 'Get a user from DB by its id',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            type: 'string',
            description: 'Id of a user (user_id)'
          }
        ],
        responses: {
          '200': {
            description: 'Successfully get the requestesd user'
          }
        }
      },
      delete: {
        tags: ['user'],
        summary: 'delete a user by id',
        description: 'Delete a user by id',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            type: 'string',
            description: 'Id of a user (user_id)'
          }
        ],
        responses: {
          '200': {
            description: 'Successfully delete the requested user'
          }
        }
      }
    },
    '/user/transfer': {
      post: {
        tags: ['user'],
        summary: 'Transfer money between wallets',
        description: 'Transfer a specified amount of money from one wallet to another',
        parameters: [
          {
            in: 'body',
            name: 'body',
            description: 'Transfer details',
            required: true,
            schema: {
              type: 'object',
              required: ['senderId', 'receiverId', 'amount', 'currency'],
              properties: {
                senderId: {
                  type: 'string',
                  description: 'ID of the sender'
                },
                receiverId: {
                  type: 'string',
                  description: 'ID of the receiver'
                },
                amount: {
                  type: 'number',
                  description: 'Amount to transfer (must be positive)',
                  minimum: 0,
                  exclusiveMinimum: true
                },
                currency: {
                  type: 'string',
                  description: 'Currency of the transfer'
                }
              }
            }
          }
        ],
        responses: {
          '200': {
            description: 'Successfully transferred money',
            schema: {
              type: 'object',
              properties: {
                data: {
                  type: 'object',
                  description: 'Transfer result details'
                }
              }
            }
          },
          '400': {
            description: 'Bad request - Missing required fields or invalid amount',
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Missing required fields'
                }
              }
            }
          },
          '500': {
            description: 'Internal server error',
            schema: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Failed to transfer money'
                }
              }
            }
          }
        }
      }
    }
  }
}

export default apiDocumentation
