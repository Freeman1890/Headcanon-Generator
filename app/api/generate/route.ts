import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Live API：调用 Gemini 2.0 Flash-Lite 实时生成 Headcanon
 * TODO: 接入 Context Caching 以降低 API 成本
 */
export async function POST(request: NextRequest) {
  try {
    const { characterName, workName } = await request.json();

    if (!characterName?.trim()) {
      return NextResponse.json(
        { error: "Character name is required" },
        { status: 400 }
      );
    }

    // TODO: Integrate Gemini 2.0 Flash-Lite
     import { GoogleGenerativeAI } from "@google/generative-ai";
     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
     const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
     const result = await model.generateContent(prompt);

    // Temporary mock response
    const mockContent = `Headcanon for ${characterName}:\n\n${characterName} has a hidden side ${workName ? `in ${workName}` : "in the story"}. They do small things in private that contrast with their usual image — these details make the character more dimensional and give fan creators room to explore.`;

    return NextResponse.json({
      id: `gen-${Date.now()}`,
      characterName: characterName.trim(),
      workName: workName?.trim() || undefined,
      content: mockContent,
      shareUrl: `/share/${encodeURIComponent(characterName.trim())}`,
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Generation failed. Please try again later." },
      { status: 500 }
    );
  }
}
