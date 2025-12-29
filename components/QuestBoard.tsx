import React from 'react';
import { Quest } from '../types';
import { CheckCircle2, Circle, Trophy } from 'lucide-react';

interface QuestBoardProps {
  quests: Quest[];
}

export const QuestBoard: React.FC<QuestBoardProps> = ({ quests }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 h-full overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
          <Trophy size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Eco Quests</h2>
          <p className="text-xs text-slate-400">Complete tasks to earn ECO tokens</p>
        </div>
      </div>

      <div className="space-y-4">
        {quests.map((quest) => (
          <div 
            key={quest.id} 
            className={`relative p-4 rounded-lg border transition-all ${
              quest.completed 
                ? 'bg-slate-900/50 border-emerald-500/30' 
                : 'bg-slate-900 border-slate-700'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className={`font-medium ${quest.completed ? 'text-emerald-400' : 'text-slate-200'}`}>
                {quest.title}
              </h3>
              {quest.completed ? (
                <CheckCircle2 size={18} className="text-emerald-500" />
              ) : (
                <Circle size={18} className="text-slate-600" />
              )}
            </div>
            
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              {quest.description}
            </p>

            {/* Progress Bar */}
            {!quest.completed && (
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-500"
                  style={{ width: `${(quest.progress / quest.maxProgress) * 100}%` }}
                />
              </div>
            )}

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-mono">
                {quest.completed ? 'Completed' : `${quest.progress} / ${quest.maxProgress}`}
              </span>
              <span className="text-amber-400 font-bold">+{quest.reward} ECO</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};