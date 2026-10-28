import axiosInstance from "../axios";

export type TrainingRatingProgress = {
  rating: number;
  lessonsCompleted: number;
  completedLessons: string[];
  specialCoursesUnlocked: boolean;
  specialCoursesUnlockRating: number;
};

export type TrainingLessonCompletionResult = TrainingRatingProgress & {
  ratingChange: number;
  alreadyCompleted: boolean;
};

export const trainingRatingApi = {
  getProgress: async () => {
    const { data } = await axiosInstance.get<TrainingRatingProgress>("/users/me/training-rating");
    return data;
  },

  completeLesson: async (lessonId: string, moves: string[]) => {
    const { data } = await axiosInstance.post<TrainingLessonCompletionResult>(
      `/users/me/training-rating/lessons/${encodeURIComponent(lessonId)}/complete`,
      { moves },
    );
    return data;
  },
};
