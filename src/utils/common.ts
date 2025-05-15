import { ICallScript, IQuestion } from "../types/common"

export const blandAIAnalyzePromptGenerator = ( concatenatedTranscript: string,
    questions: IQuestion[]) : string => {
        return `
        “You are an intelligent hiring assistant. I will pass you the following:
            •	Transcript: Full transcript of a voice call between the candidate and the AI agent.
            •	Questions: List of questions asked in the interview.
            •	Expected Answers: What a good answer should ideally include.
        
        Your task is to do the following:
            1.	Perform emotional analysis: Tone, confidence, hesitations, excitement, etc.
            2.	Evaluate each answer against the expected answer:
            •	How close was it? (give match score per question out of 10)
            •	Was anything important missed?
            •	What was well-answered?
            3.	Give a total match score out of 100.
            4.	Provide a summary of:
            •	Strengths
            •	Weaknesses
            •	Final decision: Strong Fit / Moderate Fit / Weak Fit (with reason)
            5.	Return the result in JSON format suitable for storing in a database.
        
        ⚠️ You must not assume what was not said. Only use what was said in the transcript.”
        
        ⸻
        
        📥 Example Input Structure:
        
        {
          "transcript": "Arun: Are you available to start immediately? \nCandidate: Yes, I am currently not working.\nArun: Why are you interested in this role?\nCandidate: I've read about the company and really like your mission around AI.",
          "questions": [
            "Are you available to start immediately?",
            "Why are you interested in this role?"
          ],
          "expectedAnswers": [
            "Yes, I am available immediately. I can start next week if required.",
            "I’ve researched the company, I align with the mission, and I’m passionate about AI and helping people."
          ]
        }
        ⸻
        
        🧠 What You’ll Get Back (Sample Output):
        
       {
          "emotionalAnalysis": {
            "confidence": "High",
            "tone": "Positive",
            "engagement": "Moderate"
          },
          "totalMatchScore": 80,
          "notes": "additional information",
          "summary": {
            "strengths": ["Confident tone", "Positive attitude"],
            "weaknesses": ["Some answers lacked depth"],
            "finalDecision": "Moderate Fit",
            "reason": "The candidate seems promising but can elaborate more on motivations."
        }
        
        
            concatenated_transcript: ${concatenatedTranscript},
            questions:  ${questions}`;
        
}

export const generateCallScript = (payload: ICallScript): string => {
  const {questions, companyName, name} = payload
  const questionText =  questions.map((q, index) => {
      return `
      Question ${index + 1}: ${q.questionText}, Please wait for the candidate's response. Analyze the tone and emotion of the response. Move to the next question.`;
  }).join('');

  const task  = `You are Arun, an AI calling assistant at ${companyName}, reaching out to job candidate on behalf of our hiring team. Candidate name is ${name}, Your role is to conduct a short pre-screening call to understand how serious and interested the candidate is in the role.  You will ask a set of predefined questions given below. These questions help assess basic qualifications, availability, and motivation.  As the candidate responds, you will: interested and fit the candidate is.  If the candidate asks you questions outside your scope, politely let them know someone from our team will follow up.  
      📌 Do not read the questions like a script. ✅ Instead, sound conversational. For example, instead of saying:  “What is your notice period?” Say: “Just to check — are you available to start right away, or do you have a notice period?`
  return task.concat(questionText);
};