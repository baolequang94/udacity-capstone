import * as uuid from 'uuid'

import { TodoAccess } from '../dataLayer/todoAccess'
import { AttachmentUtils } from '../helpers/attachmentUtils'
import { TodoItem, TodoUpdate } from '../models'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'

const todoAccess = new TodoAccess()
const attachmentUtils = new AttachmentUtils()

export async function getTodos(
  userId: string,
  status: string
): Promise<TodoItem[]> {
  return todoAccess.getTodos(userId, status)
}

export async function createTodo(
  userId: string,
  newTodoData: CreateTodoRequest
): Promise<TodoItem> {
  const todoId = uuid.v4()
  const createdAt = new Date().toISOString()
  const done = false

  const newTodo: TodoItem = {
    todoId,
    userId,
    createdAt,
    done,
    ...newTodoData
  }
  return todoAccess.createTodo(newTodo)
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updatedTodo: TodoUpdate
): Promise<void> {
  return todoAccess.updateTodo(userId, todoId, updatedTodo)
}

export async function deleteTodo(
  userId: string,
  todoId: string
): Promise<void> {
  return todoAccess.deleteTodo(userId, todoId)
}

export async function createAttachmentPresignedUrl(
  userId: string,
  todoId: string
): Promise<string> {
  const attachmentUrl = attachmentUtils.getAttachmentUrl(todoId)
  await todoAccess.saveImgUrl(userId, todoId, attachmentUrl)
  console.log(`createSignedUrl ${todoId}`, userId)
  return attachmentUtils.getUploadUrl(todoId)
}

export async function deletePhoto(
  userId: string,
  todoId: string
): Promise<void> {
  await todoAccess.deleteImgUrl(userId, todoId)
  return attachmentUtils.deletePhotoFile(todoId)
}
