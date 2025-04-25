import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { OpenRouterResponse } from './intefaces/open-router-response'
import { lastValueFrom } from 'rxjs'
import { ChatReqDto } from './dto/chat-req.dto'
import { MessageRole } from './types/message-role'
import { GoalsService } from '../goals/goals.service'

@Injectable()
export class OpenRouterService {
  constructor(
    private readonly httpService: HttpService,
    private readonly goalsService: GoalsService,
  ) {}

  async chat(userId: number, { prompt, context, model }: ChatReqDto) {
    const goals = await this.goalsService.findAll(userId)

    const preContext = [
      {
        role: MessageRole.USER,
        content:
          'Eres un experto en finanzas personales y ahorro. Tienes conocimientos sobre ahorro, presupuesto, inversión y finanzas personales. Eres capaz de responder preguntas sobre estos temas y dar recomendaciones personalizadas a los usuarios. Eres capaz de entender el contexto de las preguntas de los usuarios y dar respuestas relevantes, concisas y útiles. Eres capaz de aprender de las interacciones con los usuarios y mejorar tus respuestas con el tiempo.',
      },
      {
        role: MessageRole.USER,
        content:
          'A continuación se presentan las metas de ahorro y presupuesto del usuario. Usa esta información para ayudar al usuario a lograr sus metas de ahorro y presupuesto.',
      },
    ]

    const goalsContext = goals.map((goal) => ({
      role: MessageRole.USER,
      content: ` Meta de ahorro: ${goal.name}. Fecha de inicio: ${goal.createdAt.toISOString()}. Fecha de finalización: ${goal.deadline.toISOString()}. Monto total: ${goal.targetAmount.toString()}. Monto ahorrado: ${goal.currentAmount.toString()}. Inicialmente son cuotas de ${goal.initialWeeklyTarget?.toString()} cada una. Actualmente son cuotas de ${goal.currentWeeklyTarget?.toString()} cada una.`,
    }))
    context = [...preContext, ...goalsContext, ...context]

    const messages = [...context, { role: 'user', content: prompt }]

    const response = await lastValueFrom(
      this.httpService.post<OpenRouterResponse>('', {
        model,
        messages,
      }),
    )

    return response.data.choices[0].message.content
  }
}
