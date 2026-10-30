import type { WritingGuide } from "./guides";

export interface InputRecipe {
  title: string;
  purpose: string;
  mode: "character" | "relationship" | "oc";
  character: string;
  secondCharacter?: string;
  fandom?: string;
  relationshipKind?: "friendship" | "romance" | "rivals";
  tone?: "fluff";
  scenario: string;
  lookFor: string;
}

export const INPUT_RECIPES: InputRecipe[] = [
  { title: "A habit someone can interrupt", purpose: "Find an everyday action with a consequence.", mode: "character", character: "Mara, a station caretaker", scenario: "Mara checks every clock before closing the station. Tonight the last passenger asks why she has skipped the clock above the ticket window.", lookFor: "An explanation tied to that one clock, rather than a list of unrelated quirks." },
  { title: "Confidence during a boring task", purpose: "Explore a familiar character away from the main conflict.", mode: "character", character: "Gojo Satoru", fandom: "Jujutsu Kaisen", scenario: "After a routine training session, Gojo has to sort a stack of student evaluation forms with a colleague who insists on finishing before lunch.", lookFor: "A small choice about teaching or paperwork. Check any new source claims against the work." },
  { title: "A practical friendship", purpose: "Make care visible through a favor.", mode: "relationship", character: "Mara", secondCharacter: "Ivo", relationshipKind: "friendship", scenario: "Mara lends Ivo her delivery bicycle for a job interview. Ivo returns it with the brakes fixed but the seat adjusted to the wrong height.", lookFor: "Two friends negotiating the favor, with room for irritation as well as gratitude." },
  { title: "Romance with different plans", purpose: "Give a warm scene a small disagreement.", mode: "relationship", character: "Nell", secondCharacter: "Arun", relationshipKind: "romance", tone: "fluff", scenario: "Nell has planned a quiet anniversary breakfast at home. Arun arrives with train tickets for a surprise day trip, just as the bread starts burning.", lookFor: "A compromise that acknowledges both plans, rather than one person instantly giving up." },
  { title: "Rivals who need each other", purpose: "Create cooperation without erasing competition.", mode: "relationship", character: "Lea", secondCharacter: "Soren", relationshipKind: "rivals", scenario: "Two rival cartographers must share the only dry table in a leaking archive. Lea needs to finish first; Soren needs to prove that her map has a missing street.", lookFor: "A useful exchange that still leaves the contest unresolved." },
  { title: "An OC with a costly habit", purpose: "Turn a virtue into a difficult choice.", mode: "oc", character: "Nell, a ferry mechanic", scenario: "Nell wants a mainland apprenticeship. She repairs neighbors' engines for free. On the morning of her interview, a fisherman arrives with a stalled boat and no other way home.", lookFor: "A decision that costs Nell time, trust, or opportunity. A trait summary leaves the conflict unused." },
  { title: "An OC in an unfamiliar place", purpose: "Discover a habit through a change of setting.", mode: "oc", character: "Tavi, a night-market cook", scenario: "Tavi knows every regular customer's order but is visiting a silent monastery kitchen. Lunch is late, nobody gives instructions, and the cook beside them keeps moving the salt.", lookFor: "A reaction shaped by Tavi's old routine and the new kitchen's rules." },
  { title: "Repair after a missed promise", purpose: "Move a friendship beyond an apology speech.", mode: "relationship", character: "Ivo", secondCharacter: "Tavi", relationshipKind: "friendship", scenario: "Ivo missed Tavi's opening night after promising to help. A week later he finds the unopened invitation in his coat while they pack the last market stall together.", lookFor: "A specific attempt to repair the damage and a response Tavi gets to choose." },
  { title: "A quiet couple under pressure", purpose: "Explore intimacy when there is no time for a long conversation.", mode: "relationship", character: "Lea", secondCharacter: "Arun", relationshipKind: "romance", scenario: "Lea and Arun have ten minutes to clear their flooded workshop. Lea wants the tools saved first; Arun has gone upstairs for a box of letters.", lookFor: "Different priorities revealed through action, followed by a choice about what to carry." },
  { title: "A rival's unexpected kindness", purpose: "Keep an ambiguous gesture interesting.", mode: "relationship", character: "Soren", secondCharacter: "Mara", relationshipKind: "rivals", scenario: "Before the town's clockmaking contest, Mara finds a replacement spring on her workbench. Only Soren knows hers broke. His entry is due at the same time as hers.", lookFor: "A gesture with more than one plausible motive, not an automatic romantic reveal." },
];

export function recipeHref(recipe: InputRecipe) {
  const params = new URLSearchParams({ mode: recipe.mode, character: recipe.character, scenario: recipe.scenario });
  if (recipe.secondCharacter) params.set("secondCharacter", recipe.secondCharacter);
  if (recipe.fandom) params.set("fandom", recipe.fandom);
  if (recipe.relationshipKind) params.set("relationshipKind", recipe.relationshipKind);
  if (recipe.tone) params.set("tone", recipe.tone);
  return `/?${params.toString()}#generator`;
}

export function recipeText(recipe: InputRecipe) {
  return [
    `Mode: ${recipe.mode === "oc" ? "Original character" : recipe.mode === "relationship" ? "Relationship" : "Character"}`,
    `${recipe.mode === "relationship" ? "First character" : recipe.mode === "oc" ? "Your character" : "Character name"}: ${recipe.character}`,
    ...(recipe.secondCharacter ? [`Second character: ${recipe.secondCharacter}`] : []),
    `${recipe.mode === "oc" ? "Setting (optional)" : "Fandom (optional)"}: ${recipe.fandom ?? "(leave blank)"}`,
    ...(recipe.relationshipKind ? [`Relationship type: ${recipe.relationshipKind === "romance" ? "Romance / ship" : recipe.relationshipKind === "friendship" ? "Friendship (no romance)" : "Rivals"}`] : []),
    `Tone: ${recipe.tone ? "Fluff / warm everyday moments" : "Any tone"}`, `Scene: ${recipe.scenario}`,
  ].join("\n");
}

const characterGuide: WritingGuide = {
  slug: "how-to-write-a-character-headcanon",
  title: "How to Write a Character Headcanon: 3 Worked Examples",
  description: "Follow three original headcanon drafts from input to revision and a short scene. Learn to replace generic traits, repair an OOC reaction, and keep a useful detail.",
  intro: "A specific headcanon gives a character something to do. Start with an observed action, add one detail, and put someone in its way. The three worked examples below show the draft, the problem, and the revision.",
  published: "2026-07-30", updated: "2026-10-30",
  sections: [
    { title: "A four-step writing process", paragraphs: ["Separate the starting observation from the detail you invent. For a fandom character, record the scene or episode you are working from; for an OC, write down the facts you have already chosen."], steps: ["Choose one action, object, or routine.", "Add a person or event that interrupts it.", "Write the character's response in one or two sentences.", "Test that response in a short exchange, then revise what feels wrong."] },
    { title: "1. A habit: make kindness visible", paragraphs: ["Mara is an invented station caretaker. Her starting behavior is practical: she notices problems and fixes them before opening time."], example: {
      input: "Mara arrives early at the station. She dislikes being thanked in public. A regular passenger has a broken umbrella.",
      draft: "Mara is secretly kind and always helps everyone.",
      problem: "Secretly kind names a trait. Always helps everyone leaves no room for a limit or an awkward response.",
      revised: "Mara repairs the regular's umbrella and leaves it on his usual bench. If he asks, she blames the lost-property attendant, who only works on Sundays.",
      scene: ["The passenger turned the repaired umbrella in his hands. 'Who fixed this?'", "'Lost property,' Mara said, checking the departure board.", "'On a Tuesday?'", "She moved his suitcase out of a puddle. 'You'll miss your train.'"],
      reason: "The repair shows care; the impossible excuse shows discomfort. Moving the suitcase lets her change the subject while continuing to help.",
    } },
    { title: "2. A pair: give both people a reason", paragraphs: ["A relationship detail needs two people making choices. Here Ivo wants a predictable routine, while Lea wants to stop being managed."], example: {
      input: "Ivo orders lunch for his friend Lea every Friday. Lea has changed her schedule and wants to choose for herself.",
      draft: "Ivo knows Lea better than anyone and always orders exactly what she wants.",
      problem: "Lea has no action or preference. The claim that Ivo knows best also removes the scene's disagreement.",
      revised: "Ivo keeps ordering Lea's old lunch. She starts bringing a different sandwich and leaves half beside his plate, waiting to see whether he asks.",
      scene: ["'You hate mustard,' Ivo said.", "'I hated the mustard at school.' Lea set down half her sandwich.", "He pushed the usual order to one side. 'What else have I missed?'", "'Start with lunch.'"],
      reason: "The old order becomes evidence of an outdated assumption. Lea changes the routine herself, and Ivo can choose whether to listen.",
    } },
    { title: "3. An OC: let a good trait cost something", paragraphs: ["Nell is a ferry mechanic applying for a mainland apprenticeship. She is generous with repairs and reluctant to ask anyone to cover for her."], example: {
      input: "Nell repairs neighbors' engines for free. Her apprenticeship interview is this morning. A fisherman arrives with a broken starter.",
      draft: "Nell is hardworking, generous, and determined to follow her dreams.",
      problem: "All three traits can sit together without forcing a decision. The interview and the repair need to compete for the same hour.",
      revised: "Nell promises a ten-minute repair, discovers the job needs an hour, and finally asks her least favorite colleague to finish it while she catches the ferry.",
      scene: ["The starter clicked once. Nell looked at the harbor clock.", "'Ten minutes?' the fisherman asked.", "She shut the toolbox and called Arun. 'I need you to take this one.'", "'You need me?'", "'Enjoy the sentence later. The parts are on the bench.'"],
      reason: "The useful discovery is not that Nell works hard. It is that leaving requires her to accept help, which changes how she can behave in later scenes.",
    } },
    { title: "How to repair an out-of-character reaction", paragraphs: ["Keep the situation and change the response. If a reserved character suddenly explains every feeling to a stranger, preserve the broken umbrella or missed lunch and rewrite what they actually say and do."], table: {
      caption: "Editing a draft without losing its useful detail", columns: ["Draft problem", "Keep", "Revise"], rows: [
        ["A private character gives a long confession", "The other person notices a habit", "A short answer, an evasive task, or a gesture that fits their usual behavior"],
        ["Everyone reacts with the same kindness", "The practical favor", "One person feels grateful; the other finds the favor intrusive"],
        ["A new quirk changes the whole personality", "One object or routine", "When the habit appears, who sees it, and when the character stops doing it"],
      ],
    } },
    { title: "A final scene check", paragraphs: ["Read the exchange once with the names removed. If the actions could belong to anyone, make one choice more specific."], items: ["Can a reader see the detail happen?", "Does the interruption change someone's next action?", "Does each person want something different?", "Can you cut an explanation because the dialogue already shows it?"] },
  ],
  faqs: [
    { q: "How long should a headcanon be?", a: "One or two sentences is enough for the idea. Expand it only when the scene reveals a useful choice or complication." },
    { q: "What makes a headcanon feel OOC?", a: "An out-of-character reaction often ignores how the character usually handles the same pressure. Compare actions and speech, then rewrite the response while keeping the situation that interested you." },
  ],
  relatedLinks: [{ href: "/guides/headcanon-generator-prompts", label: "10 generator input examples" }, { href: "/guides/relationship-headcanon-ideas", label: "Compare friends, romance, and rivals" }, { href: "/headcanon-template", label: "Record the idea in a worksheet" }, { href: "/#generator", label: "Open the generator" }],
};

const relationshipGuide: WritingGuide = {
  slug: "relationship-headcanon-ideas",
  title: "Relationship Headcanon Ideas: Friends, Romance, and Rivals",
  description: "Compare nine original relationship headcanon examples across three situations. See how friendship, romance, and rivalry change what each person wants and does.",
  intro: "A relationship headcanon becomes interesting when the same gesture means different things to the two people involved. These nine examples use three shared situations to compare friendship, romance, and rivalry.",
  published: "2026-07-30", updated: "2026-10-30",
  sections: [
    { title: "The setup: two people, different priorities", paragraphs: ["Mara plans ahead and hates owing favors. Ivo improvises and wants his effort noticed. They are original teaching characters; each row below is a separate version of their relationship."], items: ["Friendship: they can disagree and repair the routine without a romantic turn.", "Romance: attention carries intimacy, but each person still has their own plans.", "Rivalry: help changes the contest instead of making the competition disappear."] },
    { title: "Situation 1: a borrowed coat", paragraphs: ["Use the coat to reveal what each person thinks the favor means. The object stays the same; the expectation changes."], table: { caption: "Three meanings for the same borrowed coat", columns: ["Relationship", "Headcanon", "What starts the scene"], rows: [
      ["Friendship", "Mara lends Ivo a coat for an interview. He replaces a missing button; she wanted it returned before her own early shift.", "Ivo arrives proudly carrying a repaired coat while Mara stands outside in a rain poncho."],
      ["Romance", "Ivo borrows Mara's coat on their first overnight trip. She puts a spare key in its pocket; he keeps returning the key because he thinks it was left by mistake.", "At the third handover, Mara asks which part of the invitation he is waiting for."],
      ["Rivals", "Mara lends Ivo a coat before the town debate because she wants to beat a prepared opponent. He suspects a prank and checks every pocket.", "He finds her own notes in the lining and has to decide whether to give them back unread."],
    ] } },
    { title: "Situation 2: a missed train", paragraphs: ["A delay is useful because it forces a decision now. Give one person somewhere to be and the other a reason to stay."], table: { caption: "A missed train creates three different choices", columns: ["Relationship", "Headcanon", "What starts the scene"], rows: [
      ["Friendship", "Ivo stays on the platform when Mara misses her connection. She wants him to go to his audition; he has already unpacked a card game.", "Mara takes his cards away and walks him to the replacement bus."],
      ["Romance", "Mara has rehearsed a farewell for Ivo's six-month trip. When the train is canceled, he starts discussing supper while she is still trying to say goodbye.", "They have to spend an ordinary evening together after treating it as their last one for months."],
      ["Rivals", "Mara and Ivo miss the last train to a design contest. Ivo knows a bus route but needs Mara's entry fee to afford both tickets.", "They negotiate a loan while arguing over whose clock was wrong."],
    ] } },
    { title: "Situation 3: an unfinished apology", paragraphs: ["An apology changes a relationship when it produces a new action. Decide who wants to move on and who still needs something put right."], table: { caption: "Repair is different from immediate forgiveness", columns: ["Relationship", "Headcanon", "What starts the scene"], rows: [
      ["Friendship", "Mara missed Ivo's moving day. She arrives the next morning with breakfast, but he needs help carrying the wardrobe, not another explanation.", "She puts the breakfast down and takes the heavy end without directing the move."],
      ["Romance", "Ivo shared news Mara wanted to announce herself. He plans a grand apology; she asks him to call the three people he told and correct the story.", "He must make those awkward calls while she stays in the room."],
      ["Rivals", "Mara publicly dismissed Ivo's design before checking the measurements. She corrects the record at the next meeting; he still refuses to share his new drawings.", "Her correction restores his reputation but does not buy access to his work."],
    ] } },
    { title: "Turn a row into your own scene", paragraphs: ["Choose the row whose disagreement fits your pair. Replace the coat, train, or apology with an object or obligation from their world."], steps: ["Give the first character a concrete goal.", "Give the second character a different expectation of the same gesture.", "Interrupt the familiar routine and let both respond.", "End on a changed action: a returned key, a bus ticket, or a corrected statement."], links: [{ href: "/guides/headcanon-generator-prompts", label: "Use a ready-to-fill relationship input" }] },
  ],
  faqs: [
    { q: "How do I keep a friendship headcanon platonic?", a: "Choose Friendship in More options and describe the shared task in Scene. In your revision, focus on trust, irritation, loyalty, or a practical favor rather than attraction or a confession." },
    { q: "Can a rivalry include kindness?", a: "Yes. A favor can reflect respect, pride, or a wish for a fair contest. Keep the competing goals visible after the favor." },
    { q: "How do I use these ideas in the generator?", a: "Choose Relationship, enter one name in each character field, and choose Friendship, Romance / ship, or Rivals. Add the situation in Scene under More options." },
  ],
  relatedLinks: [{ href: "/relationship-headcanon-generator", label: "Open relationship generation" }, { href: "/guides/how-to-write-a-character-headcanon", label: "Follow a draft through revision" }, { href: "/headcanon-template", label: "Keep notes on your pair" }],
};

const ocGuide: WritingGuide = {
  slug: "how-to-create-an-oc-headcanon",
  title: "How to Create an OC Headcanon: A Filled Worksheet and Scene",
  description: "Build one original character from three facts, fill a six-field OC worksheet, test a choice in a scene, and revise the profile with a continuity check.",
  intro: "Build an OC headcanon by making one known trait collide with a goal. This example follows Nell, a ferry mechanic, from three starting facts to a filled worksheet and a scene that changes her next decision.",
  published: "2026-07-30", updated: "2026-10-30",
  sections: [
    { title: "Start with three facts and one question", paragraphs: ["Nell repairs engines on a small island. She wants a mainland apprenticeship. She takes pride in never asking for help. The useful question is: what happens when helping someone else will make her miss the ferry?"], items: ["Known role: ferry mechanic.", "Current goal: reach an apprenticeship interview before noon.", "Habit: she accepts repair jobs before checking her own schedule."] },
    { title: "Choose a behavior you can test", paragraphs: ["Nell offers a ten-minute repair on interview morning. When it becomes an hour's work, she calls Arun, the colleague whose methods she usually criticizes. Asking him to finish gives her a way to leave and a reason to feel uncomfortable when she comes back."], links: [{ href: "/guides/how-to-write-a-character-headcanon#section-4", label: "See the earlier draft and revision" }] },
    { title: "A completed OC worksheet", paragraphs: ["These six entries match the Original character tab of the site's free worksheet. Copy them as a starting point, or open a blank worksheet for your own character."], table: { caption: "Nell's six-field OC worksheet", downloadFilename: "nell-oc-worksheet.txt", columns: ["Worksheet field", "Filled example"], rows: [
      ["Character / setting", "Nell, a ferry mechanic on a small island. Interview morning, before the first mainland ferry."],
      ["What they want", "To reach the apprenticeship interview and prove she can work beyond the island."],
      ["One habit or contradiction", "She wants to leave but keeps accepting repairs that make the town depend on her."],
      ["What gets in their way", "She assumes asking Arun for cover would mean admitting he is as capable as she is."],
      ["What I have not decided", "Whether she gets the apprenticeship; whether Arun actually wants her job."],
      ["A scene that would test it", "A starter fails just before departure. Nell must hand the repair to Arun or lose her interview slot."],
    ] }, links: [{ href: "/headcanon-template", label: "Open the free six-field worksheet" }] },
    { title: "Test what happens after the choice", paragraphs: ["The return scene tests the habit more sharply than another description of Nell's generosity. She has asked for help; now she must let the work belong to someone else."], example: {
      input: "Nell returns from the interview. Arun has finished the engine and changed the arrangement of her tools.",
      draft: "Nell learns to accept help and thanks Arun warmly.",
      problem: "The summary skips the exact moment her old habit returns. Gratitude alone settles the conflict too easily.",
      revised: "Nell reaches to redo Arun's cable ties, stops, and asks him to show her why he routed them that way.",
      scene: ["The engine started on the first turn. Nell opened the side panel anyway.", "'It runs,' Arun said.", "'I can hear that.' She touched the new cable route, then let go.", "'Why did you take it around this side?'", "He pulled up a stool. She left the toolbox shut."],
      reason: "Leaving the toolbox shut makes the change visible. Nell is still exacting; she is beginning to be curious instead of taking over.",
    } },
    { title: "Update the profile without rewriting everything", paragraphs: ["Record what the scene established and keep unanswered questions open. A new choice should complicate the character, not erase the habits that made the choice difficult."], table: { caption: "Continuity notes after the scene", columns: ["Keep", "Add", "Leave open"], rows: [
      ["Nell checks repairs closely", "She can ask how someone else reached a solution", "Whether she can do this when the repair has gone wrong"],
      ["She wants the apprenticeship", "The workshop can run without her for a day", "Whether she will leave if an offer arrives"],
      ["She dislikes owing favors", "She owes Arun one specific afternoon", "What he will ask for in return"],
    ] }, steps: ["Keep the starting facts that still hold.", "Add the new action the character actually took.", "Choose one unanswered question for the next scene."] },
  ],
  faqs: [
    { q: "Do I need a full backstory before writing an OC headcanon?", a: "Start with a role, a goal, and one habit. Add history when a scene needs it, such as why asking this particular colleague for help is difficult." },
    { q: "Does the worksheet save my notes?", a: "The worksheet saves in this browser and offers copy and download controls. Download a copy before switching browsers or clearing site data." },
  ],
  relatedLinks: [{ href: "/headcanon-template", label: "Fill your own OC worksheet" }, { href: "/guides/headcanon-generator-prompts", label: "Try a focused OC input" }, { href: "/oc-headcanon-generator", label: "OC Headcanon Generator" }, { href: "/oc-questions-generator", label: "Ask your OC a new question" }],
};

const promptsGuide: WritingGuide = {
  slug: "headcanon-generator-prompts",
  title: "Headcanon Generator Prompts: 10 Ready-to-Fill Input Examples",
  description: "Try ten headcanon generator prompts for characters, friends, romance, rivals, and OCs. Copy a field-by-field recipe or load it into the generator form.",
  intro: "A useful headcanon generator prompt names the people, gives them a situation, and adds one point of friction. These ten input recipes fit the site's current Character, Relationship, and Original character modes.",
  published: "2026-10-30", updated: "2026-10-30",
  sections: [
    { title: "What to put in each field", paragraphs: ["Put names in the character fields and the event in Scene under More options. Each Scene example below fits the 240-character limit. The examples are editorial recipes; the generated ideas will vary."], table: { caption: "Inputs available in the current generator", columns: ["Field", "Useful content"], rows: [
      ["Mode", "Character for one person, Relationship for a pair, Original character for an OC."],
      ["Character name / First character / Your character", "A name or a short OC label, up to 80 characters."],
      ["Second character", "The other person's name in Relationship mode, up to 80 characters."],
      ["Fandom / Setting", "The work's name or original setting when useful; this field is optional."],
      ["Relationship", "Friendship, Romance / ship, or Rivals in More options. Any leaves the relationship unspecified."],
      ["Tone", "Any or Fluff. Fluff suits warm, low-stakes situations."],
      ["Scene", "A place, an event, and competing priorities, up to 240 characters."],
    ] } },
    { title: "Choose an input recipe", paragraphs: ["Each recipe is a separate setup. Load input fills the form so you can edit it before generating; the copy button keeps the field labels with the example. One successful batch costs one credit and returns five ideas."], recipes: INPUT_RECIPES },
    { title: "How to improve an unfocused result", paragraphs: ["Change the situation before adding more adjectives. Replace a broad setting such as a normal day with the moment someone has to choose: a ferry departing, a borrowed item returned late, or an apology interrupted by work."], table: { caption: "Three small revisions to a Scene input", columns: ["Too broad", "More focused", "Why it helps"], rows: [
      ["Two friends spend time together", "One returns a borrowed bicycle with a repaired brake and a dent in the basket", "The favor has a benefit and a cost"],
      ["An OC has a complicated personality", "A mechanic must hand off a repair to catch an interview ferry", "The goal and the habit compete for the same hour"],
      ["Rivals secretly care about each other", "A rival lends a missing part before a contest but refuses to explain why", "The gesture leaves a motive to explore"],
    ] } },
  ],
  faqs: [
    { q: "Can I paste instructions for a custom output format into Scene?", a: "Scene supplies story context. Use it for the situation and the people involved; the generator keeps its five-idea format. Edit or expand a chosen idea afterward." },
    { q: "Can these recipes generate three or more people at once?", a: "The current form supports one character or a pair. For a larger cast, develop a pair first and use the worksheet to track how the other characters respond." },
    { q: "How can I avoid spoilers for a fandom character?", a: "Describe a setting you already know, then review the result before sharing it. The form has no dedicated spoiler cutoff or source-verification control." },
  ],
  relatedLinks: [{ href: "/guides/how-to-write-a-character-headcanon", label: "Revise the idea into a scene" }, { href: "/guides/relationship-headcanon-ideas", label: "Nine relationship examples" }, { href: "/guides/how-to-create-an-oc-headcanon", label: "A filled OC worksheet" }, { href: "/#generator", label: "Open a blank generator" }],
};

export const DEEP_WRITING_GUIDES: WritingGuide[] = [characterGuide, relationshipGuide, ocGuide, promptsGuide];
