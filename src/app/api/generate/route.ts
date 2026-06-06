import { GoogleGenerativeAI } from "@google/generative-ai";
import { VOICE_LAYER, REFLECT_SYSTEM, RESEARCH_SYSTEM, TAMIL_ENFORCER } from "@/lib/voice-layer";
import { BusinessProfile } from "@/lib/profile";

// Support multiple Gemini API keys for rotation: when one key's quota is
// exhausted (429), the next key is tried automatically. Add as many as needed
// via GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3 …
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter((k): k is string => Boolean(k));

const geminiClients = GEMINI_KEYS.map((key) => new GoogleGenerativeAI(key));

// Module prompt configs
function getModulePrompt(
  module: string,
  phase: string,
  profile: BusinessProfile,
  answers: Record<string, string>,
  researchData?: string
): { system: string; user: string; temp: number; model: string } {
  const coachName = profile.coach.name || "Coach";
  const onb = profile.onboarding;

  // Reflect phase — same for all modules
  if (phase === "reflect") {
    const answersText = Object.entries(answers)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    return {
      system: REFLECT_SYSTEM,
      user: `Coach பெயர்: ${coachName}\nஅவர்களின் பதில்கள்:\n${answersText}\n\n⚠️ தமிழில் மட்டுமே respond செய்.`,
      temp: 0.3,
      model: "gemini-2.5-flash",
    };
  }

  // Research phase — used by ICP, Mind X-Ray, High-Impact Problems
  if (phase === "research") {
    const answersText = Object.entries(answers)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    const context = `Coach: ${coachName}\nNiche: ${onb.what_they_call_it || "life coach"}\nயாருக்கு உதவுகிறார்: ${onb.who_they_help}\nஎன்ன மாற்றம்: ${onb.the_change}`;

    const researchPrompts: Record<string, string> = {
      icp: `இந்த coaching niche-க்கான Indian market-ஐ research செய். Return JSON with: {"demographics": {"age_range": "", "income_band": "", "cities": "", "platforms": "", "job_titles": ""}, "market_data": {"avg_coaching_price_inr": "", "common_pains": [], "competitor_language": [], "where_they_hang_out": []}}.\n\nContext:\n${context}\nCoach answers:\n${answersText}`,
      mind_xray: `India-ல இந்த niche-ல உள்ள மக்களின் psychology மற்றும் emotional landscape-ஐ research செய். Return JSON with: {"common_fears": [], "common_desires": [], "buying_objections": [], "what_theyve_tried": [], "emotional_triggers": [], "real_soundbites": []}.\n\nContext:\n${context}\nICP: ${profile.icp.generated}\nCoach answers:\n${answersText}`,
      high_impact: `India-ல இந்த niche-ல உள்ள மக்களின் real costs மற்றும் opportunity losses-ஐ research செய். Return JSON with: {"salary_ranges_inr": "", "career_growth_data": "", "real_course_prices_inr": [], "opportunity_costs": [], "competitor_pricing": [], "market_size_indicators": []}.\n\nContext:\n${context}\nMind X-Ray: ${profile.mind_xray.generated}\nCoach answers:\n${answersText}`,
    };

    return {
      system: RESEARCH_SYSTEM,
      user: researchPrompts[module] || "",
      temp: 0.3,
      model: "gemini-2.5-flash",
    };
  }

  // Generate phase — the main output
  const answersText = Object.entries(answers)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const generatePrompts: Record<string, { system: string; user: string; temp: number }> = {
    icp: {
      system: `${VOICE_LAYER}\n\nஇந்த coach-ன் ideal client-க்கு ஒரு sharp, real ICP build செய். அவர்களுக்கு ஒரு பெயரும் முகமும் கொடு. Cover செய்: அவர்கள் யார் (வயது, வேலை, சம்பளம், குடும்பம்), இப்போ வாழ்க்கையில் எங்கே இருக்காங்க, secretly என்ன want பண்றாங்க, எதைப் பத்தி embarrass ஆகுறாங்க, online-ல எங்கே நேரம் செலவிடுறாங்க, எதை fix செய்ய சந்தோஷமா pay பண்ணுவாங்க. Coach-ன் சொந்த வார்த்தைகளையே use செய். Coach "அது literally என் client" என்று சொல்லும் அளவுக்கு specific-ஆ இரு. Fluff வேண்டாம், generic personas வேண்டாம். India-grounded.\n\n## headers-உடன் clear sections-ல format செய்.`,
      user: `Coach: ${coachName} (${onb.what_they_call_it || "coach"})\nயாருக்கு உதவுகிறார்: ${onb.who_they_help}\nஎன்ன மாற்றம்: ${onb.the_change}\nSignature phrase: ${onb.signature_phrase}\n\nCoach-ன் பதில்கள்:\n${answersText}\n\nMarket research data:\n${researchData || "none"}${TAMIL_ENFORCER}`,
      temp: 0.95,
    },
    mind_xray: {
      system: `${VOICE_LAYER}\n\nஇந்த coach-ன் ideal client-க்கு ஒரு deep psychological X-Ray உருவாக்கு. EXACTLY இந்த structure-ல:\n1. Demographic profile (பெயர், வயது வரம்பு, identity paragraph)\n2. Core problem + Top 5 emotions + Top 5 ஆழமான பயங்கள்\n3. 15 வலிக்கும் விஷயங்கள் — seeing/saying/hearing/feeling/thinking (ஒவ்வொன்றும் 3)\n4. முன்னாடி என்ன try பண்ணிருக்காங்க + frustrated soundbites (first person-ல)\n5. இனிமேல் என்ன செய்ய மறுக்கிறார்கள் + internal soundbites\n6. Primary transformation (magic-genie outcomes) + வாழ்க்கை visibly எப்படி மாறும்\n7. Market psychology (success எதில் நிற்கிறது / என்ன விட வேண்டும் / யாரை blame செய்கிறார்கள் / top 5 buying objections)\n8. Final persona soundbite — first person-ல\n\nSoundbites-ஐ நிஜமான WhatsApp voice notes மாதிரி எழுது — frustrated ஆளு first person-ல பேசுவது போல. Marketing copy மாதிரி இருக்கக்கூடாது. Raw, India-real. ## headers use செய்.`,
      user: `Coach: ${coachName}\nICP:\n${profile.icp.generated}\n\nClient-ன் இரவு 1 மணி கவலை பற்றி Coach-ன் பதில்:\n${answersText}\n\nResearch data:\n${researchData || "none"}${TAMIL_ENFORCER}`,
      temp: 1.0,
    },
    high_impact: {
      system: `${VOICE_LAYER}\n\nHigh-Impact Problem analysis build செய். இந்த EXACT 5-step framework follow செய்:\n\n## 1. Core Emotional Transformation\nFrom → To (coach-ன் exact வார்த்தைகளை use செய்)\n\n## 2. Tangible Domain-க்கு Bridge\nEmotional transformation-ஐ real, measurable வாழ்க்கை area-வுடன் connect செய்\n\n## 3. Premium-க்கு மக்கள் பணம் கொடுக்கும் 10 High-Impact பிரச்சனைகள்\n10 specific, India-real பிரச்சனைகள் list செய். Vague-ஆ இருக்கக்கூடாது. படிக்குறவன் "ஆமா, அது THAN" என்று சொல்லணும்.\n\n## 4. Clear, Measurable, High-Stakes Outcomes\nTimelines-உடன். Specific. நம்பக்கூடியது.\n\n## 5. செயல்படாமல் இருப்பதன் விலை (Cost of Inaction)\n₹ figures + emotional cost. Real Indian salary data, real opportunity costs use செய். கணக்கு வலிக்கணும்.\n\nBrutally specific-ஆ இரு. Real ₹ numbers. Real situations.`,
      user: `Coach: ${coachName}\nOnboarding: ${JSON.stringify(onb)}\nMind X-Ray:\n${profile.mind_xray.generated}\n\nCoach-ன் பதில்கள்:\n${answersText}\n\nResearch data:\n${researchData || "none"}${TAMIL_ENFORCER}`,
      temp: 0.95,
    },
    mechanism: {
      system: `${VOICE_LAYER}\n\nஇந்த coach-க்கு ஒரு Unique Mechanism build செய். EXACTLY இதை output செய்:\n\n## Brandable Mechanism பெயர்\n3 options கொடு (உதா: "The Quiet Power Method"). Memorable-ஆ, India-friendly-ஆ, cringe இல்லாம இருக்கணும்.\n\n## Framework\nClean 3-5 step/pillar framework — ஒவ்வொரு step-க்கும் ஒரு one-line promise.\n\n## ஏன் இது Work ஆகும்\nUnderlying logic — இந்த approach ஏன் results produce செய்கிறது.\n\n## ஏன் மற்ற எல்லாமே Fail ஆகும்\nContrast — இவர்களுடையது ஏன் obvious choice. Mind X-Ray-ன் "refuse to do again" list-இல் இருந்து pull செய்.\n\n## Positioning Statement\n"நான் [யாருக்கு] [இதிலிருந்து] [இதற்கு] மாற உதவுகிறேன், [MECHANISM] use செய்து, [அவர்கள் வெறுக்கும் விஷயம்] இல்லாமல்."\n\n"இல்லாமல்" part client refuse செய்வதிலிருந்து straight-ஆ pull ஆகணும்.`,
      user: `Coach: ${coachName}\nOnboarding: ${JSON.stringify(onb)}\nICP:\n${profile.icp.generated}\nMind X-Ray:\n${profile.mind_xray.generated}\nHigh-Impact Problems:\n${profile.high_impact.generated}\n\nCoach-ன் பதில்கள்:\n${answersText}${TAMIL_ENFORCER}`,
      temp: 0.95,
    },
    offer: {
      system: `${VOICE_LAYER}\n\nGodfather Offer build செய் — இல்லை என்று சொல்ல stupid-ஆ feel ஆகும் அளவு நல்ல offer. இது ஒரு STORY, PITCH இல்லை.\n\nஇந்த order-ல output செய்:\n\n## கதை\nClient-ன் இப்போதைய world-க்குள் open செய் (Mind X-Ray-ன் pain use செய்). Mechanism-ஐ turn-ஆ introduce செய். After-ஐ paint செய். Narrative-ஆ எழுது. கடைசி வரை "இதோ என்ன கிடைக்கும்" bullet-point energy வேண்டாம்.\n\n## Stack\nஎன்ன கிடைக்கும். ஒவ்வொரு line-ம் feature இல்லை, அது unlock செய்யும் OUTCOME-ஆல் frame செய். ஒவ்வொரு item-ம் gift மாதிரி feel ஆகணும்.\n\n## விலை + Framing\nCost of inaction-க்கு எதிராக anchor செய் (High-Impact Problems-இல் இருந்து). கணக்கு obvious-ஆ இருக்கணும்.\n\n## Risk Reversal\n"மீண்டும் fail ஆனா?" என்ற objection-ஐ disarm செய்யும் வகையில் phrase செய். Bold. Confident.\n\n## ஏன் இப்போது\nReal, honest reason. Fake scarcity இல்லை. "Limited spots" இல்லை. உண்மையிலேயே make sense ஆகுற ஒன்று.\n\nநண்பன் சொல்லும் கதை மாதிரி படிக்கணும், sales page மாதிரி இல்லை. Funnel மாதிரி sound ஆனா, rewrite செய்.`,
      user: `Coach: ${coachName}\nOnboarding: ${JSON.stringify(onb)}\nICP:\n${profile.icp.generated}\nMind X-Ray:\n${profile.mind_xray.generated}\nHigh-Impact Problems:\n${profile.high_impact.generated}\nMechanism:\n${profile.mechanism.generated}\n\nCoach-ன் பதில்கள் (என்ன deliver செய்கிறார், விலை, dream result):\n${answersText}${TAMIL_ENFORCER}`,
      temp: 0.95,
    },
    hooks: {
      system: `${VOICE_LAYER}\n\nஇந்த coach-க்கு 10 hooks/headlines உருவாக்கு. ஒவ்வொரு hook-க்கும்:\n\n1. **Main Hook** — headline\n2. **Sub-Hook** — supporting line\n3. **ஏன் Work ஆகும்** — psychological element (1 line)\n4. **Win Rate Estimate** — honest estimate (உதா: 7/10)\n\nCRITICAL GUARDRAIL: இந்த coach-ன் ICP fake-guru overpromising-ஐ வெறுக்கிறார்கள். "30 நாளில் 10x salary" garbage எழுதாதே — trust-ஐ கொல்லும். Hooks bold-ஆ ஆனா believable-ஆ இருக்கணும். Specific, defensible numbers use செய். Guaranteed income/health/outcomes promise செய்யாதே. Win-rates honest estimates — always test செய்யச் சொல்.\n\nCoach select செய்த platform மற்றும் tone-க்கு adapt செய். Hooks-ல Tamil + English mix OK (audience பேசுற மாதிரி), ஆனா explanations எல்லாம் தமிழில்.`,
      user: `Coach: ${coachName}\nOffer:\n${profile.offer.generated}\nMechanism:\n${profile.mechanism.generated}\nHigh-Impact Problems:\n${profile.high_impact.generated}\n\nCoach-ன் பதில்கள் (platform + tone):\n${answersText}${TAMIL_ENFORCER}`,
      temp: 0.95,
    },
    pitch: {
      system: `${VOICE_LAYER}\n\nஇந்த arc follow செய்து ஒரு interactive pitch build செய்:\n\nopen → அவர்கள் world-க்குள் step in → gap-ஐ name செய் → mechanism-ஐ reveal செய் → offer போடு → clear ask → top 3 objections handle செய் (Mind X-Ray-இல் இருந்து pull செய்)\n\nChannel-க்கு ஏற்ப length மற்றும் formality adapt செய்:\n- DM = short, punchy, personal\n- Sales call = scripted with pauses and questions\n- Stage = dramatic, narrative, emotional\n- Written proposal = structured, professional but warm\n\nநிஜமான conversation மாதிரி feel ஆகணும், robotically படிக்கும் script மாதிரி இல்லை.`,
      user: `Coach: ${coachName}\nFull Profile:\nOnboarding: ${JSON.stringify(onb)}\nICP:\n${profile.icp.generated}\nMind X-Ray:\n${profile.mind_xray.generated}\nMechanism:\n${profile.mechanism.generated}\nOffer:\n${profile.offer.generated}\n\nCoach-ன் பதில்கள் (channel + desired action):\n${answersText}${TAMIL_ENFORCER}`,
      temp: 0.95,
    },
    deck: {
      system: `${VOICE_LAYER}\n\nPresentation deck outline உருவாக்கு:\n\n1. **Slide-by-slide outline** — ஒவ்வொரு slide-ன் title + purpose\n2. **Per-slide content** — ஒவ்வொரு slide-ல என்ன போகும் (text minimal-ஆ, visual-friendly-ஆ)\n3. **Speaker notes** — ஒவ்வொரு slide-க்கும் coach உண்மையிலேயே என்ன சொல்ல வேண்டும் (conversational-ஆ எழுது, nervous beginner-க்கு exactly என்ன சொல்லணும்னு தெரியணும்)\n\nCoach-ன் offer, mechanism, problems-இல் இருந்து content pull செய். Information dump இல்லை, story சொல்லணும். Pitch-ன் same narrative arc follow செய்.\n\nSlide titles Tamil + English mix OK.`,
      user: `Coach: ${coachName}\nOffer:\n${profile.offer.generated}\nMechanism:\n${profile.mechanism.generated}\nHigh-Impact Problems:\n${profile.high_impact.generated}\nICP:\n${profile.icp.generated}\n\nCoach-ன் பதில்கள் (deck purpose + length):\n${answersText}${TAMIL_ENFORCER}`,
      temp: 0.9,
    },
  };

  const config = generatePrompts[module];
  if (!config) {
    return { system: VOICE_LAYER, user: answersText + TAMIL_ENFORCER, temp: 0.9, model: "gemini-2.5-flash" };
  }
  return { ...config, model: "gemini-2.5-flash" };
}

// Transient server overload — worth retrying / falling back to another model.
function isOverloaded(msg: string): boolean {
  return (
    msg.includes("503") ||
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("UNAVAILABLE")
  );
}

// API-key quota / billing limit (429 RESOURCE_EXHAUSTED). All models share the
// project's quota, so switching models or retrying quickly won't help.
function isQuotaExceeded(msg: string): boolean {
  return (
    msg.includes("quota") ||
    msg.includes("billing") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    // Groq rate-limit (429) messages — tokens/requests per minute.
    msg.includes("Rate limit reached") ||
    msg.includes("tokens per minute") ||
    msg.includes("TPM")
  );
}

// Extract how many seconds to wait from a provider rate-limit error.
// Gemini: `"retryDelay": "27s"` · Groq: `try again in 7.2s`. Falls back to 60s
// (per-minute limits always reset within a minute).
function parseRetrySeconds(msg: string): number {
  const m =
    msg.match(/retryDelay"?\s*:?\s*"?(\d+(?:\.\d+)?)s/i) ||
    msg.match(/try again in (\d+(?:\.\d+)?)\s*s/i);
  if (m) {
    const s = Math.ceil(parseFloat(m[1]));
    if (s > 0 && s <= 120) return s;
  }
  return 60;
}

// Generate with resilience. On ANY retryable error — whether a key's quota /
// rate limit (429) or transient model overload (503) — move on to the next
// (key × model) combination. A different key or model may succeed, so we never
// give up early. Two passes give briefly-overloaded keys a second chance.
// Only non-retryable errors fail fast.
async function generateWithFallback(
  modelName: string,
  systemInstruction: string,
  contents: { role: string; parts: { text: string }[] }[],
  generationConfig: { temperature: number; maxOutputTokens: number }
): Promise<string> {
  // Try the requested model first, then a stable fallback. Dedupe in case
  // the requested model already is the fallback.
  const candidates = [modelName, "gemini-2.0-flash"].filter(
    (m, i, arr) => arr.indexOf(m) === i
  );

  let lastErr: unknown;
  const MAX_PASSES = 2;
  for (let pass = 1; pass <= MAX_PASSES; pass++) {
    for (let k = 0; k < geminiClients.length; k++) {
      const client = geminiClients[k];
      for (const name of candidates) {
        try {
          const model = client.getGenerativeModel({ model: name, systemInstruction });
          const result = await model.generateContent({ contents, generationConfig });
          return result.response.text();
        } catch (err: unknown) {
          lastErr = err;
          const msg = err instanceof Error ? err.message : "";
          // Non-retryable error (bad request, auth, etc.) — stop immediately.
          if (!isQuotaExceeded(msg) && !isOverloaded(msg)) throw err;
          console.log(
            `Gemini key #${k + 1} / ${name} unavailable (${
              isQuotaExceeded(msg) ? "quota" : "overload"
            }) — trying next`
          );
          // fall through: next model, then next key, then next pass
        }
      }
    }
    // All keys+models failed this pass. Brief wait, then retry once more in
    // case the limit was a momentary per-minute spike.
    if (pass < MAX_PASSES) await new Promise((r) => setTimeout(r, 2500));
  }

  // Every Gemini key was rate-limited/overloaded — fall back to Groq (free tier
  // with a much higher per-minute limit) so the app keeps working. Groq is only
  // tried if a key is configured; Tamil quality is slightly below Gemini.
  if (process.env.GROQ_API_KEY) {
    try {
      const userText = contents[0]?.parts?.[0]?.text ?? "";
      console.log("All Gemini keys exhausted — falling back to Groq");
      return await callGroq(
        systemInstruction,
        userText,
        generationConfig.temperature,
        generationConfig.maxOutputTokens
      );
    } catch (groqErr) {
      lastErr = groqErr;
    }
  }

  throw lastErr ?? new Error("All models unavailable");
}

// Groq fallback via its OpenAI-compatible endpoint. Llama 3.3 70B handles Tamil
// reasonably and Groq's free tier allows far more requests per minute than the
// Gemini free tier.
async function callGroq(
  systemInstruction: string,
  userText: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userText },
      ],
      temperature,
      max_tokens: Math.min(maxTokens, 8000),
    }),
  });
  if (!res.ok) {
    throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned an empty response");
  return text;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { module, phase, profile, answers, researchData } = body;

    const { system, user, temp, model: modelName } = getModulePrompt(
      module, phase, profile, answers, researchData
    );

    const text = await generateWithFallback(
      modelName,
      system,
      [{ role: "user", parts: [{ text: user }] }],
      {
        temperature: temp,
        // Kept modest so each request stays well under free-tier per-minute
        // token limits (Gemini & Groq), while still allowing rich output.
        maxOutputTokens: phase === "reflect" ? 200 : phase === "research" ? 2048 : 4096,
      }
    );

    return Response.json({ output: text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Gemini API error:", message);
    // Gemini API key quota / billing limit reached — needs a fresh key or reset.
    if (isQuotaExceeded(message)) {
      const wait = parseRetrySeconds(message);
      return Response.json(
        {
          error: `AI கொஞ்சம் busy 😅 தயவுசெய்து ${wait} விநாடிகள் காத்திருந்து மீண்டும் முயற்சிக்கவும். (Please wait ~${wait}s and try again.)`,
          retryAfter: wait,
        },
        { status: 429 }
      );
    }
    // Friendlier message when the models are just busy (transient overload).
    if (isOverloaded(message)) {
      return Response.json(
        {
          error:
            "AI இப்போது அதிக பயன்பாட்டில் உள்ளது 😓 சில விநாடிகளில் மீண்டும் முயற்சிக்கவும்.",
        },
        { status: 503 }
      );
    }
    return Response.json({ error: message }, { status: 500 });
  }
}
