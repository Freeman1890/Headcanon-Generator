import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const MAX_NAME_LENGTH = 80;
const UNSAFE_CONTENT_PATTERN =
  /\b(?:porn(?:ography)?|explicit sex|sexual assault|rape|incest|child sexual|self[- ]harm|suicide instructions|how to make (?:a )?(?:bomb|explosive)|drug recipe|hate speech)\b/i;

function containsUnsafeContent(value: string) {
  return value.length > 2000 || UNSAFE_CONTENT_PATTERN.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const characterName =
      typeof body.characterName === "string" ? body.characterName : "";
    const workName = typeof body.workName === "string" ? body.workName : "";

    if (!characterName.trim()) {
      return NextResponse.json(
        { error: "Character name is required" },
        { status: 400 }
      );
    }

    const charName = characterName.trim();
    const fandom = workName.trim();

    if (charName.length > MAX_NAME_LENGTH || fandom.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: "Character and fandom names must be 80 characters or fewer" },
        { status: 400 }
      );
    }

    if (containsUnsafeContent(`${charName} ${fandom}`)) {
      return NextResponse.json(
        { error: "Please use a general-audience character or fandom" },
        { status: 400 }
      );
    }

    let content = "";

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash-lite",
        });
        const prompt = `Write a short, general-audience fan headcanon for "${charName}"${fandom ? ` from "${fandom}"` : ""}. Use 2 or 3 plain English sentences. Make it specific, grounded, and easy to imagine in a scene. Avoid sales language, big claims, em dashes, and phrases like "hidden side", "more dimensional", or "room to explore". Do not include explicit sexual content, sexual content involving minors, hate, graphic violence, self-harm instructions, drug instructions, or instructions for illegal activity. If the request asks for unsafe content, return a brief refusal and a safe alternative.`;
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        content = text?.trim().replace(/[\u2013\u2014]/g, ",").slice(0, 800) || "";
        if (containsUnsafeContent(content)) {
          content = "";
        }
      } catch (apiError) {
        console.error("Gemini API error:", apiError);
      }
    }

    if (!content) {
      content = `Headcanon for ${charName}:\n\n${charName} keeps one small habit private${fandom ? ` in ${fandom}` : ""}. It is not dramatic. It is the kind of detail another character might notice once and remember later.`;
    }

    const shareParams = new URLSearchParams({
      headcanon: content,
    });

    if (fandom) {
      shareParams.set("work", fandom);
    }

    return NextResponse.json({
      id: `gen-${Date.now()}`,
      characterName: charName,
      workName: fandom || undefined,
      content,
      shareUrl: `/share/${encodeURIComponent(charName)}#${shareParams.toString()}`,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Generation failed. Please try again later." },
      { status: 500 }
    );
  }
}
