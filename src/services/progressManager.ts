import { apiService } from './api';

export const progressManager = {
  // Synchronizes state with backend
  async syncProfile(email: string, setProfile: (p: any) => void): Promise<any> {
    try {
      const response = await apiService.getProgress(email);
      if (response && response.success) {
        setProfile(response.profile);
        return response.profile;
      }
    } catch (e) {
      console.error('[ProgressManager] syncProfile failed:', e);
    }
  },

  // Awards lesson completion XP (Requirement 3: Lesson Completed = +25 XP)
  async completeLesson(email: string, lessonId: string, setProfile: (p: any) => void, showToast?: (msg: string) => void) {
    try {
      const response = await apiService.completeLesson(email, lessonId);
      if (response && response.success) {
        setProfile(response.profile);
        if (response.rewarded && showToast) {
          showToast(`✨ Lesson completed! +${response.xpEarned} XP!`);
        }
      }
    } catch (e) {
      console.error('[ProgressManager] completeLesson failed:', e);
    }
  },

  // Submits a correct quiz answer to award XP and Coins (Requirement 2 & 3: Quiz correct = +10 XP, Easy = +5 coins, Medium = +10 coins, Hard = +20 coins)
  async submitQuizAnswer(email: string, quizId: string, isCorrect: boolean, difficulty: string, setProfile: (p: any) => void, showToast?: (msg: string) => void) {
    try {
      const response = await apiService.submitQuizAnswer(email, quizId, isCorrect, difficulty);
      if (response && response.success) {
        setProfile(response.profile);
        if (isCorrect && response.rewarded && showToast) {
          showToast(`✨ Correct answer! +${response.xpEarned} XP, +${response.coinsEarned} Coins!`);
        }
      }
    } catch (e) {
      console.error('[ProgressManager] submitQuizAnswer failed:', e);
    }
  },

  // Completes challenge to award XP and Coins (Requirement 2 & 3: Challenge completed = +40 XP, Easy = +5, Medium = +10, Hard = +20, Daily = +30)
  async completeChallenge(email: string, challengeId: string, difficulty: string, setProfile: (p: any) => void, showToast?: (msg: string) => void) {
    try {
      const response = await apiService.completeChallenge(email, challengeId, difficulty);
      if (response && response.success) {
        setProfile(response.profile);
        if (response.rewarded && showToast) {
          showToast(`🏆 Challenge completed! +${response.xpEarned} XP, +${response.coinsEarned} Coins!`);
        }
      }
    } catch (e) {
      console.error('[ProgressManager] completeChallenge failed:', e);
    }
  },

  // Unlocks achievement
  async claimAchievement(email: string, achievementId: string, bonusCoins: number, bonusXp: number, setProfile: (p: any) => void, showToast?: (msg: string) => void) {
    try {
      const response = await apiService.claimAchievement(email, achievementId, bonusCoins, bonusXp);
      if (response && response.success) {
        setProfile(response.profile);
        if (response.rewarded && showToast) {
          showToast(`🏆 Achievement unlocked! +${response.xpEarned} XP, +${response.coinsEarned} Coins!`);
        }
      }
    } catch (e) {
      console.error('[ProgressManager] claimAchievement failed:', e);
    }
  },

  // Complete module bonus (Requirement 3: Full Module Completed = +100 XP)
  async completeModuleBonus(email: string, moduleId: string, setProfile: (p: any) => void, showToast?: (msg: string) => void) {
    try {
      const response = await apiService.completeModuleBonus(email, moduleId);
      if (response && response.success) {
        setProfile(response.profile);
        if (response.rewarded && showToast) {
          showToast(`🌟 Module completed! +${response.xpEarned} XP!`);
        }
      }
    } catch (e) {
      console.error('[ProgressManager] completeModuleBonus failed:', e);
    }
  },

  // Updates streak
  async dailyCheckin(email: string, setProfile: (p: any) => void): Promise<any> {
    try {
      const response = await apiService.dailyCheckin(email);
      if (response && response.success) {
        setProfile(response.profile);
        return response.profile;
      }
    } catch (e) {
      console.error('[ProgressManager] dailyCheckin failed:', e);
    }
  },

  // Updates profile username/avatar
  async updateDetails(email: string, username?: string, avatar?: string, setProfile?: (p: any) => void): Promise<any> {
    try {
      const response = await apiService.updateDetails(email, username, avatar);
      if (response && response.success) {
        if (setProfile) setProfile(response.profile);
        return response.profile;
      }
    } catch (e) {
      console.error('[ProgressManager] updateDetails failed:', e);
    }
  }
};
