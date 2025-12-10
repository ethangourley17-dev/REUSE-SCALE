import React, { useState, useEffect, useRef, useCallback } from 'react';
import ScaleIndicator from './components/ScaleIndicator';
import CameraFeed from './components/CameraFeed';
import TicketReceipt from './components/TicketReceipt';
import { identifyTruck } from './services/geminiService';
import { ScaleConnection } from './services/serialService';
import { ScaleTicket, TicketStatus, AVAILABLE_MATERIALS, Material } from './types';

export default function App() {
  // --- State ---
  const [weight, setWeight] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [tickets, setTickets] = useState<ScaleTicket[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material>(AVAILABLE_MATERIALS[0]);
  
  // Automation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [triggerCamera, setTriggerCamera] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [lastTicket, setLastTicket] = useState<ScaleTicket | null>(null);

  // Refs for stability logic
  const weightRef = useRef(0);
  const stabilityCountRef = useRef(0);
  const lastProcessedTimeRef = useRef(0);
  const hasTriggeredRef = useRef(false);
  const scaleConnectionRef = useRef<ScaleConnection | null>(null);

  // --- Scale Connection Logic ---
  const handleWeightUpdate = useCallback((newWeight: number) => {
    setWeight(newWeight);
    weightRef.current = newWeight;
  }, []);

  const connectScale = async () => {
    try {
      if (!scaleConnectionRef.current) {
        scaleConnectionRef.current = new ScaleConnection(handleWeightUpdate);
      }
      await scaleConnectionRef.current.connect({
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });
      setIsConnected(true);
    } catch (error) {
      alert("Failed to connect to scale. Ensure you are using HTTPS or localhost.");
    }
  };

  const simulateScale = () => {
    // Simulation for demo purposes
    let w = 0;
    const interval = setInterval(() => {
      w += Math.random() > 0.5 ? 500 : -50;
      if (w > 12500) { // Settle around 12500kg
         w = 12500 + (Math.random() * 20 - 10);
         clearInterval(interval);
         // Keep jittering slightly to simulate real scale
         setInterval(() => {
             setWeight(prev => Math.max(0, Math.floor(prev + (Math.random() * 10 - 5))));
         }, 500);
      }
      setWeight(Math.max(0, Math.floor(w)));
    }, 100);
  };

  // --- Automation Logic (The "Brain") ---
  useEffect(() => {
    const checkStability = setInterval(() => {
      const currentWeight = weightRef.current;
      
      // Reset trigger if weight drops near zero (truck left)
      if (currentWeight < 100) {
        hasTriggeredRef.current = false;
        stabilityCountRef.current = 0;
        return;
      }

      // 1. Threshold Check (e.g., must be > 500kg to be a truck)
      if (currentWeight > 500 && !hasTriggeredRef.current && !isProcessing) {
        // 2. Stability Check
        // In a real app, compare with previous samples. Here we assume stable if it stays high.
        stabilityCountRef.current += 1;

        // If stable for ~2 seconds (10 checks * 200ms)
        if (stabilityCountRef.current > 10) {
           console.log("Truck detected & stable. Triggering workflow...");
           hasTriggeredRef.current = true; // Prevent double trigger for same truck
           setTriggerCamera(true);
        }
      }
    }, 200);

    return () => clearInterval(checkStability);
  }, [isProcessing]);

  // --- Workflow Execution ---
  const handleImageCaptured = async (imageData: string) => {
    setTriggerCamera(false); // Reset trigger
    setIsProcessing(true);
    setProcessingStatus("Identifying License Plate...");

    // 1. Identify
    const { licensePlate, confidence } = await identifyTruck(imageData);
    
    setProcessingStatus(`Plate: ${licensePlate} (${Math.round(confidence * 100)}%). Matching ticket...`);

    // 2. Logic: In or Out?
    // Check if there is an OPEN ticket for this plate
    const existingTicketIndex = tickets.findIndex(
      t => t.licensePlate === licensePlate && t.status === TicketStatus.INBOUND_OPEN
    );

    let currentTicket: ScaleTicket;

    if (existingTicketIndex >= 0) {
      // --- OUTBOUND TRANSACTION ---
      const oldTicket = tickets[existingTicketIndex];
      const outboundWeight = weightRef.current;
      const netWeight = Math.abs(oldTicket.inboundWeight - outboundWeight);
      const cost = netWeight * oldTicket.pricePerKg;

      const updatedTicket: ScaleTicket = {
        ...oldTicket,
        outboundWeight,
        outboundImage: imageData,
        outboundTimestamp: Date.now(),
        netWeight,
        totalCost: cost,
        status: TicketStatus.COMPLETED
      };

      const newTickets = [...tickets];
      newTickets[existingTicketIndex] = updatedTicket;
      setTickets(newTickets);
      currentTicket = updatedTicket;
      setProcessingStatus("Ticket Closed. Printing...");

    } else {
      // --- INBOUND TRANSACTION ---
      const newTicket: ScaleTicket = {
        id: crypto.randomUUID(),
        licensePlate,
        materialName: selectedMaterial.name,
        pricePerKg: selectedMaterial.pricePerKg,
        inboundWeight: weightRef.current,
        inboundImage: imageData,
        inboundTimestamp: Date.now(),
        status: TicketStatus.INBOUND_OPEN
      };

      setTickets(prev => [newTicket, ...prev]);
      currentTicket = newTicket;
      setProcessingStatus("Ticket Opened.");
    }

    // 3. Finish
    setLastTicket(currentTicket);
    setTimeout(() => {
      setIsProcessing(false);
      setProcessingStatus("");
      // Trigger print dialog automatically if needed, or user clicks print
    }, 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- UI Render ---
  return (
    <div className="flex h-screen w-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* LEFT PANEL: Operations */}
      <div className="w-2/3 p-4 flex flex-col gap-4">
        
        {/* Top Header */}
        <header className="flex justify-between items-center bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
            </div>
            <div>
               <h1 className="text-xl font-bold tracking-tight">Reuse Canada</h1>
               <p className="text-xs text-slate-400">Automated Scale Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 uppercase font-semibold">Active Material</span>
                <select 
                  className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm outline-none focus:border-blue-500"
                  value={selectedMaterial.id}
                  onChange={(e) => setSelectedMaterial(AVAILABLE_MATERIALS.find(m => m.id === e.target.value) || AVAILABLE_MATERIALS[0])}
                >
                  {AVAILABLE_MATERIALS.map(m => (
                    <option key={m.id} value={m.id}>{m.name} (${m.pricePerKg}/kg)</option>
                  ))}
                </select>
             </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-2 gap-4">
           {/* Scale Display */}
           <div className="h-full">
              <ScaleIndicator 
                currentWeight={weight} 
                isStable={true} // In real impl, pass actual stability bool
                isConnected={isConnected}
                onConnect={connectScale}
                onSimulate={simulateScale}
              />
           </div>

           {/* Camera Feed */}
           <div className="h-full flex flex-col gap-2">
              <div className="flex-1 relative">
                <CameraFeed onCapture={handleImageCaptured} trigger={triggerCamera} />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm rounded-xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-blue-400 font-mono animate-pulse">{processingStatus}</p>
                  </div>
                )}
              </div>
              
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                 <span className="text-xs text-slate-400 font-bold uppercase">Manual Override</span>
                 <button 
                   onClick={() => setTriggerCamera(true)}
                   disabled={isProcessing}
                   className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-2 rounded transition-colors"
                 >
                   Force Capture
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* RIGHT PANEL: Ticket History */}
      <div className="w-1/3 bg-slate-800 border-l border-slate-700 flex flex-col">
         <div className="p-4 border-b border-slate-700 bg-slate-800/50 backdrop-blur">
            <h2 className="text-lg font-bold text-slate-200">Recent Activity</h2>
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {tickets.length === 0 && (
               <div className="text-center text-slate-500 mt-10 italic">
                  No tickets yet. Waiting for truck...
               </div>
            )}
            {tickets.map(ticket => (
               <div 
                 key={ticket.id} 
                 onClick={() => setLastTicket(ticket)}
                 className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${
                    ticket.status === TicketStatus.INBOUND_OPEN 
                    ? 'bg-yellow-900/20 border-yellow-700/50 hover:bg-yellow-900/30' 
                    : 'bg-green-900/20 border-green-700/50 hover:bg-green-900/30'
                 }`}
               >
                  <div className="flex justify-between items-start mb-2">
                     <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        ticket.status === TicketStatus.INBOUND_OPEN ? 'bg-yellow-500 text-black' : 'bg-green-500 text-black'
                     }`}>
                        {ticket.status === TicketStatus.INBOUND_OPEN ? 'INBOUND' : 'COMPLETED'}
                     </span>
                     <span className="text-xs text-slate-400">{new Date(ticket.inboundTimestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                     <span className="text-lg font-mono font-bold text-white">{ticket.licensePlate}</span>
                  </div>
                  <div className="text-xs text-slate-400 grid grid-cols-2 gap-2 mt-2">
                     <div>
                        <span className="block text-slate-500 uppercase text-[10px]">In Weight</span>
                        {ticket.inboundWeight.toLocaleString()} kg
                     </div>
                     {ticket.outboundWeight && (
                        <div className="text-right">
                           <span className="block text-slate-500 uppercase text-[10px]">Out Weight</span>
                           {ticket.outboundWeight.toLocaleString()} kg
                        </div>
                     )}
                  </div>
                  {ticket.totalCost !== undefined && (
                     <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-between items-center text-green-400 font-bold">
                        <span>Total</span>
                        <span>${ticket.totalCost.toFixed(2)}</span>
                     </div>
                  )}
               </div>
            ))}
         </div>
      </div>

      {/* TICKET PREVIEW MODAL */}
      {lastTicket && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white text-slate-900 rounded-xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-4 bg-slate-100 border-b flex justify-between items-center">
                 <h3 className="font-bold text-lg">Ticket Details</h3>
                 <button onClick={() => setLastTicket(null)} className="text-slate-500 hover:text-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-slate-200 p-8 flex justify-center">
                 <div className="bg-white shadow-xl">
                   <TicketReceipt ticket={lastTicket} />
                 </div>
              </div>

              <div className="p-4 bg-white border-t flex gap-3">
                 <button 
                   onClick={handlePrint}
                   className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    PRINT RECEIPT
                 </button>
                 <button 
                   onClick={() => setLastTicket(null)}
                   className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-3 rounded-lg"
                 >
                    CLOSE
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Hidden Print Element */}
      <TicketReceipt ticket={lastTicket} />
      
    </div>
  );
}