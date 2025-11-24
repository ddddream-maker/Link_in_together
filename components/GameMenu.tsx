import React, { useState } from 'react';
import { Difficulty, User } from '../types';
import { Play, LogOut, Trophy, User as UserIcon, Clock, Globe, Zap, Crown } from 'lucide-react';
import { AuthForm } from './AuthForm';
import { logoutUser } from '../services/auth';

interface GameMenuProps {
  onStart: (difficulty: Difficulty) => void;
  currentUser: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({ onStart, currentUser, onLogin, onLogout }) => {
  const handleLogout = () => {
    logoutUser();
    onLogout();
  };

  const getRecordDisplay = (difficulty: Difficulty) => {
    const rec = currentUser?.records?.[difficulty];
    if (!rec) return { score: '--', time: '--' };
    return { 
        score: rec.score, 
        time: `${Math.floor(rec.timeUsed / 60)}:${(rec.timeUsed % 60).toString().padStart(2, '0')}` 
    };
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10">
      {/* Main Card */}
      <div className="glass-panel p-6 md:p-10 rounded-3xl shadow-2xl max-w-6xl w-full flex flex-col md:flex-row gap-8 md:gap-16 items-center md:items-stretch animate-fade-in relative overflow-hidden">
        
        {/* Decorative blobs */}
        <div className="absolute -top-40 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Left Side: Brand & Global Stats */}
        <div className="flex-1 flex flex-col justify-center w-full md:max-w-md z-10">
            <div className="text-center md:text-left mb-8">
                <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-2 drop-shadow-sm font-[Fredoka] tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">连连看</span>
                  <span className="text-3xl block md:inline md:ml-4 text-gray-400 font-medium">Online</span>
                </h1>
                <p className="text-xl text-gray-600 font-medium flex items-center justify-center md:justify-start gap-2">
                    <span>Fruit Link Saga</span>
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold uppercase">Beta</span>
                </p>
            </div>
            
            {/* Global Leaderboard Widget */}
            <div className="hidden md:block bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4 border-b border-gray-200/50 pb-2">
                    <div className="flex items-center gap-2 text-indigo-900 font-bold">
                        <Globe size={18} />
                        <span>全球排行榜</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span>Live Updates</span>
                    </div>
                </div>
                
                <div className="space-y-3">
                    {[
                        { name: 'SpeedyCat', score: 15400, rank: 1, avatar: '🐱' },
                        { name: 'FruitMaster', score: 14250, rank: 2, avatar: '👑' },
                        { name: 'EmojiKing', score: 13900, rank: 3, avatar: '😎' },
                    ].map((p, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/60 p-2.5 rounded-xl hover:bg-white/80 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`
                                    w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                                    ${i === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-200' : 
                                      i === 1 ? 'bg-gray-100 text-gray-600 ring-2 ring-gray-200' : 
                                      'bg-orange-100 text-orange-700 ring-2 ring-orange-200'}
                                `}>
                                    {p.rank}
                                </div>
                                <span className="text-sm font-bold text-gray-700">{p.name}</span>
                            </div>
                            <span className="font-mono font-bold text-indigo-600">{p.score.toLocaleString()}</span>
                        </div>
                    ))}
                    <div className="text-center text-xs text-gray-400 mt-2 pt-2">
                        Top 3 Players (Season 4)
                    </div>
                </div>
            </div>

            <div className="hidden md:flex items-center gap-4 mt-6 text-xs text-gray-400 font-medium pl-2">
                <div className="flex items-center gap-1.5">
                    <Zap size={14} className="text-green-500 fill-green-500" />
                    <span>Server: CN-East (24ms)</span>
                </div>
                <span>•</span>
                <span>Online Edition v2.1</span>
            </div>
        </div>

        {/* Right Side: Auth or Menu */}
        <div className="flex-1 w-full max-w-md flex flex-col justify-center z-10">
          
          {!currentUser ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/60">
               <AuthForm onLoginSuccess={onLogin} />
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-4">
                
                {/* User Profile Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute -top-4 -right-4 opacity-10 rotate-12 transition-transform group-hover:rotate-6 group-hover:scale-110">
                        <Trophy size={120} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="bg-white/20 p-2.5 rounded-full backdrop-blur-sm border border-white/10">
                                    <UserIcon size={24} />
                                </div>
                                <div>
                                    <div className="text-blue-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                        Online
                                    </div>
                                    <div className="text-xl font-bold leading-none">{currentUser.username}</div>
                                </div>
                            </div>
                            <Crown className="text-yellow-300 opacity-50" size={32} />
                        </div>
                        
                        {/* Mini Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 mt-4">
                             {['easy', 'normal', 'hard'].map(d => {
                                 const rec = getRecordDisplay(d as Difficulty);
                                 return (
                                     <div key={d} className="bg-black/20 rounded-xl p-2.5 text-center border border-white/5 backdrop-blur-sm">
                                         <div className="text-[10px] uppercase text-blue-200 font-bold mb-1 opacity-80">{d}</div>
                                         <div className="text-sm font-bold tracking-tight">{rec.score}</div>
                                         <div className="text-[10px] opacity-60 flex justify-center items-center gap-1 mt-0.5">
                                             <Clock size={8} /> {rec.time}
                                         </div>
                                     </div>
                                 );
                             })}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-300/30 my-2"></div>

                {/* Difficulty Select */}
                <div className="space-y-3 flex-1">
                    <div className="flex items-center justify-between px-1">
                         <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">Start New Game</p>
                    </div>
                    
                    <MenuButton 
                        label="简单 Easy" 
                        sub="8x10 • 休闲模式"
                        color="from-emerald-400 to-green-500 shadow-emerald-200" 
                        onClick={() => onStart('easy')} 
                    />
                    <MenuButton 
                        label="普通 Normal" 
                        sub="10x14 • 标准挑战"
                        color="from-blue-400 to-blue-500 shadow-blue-200" 
                        onClick={() => onStart('normal')} 
                    />
                    <MenuButton 
                        label="困难 Hard" 
                        sub="12x18 • 极限烧脑"
                        color="from-rose-400 to-red-500 shadow-rose-200" 
                        onClick={() => onStart('hard')} 
                    />
                </div>

                <button 
                    onClick={handleLogout}
                    className="self-center flex items-center space-x-2 text-gray-400 hover:text-red-500 transition-colors text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-50"
                >
                    <LogOut size={14} />
                    <span>退出登录 / Logout</span>
                </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const MenuButton = ({ label, sub, color, onClick }: { label: string, sub: string, color: string, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full bg-gradient-to-r ${color} text-white py-3.5 px-5 rounded-xl shadow-lg transform transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:scale-95 flex items-center justify-between group border border-white/20`}
  >
    <div className="text-left">
        <div className="font-bold text-lg leading-tight drop-shadow-sm">{label}</div>
        <div className="text-[11px] opacity-90 font-medium tracking-wide mt-0.5">{sub}</div>
    </div>
    <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors backdrop-blur-sm">
        <Play size={20} fill="currentColor" />
    </div>
  </button>
);