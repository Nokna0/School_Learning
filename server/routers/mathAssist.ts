import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc.js";
import { chatJSON, isAiEnabled, aiDisabledReason } from "../_core/ai.js";

export interface QuestionHelpResult {
  keyConcepts: string[];
  approachSteps: string[];
  cautionPoints: string[];
  phraseExplanations: { phrase: string; meaning: string }[];
}

export const mathAssistRouter = router({
  questionHelp: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1),
      }),
    )
    .mutation(async ({ input }): Promise<QuestionHelpResult> => {
      if (!isAiEnabled()) {
        return {
          keyConcepts: [aiDisabledReason()],
          approachSteps: [
            "AI 공급자 설정을 완료하면 문제 접근 가이드가 생성됩니다.",
          ],
          cautionPoints: [],
          phraseExplanations: [],
        };
      }

      const result = await chatJSON<QuestionHelpResult>({
        system:
          "You are a Korean math tutor. Given a math problem, guide the student on HOW to approach it without giving the final answer. " +
          'Respond with JSON in Korean: {"keyConcepts": string[] (핵심 개념), ' +
          '"approachSteps": string[] (접근 단계), "cautionPoints": string[] (주의할 점), ' +
          '"phraseExplanations": [{"phrase": string, "meaning": string}] (문제 속 표현 해석)}.',
        user: `다음 수학 문제의 접근 방법을 알려줘 (정답은 알려주지 마):\n\n${input.text}`,
      });

      return {
        keyConcepts: result.keyConcepts ?? [],
        approachSteps: result.approachSteps ?? [],
        cautionPoints: result.cautionPoints ?? [],
        phraseExplanations: result.phraseExplanations ?? [],
      };
    }),
});
