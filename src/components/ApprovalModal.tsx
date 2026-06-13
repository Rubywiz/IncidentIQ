'use client';

import { useState } from 'react';

interface ApprovalModalProps {
  incidentId: string;
  onApproved: () => void;
}

export default function ApprovalModal({ incidentId, onApproved }: ApprovalModalProps) {
  const [loading, setLoading] = useState(false);

  const approve = async () => {
    setLoading(true);
    await fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidentId }),
    });
    onApproved();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-yellow-500 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-4xl mb-4 text-center">⚠️</div>
        <h2 className="text-xl font-bold text-white text-center mb-2">Human Approval Required</h2>
        <p className="text-gray-400 text-center mb-6">
          The Resolver agent has drafted a rollback plan. Review it in the Band room, then approve to execute.
        </p>
        <div className="bg-gray-800 rounded-lg p-4 mb-6 text-sm text-gray-300 font-mono">
          <p className="font-semibold text-yellow-400 mb-1">Proposed action:</p>
          <p>kubectl rollout undo deployment/payment-service</p>
          <p className="text-gray-500 mt-1">Estimated recovery: ~2 minutes · Risk: Low</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={approve}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
          >
            {loading ? 'Approving...' : '✅ Approve & Execute'}
          </button>
          <button
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition"
          >
            ❌ Reject
          </button>
        </div>
      </div>
    </div>
  );
}
