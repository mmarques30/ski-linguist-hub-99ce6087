import type { PlacementQuestion } from "@/lib/registration-utils";

type FallbackQuestion = Omit<PlacementQuestion, "id"> & { tempId: string };

const englishQuestions: FallbackQuestion[] = [
  { tempId: "en-1", question_text: "_____ name is John.", options: ["My", "I", "Me", "Mine"], correct_answer: "My", level: "A1", order_index: 1 },
  { tempId: "en-2", question_text: "She _____ to work every day.", options: ["go", "goes", "going", "gone"], correct_answer: "goes", level: "A1", order_index: 2 },
  { tempId: "en-3", question_text: "This is _____ book.", options: ["a", "an", "the", "some"], correct_answer: "a", level: "A1", order_index: 3 },
  { tempId: "en-4", question_text: "They _____ from France.", options: ["is", "am", "are", "be"], correct_answer: "are", level: "A1", order_index: 4 },
  { tempId: "en-5", question_text: "I _____ coffee in the morning.", options: ["drink", "drinks", "drinking", "drank"], correct_answer: "drink", level: "A1", order_index: 5 },
  { tempId: "en-6", question_text: "We _____ tennis yesterday.", options: ["play", "plays", "played", "playing"], correct_answer: "played", level: "A2", order_index: 6 },
  { tempId: "en-7", question_text: "She has _____ lived here.", options: ["never", "ever", "always", "yet"], correct_answer: "never", level: "A2", order_index: 7 },
  { tempId: "en-8", question_text: "If it rains, we _____ stay inside.", options: ["will", "would", "are", "have"], correct_answer: "will", level: "A2", order_index: 8 },
  { tempId: "en-9", question_text: "He is _____ than his brother.", options: ["tall", "taller", "tallest", "more tall"], correct_answer: "taller", level: "A2", order_index: 9 },
  { tempId: "en-10", question_text: "I have _____ finished my homework.", options: ["yet", "already", "still", "ever"], correct_answer: "already", level: "A2", order_index: 10 },
  { tempId: "en-11", question_text: "The meeting was postponed _____ the bad weather.", options: ["because", "because of", "although", "despite"], correct_answer: "because of", level: "B1", order_index: 11 },
  { tempId: "en-12", question_text: "She suggested _____ early.", options: ["leave", "to leave", "leaving", "left"], correct_answer: "leaving", level: "B1", order_index: 12 },
  { tempId: "en-13", question_text: "I wish I _____ speak German.", options: ["can", "could", "will", "would"], correct_answer: "could", level: "B1", order_index: 13 },
  { tempId: "en-14", question_text: "The report _____ by Friday.", options: ["must finish", "must be finished", "must finishing", "must to finish"], correct_answer: "must be finished", level: "B1", order_index: 14 },
  { tempId: "en-15", question_text: "He's used to _____ up early.", options: ["get", "getting", "gets", "got"], correct_answer: "getting", level: "B1", order_index: 15 },
  { tempId: "en-16", question_text: "Hardly _____ arrived when it started raining.", options: ["had we", "we had", "have we", "we have"], correct_answer: "had we", level: "B2", order_index: 16 },
  { tempId: "en-17", question_text: "The ski bindings should be _____ properly.", options: ["adjust", "adjusted", "adjusting", "adjustment"], correct_answer: "adjusted", level: "B2", order_index: 17 },
  { tempId: "en-18", question_text: "Be careful not to hurt your _____ when skiing.", options: ["ankles", "angels", "angles", "anchors"], correct_answer: "ankles", level: "B2", order_index: 18 },
  { tempId: "en-19", question_text: "Not only _____ late, but he also forgot the equipment.", options: ["he was", "was he", "he is", "is he"], correct_answer: "was he", level: "C1", order_index: 19 },
  { tempId: "en-20", question_text: "Had I known about the avalanche risk, I _____ differently.", options: ["would act", "would have acted", "will act", "acted"], correct_answer: "would have acted", level: "C1", order_index: 20 },
];

function toPlacementQuestions(items: FallbackQuestion[]): PlacementQuestion[] {
  return items.map((item) => ({
    id: item.tempId,
    question_text: item.question_text,
    options: item.options,
    correct_answer: item.correct_answer,
    level: item.level,
    order_index: item.order_index,
  }));
}

export const FALLBACK_PLACEMENT_QUESTIONS: Record<string, PlacementQuestion[]> = {
  anglais: toPlacementQuestions(englishQuestions),
  portugais: toPlacementQuestions(englishQuestions),
  russe: toPlacementQuestions(englishQuestions),
  neerlandais: toPlacementQuestions(englishQuestions),
};
