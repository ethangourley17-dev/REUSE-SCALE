import React from 'react';

interface ScaleIndicatorProps {
  currentWeight: number;
  isStable: boolean;
  isConnected: boolean;
  onSimulate: () => void;
  onConnect: () => void;
}

const ScaleIndicator: React.FC<ScaleIndicatorProps> = ({ 
  currentWeight, 
  isStable, 
  isConnected, 
  onSimulate,
  onConnect
}) => {
  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700 flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Scale Readout</h2>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isConnected ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
          {isConnected ? 'LIVE CONNECTION' : 'DISCONNECTED'}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-black rounded-lg border-4 border-slate-700 relative overflow-hidden">
        {/* LCD Display Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_4px,3px_100%]"></div>
        
        <div className={`text-7xl md:text-9xl font-mono font-bold tracking-tighter z-0 transition-colors duration-300 ${isStable ? 'text-green-500' : 'text-yellow-500'}`}>
          {currentWeight.toLocaleString()} <span className="text-4xl text-slate-500 ml-2">kg</span>
        </div>
        
        {!isStable && (
            <div className="absolute top-4 right-4 text-yellow-500 font-mono text-sm animate-bounce">
                UNSTABLE
            </div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        {!isConnected ? (
          <button 
            onClick={onConnect}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-[0_4px_0_rgb(30,58,138)] active:shadow-none active:translate-y-[4px]"
          >
            CONNECT RS232
          </button>
        ) : (
             <div className="flex-1 bg-slate-700 text-slate-400 font-bold py-3 px-4 rounded-lg text-center border border-slate-600">
                SERIAL ACTIVE
            </div>
        )}
        
        <button 
          onClick={onSimulate}
          className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold py-3 px-4 rounded-lg transition-colors border border-slate-600"
        >
          SIMULATE
        </button>
      </div>
    </div>
  );
};

export default ScaleIndicator;