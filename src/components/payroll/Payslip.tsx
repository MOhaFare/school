import React from 'react';
import { Payroll } from '../../types';
import Logo from '../ui/Logo';
import { formatCurrency, formatDate } from '../../utils/format';

interface PayslipProps {
  payroll: Payroll & { teacherRole?: string; joinDate?: string };
  schoolName: string;
  schoolAddress?: string;
  schoolLogo?: string | null;
}

const Payslip = React.forwardRef<HTMLDivElement, PayslipProps>(({ 
  payroll, schoolName, schoolAddress, schoolLogo 
}, ref) => {
  
  const slipId = `PAY-${payroll.month.substring(0,3).toUpperCase()}-${payroll.year}-${payroll.id.substring(0,4)}`;
  const totalEarnings = payroll.baseSalary + payroll.bonus;
  const totalDeductions = payroll.deductions;

  return (
    <div ref={ref} className="w-[210mm] bg-white p-10 font-sans text-slate-900 mx-auto border border-gray-200 print:border-none">
      {/* Header */}
      <div className="text-center border-b-2 border-slate-200 pb-6 mb-8">
        <div className="flex justify-center mb-3">
           {schoolLogo ? (
            <img src={schoolLogo} alt="Logo" className="h-16 w-16 object-contain" />
           ) : (
            <Logo className="scale-150" />
           )}
        </div>
        <h1 className="text-2xl font-bold uppercase text-slate-900">{schoolName}</h1>
        <p className="text-sm text-slate-500">{schoolAddress}</p>
        <h2 className="text-lg font-bold text-slate-800 uppercase mt-4 bg-slate-100 inline-block px-6 py-1 rounded-full">
            Payslip for {payroll.month} {payroll.year}
        </h2>
      </div>

      {/* Employee Details */}
      <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-sm">
        <div className="flex justify-between border-b border-slate-100 pb-1">
            <span className="font-bold text-slate-500">Employee Name:</span>
            <span className="font-semibold text-slate-900">{payroll.teacherName}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-1">
            <span className="font-bold text-slate-500">Employee ID:</span>
            <span className="font-mono text-slate-900">{payroll.teacherId}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-1">
            <span className="font-bold text-slate-500">Designation:</span>
            <span className="text-slate-900">{payroll.teacherRole || 'Teacher'}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-1">
            <span className="font-bold text-slate-500">Payslip ID:</span>
            <span className="font-mono text-slate-900">{slipId}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-1">
            <span className="font-bold text-slate-500">Payment Date:</span>
            <span className="text-slate-900">{payroll.paidDate ? formatDate(payroll.paidDate) : 'Pending'}</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-1">
            <span className="font-bold text-slate-500">Status:</span>
            <span className={`font-bold uppercase text-xs px-2 py-0.5 rounded ${payroll.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {payroll.status}
            </span>
        </div>
      </div>

      {/* Salary Details Table */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Earnings */}
        <div>
            <div className="bg-slate-100 px-3 py-2 font-bold text-slate-700 uppercase text-xs mb-2">Earnings</div>
            <table className="w-full text-sm">
                <tbody>
                    <tr className="border-b border-slate-100">
                        <td className="py-2 text-slate-600">Basic Salary</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(payroll.baseSalary)}</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                        <td className="py-2 text-slate-600">Bonus / Allowance</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(payroll.bonus)}</td>
                    </tr>
                    <tr>
                        <td className="py-3 font-bold text-slate-800">Total Earnings</td>
                        <td className="py-3 text-right font-bold text-slate-800">{formatCurrency(totalEarnings)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* Deductions */}
        <div>
            <div className="bg-slate-100 px-3 py-2 font-bold text-slate-700 uppercase text-xs mb-2">Deductions</div>
            <table className="w-full text-sm">
                <tbody>
                    <tr className="border-b border-slate-100">
                        <td className="py-2 text-slate-600">Tax / Other</td>
                        <td className="py-2 text-right font-medium text-red-600">-{formatCurrency(payroll.deductions)}</td>
                    </tr>
                    <tr className="border-b border-slate-100 h-9"><td></td><td></td></tr>
                    <tr>
                        <td className="py-3 font-bold text-slate-800">Total Deductions</td>
                        <td className="py-3 text-right font-bold text-red-600">-{formatCurrency(totalDeductions)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
      </div>

      {/* Net Pay */}
      <div className="bg-slate-50 border border-slate-200 p-4 mb-12 flex justify-between items-center rounded-lg">
        <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Net Salary Payable</p>
            <p className="text-xs text-slate-400 italic">amount in words not implemented</p>
        </div>
        <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(payroll.netSalary)}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-end mt-auto">
        <div className="text-center">
            <div className="w-40 border-b border-slate-400 mb-2"></div>
            <p className="text-xs font-bold text-slate-500 uppercase">Employee Signature</p>
        </div>
        <div className="text-center">
            <div className="w-40 border-b border-slate-400 mb-2"></div>
            <p className="text-xs font-bold text-slate-500 uppercase">Director / Principal</p>
        </div>
      </div>
    </div>
  );
});

Payslip.displayName = 'Payslip';

export default Payslip;
