export interface OpenRouterResponse {
  id: string
  provider: string
  model: string
  object: string
  created: number
  choices: Choice[]
  usage: Usage
}

export interface Choice {
  logprobs: null
  finish_reason: string
  native_finish_reason: string
  index: number
  message: Message
}

export interface Message {
  role: string
  content: string
  refusal: null
  reasoning: null
}

export interface Usage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}
