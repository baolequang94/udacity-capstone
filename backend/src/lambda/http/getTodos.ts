import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import {
  decodeNextKey,
  encodeNextKey,
  getUserId,
  parseLimitParam
} from '../utils'
import { createLogger } from '../../utils/logger'
import { getTodos } from '../../businessLogic/todos'

const logger = createLogger('getTodos')

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing GetTodos event...')
    const userId = getUserId(event)

    const { limit, nextKey } = event.queryStringParameters

    const parsedLimit = parseLimitParam(limit) || 5
    const decodedNextKey = decodeNextKey(nextKey)

    try {
      const { Items, LastEvaluatedKey } = await getTodos(
        userId,
        parsedLimit,
        decodedNextKey
      )
      logger.info('Successfully retrieved todolist')
      return {
        statusCode: 200,
        body: JSON.stringify({
          items: Items,
          nextKey: encodeNextKey(LastEvaluatedKey)
        })
      }
    } catch (err) {
      logger.error(`Error: ${err.message}`)
      return {
        statusCode: 500,
        body: JSON.stringify({ err })
      }
    }
  }
)
handler.use(
  cors({
    credentials: true
  })
)
