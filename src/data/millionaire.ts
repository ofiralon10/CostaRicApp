export interface MillionaireQ {
  question: string
  questionEn: string
  options: [string, string, string, string]
  optionsEn: [string, string, string, string]
  correct: number
}

import { easyQuestions1 } from './millionaire-easy-1'
import { easyQuestions2 } from './millionaire-easy-2'
import { mediumQuestions } from './millionaire-medium'
import { hardQuestions } from './millionaire-hard'

export const millionaireEasy: MillionaireQ[] = [...easyQuestions1, ...easyQuestions2]
export const millionaireMedium: MillionaireQ[] = mediumQuestions
export const millionaireHard: MillionaireQ[] = hardQuestions
