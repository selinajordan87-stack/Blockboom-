import type { FishName } from "../fishing/Fishing";
export interface LearningContent {
  id: string;
  kind: "reading" | "spelling";
  prompt: string;
  target: string;
  allowSpeech: boolean;
}
export interface LearningProgress {
  completedMissions: string[];
  repetitions: number;
  successfulAnswers: number;
  voluntaryHints: number;
}
export interface SpellingEngine {
  evaluate(
    answer: string,
    content: LearningContent,
  ): { correct: boolean; feedback: string };
}
export interface DifficultyAdapter {
  select(
    contents: LearningContent[],
    progress: LearningProgress,
  ): LearningContent | undefined;
}
export const mission: LearningContent = {
  id: "first-perch",
  kind: "reading",
  prompt: "Fange einen Barsch.",
  target: "Flussbarsch",
  allowSpeech: true,
};
export const emptyProgress = (): LearningProgress => ({
  completedMissions: [],
  repetitions: 0,
  successfulAnswers: 0,
  voluntaryHints: 0,
});
export class ReadingEngine {
  constructor(
    public progress: LearningProgress = emptyProgress(),
    public active = false,
  ) {}
  accept() {
    if (!this.active && !this.progress.completedMissions.includes(mission.id)) {
      this.active = true;
      this.progress.repetitions++;
    }
  }
  catch(f: FishName) {
    if (this.active && f === mission.target) {
      this.progress.completedMissions.push(mission.id);
      this.progress.successfulAnswers++;
      this.active = false;
      return true;
    }
    return false;
  }
  hint() {
    this.progress.voluntaryHints++;
  }
}
