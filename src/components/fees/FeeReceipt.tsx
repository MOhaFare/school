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
  
  const receiptNo = fee.id.substring(0, 8).toUpperCase();

  return (
    <div ref={ref} className="w-[210mm] bg-white p-8 font-sans text-slate-900 mx-auto border border-gray-200 print:border-none">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
        <div className="flex items-center gap-4">
          {schoolLogo ? (
            <img src={schoolLogo} alt="Logo" className="h-20 w-20 object-contain" />
          ) : (
            <Logo className="scale-[2]" />
          )}
          <div>
            <h1 className="text-2xl font-bold uppercase text-slate-900">{schoolName}</h1>
            <p className="text-sm text-slate-600 max-w-xs">{schoolAddress}</p>
            <div className="text-xs text-slate-500 mt-1">
              {schoolPhone && <span>Ph: {schoolPhone} </span>}
              {schoolEmail && <span>| Email: {schoolEmail}</span>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-widest">Fee Receipt</h2>
          <p className="text-sm text-slate-500 mt-1">Receipt No: <span className="font-mono font-bold text-slate-900">#{receiptNo}</span></p>
          <p className="text-sm text-slate-500">Date: <span className="font-medium text-slate-900">{formatDate(new Date().toISOString())}</span></p>
          <div className={`mt-2 inline-block px-3 py-1 rounded border-2 font-bold uppercase text-xs ${fee.status === 'paid' ? 'border-green-600 text-green-700' : 'border-red-600 text-red-700'}`}>
            {fee.status}
          </div>
        </div>
      </div>

      {/* Student Details */}
      <div className="bg-slate-50 rounded-lg p-4 mb-8 border border-slate-200">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="flex">
            <span className="w-32 font-bold text-slate-500">Student Name:</span>
            <span className="font-semibold text-slate-900">{fee.studentName}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-500">Admission No:</span>
            <span className="font-mono text-slate-900">{fee.student_id}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-500">Class:</span>
            <span className="text-slate-900">{fee.class ? `${fee.class}-${fee.section}` : 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="w-32 font-bold text-slate-500">Roll Number:</span>
            <span className="text-slate-900">{fee.rollNumber || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="bg-slate-800 text-white text-sm uppercase">
            <th className="py-3 px-4 text-left rounded-tl-md">Description</th>
            <th className="py-3 px-4 text-left">Due Date</th>
            <th className="py-3 px-4 text-left">Payment Date</th>
            <th className="py-3 px-4 text-right rounded-tr-md">Amount</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          <tr className="border-b border-slate-200">
            <td className="py-4 px-4 font-medium">{fee.description}</td>
            <td className="py-4 px-4 text-slate-600">{formatDate(fee.due_date)}</td>
            <td className="py-4 px-4 text-slate-600">{fee.payment_date ? formatDate(fee.payment_date) : '-'}</td>
            <td className="py-4 px-4 text-right font-bold">{formatCurrency(fee.amount)}</td>
          </tr>
          {/* Empty rows for layout */}
          <tr className="border-b border-slate-100 h-8"><td></td><td></td><td></td><td></td></tr>
          <tr className="border-b border-slate-100 h-8"><td></td><td></td><td></td><td></td></tr>
        </tbody>
        <tfoot>
          <tr className="bg-slate-50">
            <td colSpan={3} className="py-3 px-4 text-right font-bold text-slate-600 uppercase">Total Amount</td>
            <td className="py-3 px-4 text-right font-bold text-xl text-slate-900">{formatCurrency(fee.amount)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Footer */}
      <div className="mt-16 flex justify-between items-end">
        <div className="text-xs text-slate-500 max-w-sm">
          <p className="font-bold mb-1">Terms & Conditions:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Fees once paid are not refundable.</li>
            <li>This is a computer generated receipt.</li>
          </ul>
        </div>
        <div className="text-center">
          <div className="w-48 border-b border-slate-400 mb-2"></div>
          <p className="text-sm font-bold text-slate-600 uppercase">Cashier Signature</p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-2">
        Generated by {schoolName} Management System
      </div>
    </div>
  );
});

FeeReceipt.displayName = 'FeeReceipt';

export default FeeReceipt;
