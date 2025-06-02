import { Request, Response } from "express";
import { OpenAI } from "openai";
import asyncHandler from "../middleware/asyncHandler";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const openaiController = asyncHandler(async (req: Request, res: Response) => {
  const { messages, max_tokens, temperature } = req.body;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    max_tokens,
    temperature,
  });

  res.status(200).json({
    success: true,
    data: response.choices[0].message.content,
  });
});

// example of messages:
// [
//   {
//     role: "user",
//     content: "Hello, how are you?"
//   }
// ]

// example of request:
// {
//   "messages": [
//     {
//       "role": "user",
//       "content": "Hello, how are you?"
//     }
//   ],
//   "max_tokens": 100,
//   "temperature": 0
// }
