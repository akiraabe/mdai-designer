// src/components/Chat/ChatMessage.tsx
// チャットメッセージ内の修正提案ボタンなどの特化機能

import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import type { ChatMessage } from './BaseChatPanel';
import type { ModificationProposal } from '../../types/aiTypes';

interface ChatMessageActionsProps {
  message: ChatMessage;
  onApplyProposal?: (proposal: ModificationProposal) => Promise<void>;
  onRejectProposal?: (proposalId: string) => void;
}

export const ChatMessageActions: React.FC<ChatMessageActionsProps> = ({
  message,
  onApplyProposal,
  onRejectProposal
}) => {
  // 修正提案の場合のみボタンを表示
  if (message.type !== 'proposal' || !message.proposal) {
    return null;
  }

  return (
    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
      <button
        onClick={() => onApplyProposal?.(message.proposal!)}
        style={{
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <CheckCircle className="h-3 w-3" />
        適用
      </button>
      <button
        onClick={() => onRejectProposal?.(message.proposal!.id)}
        style={{
          backgroundColor: '#ef4444',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <XCircle className="h-3 w-3" />
        拒否
      </button>
    </div>
  );
};