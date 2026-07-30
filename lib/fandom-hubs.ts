export interface FandomHub {
  slug: string;
  name: string;
  title: string;
  description: string;
  intro: string[];
  angles: { title: string; body: string }[];
  sceneStarts: string[];
  faqs: { q: string; a: string }[];
}

export const FANDOM_HUBS: FandomHub[] = [
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
