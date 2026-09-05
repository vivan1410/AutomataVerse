const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/progression.json');

// Ensure db directory exists
const ensureDb = () => {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2));
  }
};

// Load data
const loadData = () => {
  ensureDb();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('[Progression Service] DB load failed, returning empty store:', e.message);
    return { users: {} };
  }
};

// Save data
const saveData = (data) => {
  ensureDb();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('[Progression Service] DB save failed:', e.message);
  }
};

// Level Calculation from XP (Requirement 4)
const calculateLevel = (xp) => {
  if (xp < 100) return 1;
  if (xp < 250) return 2;
  if (xp < 500) return 3;
  if (xp < 800) return 4;
  
  let level = 4;
  let threshold = 800;
  let increment = 400;
  while (xp >= threshold) {
    level++;
    threshold += increment;
    increment += 100;
  }
  return level;
};

// Create a blank new user profile (Requirement 1)
const createDefaultProfile = (username, email) => {
  return {
    email: email.trim().toLowerCase(),
    username: username.trim(),
    xp: 0,
    coins: 0,
    level: 1,
    streak: 0,
    lastActiveDate: '',
    lessonsCompleted: [], // List of completed lesson IDs
    chaptersCompleted: [], // List of completed chapter IDs
    quizzesCompleted: [], // List of completed quiz IDs
    challengesSolved: [], // List of completed challenge IDs
    achievements: [], // List of unlocked achievement IDs
    questionsSolvedCount: 0,
    correctAnswersCount: 0,
    totalAnswersCount: 0,
    practiceSessions: 0,
    challengeSessions: 0,
    totalTimeSpent: 0,
    longestStreak: 0,
    joinDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  };
};

const progressionService = {
  // Register a user
  registerUser(username, email, password) {
    const data = loadData();
    const cleanEmail = email.trim().toLowerCase();
    
    if (data.users[cleanEmail]) {
      throw new Error('User already exists with this email address.');
    }

    const profile = createDefaultProfile(username, cleanEmail);
    data.users[cleanEmail] = {
      password: password, // For simplicity of this pair-programming session
      profile
    };
    saveData(data);
    return profile;
  },

  // Login a user
  loginUser(email, password) {
    const data = loadData();
    const cleanEmail = email.trim().toLowerCase();
    
    if (!data.users[cleanEmail]) {
      // If guest user, auto register on backend!
      if (cleanEmail.includes('guest')) {
        return this.registerUser('Guest Student', cleanEmail, 'guest');
      }
      throw new Error('No user profile found for this email.');
    }

    const user = data.users[cleanEmail];
    if (user.password !== password) {
      throw new Error('Invalid credentials.');
    }

    return user.profile;
  },

  // Get current progress
  getProgress(email) {
    const data = loadData();
    const cleanEmail = email.trim().toLowerCase();
    
    if (!data.users[cleanEmail]) {
      // Auto register for safety or guest flows
      return this.registerUser(cleanEmail.split('@')[0], cleanEmail, 'guest');
    }
    return data.users[cleanEmail].profile;
  },

  // Update profile details
  updateDetails(email, { username, avatar }) {
    const data = loadData();
    const cleanEmail = email.trim().toLowerCase();
    if (!data.users[cleanEmail]) throw new Error('User not found.');

    const profile = data.users[cleanEmail].profile;
    if (username) profile.username = username;
    if (avatar) profile.avatar = avatar;

    saveData(data);
    return profile;
  },

  // Complete a lesson (Requirement 3: Lesson Completed = +25 XP)
  completeLesson(email, lessonId) {
    const data = loadData();
    const cleanEmail = email.trim().toLowerCase();
    if (!data.users[cleanEmail]) throw new Error('User not found.');

    const profile = data.users[cleanEmail].profile;
    
    // Exploits Prevention: Check if already completed (Requirement 7)
    if (profile.lessonsCompleted.includes(lessonId)) {
      return { profile, rewarded: false, reason: 'Lesson already completed.' };
    }

    profile.lessonsCompleted.push(lessonId);
    
    // Award XP
    profile.xp += 25;
    profile.level = calculateLevel(profile.xp);

    saveData(data);
    return { profile, rewarded: true, xpEarned: 25, coinsEarned: 0 };
  },

  // Submit correct quiz answer (Requirement 2 & 3: Correct Quiz Answer = +10 XP, Easy = +5 coins, Med = +10 coins, Hard = +20 coins)
  submitQuizAnswer(email, { quizId, isCorrect, difficulty }) {
    const data = loadData();
    const cleanEmail = email.trim().toLowerCase();
    if (!data.users[cleanEmail]) throw new Error('User not found.');

    const profile = data.users[cleanEmail].profile;

    profile.totalAnswersCount = (profile.totalAnswersCount || 0) + 1;

    let xpEarned = 0;
    let coinsEarned = 0;

    if (isCorrect) {
      profile.correctAnswersCount = (profile.correctAnswersCount || 0) + 1;
      profile.questionsSolvedCount = (profile.questionsSolvedCount || 0) + 1;

      // Coins award (Requirement 2)
      if (difficulty === 'Easy') coinsEarned = 5;
      else if (difficulty === 'Medium') coinsEarned = 10;
      else if (difficulty === 'Hard') coinsEarned = 20;
      else coinsEarned = 5; // Default

      // XP award (Requirement 3)
      xpEarned = 10;

      profile.xp += xpEarned;
      profile.coins += coinsEarned;
      profile.level = calculateLevel(profile.xp);
    }

    // Save practice session run
    if (quizId && !profile.quizzesCompleted.includes(quizId)) {
      profile.quizzesCompleted.push(quizId);
      profile.practiceSessions = (profile.practiceSessions || 0) + 1;
    }

    saveData(data);
    return { profile, rewarded: isCorrect, xpEarned, coinsEarned };
  },

  // Complete challenge (Requirement 2 & 3: Challenge Completed = +40 XP, Easy = +5, Medium = +10, Hard = +20, Daily = +30)
  completeChallenge(email, { challengeId, difficulty }) {
    const data = loadData();
    const cleanEmail = email.trim().toLowerCase();
    if (!data.users[cleanEmail]) throw new Error('User not found.');

    const profile = data.users[cleanEmail].profile;

    // Exploit Prevention: Claim challenge only once
    if (profile.challengesSolved.includes(challengeId)) {
      return { profile, rewarded: false, reason: 'Challenge already solved.' };
    }

    profile.challengesSolved.push(challengeId);
    profile.challengeSessions = (profile.challengeSessions || 0) + 1;

    let xpEarned = 40;
    let coinsEarned = 0;

    if (difficulty === 'Easy') coinsEarned = 5;
    else if (difficulty === 'Medium') coinsEarned = 10;
    else if (difficulty === 'Hard') coinsEarned = 20;
    else if (difficulty === 'Daily') coinsEarned = 30;
    else coinsEarned = 10; // Default

    profile.xp += xpEarned;
    profile.coins += coinsEarned;
    profile.level = calculateLevel(profile.xp);

    saveData(data);
    return { profile, rewarded: true, xpEarned, coinsEarned };
  },

  // Unlock achievement
  claimAchievement(email, { achievementId, bonusCoins, bonusXp }) {
    const data = loadData();
    const cleanEmail = email.trim().toLowerCase();
    if (!data.users[cleanEmail]) throw new Error('User not found.');

    const profile = data.users[cleanEmail].profile;

    // Exploit prevention
    if (profile.achievements.includes(achievementId)) {
      return { profile, rewarded: false, reason: 'Achievement already claimed.' };
    }

    profile.achievements.push(achievementId);

    const xpEarned = bonusXp || 50;
    const coinsEarned = bonusCoins || 10;

    profile.xp += xpEarned;
    profile.coins += coinsEarned;
    profile.level = calculateLevel(profile.xp);

    saveData(data);
    return { profile, rewarded: true, xpEarned, coinsEarned };
  },

  // Complete module bonus (Requirement 3: Full Module Completed = +100 XP)
  completeModuleBonus(email, { moduleId }) {
    const data = loadData();
    const cleanEmail = email.trim().toLowerCase();
    if (!data.users[cleanEmail]) throw new Error('User not found.');

    const profile = data.users[cleanEmail].profile;
    
    if (profile.chaptersCompleted.includes(moduleId)) {
      return { profile, rewarded: false, reason: 'Module already completed.' };
    }

    profile.chaptersCompleted.push(moduleId);
    profile.xp += 100;
    profile.level = calculateLevel(profile.xp);

    saveData(data);
    return { profile, rewarded: true, xpEarned: 100, coinsEarned: 0 };
  },

  // Daily checkin/streak safety updates
  dailyCheckin(email) {
    const data = loadData();
    const cleanEmail = email.trim().toLowerCase();
    if (!data.users[cleanEmail]) throw new Error('User not found.');

    const profile = data.users[cleanEmail].profile;
    const todayStr = new Date().toISOString().split('T')[0];
    const lastActive = profile.lastActiveDate;

    if (lastActive === todayStr) {
      return profile; // Already active today
    }

    let newStreak = profile.streak || 0;
    
    if (lastActive) {
      const prevDate = new Date(lastActive);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak += 1;
      } else if (diffDays > 1) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    profile.streak = newStreak;
    profile.lastActiveDate = todayStr;
    if (newStreak > (profile.longestStreak || 0)) {
      profile.longestStreak = newStreak;
    }

    saveData(data);
    return profile;
  },

  // Leaderboard retrieval (Requirement 9)
  getLeaderboard() {
    const data = loadData();
    const list = Object.values(data.users).map(u => ({
      username: u.profile.username || 'Anonymous Learner',
      xp: u.profile.xp,
      coins: u.profile.coins,
      level: u.profile.level,
      streak: u.profile.streak,
      joinDate: u.profile.joinDate
    }));

    // Add static AI/leaderboard users to fill out ranks (Requirement 9)
    const fillerUsers = [
      { username: 'Turing Complete', level: 12, xp: 6200, coins: 410, streak: 8, joinDate: 'May 2026' },
      { username: 'Kleene Star 🌟', level: 10, xp: 5120, coins: 320, streak: 12, joinDate: 'June 2026' },
      { username: 'Lambda Nerd', level: 8, xp: 4210, coins: 280, streak: 5, joinDate: 'July 2026' },
      { username: 'Chomsky Bot', level: 6, xp: 3200, coins: 210, streak: 3, joinDate: 'July 2026' },
      { username: 'FiniteStateFun', level: 5, xp: 2810, coins: 180, streak: 4, joinDate: 'August 2026' }
    ];

    // Combine and sort by XP descending
    const combined = [...list, ...fillerUsers].sort((a, b) => b.xp - a.xp);
    return combined.map((u, index) => ({
      rank: index + 1,
      ...u
    }));
  },

  // Google Login & Automatic User registration / linking
  loginOrRegisterGoogle(sub, email, name, picture) {
    const data = loadData();
    const cleanEmail = email.trim().toLowerCase();
    
    // Look up user by google sub ID (provider_user_id)
    let emailKey = Object.keys(data.users).find(key => data.users[key].provider_user_id === sub);
    let existingUser = emailKey ? data.users[emailKey] : null;
    
    // If not found by sub, look up by email key directly
    if (!existingUser && data.users[cleanEmail]) {
      existingUser = data.users[cleanEmail];
      // Link the existing user profile to Google login details
      existingUser.provider = 'google';
      existingUser.provider_user_id = sub;
      if (picture && !existingUser.profile.avatar) {
        existingUser.profile.avatar = picture;
      }
      emailKey = cleanEmail;
    }
    
    if (existingUser) {
      // User exists - update avatar/picture if appropriate
      if (picture) {
        existingUser.profile.avatar = picture;
      }
      saveData(data);
      return existingUser.profile;
    }
    
    // User does not exist - create a new default profile
    const profile = createDefaultProfile(name, cleanEmail);
    if (picture) {
      profile.avatar = picture; // Use Google picture as avatar
    }
    
    data.users[cleanEmail] = {
      password: '', // No password required for Google logins
      provider: 'google',
      provider_user_id: sub,
      profile
    };
    
    saveData(data);
    return profile;
  }
};

module.exports = progressionService;
