// Utility functions for managing job questions in localStorage

export interface JobQuestion {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  question: string;
  askedBy: string; // user ID or email
  askedAt: string;
  status: 'pending' | 'answered';
  answer?: string;
  answeredAt?: string;
  answeredBy?: string;
}

const QUESTIONS_KEY = 'urbi-job-questions';

export const getJobQuestions = (): JobQuestion[] => {
  try {
    const questions = localStorage.getItem(QUESTIONS_KEY);
    return questions ? JSON.parse(questions) : [];
  } catch (error) {
    console.error('Error loading job questions:', error);
    return [];
  }
};

export const addQuestion = (questionData: Omit<JobQuestion, 'id' | 'askedAt' | 'status'>): JobQuestion => {
  try {
    const questions = getJobQuestions();
    const newQuestion: JobQuestion = {
      ...questionData,
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      askedAt: new Date().toISOString(),
      status: 'pending'
    };
    
    const updatedQuestions = [newQuestion, ...questions];
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(updatedQuestions));
    console.log('✅ Question added:', newQuestion.id);
    
    return newQuestion;
  } catch (error) {
    console.error('Error adding question:', error);
    throw error;
  }
};

export const getQuestionsByJob = (jobId: string): JobQuestion[] => {
  try {
    const questions = getJobQuestions();
    return questions.filter(question => question.jobId === jobId);
  } catch (error) {
    console.error('Error loading questions for job:', error);
    return [];
  }
};

export const getQuestionsByUser = (userId: string): JobQuestion[] => {
  try {
    const questions = getJobQuestions();
    return questions.filter(question => question.askedBy === userId);
  } catch (error) {
    console.error('Error loading questions for user:', error);
    return [];
  }
};

export const answerQuestion = (questionId: string, answer: string, answeredBy: string): void => {
  try {
    const questions = getJobQuestions();
    const questionIndex = questions.findIndex(q => q.id === questionId);
    
    if (questionIndex !== -1) {
      questions[questionIndex] = {
        ...questions[questionIndex],
        status: 'answered',
        answer,
        answeredAt: new Date().toISOString(),
        answeredBy
      };
      
      localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
      console.log('✅ Question answered:', questionId);
    }
  } catch (error) {
    console.error('Error answering question:', error);
  }
};

export const deleteQuestion = (questionId: string): void => {
  try {
    const questions = getJobQuestions();
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(updatedQuestions));
    console.log('✅ Question deleted:', questionId);
  } catch (error) {
    console.error('Error deleting question:', error);
  }
};

export const clearAllQuestions = (): void => {
  try {
    localStorage.removeItem(QUESTIONS_KEY);
    console.log('✅ All questions cleared');
  } catch (error) {
    console.error('Error clearing questions:', error);
  }
};