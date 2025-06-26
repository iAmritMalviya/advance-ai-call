import OpenAI from "openai";
import { IBlandAICallResponseEvaluation, IQuestion } from "../types/common";
import { logger } from "../utils/logger";
import { blandAIAnalyzePromptGenerator } from "../utils/common";

export const openai = new OpenAI({
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


export async function getEmbedding(text: string): Promise<number[]> {
    if (!text || text.length === 0) throw new Error('Input text is empty');
  
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.replace(/\n/g, ' '), 
    });
  
    const embedding = response.data[0]?.embedding;
    if (!embedding) throw new Error('No embedding returned from OpenAI');
  
    return embedding;
  }

  interface IExtractedResumeDetails{
    name: string,
    email: string,
    phone: string,
    titles: string[],
    totalExperience: number,
    state: string,
    city: string, 
    description: string
    location: string,
    skills: string[],
    industryKeywords: string[],
    degrees: string[],
    currentCompany: string,
    currentJobTitle: string,
    linkedin: string,
    github: string
  }

  export async function extractResumeData(text: string): Promise<IExtractedResumeDetails> {
    const systemPrompt = `
  You are a highly accurate resume parser.
  
  Given the resume text, extract the following details and return in JSON format:
  
  {
    "name": string,
    "email": string,
    "phone": string,
    "titles": string[],
    "totalExperience": number,
    "state": string,
    "city": string, 
    "description": string
    "location": string,
    "skills": string[],
    "degrees": string[],
    "industryKeywords": string[]
    "currentCompany": string,
    "currentJobTitle": string,
    "linkedin": string,
    "github": string
  }
  
  ⚠️ If a field is not found, return null or empty array. Keep keys consistent.
  Ensure skills are relevant technologies or tools. Education can include degree + institute.
  
  Return only valid JSON.
  `;
  
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    });
  
    const responseContent = response.choices?.[0]?.message?.content;
    try {
      const json = JSON.parse(responseContent!);
      return json;
    } catch (err) {
      console.error("Failed to parse JSON", err, responseContent);
      throw new Error("Invalid JSON returned by model");
    }
  }