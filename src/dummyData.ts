import { IQuestion } from "./types/common"

export const candidates = [
  {
    "id": 1,
    "name": "Alice Johnson",
    "phoneNumber": "+918107711622",
    "company": "arc"
  },
  // {
  //   "id": 2,
  //   "name": "Bhargav",
  //   "phoneNumber": "+17042227592",
  //   "company": "arc"
  // },
  {
    "id": 2,
    "name": "Dev",
    "phoneNumber": "+916284164462",
    "company": "Hr Agent io"
  },  
  {
    "id": 3,
    "name": "Riya",
    "phoneNumber": "+917568525429",
    "company": "Hr Agent io"
  },  
  {
    "id": 4,
    "name": "Riya",
    "phoneNumber": "+918617766165",
    "company": "Hr Agent io"
  },
]

export const questions : IQuestion[]= [
  // {
  //   "id": 1,
  //   "questionText": "Can you briefly introduce yourself and your background?",
  //   "expectation": "",
  // },
  // {
  //   "id": 2,
  //   "questionText": "Why are you looking for a new opportunity?",
  //   "expectation": ""
  // },
  // {
  //   "id": 3,
  //   "questionText": "What interests you about this role and our company?"
  // },
  // {
  //   "id": 4,
  //   "questionText": "What is your current notice period or availability to start?",
  //   "expectation": "immediate"
  // },
  {
    "id": 5,
    "questionText": "What are your salary expectations?",
    "expectation": "10lpa"
  },
  // {
  //   "id": 6,
  //   "questionText": "Are you open to working remotely, onsite, or in a hybrid setup?"
  // },
  // {
  //   "id": 7,
  //   "questionText": "Are you legally authorized to work in this country?"
  // },
  // {
  //   "id": 8,
  //   "questionText": "Have you applied to our company before or interviewed with us previously?"
  // },
  // {
  //   "id": 9,
  //   "questionText": "What type of work culture are you looking for?"
  // },
  // {
  //   "id": 10,
  //   "questionText": "Do you have any upcoming commitments that may affect your availability?"
  // }
]

export const blandAIPostCallResponse = {
  context: {
    id: "2x4pNXICwrJ7k8HmS7jSpBYCds7",
    ts: "2025-05-14T07:19:20.810Z",
    pipeline_id: null,
    workflow_id: "p_MOCpP7r",
    deployment_id: "d_xRsQZJeG",
    source_type: "COMPONENT",
    verified: false,
    hops: null,
    test: false,
    replay: false,
    owner_id: "o_kPIE11b",
    platform_version: "3.56.2",
    workflow_name: "RequestBin",
    resume: null,
    emitter_id: "hi_vmH1DpM",
    external_user_id: null,
    external_user_environment: null,
    trace_id: "2x4pNVxOWJ9NRTH5p2e4thSsIUp",
    project_id: "proj_e5seEzg",
  },
  event: {
    method: "POST",
    path: "/",
    query: {},
    client_ip: "172.71.194.252",
    url: "https://eoict3a33ptxtwr.m.pipedream.net/",
    headers: {
      "x-forwarded-for": "2a06:98c0:3600::103",
      host: "eoict3a33ptxtwr.m.pipedream.net",
      "content-length": "4589",
      "cf-ray": "93f8a07227cdc895-IAD",
      "cf-ew-via": "15",
      "content-type": "application/json",
      "cdn-loop": "cloudflare; loops=1; subreqs=1",
      "accept-encoding": "gzip, br",
      "accept-language": "*",
      "cf-visitor": '{"scheme":"https"}',
      "cf-worker": "bland.ai",
      "x-webhook-signature":
        "609878f6832381f4f4c6de64e80127ad9fd1949c0f65a0e7c3a0feaca4679272",
      "cf-connecting-ip": "2a06:98c0:3600::103",
      "sec-fetch-mode": "cors",
      "user-agent": "Bland/1.0",
      accept: "*/*",
    },
    body: {
      call_id: "2794a2b3-84b3-4941-b229-80eb206cb8b6",
      c_id: "2794a2b3-84b3-4941-b229-80eb206cb8b6",
      call_length: 0.933333333333333,
      batch_id: null,
      to: "+918107711622",
      from: "+19787758468",
      completed: true,
      created_at: "2025-05-14T07:17:36.289+00:00",
      inbound: false,
      queue_status: "complete",
      max_duration: 30,
      error_message: null,
      variables: {
        now: "Wednesday, May 14, 2025 12:17 AM",
        now_utc: "Wednesday, May 14, 2025 7:17 AM",
        short_from: "9787758468",
        short_to: "8107711622",
        from: "+19787758468",
        to: "+918107711622",
        call_id: "2794a2b3-84b3-4941-b229-80eb206cb8b6",
        phone_number: "+918107711622",
        country: "IN",
        state: "Rajasthan",
        language: "English",
        metadata: {
          questions: [
            {
              id: 5,
              questionText: "What are your salary expectations?",
              expectation: "10lpa",
            },
          ],
        },
        timestamp: "2025-05-14T00:17:55-07:00",
        timezone: "America/Los_Angeles",
      },
      answered_by: null,
      record: true,
      recording_url:
        "https://server.aws.dc5.bland.ai/v1/recordings/2794a2b3-84b3-4941-b229-80eb206cb8b6:aebedaa4-dafe-43e3-8710-f8837646d74d",
      metadata: {
        questions: [
          {
            id: 5,
            expectation: "10lpa",
            questionText: "What are your salary expectations?",
          },
        ],
      },
      summary:
        "The call was a brief screening interview between Arun from Arc's hiring team and Amrit, a job applicant. Amrit expressed salary expectations of 10 lakh per annum and confirmed availability to start immediately. Despite being given the opportunity, Amrit did not express any specific interest in the role or company, nor did they ask any questions about the position. The call ended with Arun informing Amrit that someone from the team would be in touch soon to discuss next steps.",
      price: 0.084,
      started_at: "2025-05-14T07:17:36.289Z",
      local_dialing: false,
      call_ended_by: "ASSISTANT",
      pathway_logs: null,
      analysis_schema: null,
      analysis: null,
      transferred_to: null,
      pathway_tags: [],
      recording_expiration: null,
      status: "completed",
      pathway_id: null,
      warm_transfer_calls: null,
      concatenated_transcript:
        "assistant: Hello Amrit, this is Arun from Arc's hiring team. I'm calling to discuss the role you've applied for and see if it's a good fit for you. Can you start by telling me a little about what you're looking for in terms of compensation - what are your salary expectations for this position? \n user: Okay. So my salary and proficiency is 10 lakh per annum. \n assistant: That's ten lakh per annum, got it. Just to check — are you available to start right away, or do you have a notice period? \n user: You can start right away. \n assistant: Great, thank you for letting me know. Is there anything in particular that drew you to this role or our company, or any questions about the position itself? \n user: Not for now. \n assistant: Well, thank you, Amrit, for taking the time to speak with me today. Someone from our team will be in touch with you soon to discuss the next steps. Have a great day and goodbye. \n agent-action: Ended call \n ",
      transcripts: [
        {
          id: 174481637,
          user: "assistant",
          text: "Hello Amrit, this is Arun from Arc's hiring team. I'm calling to discuss the role you've applied for and see if it's a good fit for you. Can you start by telling me a little about what you're looking for in terms of compensation - what are your salary expectations for this position?",
          created_at: "2025-05-14T07:17:56.96143+00:00",
        },
        {
          id: 174481812,
          user: "user",
          text: "Okay. So my salary and proficiency is 10 lakh per annum.",
          created_at: "2025-05-14T07:18:16.663813+00:00",
        },
        {
          id: 174481845,
          user: "assistant",
          text: "That's ten lakh per annum, got it. Just to check — are you available to start right away, or do you have a notice period?",
          created_at: "2025-05-14T07:18:20.358838+00:00",
        },
        {
          id: 174481899,
          user: "user",
          text: "You can start right away.",
          created_at: "2025-05-14T07:18:28.280516+00:00",
        },
        {
          id: 174481921,
          user: "assistant",
          text: "Great, thank you for letting me know. Is there anything in particular that drew you to this role or our company, or any questions about the position itself?",
          created_at: "2025-05-14T07:18:30.980117+00:00",
        },
        {
          id: 174482020,
          user: "user",
          text: "Not for now.",
          created_at: "2025-05-14T07:18:40.840848+00:00",
        },
        {
          id: 174482034,
          user: "assistant",
          text: "Well, thank you, Amrit, for taking the time to speak with me today. Someone from our team will be in touch with you soon to discuss the next steps. Have a great day and goodbye.",
          created_at: "2025-05-14T07:18:42.838342+00:00",
        },
        {
          id: 174482110,
          user: "agent-action",
          text: "Ended call",
          created_at: "2025-05-14T07:18:50.338249+00:00",
        },
      ],
      corrected_duration: "56",
      end_at: "2025-05-14T07:18:50.000Z",
      disposition_tag: "FOLLOW_UP_REQUIRED",
    },
  },
};



// {
//   phone_number: '+918107711622',
//   task: 'You are Riya, an AI calling assistant at hragent.io, reaching out to job candidates on behalf of our hiring team. Your role is to conduct a short pre-screening call to understand how serious and interested the candidate is in the role.  You will ask a set of predefined questions given below. These questions help assess basic qualifications, availability, and motivation.  As the candidate responds, you will: \n' +
//     '        •Record their answers. \n' +
//     '        •Analyze tone, emotion, and sentiment in their voice.\n' +
//     '        • Mark if a candidate skips a question or gives unclear responses. \n' +
//     '        •Based on the conversation, give a match score out of 100 indicating how interested and fit the candidate is.  If the candidate asks you questions outside your scope, politely let them know someone from our team will follow up.  \n' +
//     '        📌 Do not read the questions like a script. ✅ Instead, sound conversational. For example, instead of saying:  “What is your notice period?” Say: “Just to check — are you available to start right away, or do you have a notice period?\n' +
//     "        Question 1: Can you briefly introduce yourself and your background?, Please wait for the candidate's response. Analyze the tone and emotion of the response. Move to the next question.\n" +
//     "        Question 2: Why are you looking for a new opportunity?, Please wait for the candidate's response. Analyze the tone and emotion of the response. Move to the next question.\n" +
//     "        Question 3: What interests you about this role and our company?, Please wait for the candidate's response. Analyze the tone and emotion of the response. Move to the next question.\n" +
//     "        Question 4: What is your current notice period or availability to start?, Please wait for the candidate's response. Analyze the tone and emotion of the response. Move to the next question.\n" +
//     "        Question 5: What are your salary expectations?, Please wait for the candidate's response. Analyze the tone and emotion of the response. Move to the next question.\n" +
//     "        Question 6: Are you open to working remotely, onsite, or in a hybrid setup?, Please wait for the candidate's response. Analyze the tone and emotion of the response. Move to the next question.\n" +
//     "        Question 7: Are you legally authorized to work in this country?, Please wait for the candidate's response. Analyze the tone and emotion of the response. Move to the next question.\n" +
//     "        Question 8: Have you applied to our company before or interviewed with us previously?, Please wait for the candidate's response. Analyze the tone and emotion of the response. Move to the next question.\n" +
//     "        Question 9: What type of work culture are you looking for?, Please wait for the candidate's response. Analyze the tone and emotion of the response. Move to the next question.\n" +
//     "        Question 10: Do you have any upcoming commitments that may affect your availability?, Please wait for the candidate's response. Analyze the tone and emotion of the response. Move to the next question.",
//   record: true,
//   webhook_events: [ 'dynamic_data' ],
//   webhook: 'https://eoict3a33ptxtwr.m.pipedream.net'
// },

