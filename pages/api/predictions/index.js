import { NextResponse } from "next/server";
import Replicate from "replicate";
import packageData from "../../../package.json";

async function getObjectFromRequestBodyStream(body) {
  const input = await body.getReader().read();
  const decoder = new TextDecoder();
  const string = decoder.decode(input.value);
  return JSON.parse(string);
}

const WEBHOOK_HOST = "https://scribble-tattzy.vercel.app";

export default async function handler(req) {
  const input = await getObjectFromRequestBodyStream(req.body);

  const { replicate_api_token, ...restInput } = input;

  const token = replicate_api_token || process.env.REPLICATE_API_TOKEN;

  const replicate = new Replicate({
    auth: token,
    userAgent: `${packageData.name}/${packageData.version}`,
  });

  // Your LoRA model with Flux - using lineart
  const prediction = await replicate.predictions.create({
    version: "4e8f6c1dc77db77dabaf98318cde3679375a399b434ae2db0e698804ac84919c",
    input: {
      prompt: `TA-TTT-OO-ME ${restInput.prompt}`,
      lineart_image: restInput.image,
      lineart_strength: 0.6,
      lineart_detector_type: "lineart",
      guidance_scale: 3.5,
      steps: 8,
      seed: Math.floor(Math.random() * 1000000),
    },
    webhook: `${WEBHOOK_HOST}/api/replicate-webhook`,
    webhook_events_filter: ["start", "completed"],
  });

  if (prediction?.error) {
    return NextResponse.json({ detail: prediction.error }, { status: 500 });
  }

  return NextResponse.json(prediction, { status: 201 });
}

export const config = {
  runtime: "edge",
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};