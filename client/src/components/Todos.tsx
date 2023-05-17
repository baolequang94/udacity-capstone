import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import ReactPaginate from 'react-paginate'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader
} from 'semantic-ui-react'

import {
  createTodo,
  deleteTodo,
  getTodos,
  patchTodo,
  deletePhoto
} from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'

interface TodosProps {
  auth: Auth
  history: History
}

export type NextKey = null | string

interface TodosState {
  curPageIndex: number
  pages: NextKey[]
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
  keywordSeach: string
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    curPageIndex: 0,
    pages: [null],
    todos: [],
    newTodoName: '',
    loadingTodos: true,
    keywordSeach: ''
  }

  fetchTodos = async (startKey?: NextKey) => {
    const { todos, nextKey } = await getTodos(
      this.props.auth.getIdToken(),
      startKey
    )
    this.setState({
      pages: [...this.state.pages, nextKey],
      todos,
      loadingTodos: false
    })
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate
      })
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: ''
      })
    } catch {
      alert('Todo creation failed')
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter((todo) => todo.todoId !== todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoPhotoDelete = async (todoId: string) => {
    try {
      await deletePhoto(this.props.auth.getIdToken(), todoId)
      await this.fetchTodos()
    } catch {
      alert("Todo's photo deletion failed")
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  async componentDidMount() {
    try {
      await this.fetchTodos()
    } catch (e) {
      alert(`Failed to fetch todos: ${(e as Error).message}`)
    }
  }

  handlePaginate = () => {
    const newIndex = ++this.state.curPageIndex
    this.setState({
      curPageIndex: newIndex
    })
    this.fetchTodos(this.state.pages[newIndex])
  }

  render() {
    console.log(this.state)
    return (
      <div>
        <Header as="h1">TODOs</Header>

        {this.renderCreateTodoInput()}

        {this.renderTodos()}

        {this.renderPagination()}
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New task',
              onClick: this.onTodoCreate
            }}
            fluid
            actionPosition="left"
            placeholder="To change the world..."
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    return (
      <Grid padded>
        {this.state.todos.map((todo, pos) => {
          return (
            <Grid.Row key={todo.todoId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onTodoCheck(pos)}
                  checked={todo.done}
                />
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle">
                {todo.name}
              </Grid.Column>
              <Grid.Column width={3} floated="right">
                {todo.dueDate}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(todo.todoId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTodoDelete(todo.todoId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>

              {/* <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTodoPhotoDelete(todo.todoId)}
                  content={<span>Remove Image</span>}
                >
                  <Icon name="file image" />
                  <Icon name="caret down" />
                </Button>
              </Grid.Column> */}

              {todo.attachmentUrl && (
                <>
                  <Image src={todo.attachmentUrl} size="small" wrapped />
                  <Grid.Column width={1} floated="left">
                    <Button
                      icon
                      color="red"
                      onClick={() => this.onTodoPhotoDelete(todo.todoId)}
                      content={<span>Remove Image</span>}
                    >
                      <Icon name="file image" />
                      <Icon name="caret down" />
                    </Button>
                  </Grid.Column>
                </>
              )}
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  renderPagination() {
    return (
      <ReactPaginate
        nextLabel="next >"
        previousLabel="< previous"
        onPageChange={this.handlePaginate}
        pageCount={2}
        pageClassName="page-item-none"
        breakClassName="page-item-none"
        containerClassName="pagination"
        renderOnZeroPageCount={null}
        previousClassName="page-item"
        nextClassName="page-item"
      />
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
