import React from 'react';
import { ScaleTicket } from '../types';

interface TicketReceiptProps {
  ticket: ScaleTicket | null;
}

const TicketReceipt: React.FC<TicketReceiptProps> = ({ ticket }) => {
  if (!ticket) return null;

  const isComplete = ticket.status === 'COMPLETED';
  const date = new Date(ticket.inboundTimestamp).toLocaleDateString();
  const timeIn = new Date(ticket.inboundTimestamp).toLocaleTimeString();
  const timeOut = ticket.outboundTimestamp ? new Date(ticket.outboundTimestamp).toLocaleTimeString() : '---';

  return (
    <div id="printable-receipt" className="hidden print:block p-2 font-mono bg-white text-black w-[80mm] mx-auto text-xs leading-tight">
      {/* Header */}
      <div className="text-center border-b-2 border-dashed border-black pb-2 mb-2">
        <h1 className="text-xl font-black uppercase tracking-wider mb-1">Reuse Canada</h1>
        <p className="font-bold text-sm">Digital Scale Ticket</p>
        <p className="text-[10px]">{date}</p>
        <p className="mt-1 font-bold">#{ticket.id.slice(0, 8).toUpperCase()}</p>
      </div>

      {/* Truck Info */}
      <div className="mb-3 border-b border-black pb-2">
        <div className="flex justify-between">
          <span>License Plate:</span>
          <span className="font-bold text-sm">{ticket.licensePlate}</span>
        </div>
        <div className="flex justify-between">
          <span>Material:</span>
          <span className="font-bold">{ticket.materialName}</span>
        </div>
      </div>

      {/* Weights & Images */}
      <div className="space-y-4 mb-4">
        {/* Inbound */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-end">
            <span className="font-bold">INBOUND:</span>
            <span>{timeIn}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold">
            <span>{ticket.inboundWeight.toLocaleString()} kg</span>
          </div>
          {ticket.inboundImage && (
             <img src={ticket.inboundImage} alt="Inbound" className="w-full h-auto grayscale contrast-125 border border-black" />
          )}
        </div>

        {/* Outbound */}
        {isComplete && ticket.outboundWeight !== undefined && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end">
              <span className="font-bold">OUTBOUND:</span>
              <span>{timeOut}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold">
              <span>{ticket.outboundWeight.toLocaleString()} kg</span>
            </div>
            {ticket.outboundImage && (
               <img src={ticket.outboundImage} alt="Outbound" className="w-full h-auto grayscale contrast-125 border border-black" />
            )}
          </div>
        )}
      </div>

      {/* Totals */}
      {isComplete && (
        <div className="border-t-2 border-dashed border-black pt-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>Net Weight:</span>
            <span className="font-bold">{ticket.netWeight?.toLocaleString()} kg</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span>Rate:</span>
            <span>${ticket.pricePerKg.toFixed(2)}/kg</span>
          </div>
          <div className="flex justify-between text-xl font-black mt-2 border-t border-black pt-1">
            <span>TOTAL:</span>
            <span>${ticket.totalCost?.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-[10px] mt-4">
        <p>Thank you for choosing Reuse Canada.</p>
        <p>Questions? 1-800-REUSE-CA</p>
      </div>
    </div>
  );
};

export default TicketReceipt;