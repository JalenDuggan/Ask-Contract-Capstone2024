import { kv } from '@vercel/kv'
import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'
import axios from 'axios'
import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  const json = await req.json()
  let { messages, previewToken } = json
  const userId = (await auth())?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  if (previewToken) {
    openai.apiKey = previewToken
  }
  
  //console.log(messages)

  interface Message {
    role: string;
    content: string;
}

function convertMessages(messages: Message[]): string[][] {
    const convertedMessages: string[][] = [];

    let currentQuestion: string | null = null;
    let currentAnswer: string | null = null;

    for (let i = 0; i < messages.length-1; i++) {
      const message = messages[i];
      
      if (message.role === 'user') {
          if (currentQuestion !== null) {
              convertedMessages.push([currentQuestion, currentAnswer || '']);
          }
          currentQuestion = message.content.trim();
          currentAnswer = null;
      } else if (message.role === 'assistant') {
          if (currentQuestion !== null) {
              currentAnswer = message.content.trim();
          }
      }
  }

    // Push the last question with its answer to the result array
    if (currentQuestion !== null) {
        convertedMessages.push([currentQuestion, currentAnswer || '']);
    }

    return convertedMessages;
}

//console.log("-------")
const convertedMessages = convertMessages(messages);
//console.log(convertedMessages);
//console.log(messages[messages.length-1]["content"]);
// Example POST method implementation:
async function postData(url = "", data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: "POST", // *GET, POST, PUT, DELETE, etc.
    // mode: "cors", // no-cors, *cors, same-origin
    // cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
    // credentials: "same-origin", // include, *same-origin, omit
    headers: {
      "Content-Type": "application/json",
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: "follow", // manual, *follow, error
    referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data), // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}
let question: any
await postData("http://localhost:8080/api/chat", {
  
  "question": messages[messages.length-1]["content"],

  "history": convertedMessages}).then((data) => {
  question = data["text"]; // JSON data parsed by `data.json()` call
  console.log(question)
});
console.log(question)

messages = [{ role: 'user', content:`repeat this text back to me in markdown: ${question}`}]

// const backendResponse = await fetch('http://localhost:8080/api/chat', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({

  //     "question": messages[messages.length-1]["content"],
  //     "history": convertedMessages
  //   }),
  // });

  // if (!backendResponse.ok) {
  //   // Handle error if backend request fails
  //   return new Response('Error fetching response from backend', {
  //     status: 500
  //   });
  // }
  // backendResponse.json()
  // console.log(backendResponse.body)
  
  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.7,
    stream: true
  })

  const stream = OpenAIStream(res, {
    async onCompletion(completion) {
      const title = json.messages[0].content.substring(0, 100)
      const id = json.id ?? nanoid()
      const createdAt = Date.now()
      const path = `/chat/${id}`
      const payload = {

        id,
        title,
        userId,
        createdAt,
        path,
        messages: [
          [
            { role: 'user', content:`repeat this text back to me in text: ${question}`}
        ]
        ,
          {
            content: completion,
            role: 'assistant'
          }
        ]
      }

     console.log(payload)

      await kv.hmset(`chat:${id}`, payload)
      await kv.zadd(`user:chat:${userId}`, {
        score: createdAt,
        member: `chat:${id}`
      })
    }
  })

  return new StreamingTextResponse(stream)
}
