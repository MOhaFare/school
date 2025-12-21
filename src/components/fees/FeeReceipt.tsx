import React from 'react';
import { Fee } from '../../types';
import Logo from '../ui/Logo';
import { formatCurrency, formatDate } from '../../utils/format';

interface FeeReceiptProps {
  fee: Fee & { studentName?: string; class?: string; section?: string; rollNumber?: string };
  schoolName: string;
  schoolAddress?: string;
  schoolPhone?: string;
  schoolEmail?: string;
  schoolLogo?: string | null;
}

const FeeReceipt = React.forwardRef<HTMLDivElement, FeeReceiptProps>(({ 
  fee, schoolName, schoolAddress, schoolPhone, schoolEmail, schoolLogo 
}, ref) => {
  
  const receiptNo = fee.id ? fee.id.substring(0, 8).toUpperCase() : 'PENDING';

  return (
    <div ref={ref} className="w-[148mm] min-h-[210mm] bg-white p-8 font-sans text-slate-900 mx-auto border border-gray-200 print:border-none print:w-full print:h-auto">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          {schoolLogo ? (
            <img src={schoolLogo} alt="Logo" className="h-16 w-16 object-contain" />
          ) : (
            <Logo className="scale-[1.5]" />
          )}
          <div>
            <h1 className="text-xl font-bold uppercase text-slate-900 leading-tight">{schoolName}</h1>
            <p className="text-xs text-slate-600 max-w-[200px] leading-tight">{schoolAddress}</p>
            <div className="text-[10px] text-slate-500 mt-1">
              {schoolPhone && <span>Ph: {schoolPhone} </span>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-widest">RECEIPT</h2>
          <p className="text-xs text-slate-500 mt-1">No: <span className="font-mono font-bold text-slate-900">#{receiptNo}</span></p>
          <p className="text-xs text-slate-500">Date: <span className="font-medium text-slate-900">{formatDate(new Date().toISOString())}</span></p>
        </div>
      </div>

      {/* Student Details */}
      <div className="bg-slate-50 rounded p-3 mb-6 border border-slate-200">
        <div className="grid grid-cols-2 gap-y-1 text-sm">
          <div className="flex">
            <span className="w-24 font-bold text-slate-500 text-xs uppercase">Student:</span>
            <span className="font-semibold text-slate-900">{fee.studentName}</span>
          </div>
          <div className="flex">
            <span className="w-24 font-bold text-slate-500 text-xs uppercase">Class:</span>
            <span className="text-slate-900">{fee.class ? `${fee.class}-${fee.section}` : 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="w-24 font-bold text-slate-500 text-xs uppercase">Roll No:</span>
            <span className="text-slate-900">{fee.rollNumber || 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="w-24 font-bold text-slate-500 text-xs uppercase">Status:</span>
            <span className={`font-bold uppercase text-xs ${fee.status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>{fee.status}</span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <table className="w-full mb-6 border-collapse text-sm">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="py-2 px-3 text-left rounded-tl-sm">Description</th>
            <th className="py-2 px-3 text-left">Due Date</th>
            <th className="py-2 px-3 text-right rounded-tr-sm">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-200">
            <td className="py-3 px-3 font-medium">{fee.description}</td>
            <td className="py-3 px-3 text-slate-600">{formatDate(fee.due_date)}</td>
            <td className="py-3 px-3 text-right font-bold">{formatCurrency(fee.amount)}</td>
          </tr>
          {/* Filler rows for layout stability */}
          <tr className="border-b border-slate-100 h-6"><td></td><td></td><td></td></tr>
          <tr className="border-b border-slate-100 h-6"><td></td><td></td><td></td></tr>
        </tbody>
        <tfoot>
          <tr className="bg-slate-100">
            <td colSpan={2} className="py-2 px-3 text-right font-bold text-slate-600 uppercase text-xs">Total Paid</td>
            <td className="py-2 px-3 text-right font-bold text-lg text-slate-900">{formatCurrency(fee.amount)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Footer */}
      <div className="mt-12 flex justify-between items-end">
        <div className="text-[10px] text-slate-500 max-w-[200px]">
          <p className="font-bold mb-1">Note:</p>
          <ul className="list-disc pl-3">
            <li>Fees once paid are not refundable.</li>
            <li>Computer generated receipt.</li>
          </ul>
        </div>
        <div className="text-center">
          <div className="w-32 border-b border-slate-400 mb-1"></div>
          <p className="text-[10px] font-bold text-slate-600 uppercase">Cashier Signature</p>
        </div>
      </div>
    </div>
  );
});

FeeReceipt.displayName = 'FeeReceipt';

export default FeeReceipt;
