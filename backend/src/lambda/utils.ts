import { APIGatewayProxyEvent } from 'aws-lambda'
import { parseUserId } from '../auth/utils'

/**
 * Get a user id from an API Gateway event
 * @param event an event from API Gateway
 *
 * @returns a user id from a JWT token
 */
export function getUserId(event: APIGatewayProxyEvent): string {
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  return parseUserId(jwtToken)
}

export function encodeNextKey(nextKey) {
  if (!nextKey) {
    return null
  }
  return encodeURIComponent(JSON.stringify(nextKey))
}

export function decodeNextKey(nextKey) {
  if (!nextKey) {
    return undefined
  }
  return JSON.parse(decodeURIComponent(nextKey))
}

export function parseLimitParam(paramLimit) {
  if (!paramLimit) {
    return undefined
  }

  const limit = parseInt(paramLimit, 10)

  if (limit <= 0) {
    throw new Error('limit must be positive')
  }

  return limit
}
