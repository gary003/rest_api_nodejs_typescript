import { OpenAPIObject } from 'openapi3-ts/oas31'

const API_VERSION = process.env.API_VERSION || '1.0.0'
const API_BASEPATH = process.env.API_BASEPATH || '/api/v1'
const API_PORT = process.env.API_PORT || 8080

const apiDocumentation: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'REST API nodejs typescript',
    description: 'REST API for user management and wallet transactions',
    version: API_VERSION,
    contact: {
      name: 'API Support',
      email: 'support@walletapi.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: `http://localhost:${API_PORT}${API_BASEPATH}`,
      description: 'Local development server'
    }
  ],
  components: {
    schemas: {
      User: {
        type: 'object',
        required: ['userId', 'firstname', 'lastname'],
        properties: {
          userId: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
            description: 'Unique identifier for the user'
          },
          firstname: {
            type: 'string',
            minLength: 2,
            example: 'John',
            description: 'The user first name'
          },
          lastname: {
            type: 'string',
            minLength: 2,
            example: 'Doe',
            description: 'The user s last name'
          },
          walletId: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440001',
            description: 'Associated wallet ID'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            example: 'Invalid request parameters'
          },
          details: {
            type: 'array',
            items: {
              type: 'string'
            },
            example: ['amount must be positive number']
          },
          code: {
            type: 'string',
            example: 'VALIDATION_ERROR'
          }
        }
      }
    }
  },
  paths: {
    '/user': {
      get: {
        tags: ['user'],
        summary: 'Get all users',
        description: 'Retrieves a list of all registered users with their wallet information',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/User'
                  }
                }
              }
            }
          },
          '401': {
            description: 'Unauthorized',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['user'],
        summary: 'Create new user',
        description: 'Registers a new user with initial wallet setup',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['firstname', 'lastname'],
                properties: {
                  firstname: {
                    $ref: '#/components/schemas/User/properties/firstname'
                  },
                  lastname: {
                    $ref: '#/components/schemas/User/properties/lastname'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'User created successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          }
        }
      }
    },
    '/user/stream': {
      get: {
        tags: ['user'],
        summary: 'Stream users',
        description: 'Real-time stream of user data updates',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Successful operation',
            content: {
              'text/event-stream': {
                schema: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          }
        }
      }
    },
    '/user/{userId}': {
      get: {
        tags: ['user'],
        summary: 'Get user by ID',
        description: 'Retrieves detailed information about a specific user',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: {
              $ref: '#/components/schemas/User/properties/userId'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Successful operation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['user'],
        summary: 'Delete user',
        description: 'Permanently removes a user and associated wallet',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: {
              $ref: '#/components/schemas/User/properties/userId'
            }
          }
        ],
        responses: {
          '204': {
            description: 'User deleted successfully'
          }
        }
      }
    },
    '/user/transfer': {
      post: {
        tags: ['user'],
        summary: 'Create transaction',
        description: 'Transfer funds between wallets',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
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
                    exclusiveMinimum: 0
                  },
                  currency: {
                    type: 'string',
                    description: 'Currency of the transfer'
                  }
                }
              }
            }
          }
        },
        responses: {
          '202': {
            description: 'Transaction accepted for processing',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    transactionId: {
                      type: 'string',
                      format: 'uuid'
                    },
                    status: {
                      type: 'string',
                      enum: ['PENDING', 'COMPLETED', 'FAILED']
                    }
                  }
                }
              }
            }
          },
          '422': {
            description: 'Business rule violation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
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
