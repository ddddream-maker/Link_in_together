import { User, Difficulty } from '../types';

const DB_KEY = 'fruit_link_users_db_v2'; // Bumped version for new schema
const OLD_DB_KEY = 'fruit_link_users_db'; // For migration
const SESSION_KEY = 'fruit_link_session_v2';

interface UserRecord extends User {
  passwordHash: string;
}

// Helper to simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Migrate old data if necessary
const migrateData = () => {
  if (localStorage.getItem(OLD_DB_KEY) && !localStorage.getItem(DB_KEY)) {
    try {
      const oldUsers = JSON.parse(localStorage.getItem(OLD_DB_KEY) || '[]');
      const newUsers: UserRecord[] = oldUsers.map((u: any) => ({
        username: u.username,
        passwordHash: u.passwordHash,
        records: {
          // Attempt to map old "bestScore" to "easy" or just ignore
          easy: { score: u.bestScore || 0, timeUsed: 0 }
        }
      }));
      localStorage.setItem(DB_KEY, JSON.stringify(newUsers));
      localStorage.removeItem(OLD_DB_KEY);
    } catch (e) {
      console.error("Migration failed", e);
    }
  }
};

const getDb = (): UserRecord[] => {
  migrateData();
  const str = localStorage.getItem(DB_KEY);
  return str ? JSON.parse(str) : [];
};

const saveDb = (users: UserRecord[]) => {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
};

export const loginUser = async (username: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
  await delay(600); 
  
  const users = getDb();
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (user && user.passwordHash === password) {
    const safeUser = { username: user.username, records: user.records };
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    return { success: true, user: safeUser };
  }

  return { success: false, message: '账号或密码错误' };
};

export const registerUser = async (username: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
  await delay(600);
  
  const users = getDb();
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, message: '该用户名已被注册' };
  }

  const newUser: UserRecord = {
    username,
    passwordHash: password,
    records: {}
  };

  users.push(newUser);
  saveDb(users);
  
  const safeUser = { username: newUser.username, records: newUser.records };
  localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
  
  return { success: true, user: safeUser };
};

export const logoutUser = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): User | null => {
  const str = localStorage.getItem(SESSION_KEY);
  return str ? JSON.parse(str) : null;
};

export const updateUserScore = (username: string, difficulty: Difficulty, newScore: number, timeUsed: number) => {
  const users = getDb();
  const userIndex = users.findIndex(u => u.username === username);
  
  if (userIndex !== -1) {
    const user = users[userIndex];
    if (!user.records) user.records = {};
    
    const currentRecord = user.records[difficulty];
    
    // Update if no record exists OR if new score is higher
    // If score is same, update if time is better (lower)
    let shouldUpdate = false;
    
    if (!currentRecord) {
      shouldUpdate = true;
    } else if (newScore > currentRecord.score) {
      shouldUpdate = true;
    } else if (newScore === currentRecord.score && timeUsed < currentRecord.timeUsed) {
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      user.records[difficulty] = { score: newScore, timeUsed };
      saveDb(users);
      
      // Update session too
      const session = getCurrentUser();
      if (session && session.username === username) {
        session.records = user.records;
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      }
    }
  }
};