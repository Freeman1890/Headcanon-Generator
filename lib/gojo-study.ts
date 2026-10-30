export const GOJO_STUDY = {
  updated: "2026-10-30",
  scope: "Adult Gojo as a teacher in the early TV anime, through season 1 episode 7. This article discusses the episode's training setup; it leaves later plot events aside. The linked official site also covers later arcs.",
  sources: [
    { label: "Official anime character profile: Satoru Gojo", href: "https://jujutsukaisen.jp/character/shibuyajihen.php", fact: "The profile identifies Gojo as a teacher at Tokyo Jujutsu High and connects his work to raising the next generation of strong allies." },
    { label: "Official synopsis: season 1, episode 7", href: "https://jujutsukaisen.jp/episodes/07.php", fact: "During Jogo's attack, Gojo returns to the school and brings the training Yuji to the encounter." },
  ],
  interpretation: "Those two starting points suggest a useful writing angle: Gojo may treat a student's question as a chance for a practical demonstration. That reading gives him a teaching motive rather than making every joke a cover for sadness.",
  revision: {
    input: "Gojo has finished an ordinary training session. A student repeats a question he thought he had already answered.",
    draft: "Gojo jokes because he is lonely and wants everyone to like him.",
    problem: "The explanation assigns the same hidden motive to every joke. It also loses the specific teacher-student situation.",
    revised: "Gojo turns a repeated question into a ridiculous classroom demonstration, then checks whether the student can explain the answer without his help.",
    scene: ["Gojo balanced a marker across two paper cups. 'A very expensive training apparatus.'", "Yuji stared at it. 'You found those in the bin.'", "'And yet, the question remains.' He slid one cup away.", "Yuji reached to steady the marker, then stopped. 'Oh. So if I move this one first...'", "Gojo left the second cup where it was. 'Show me.'"],
    reason: "The invented demonstration keeps the joke connected to a job: getting Yuji to try the answer. The final instruction gives the student the next action.",
  },
};

export const GOJO_EXAMPLE = {
  id: "gojo-jjk", characterName: "Gojo Satoru", workName: "Jujutsu Kaisen",
  metaTitle: "Gojo Satoru Headcanons: Source Anchors and a Worked Scene",
  metaDescription: "Build Gojo Satoru headcanons from two official anime source anchors, an original teaching scene, four new ideas, and a draft-to-revision walkthrough.",
  summary: "A Gojo headcanon can start with his teaching choices instead of a secret tragedy. This worked example builds an ordinary classroom moment from his interest in developing students.",
  content: GOJO_STUDY.revision.revised,
  whyItFits: ["The student gets to solve a problem instead of only admiring the teacher.", "The playful demonstration has a practical purpose within the scene."],
  moreIdeas: [
    "He keeps a box of abandoned training props and asks each new student to invent a use for the least impressive one.",
    "He remembers which student asks questions after everyone else has left and creates a reason to stay by the door.",
    "His evaluation forms contain outrageous headings, but the one concrete exercise for each student is written with care.",
    "He turns a boring staff inventory into a competition and loses because a colleague insists that enthusiasm is not a counting method.",
  ],
  sceneIdeas: ["A student finds an old exercise with their name crossed out and replaced by a harder version. They want to know when Gojo decided they were ready."],
  writerNotes: ["Give his confidence a task: teaching, persuading, or getting an answer.", "Let another person refuse the joke and continue with their own goal.", "For a later arc or another adaptation, choose a new source anchor before extending this version."],
  prompts: ["A student asks to teach the next exercise. What does Gojo let them change?"],
  faqs: [
    { q: "Which parts of this page come from the anime?", a: "The two source notes summarize the official profile and episode 7 synopsis. The classroom demonstration and the four additional ideas are original fan-writing examples by Headcanon Generator." },
    { q: "How do I adapt this Gojo headcanon for a different tone?", a: "Change the obstacle, not his whole personality. For comedy, a colleague can insist on finishing paperwork. For a quieter scene, let a student ask why an exercise was changed." },
  ],
  shareUrl: "/fandom/jujutsu-kaisen/gojo-satoru",
};
