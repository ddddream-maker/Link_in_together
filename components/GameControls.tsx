import React, { useEffect, useState } from 'react';
import { RefreshCw, Lightbulb, Flag, Timer, Trophy, Zap, Clock, Flame } from 'lucide-react';

interface GameControlsProps {
  score: number;
  timeLeft: number;
  totalTime: number;
  hints: number;
  shuffles: number;
  combo: number;
  lastTimeBonus: { amount: number; id: number } | null;
  onHint: () => void;
  onShuffle: () => void;
  onGiveUp: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  score,
  timeLeft,
  totalTime,
  hints,
  shuffles,
  combo,
  lastTimeBonus,
  onHint,
  onShuffle,
  onGiveUp
}) => {
  const timePercent = (timeLeft / totalTime) * 100;
  const [bonusDisplay, setBonusDisplay] = useState<{amount: number, id: number} | null>(null);

  // Trigger animation when lastTimeBonus changes
  useEffect(() => {
    if (lastTimeBonus) {
        setBonusDisplay(lastTimeBonus);
        const timer = setTimeout(() => {
            setBonusDisplay(null);
        }, 800); 
        return () => clearTimeout(timer);
    }
  }, [lastTimeBonus]);
  
  // Format time MM:SS
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeString = `${mins}:${secs.toString().padStart(2, '0')}`;
  
  // Flame effect active state
  const isOnFire = combo > 3;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center gap-4 shrink-0 z-20">
      
      {/* Stats Bar - Dashboard */}
      <div className={`
        flex-1 grid grid-cols-[1fr_auto_1fr] items-center 
        px-6 py-3 rounded-2xl transition-all duration-300 w-full sm:w-auto min-h-[80px] relative
        ${isOnFire ? 'animate-burning-border border-orange-500/50 bg-gray-900/80 text-white' : 'shadow-xl bg-white/90 backdrop-blur-xl border border-white/40 text-gray-800'}
      `}>
        
        {/* Left: Score */}
        <div className="justify-self-start flex flex-col items-start min-w-[100px]">
            <div className={`flex items-center space-x-2 text-xs font-bold uppercase tracking-widest mb-1 ${isOnFire ? "text-orange-200" : "text-gray-400"}`}>
                <Trophy size={14} className={isOnFire ? "text-yellow-400" : "text-yellow-500"} />
                <span>Score</span>
            </div>
            <span className={`text-4xl font-black leading-none tracking-tight transition-all duration-300 ${isOnFire ? "text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]" : "text-gray-800"}`}>
                {score.toLocaleString()}
            </span>
        </div>

        {/* Center: Timer (Fixed Width Container) */}
        <div className="justify-self-center w-[220px] flex flex-col items-center relative px-4">
            
            {/* Vertical Separators */}
            <div className={`absolute left-0 top-2 bottom-2 w-px ${isOnFire ? 'bg-white/10' : 'bg-gray-200'}`}></div>
            <div className={`absolute right-0 top-2 bottom-2 w-px ${isOnFire ? 'bg-white/10' : 'bg-gray-200'}`}></div>

            {/* Floating Bonus Time Popup */}
            {bonusDisplay && (
                <div 
                    key={bonusDisplay.id}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-float-up"
                >
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1.5 rounded-full shadow-[0_4px_15px_rgba(16,185,129,0.4)] border-2 border-white/50 flex items-center space-x-1 whitespace-nowrap backdrop-blur-sm">
                        <Clock size={18} strokeWidth={3} className="animate-pulse" />
                        <span className="text-2xl font-black italic tracking-tighter">+{bonusDisplay.amount}s</span>
                    </div>
                </div>
            )}

            <div className="flex items-end space-x-2 mb-2">
                <span className={`font-mono font-bold text-3xl leading-none tabular-nums ${timeLeft < 30 ? "text-red-500 animate-pulse" : (isOnFire ? "text-white" : "text-gray-700")}`}>
                    {timeString}
                </span>
                <span className={`text-xs font-bold mb-1 ${isOnFire ? "text-orange-200" : "text-gray-400"}`}>TIME</span>
            </div>
            
            {/* Progress Bar Container */}
            <div className="w-full h-3 bg-gray-200/50 rounded-full overflow-hidden border border-black/5 relative shadow-inner">
                {/* Striped Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[length:10px_10px] bg-[linear-gradient(45deg,rgba(0,0,0,1)_25%,transparent_25%,transparent_50%,rgba(0,0,0,1)_50%,rgba(0,0,0,1)_75%,transparent_75%,transparent)]"></div>
                
                {/* Active Bar */}
                <div 
                    className={`h-full transition-all duration-1000 ease-linear relative overflow-hidden ${
                        timePercent < 20 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 
                        (isOnFire ? 'bg-gradient-to-r from-orange-500 to-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-gradient-to-r from-green-500 to-emerald-400')
                    }`}
                    style={{ width: `${Math.min(100, timePercent)}%` }}
                >
                    <div className="absolute inset-0 w-full h-full bg-white/20 animate-[shimmer_2s_infinite] skew-x-12"></div>
                </div>
            </div>
        </div>

        {/* Right: Combo */}
        <div className="justify-self-end flex flex-col items-end min-w-[100px] relative">
             <div className={`transition-all duration-300 transform origin-right ${combo > 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                
                {/* Flame Icon above Combo */}
                {isOnFire && (
                    <div className="absolute -top-6 right-0 text-orange-500 animate-bounce filter drop-shadow-lg">
                        <Flame size={24} fill="currentColor" />
                    </div>
                )}

                <div className="flex flex-col items-end">
                    <div className={`flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest mb-1 ${isOnFire ? "text-orange-200" : "text-gray-400"}`}>
                        <span className={isOnFire ? "animate-pulse" : ""}>Combo</span>
                        <Zap size={14} className={isOnFire ? "text-orange-400 fill-orange-400" : "text-blue-400"} />
                    </div>
                    
                    <div className="flex items-baseline">
                         <span className="text-lg font-bold italic mr-0.5 opacity-50">x</span>
                         <span className={`text-4xl font-black italic leading-none ${
                             isOnFire 
                                ? 'text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-orange-500 to-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]' 
                                : 'text-blue-600'
                         }`}>
                             {combo}
                         </span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 w-full sm:w-auto justify-center sm:h-[80px]">
        <ControlButton 
            icon={Lightbulb} 
            label={hints} 
            onClick={onHint} 
            disabled={hints <= 0}
            color="bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200"
            title="提示 Hint"
        />
        <ControlButton 
            icon={RefreshCw} 
            label={shuffles} 
            onClick={onShuffle} 
            disabled={shuffles <= 0}
            color="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
            title="打乱 Shuffle"
        />
        <ControlButton 
            icon={Flag} 
            label="放弃" 
            onClick={onGiveUp} 
            disabled={false}
            color="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
            title="放弃 Give Up"
        />
      </div>

      <style>{`
        @keyframes float-up {
            0% { transform: translate(-50%, -20%) scale(0.8); opacity: 0; }
            20% { transform: translate(-50%, -100%) scale(1.1); opacity: 1; }
            80% { transform: translate(-50%, -150%) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -180%) scale(0.95); opacity: 0; }
        }
        .animate-float-up {
            animation: float-up 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }

        @keyframes burning-border {
            0% { 
                box-shadow: 
                    0 0 10px 0px rgba(255, 69, 0, 0.4),
                    0 0 20px 2px rgba(255, 140, 0, 0.2),
                    inset 0 0 15px rgba(255, 69, 0, 0.1);
                border-color: rgba(255, 69, 0, 0.5);
            }
            50% { 
                box-shadow: 
                    0 0 25px 5px rgba(255, 69, 0, 0.6),
                    0 0 40px 10px rgba(255, 165, 0, 0.4),
                    inset 0 0 30px rgba(255, 69, 0, 0.3);
                border-color: rgba(255, 215, 0, 0.8);
            }
            100% { 
                box-shadow: 
                    0 0 10px 0px rgba(255, 69, 0, 0.4),
                    0 0 20px 2px rgba(255, 140, 0, 0.2),
                    inset 0 0 15px rgba(255, 69, 0, 0.1);
                border-color: rgba(255, 69, 0, 0.5);
            }
        }
        .animate-burning-border {
            animation: burning-border 1.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

const ControlButton = ({ icon: Icon, label, onClick, disabled, color, title }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`
      flex flex-col items-center justify-center space-y-1 px-3 py-1 rounded-xl font-bold transition-all border-b-4 active:border-b-0 active:translate-y-1 min-w-[72px] h-full
      ${disabled 
        ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200' 
        : `${color} shadow-lg hover:brightness-105`
      }
    `}
  >
    <Icon size={22} strokeWidth={2.5} />
    <span className="text-xs">{label}</span>
  </button>
);
