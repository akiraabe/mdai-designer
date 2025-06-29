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
  onActionSelect?: (actionId: string, actionData: any) => Promise<void>;
}

export const ChatMessageActions: React.FC<ChatMessageActionsProps> = ({
  message,
  onApplyProposal,
  onRejectProposal,
  onActionSelect
}) => {
  // 修正提案の場合
  if (message && message.type === 'proposal' && message.proposal) {
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
  }
  
  // 選択肢の場合
  if (message && message.type === 'action_selection' && message.actionOptions) {
    return (
      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {message.actionOptions.actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionSelect?.(action.id, {
              action: action.action,
              originalMessage: message.actionOptions!.originalMessage,
              currentData: message.actionOptions!.currentData
            })}
            style={{
              backgroundColor: action.id === 'replace' ? '#f59e0b' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {action.label}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              {action.description}
            </div>
          </button>
        ))}
      </div>
    );
  }
  
  return null;
};