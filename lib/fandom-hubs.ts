export interface FandomHub {
  slug: string;
  name: string;
  title: string;
  description: string;
  intro: string[];
  angles: { title: string; body: string }[];
  sceneStarts: string[];
  faqs: { q: string; a: string }[];
  writingExamples?: { character: string; body: string; scenario: string }[];
  sources?: { label: string; href: string }[];
}

export const FANDOM_HUBS: FandomHub[] = [
  {
    slug: "naruto-headcanon-generator",
    name: "Naruto",
    title: "Naruto Headcanon Generator",
    description: "Use the Naruto headcanon generator for training breaks and quiet village moments. Read original fan-made examples, then start with a character and scene.",
    intro: [
      "A mission has an end, but the walk home still needs writing. Start a Naruto headcanon with the person who checks the supplies twice, saves a seat, or stays behind after practice. Those little choices give a scene something to hold onto.",
      "Choose a character below or enter another name in the generator. The examples are invented fan interpretations, not facts from the manga or anime. Keep the era in mind: a young Team Seven scene and an adult village scene should not sound the same.",
    ],
    angles: [
      { title: "After training", body: "Leave the fight off the page for a moment. Who puts the equipment away? Who claims not to be tired? A small chore can make pride, worry, or a friendship visible without a speech." },
      { title: "Life in the village", body: "Try a missed meal, a noisy errand, or an appointment somebody forgot. Let the character solve an ordinary problem in a recognizable way instead of giving everyone the same secret hobby." },
      { title: "A pair, not a whole team", body: "For two characters, use Relationship and enter a name in each field. Choose Friendship to keep the result platonic, or Romance / ship for a gentle fan pairing. Neither setting makes the relationship official." },
    ],
    writingExamples: [
      { character: "Naruto Uzumaki", body: "Naruto starts saving the paper wrappers from meals he shares after training. He insists they are a record of his progress, although most have sauce on them and no dates.", scenario: "After training, a small keepsake from a shared meal" },
      { character: "Sakura Haruno", body: "Sakura keeps a spare hair tie tucked into the back of her training notebook. She lends it out with a warning to return it, then quietly replaces it before the next practice.", scenario: "A training notebook and a small item lent to a teammate" },
      { character: "Kakashi Hatake", body: "Kakashi notices when a teammate has stopped replacing a worn strap. A new one turns up beside their gear the next morning, with a note complaining about the noise the old buckle made.", scenario: "A teammate finds an anonymously repaired piece of equipment" },
    ],
    sceneStarts: [
      "Rain cancels training, and two teammates disagree about whether that counts as a day off.",
      "A borrowed item comes back repaired, but its owner liked the old scratch.",
      "Someone remembers an order from months ago and gives a very unconvincing explanation for it.",
    ],
    faqs: [
      { q: "Are these Naruto headcanons canon?", a: "No. The habits and scenes on this page are original fan-made examples. Use the manga, anime, or official character material to check an established event or relationship." },
      { q: "Can I generate a Naruto ship or friendship?", a: "Yes. Open Relationship, enter the two names separately, and keep Naruto in Fandom. In More options, choose Friendship for no romance or Romance / ship for a non-explicit pairing. One credit returns five short ideas." },
      { q: "How can I keep the idea in the right era?", a: "Add a brief setting in Scene, such as a training break during the early Team Seven period. Check the result for timeline mistakes yourself; the generator is a writing aid, not a canon reference." },
    ],
    sources: [{ label: "Official Naruto character context: Sakura and Team Seven", href: "https://naruto-official.com/en/news/01_1743" }],
  },
  {
    slug: "danganronpa-headcanon-generator",
    name: "Danganronpa",
    title: "Danganronpa Headcanon Generator",
    description: "Try the Danganronpa headcanon generator for school routines, awkward conversations, and talent-related habits. Read fan-made examples and choose a character.",
    intro: [
      "A Danganronpa character can be interesting before anyone finds a clue. Think about what happens when a talent meets a dull afternoon: a shared table, a borrowed notebook, or a conversation that nobody knows how to end.",
      "These examples use the Trigger Happy Havoc cast and avoid revealing case outcomes. Every habit below is invented for this page. For a different game or an alternate universe, name it in Scene so your starting point is clear. Generated text can still make mistakes or introduce spoilers.",
    ],
    angles: [
      { title: "Talent versus ordinary life", body: "A talent need not explain every choice. Give a character an easy task they find unexpectedly annoying, or let them be helpful without making a performance of it. The contrast is often enough for a short scene." },
      { title: "Trust in small amounts", body: "Start with a favor that costs almost nothing: watching a seat, returning a book, or remembering a preference. Decide whether the character accepts it, questions it, or finds a way to repay it immediately." },
      { title: "Choose the version of the story", body: "A school-life AU has different stakes from a scene during the game. Put that distinction in Scene. Avoid mixing casts, timelines, and major reveals unless the crossover or spoiler is part of your own plan." },
    ],
    writingExamples: [
      { character: "Makoto Naegi", body: "Makoto labels a communal umbrella with a scrap of tape so it stops disappearing. When it comes back with three more names written on it, he decides that is close enough to success.", scenario: "School-life AU: returning a communal umbrella, with no case outcomes" },
      { character: "Kyoko Kirigiri", body: "Kyoko leaves a folded bookmark in a book she lends out. It marks the page she thinks the borrower will like, not the page where she stopped reading.", scenario: "School-life AU: lending a book, with no case outcomes" },
      { character: "Byakuya Togami", body: "Byakuya moves a wobbly chair away from a shared table and says the noise was distracting. The next day it is repaired, and he looks irritated when anyone thanks him.", scenario: "School-life AU: a repaired chair in a shared study room, with no case outcomes" },
    ],
    sceneStarts: [
      "Two classmates both want the quiet table and refuse to admit they could share it.",
      "A note meant as practical advice sounds much kinder than its author intended.",
      "A routine favor becomes awkward because neither person knows when to stop returning it.",
    ],
    faqs: [
      { q: "Does this page contain Danganronpa spoilers?", a: "The starter examples do not reveal victims, culprits, trial solutions, or endings. Model-generated results are not guaranteed to be spoiler-free. Add your game and spoiler boundary in Scene, then review the output before sharing it." },
      { q: "Can I use characters from Danganronpa 2 or V3?", a: "You can enter another character and specify the game in Scene. The examples here focus on Trigger Happy Havoc; the tool does not verify continuity, so check any details that matter to your story." },
      { q: "Can I write a non-despair school AU?", a: "Yes. Put that setting in Scene and choose Fluff for warm, low-stakes moments. For a pair, use Relationship and select Friendship or Romance / ship. You get five short ideas for one purchased credit, not a full chapter." },
    ],
    sources: [
      { label: "Official Danganronpa: Trigger Happy Havoc overview", href: "https://www.danganronpa.com/pages/sp/en/" },
      { label: "Official Reload character roster", href: "https://www.danganronpa.com/reload/character/dangan01.html" },
    ],
  },
  {
    slug: "phighting-headcanon-generator",
    name: "PHIGHTING!",
    title: "PHIGHTING! Headcanon Generator",
    description: "Use the PHIGHTING headcanon generator for practice, team downtime, and small rivalries. Read original fan-made examples, then start with a Phighter and scene.",
    intro: [
      "The match is over. Someone still has to find the missing bag, settle an argument about the playlist, or wait for a teammate who said they would only be a minute. That is a useful place to start a PHIGHTING! headcanon.",
      "Pick a Phighter below or enter another name with PHIGHTING! as the fandom. The examples are made-up writing prompts, not game dialogue or confirmed lore. No character artwork, official dialogue, or player account is needed to use the generator.",
    ],
    angles: [
      { title: "Between matches", body: "Write the part that a scoreboard cannot show. A repeated habit before practice or a tiny disagreement afterward can give a character something to do without turning an ability into their entire personality." },
      { title: "Equipment with a history", body: "Choose one ordinary object: a bag strap, a spare cable, a scuffed wheel. Decide who notices it and why the owner will not replace it. Label any invented explanation as your interpretation." },
      { title: "Teamwork without a confession", body: "A shared routine can be friendly, competitive, or romantic. Use the relationship choice to make your intention explicit. For a friendship, a remembered preference does not need to become a secret crush." },
    ],
    writingExamples: [
      { character: "Sword", body: "Sword counts the practice gear before leaving, then counts it again when someone talks over him. He says it saves time, even though everyone else has already reached the door.", scenario: "Packing practice equipment after a match" },
      { character: "Boombox", body: "Boombox keeps a short playlist for cleaning up after practice. He notices when someone starts humming along but leaves the same track on rather than calling attention to it.", scenario: "A quiet cleanup after practice, with a shared playlist" },
      { character: "Skateboard", body: "Skateboard remembers which stretch of pavement makes a loose wheel rattle. When a friend borrows the board, he gives directions around that patch instead of admitting the wheel needs fixing.", scenario: "Lending a board with one loose wheel between practice sessions" },
    ],
    sceneStarts: [
      "A teammate brings a spare item for someone who insists they never forget anything.",
      "The usual playlist is missing, and the silence is more distracting than the music ever was.",
      "Two rivals end up waiting for the same late teammate and run out of complaints.",
    ],
    faqs: [
      { q: "Are these official PHIGHTING! character facts?", a: "No. These are original fan interpretations. The wiki links below are for checking character context; they do not verify the habits or scenes invented on this page." },
      { q: "Can I generate a PHIGHTING! duo or ship?", a: "Yes. Choose Relationship and enter a different name in each field. Use Friendship, Romance / ship, or Rivals to choose the dynamic. Keep PHIGHTING! in Fandom so the names have context." },
      { q: "Does this connect to my Roblox account?", a: "No. The generator only uses the character, fandom, and optional scene you type. It does not access your Roblox profile, inventory, match history, or game account." },
    ],
    sources: [
      { label: "PHIGHTING! Wiki: Sword", href: "https://phighting.wiki/Sword" },
      { label: "PHIGHTING! Wiki: character dialogue index", href: "https://phighting.wiki/Boombox/Dialogue" },
    ],
  },
  {
    slug: "genshin-impact",
    name: "Genshin Impact",
    title: "Genshin Impact Headcanons, Scene Prompts, and Writing Ideas",
    description:
      "Browse Genshin Impact headcanon ideas, scene prompts, and practical notes for writing characters, relationships, and quiet fanfiction scenes in Teyvat.",
    intro: [
      "Genshin Impact gives writers a large cast, distinct regions, and plenty of quiet space between quests. A useful headcanon can live in that space without rewriting a character's whole history.",
      "Start with an ordinary detail. Think about what the character carries, avoids, cooks badly, remembers too clearly, or does when nobody expects anything from them.",
    ],
    angles: [
      {
        title: "Life between quests",
        body: "Place the character in a shop, kitchen, library, or festival. An ordinary setting makes a private habit easier to notice.",
      },
      {
        title: "Regional details",
        body: "Use food, weather, local customs, and travel time as pressure on the scene. The setting should affect what the character can do.",
      },
      {
        title: "Public role and private behavior",
        body: "Many characters have a job, title, or reputation to maintain. Let the headcanon show what changes when that role is briefly set aside.",
      },
    ],
    sceneStarts: [
      "A festival closes the shortest route home, so two characters have to wait together.",
      "Someone finds an everyday object that does not match the character's public image.",
      "A recipe goes wrong, and the character has to decide whether to admit they care.",
    ],
    faqs: [
      {
        q: "Are these Genshin Impact headcanons official?",
        a: "No. They are fan-made writing ideas. Check the game or official material when a canon detail matters to your story.",
      },
      {
        q: "Can I generate an idea for any Genshin Impact character?",
        a: "Yes. Use the character field for the name and prefill Genshin Impact as the fandom. Rewrite the result if it does not fit your reading of the character.",
      },
    ],
  },
  {
    slug: "jujutsu-kaisen",
    name: "Jujutsu Kaisen",
    title: "Jujutsu Kaisen Headcanons, Scene Prompts, and Writing Ideas",
    description:
      "Find Jujutsu Kaisen headcanon ideas for missions, school routines, strained friendships, and the small details characters use to hide what they are feeling.",
    intro: [
      "Jujutsu Kaisen moves quickly between danger, school routines, and relationships under pressure. Headcanons work best when they connect those parts instead of adding a dramatic secret for its own sake.",
      "Look for a habit that helps the character get through an ordinary day. Then ask what happens when another person notices it at the wrong time.",
    ],
    angles: [
      {
        title: "What happens after a mission",
        body: "Write the walk back, the late meal, or the short conversation nobody has during a fight. Recovery often reveals more than action does.",
      },
      {
        title: "Humor as cover",
        body: "A joke can change the subject, test a friendship, or make a difficult room bearable. Decide what the character does not want answered.",
      },
      {
        title: "Small school routines",
        body: "Use classrooms, vending machines, dorm rooms, and training spaces to give the cast something concrete to react to.",
      },
    ],
    sceneStarts: [
      "A character returns something they borrowed months ago, with no explanation for why they kept it.",
      "Two people disagree about what counts as a normal way to recover after a mission.",
      "A familiar joke fails, and the silence after it says more than the argument would.",
    ],
    faqs: [
      {
        q: "Can a Jujutsu Kaisen headcanon be lighthearted?",
        a: "Yes. Food, school, travel, and awkward downtime can give the cast room to feel like people without ignoring the story's heavier parts.",
      },
      {
        q: "How do I keep a headcanon in character?",
        a: "Base it on a choice or reaction already visible in the source, then add only one new detail. Avoid changing the character's core motive just to make the idea work.",
      },
    ],
  },
  {
    slug: "spy-x-family",
    name: "Spy x Family",
    title: "Spy x Family Headcanons for Family and Comedy Scenes",
    description:
      "Explore Spy x Family headcanon ideas for domestic comedy, family routines, secret-keeping, school scenes, and small Forger moments that can begin a story.",
    intro: [
      "Spy x Family is built around people performing a role and slowly making parts of that role real. A good headcanon can use that tension without turning every scene into a reveal.",
      "Domestic details are especially useful here. A packed lunch, a school note, or an evening routine can show affection and suspicion in the same scene.",
    ],
    angles: [
      {
        title: "Family routines",
        body: "Give the household a repeated habit that began as part of the mission but now matters for personal reasons.",
      },
      {
        title: "Secrets in ordinary rooms",
        body: "Let a small misunderstanding happen in the kitchen, hallway, or classroom. The stakes can be emotional even when the event is harmless.",
      },
      {
        title: "A child's logic",
        body: "Keep the observation concrete and immediate. Children often notice the right detail and draw the funniest possible conclusion from it.",
      },
    ],
    sceneStarts: [
      "A school assignment asks a question nobody in the family can answer honestly.",
      "One person tries to repair a household object before anyone notices it broke.",
      "A family tradition is invented on the spot, then unexpectedly survives the week.",
    ],
    faqs: [
      {
        q: "What kind of Spy x Family headcanon works well for fanfiction?",
        a: "Try a routine that exposes two motives at once. The character may be protecting a secret while also doing something genuinely kind.",
      },
      {
        q: "Can I use these ideas for short scenes?",
        a: "Yes. Most of the prompts are meant to fit a single domestic or school scene before they grow into a larger plot.",
      },
    ],
  },
  {
    slug: "honkai-star-rail",
    name: "Honkai: Star Rail",
    title: "Honkai: Star Rail Headcanons and Crew Writing Ideas",
    description:
      "Browse Honkai: Star Rail headcanon ideas for the Astral Express crew, shared travel routines, quiet character habits, and scene prompts between destinations.",
    intro: [
      "Honkai: Star Rail combines large worlds with a crew that keeps returning to the same train. That makes travel habits, shared spaces, and the time between destinations useful material for headcanons.",
      "Choose one thing the character always does before arrival or after departure. A repeated action can reveal how they handle uncertainty without explaining it out loud.",
    ],
    angles: [
      {
        title: "Life on the Express",
        body: "Use shared meals, cabins, observation windows, and luggage. Limited space makes small habits visible to everyone.",
      },
      {
        title: "Souvenirs and memory",
        body: "Decide what the character keeps from a world and what they leave behind. The object does not need to be valuable.",
      },
      {
        title: "Before the next stop",
        body: "A journey has built-in pauses. Let the character prepare, procrastinate, or ask a question they cannot take back once the train arrives.",
      },
    ],
    sceneStarts: [
      "A character notices that the same object has moved to a different cabin after every trip.",
      "The crew has one evening with no urgent task and cannot agree on how to spend it.",
      "Someone packs for the next world as if they already know what will go wrong.",
    ],
    faqs: [
      {
        q: "Do Honkai: Star Rail headcanons need to follow a specific Path?",
        a: "No. A Path can shape the theme, but a small daily habit can work without turning the idea into a lore explanation.",
      },
      {
        q: "Can I write an original crew member?",
        a: "Yes. Use the OC generator with Honkai: Star Rail in the fandom field, then adjust the idea to fit your character's role and home world.",
      },
    ],
  },
  {
    slug: "demon-slayer",
    name: "Demon Slayer",
    title: "Demon Slayer Headcanons and Quiet Character Moments",
    description:
      "Find Demon Slayer headcanon ideas for recovery, training, friendship, travel, and quiet choices that reveal character before and after dangerous battles.",
    intro: [
      "Demon Slayer gives its characters intense physical demands and very little certainty. A grounded headcanon can focus on how they rest, train, care for equipment, or help someone without making a speech about it.",
      "Physical details matter. A repaired sleeve, a familiar meal, or a change in breathing can carry the emotional weight of a scene.",
    ],
    angles: [
      {
        title: "Recovery and routine",
        body: "Show what the character does after the danger has passed. Rest can be difficult for someone who is used to staying alert.",
      },
      {
        title: "Care through action",
        body: "Let affection appear in packed food, mended clothing, shared watch, or practical advice rather than a direct confession.",
      },
      {
        title: "Training with a flaw",
        body: "Give the character one small mistake they repeat when tired. Improvement feels clearer when the problem is specific.",
      },
    ],
    sceneStarts: [
      "A character wakes before dawn and finds someone else already repairing their gear.",
      "A meal tastes familiar, but neither person wants to explain why that matters.",
      "Training stops because of a tiny injury the character insists is not worth mentioning.",
    ],
    faqs: [
      {
        q: "Can a Demon Slayer headcanon focus on everyday life?",
        a: "Yes. Recovery, travel, food, clothing, and chores can make the dangerous parts of the story feel more personal.",
      },
      {
        q: "How do I avoid making a headcanon too dramatic?",
        a: "Keep the event small and let the character's reaction provide the meaning. Not every private habit needs a tragic explanation.",
      },
    ],
  },
];

export function findFandomHub(slug: string) {
  return FANDOM_HUBS.find((hub) => hub.slug === slug);
}
