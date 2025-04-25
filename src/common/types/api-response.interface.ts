export interface IApiMessage {
  content: string[]
  displayable: boolean
}

export interface IApiRes<T> {
  success: boolean
  message: IApiMessage
  data: T | T[] | null
}
