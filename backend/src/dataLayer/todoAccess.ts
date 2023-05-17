import * as AWS from 'aws-sdk'
import { createLogger } from '../utils/logger'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem, TodoUpdate } from '../models'
const AWSXRay = require('aws-xray-sdk')

const XAWS = AWSXRay.captureAWS(AWS)
const logger = createLogger('todoAccess')

export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todosTable = process.env.TODOS_TABLE
  ) {}

  async getTodos(
    userId: string,
    limit: number,
    nextKey: object
  ): Promise<AWS.DynamoDB.DocumentClient.QueryOutput> {
    logger.info('Getting all todo items')
    const result = await this.docClient
      .query({
        TableName: this.todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        Limit: limit,
        ExclusiveStartKey: nextKey
      })
      .promise()

    return result
  }

  async createTodo(newTodo: TodoItem): Promise<TodoItem> {
    logger.info(`Creating new todo item: ${newTodo.todoId}`)
    await this.docClient
      .put({
        TableName: this.todosTable,
        Item: newTodo
      })
      .promise()
    return newTodo
  }

  async updateTodo(
    userId: string,
    todoId: string,
    updatedTodo: TodoUpdate
  ): Promise<void> {
    logger.info(`Updating a todo item: ${todoId}`)
    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: { userId, todoId },
        ConditionExpression: 'attribute_exists(todoId)',
        UpdateExpression: 'set #n = :n, dueDate = :due, done = :dn',
        ExpressionAttributeNames: { '#n': 'name' },
        ExpressionAttributeValues: {
          ':n': updatedTodo.name,
          ':due': updatedTodo.dueDate,
          ':dn': updatedTodo.done
        },
        ReturnValues: 'ALL_NEW'
      })
      .promise()

    // const toDoUpdatedItem = result.Attributes
    // logger.info(`Todo Updated Item: ${toDoUpdatedItem}`)
    // return toDoUpdatedItem as TodoUpdate
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    await this.docClient
      .delete({
        TableName: this.todosTable,
        Key: { userId, todoId }
      })
      .promise()
  }

  async saveImgUrl(
    userId: string,
    todoId: string,
    attachmentUrl: string
  ): Promise<void> {
    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: { userId, todoId },
        ConditionExpression: 'attribute_exists(todoId)',
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': attachmentUrl
        }
      })
      .promise()
  }

  async deleteImgUrl(userId: string, todoId: string): Promise<void> {
    await this.docClient
      .update({
        TableName: this.todosTable,
        Key: { userId, todoId },
        AttributeUpdates: {
          attachmentUrl: {
            Action: 'DELETE'
          }
        }
      })
      .promise()
  }
}
