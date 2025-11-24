import React, { useState, useEffect, useRef } from 'react';
import { GameState, Difficulty, Position, TileData, User } from './types';
import { DIFFICULTY_CONFIG, MATCH_SCORE, COMBO_CONFIG } from './constants';
import { generateBoard, findPath, getHintPair, shuffleBoard } from './services/gameLogic';
import { playMatchSound, playHintSound, playShuffleSound } from './services/audio';
import { getCurrentUser, updateUserScore } from './services/auth';
import { GameMenu } from './components/GameMenu';
import { GameControls } from './components/GameControls';
import { GameBoard } from './components/GameBoard';
import { Frown, Trophy, ArrowRight, AlertTriangle, Clock } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('easy');
  
  const [board, setBoard] = useState<TileData[][]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [initialTime, setInitialTime] = useState(0); // Track start time for "Time Used" calc
  const [hints, setHints] = useState(0);
  const [shuffles, setShuffles] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lastTimeBonus, setLastTimeBonus] = useState<{ amount: number, id: number } | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [hintPair, setHintPair] = useState<[Position, Position] | null>(null);
  const [connectionPath, setConnectionPath] = useState<Position[] | null>(null);

  const lastMatchTimeRef = useRef<number>(0);

  // Initialize Session
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  // Timer Effect
  useEffect(() => {
    let timerId: ReturnType<typeof setInterval>;
    if (gameState === GameState.PLAYING && timeLeft > 0 && !showQuitConfirm) {
      timerId = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1) {
                setGameState(GameState.LOST);
                return 0;
            }
            return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [gameState, timeLeft, showQuitConfirm]);

  // Handle Win Logic and Saving Score
  useEffect(() => {
    if (gameState === GameState.WON && currentUser) {
        // Time used can be technically negative if they gained tons of time, so floor at 1s for records
        const rawTimeUsed = initialTime - timeLeft;
        const timeUsed = Math.max(1, rawTimeUsed);
        
        updateUserScore(currentUser.username, currentDifficulty, score, timeUsed);
        
        // Refresh user object from storage to reflect updates
        const updatedUser = getCurrentUser();
        if (updatedUser) setCurrentUser(updatedUser);
    }
  }, [gameState]); 

  // Start Game
  const startGame = (difficulty: Difficulty) => {
    setCurrentDifficulty(difficulty);
    const config = DIFFICULTY_CONFIG[difficulty];
    
    // Mobile Optimization:
    // If the screen is portrait (height > width), swap rows and cols.
    // This makes the board "tall" instead of "wide", matching the phone screen better.
    // Example Hard Mode: 12 Rows x 18 Cols (Wide) -> 18 Rows x 12 Cols (Tall)
    const isPortrait = window.innerWidth < window.innerHeight;
    
    const rows = isPortrait ? config.cols : config.rows;
    const cols = isPortrait ? config.rows : config.cols;

    const newBoard = generateBoard(rows, cols);
    
    setBoard(newBoard);
    setScore(0);
    setTimeLeft(config.totalTime);
    setInitialTime(config.totalTime);
    setHints(config.initialHints);
    setShuffles(config.initialShuffles);
    setCombo(0);
    setLastTimeBonus(null);
    lastMatchTimeRef.current = 0;
    
    setSelectedPos(null);
    setHintPair(null);
    setConnectionPath(null);
    setShowQuitConfirm(false);
    setGameState(GameState.PLAYING);
  };

  // Handle Tile Click
  const handleTileClick = (pos: Position) => {
    // Ignore invalid clicks
    if (gameState !== GameState.PLAYING || showQuitConfirm) return;
    const tile = board[pos.y][pos.x];
    if (tile.isEmpty) return;

    // Clear hint if user clicks
    setHintPair(null);

    // If nothing selected, select this
    if (!selectedPos) {
      setSelectedPos(pos);
      return;
    }

    // If clicking same tile, deselect
    if (selectedPos.x === pos.x && selectedPos.y === pos.y) {
      setSelectedPos(null);
      return;
    }

    // Check match
    const selectedTile = board[selectedPos.y][selectedPos.x];
    if (selectedTile.type === tile.type) {
        // Try to find path
        const path = findPath(selectedPos, pos, board);
        if (path) {
            // Match found!
            handleMatch(selectedPos, pos, path);
        } else {
            // No path, switch selection
            setSelectedPos(pos);
        }
    } else {
        // Different type, switch selection
        setSelectedPos(pos);
    }
  };

  // Handle Match Logic
  const handleMatch = (p1: Position, p2: Position, path: Position[]) => {
    // Show connection
    setConnectionPath(path);
    setSelectedPos(null);

    // Play Sound immediately
    playMatchSound();

    // --- COMBO & SCORE LOGIC ---
    const now = Date.now();
    let newCombo = 1;
    
    // Check if within combo window (and it's not the first match of the game)
    if (lastMatchTimeRef.current > 0 && (now - lastMatchTimeRef.current) <= COMBO_CONFIG.WINDOW_MS) {
        newCombo = combo + 1;
    }
    
    // Update ref for next time
    lastMatchTimeRef.current = now;
    setCombo(newCombo);

    // Calculate Bonuses
    // Base Score + (Combo Level * Bonus)
    // Combo 1: +100, Combo 2: +150, Combo 3: +200...
    const scoreToAdd = MATCH_SCORE + ((newCombo - 1) * COMBO_CONFIG.COMBO_SCORE_BONUS);
    
    // Base Time + (Combo Level * Bonus)
    // Combo 1: +2s, Combo 2: +3s, Combo 3: +4s...
    const timeToAdd = COMBO_CONFIG.BASE_TIME_BONUS + ((newCombo - 1) * COMBO_CONFIG.COMBO_TIME_BONUS);

    // Apply updates
    setTimeout(() => {
        setBoard(prev => {
            const newBoard = prev.map(row => row.map(t => ({...t})));
            newBoard[p1.y][p1.x].isEmpty = true;
            newBoard[p2.y][p2.x].isEmpty = true;
            return newBoard;
        });
        
        setScore(s => s + scoreToAdd);
        
        // Trigger visual effect for time bonus
        setTimeLeft(t => t + timeToAdd);
        setLastTimeBonus({ amount: timeToAdd, id: Date.now() });

        setConnectionPath(null);

        // Check Win Condition
        setBoard(currentBoard => {
            const hasTiles = currentBoard.some(row => row.some(t => !t.isEmpty));
            if (!hasTiles) {
                setGameState(GameState.WON);
            }
            return currentBoard;
        });

    }, 400); // Wait for shatter animation
  };

  // Features
  const handleHint = () => {
    if (hints > 0 && !showQuitConfirm) {
      const pair = getHintPair(board);
      if (pair) {
        playHintSound();
        setHintPair(pair);
        setHints(h => h - 1);
      }
    }
  };

  const handleShuffle = () => {
    if (shuffles > 0 && !showQuitConfirm) {
      playShuffleSound();
      setBoard(prev => shuffleBoard(prev));
      setShuffles(s => s - 1);
      setHintPair(null);
      setSelectedPos(null);
    }
  };

  const handleGiveUpRequest = () => {
    setShowQuitConfirm(true);
  };

  const confirmGiveUp = () => {
    setShowQuitConfirm(false);
    setGameState(GameState.MENU);
  };

  const cancelGiveUp = () => {
    setShowQuitConfirm(false);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const checkIsNewRecord = () => {
      if(!currentUser) return false;
      const rec = currentUser.records?.[currentDifficulty];
      if (!rec) return true;
      if (score > rec.score) return true;
      return false;
  };

  const isNewRecord = gameState === GameState.WON && checkIsNewRecord();

  return (
    <div className="min-h-screen bg-transparent flex flex-col font-sans overflow-hidden">
      
      {gameState === GameState.MENU && (
        <GameMenu 
            onStart={startGame} 
            currentUser={currentUser}
            onLogin={handleLogin}
            onLogout={handleLogout}
        />
      )}

      {gameState === GameState.PLAYING && (
        <div className="flex-1 flex flex-col h-[100dvh] w-full relative">
          <GameControls 
            score={score}
            timeLeft={timeLeft}
            totalTime={initialTime}
            hints={hints}
            shuffles={shuffles}
            combo={combo}
            lastTimeBonus={lastTimeBonus}
            onHint={handleHint}
            onShuffle={handleShuffle}
            onGiveUp={handleGiveUpRequest}
          />
          <div className="flex-1 min-h-0 w-full flex flex-col">
             <GameBoard 
                board={board}
                selectedPos={selectedPos}
                hintPair={hintPair}
                onTileClick={handleTileClick}
                connectionPath={connectionPath}
                isPaused={showQuitConfirm}
             />
          </div>
        </div>
      )}

      {/* Quit Confirmation Modal */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center glass-panel-dark animate-fade-in p-4">
             <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-100">
                <div className="mb-6 flex justify-center">
                    <div className="bg-orange-100 p-4 rounded-full">
                        <AlertTriangle size={48} className="text-orange-500" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">退出游戏?</h3>
                <p className="text-gray-500 mb-8">您确定要放弃当前进度并返回主菜单吗?</p>
                
                <div className="flex space-x-4">
                    <button 
                        onClick={cancelGiveUp}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={confirmGiveUp}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-red-200"
                    >
                        确定放弃
                    </button>
                </div>
             </div>
        </div>
      )}

      {/* Game Over / Win Screens */}
      {(gameState === GameState.WON || gameState === GameState.LOST) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center glass-panel-dark p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center transform scale-100 transition-all border border-gray-100">
                {gameState === GameState.WON ? (
                    <div className="mb-4 flex flex-col items-center">
                        <div className="p-4 bg-yellow-100 rounded-full mb-4 animate-bounce">
                            <Trophy size={48} className="text-yellow-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800">胜利!</h2>
                        
                        <div className="bg-gray-50 rounded-xl p-4 w-full mt-4 mb-2">
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-500 text-sm">难度</span>
                                <span className="font-bold text-gray-800 uppercase">{currentDifficulty}</span>
                             </div>
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-500 text-sm">最终得分</span>
                                <span className="text-xl font-bold text-orange-600">{score}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-gray-500 text-sm">剩余时间</span>
                                <span className="text-lg font-mono text-gray-700">
                                     {Math.floor(timeLeft / 60)}:
                                     {(timeLeft % 60).toString().padStart(2, '0')}
                                </span>
                             </div>
                        </div>

                        {isNewRecord && (
                             <p className="text-sm text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full animate-pulse">
                                🏆 新纪录! New Personal Best!
                             </p>
                        )}
                    </div>
                ) : (
                    <div className="mb-4 flex flex-col items-center">
                        <div className="p-4 bg-red-100 rounded-full mb-4">
                            <Frown size={48} className="text-red-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800">游戏结束</h2>
                        <p className="text-gray-500 mt-2">时间耗尽! 再接再厉。</p>
                    </div>
                )}
                
                <button 
                    onClick={() => setGameState(GameState.MENU)}
                    className="w-full mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                    <span>返回菜单</span>
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

export default App;