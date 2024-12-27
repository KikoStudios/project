import { FC } from 'react';
import { DollarSign, Gift } from 'lucide-react';

interface LoanRequestModalProps {
  request: {
    id: string;
    fromPlayerId: string;
    toPlayerId: string;
    amount: number;
    interestType: 'overall' | 'per_round' | 'gift';
    interestAmount: number;
    requesterName: string;
  };
  onAccept: () => void;
  onReject: () => void;
}

export const LoanRequestModal: FC<LoanRequestModalProps> = ({
  request,
  onAccept,
  onReject
}) => {
  const getInterestDisplay = () => {
    if (request.interestType === 'gift') {
      return {
        icon: <Gift className="w-16 h-16 text-pink-500 mx-auto mb-4" />,
        title: 'Gift Request',
        calculation: `$${request.amount}`
      };
    }

    return {
      icon: <DollarSign className="w-16 h-16 text-yellow-500 mx-auto mb-4" />,
      title: 'Loan Request',
      calculation: request.interestType === 'overall'
        ? `$${request.amount} + $${request.interestAmount} = $${request.amount + request.interestAmount}`
        : `$${request.amount} + $${request.interestAmount} per round`
    };
  };

  const display = getInterestDisplay();

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 w-full max-w-sm">
        <div className="text-center mb-8">
          {display.icon}
          <h2 className="text-2xl font-bold text-white mb-2">{display.title}</h2>
          <p className="text-lg text-white/80">
            From <span className="font-bold">{request.requesterName}</span>
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-sm text-white/60">
              {request.interestType === 'gift' ? 'Gift Amount' : 'Calculation'}
            </div>
            <div className="text-xl font-bold text-white">
              {display.calculation}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={onReject}
            className="w-full bg-red-500 text-white py-4 rounded-lg text-lg font-semibold"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            className="w-full bg-green-500 text-white py-4 rounded-lg text-lg font-semibold"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}; 