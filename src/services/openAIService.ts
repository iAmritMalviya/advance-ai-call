import OpenAI from "openai";
import { IBlandAICallResponseEvaluation, IQuestion } from "../types/common";
import { logger } from "../utils/logger";
import { blandAIAnalyzePromptGenerator } from "../utils/common";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


export const analyzeResponse = async (
    concatenatedTranscript: string,
    questions: IQuestion[]
  ): Promise<IBlandAICallResponseEvaluation> => {
    try {
      const prompt = blandAIAnalyzePromptGenerator(concatenatedTranscript, questions);
  
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });
  
      const responseContent = completion.choices?.[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error("No content returned from OpenAI.");
      }
  
      const data =  JSON.parse(responseContent);
      console.log("🚀 ~ data:", data)
      return data;
    } catch (error: any) {
        if (error.code === 'model_not_found') {
            logger.error("Invalid model or missing access. Check model name or your OpenAI account.");
        }
      throw error;
    }
  };
