'use client';

interface BagIndicatorProps {
  included: boolean;
  label: string;
  fee?: number;
  statusPerk?: boolean;
}

export default function BagIndicator({
  included,
  label,
  fee,
  statusPerk,
}: Readonly<BagIndicatorProps>) {
  if (included || statusPerk) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E3F8E9] border border-[#7CD092]/30 w-fit">
        <span className="text-[#2D4637] font-bold text-[10px]">✓</span>
        <span className="text-[#2D4637] font-semibold text-[10px] uppercase tracking-wide">
          {label}
          {statusPerk && (
            <span className="opacity-75 ml-1 normal-case">(status)</span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FFBEB9] border border-[#FF4B4B]/20 w-fit">
      <span className="text-[#FF4B4B] font-bold text-[10px]">✗</span>
      <span className="text-[#7D283C] font-semibold text-[10px] uppercase tracking-wide">
        {label}{fee ? ` +$${fee}` : ''}
      </span>
    </div>
  );
}
