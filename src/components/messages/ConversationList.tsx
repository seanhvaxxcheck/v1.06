import React from 'react';
import { User } from 'lucide-react';
import { Conversation } from '../../hooks/useMessaging';
import { format, isToday, isYesterday } from 'date-fns';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversation,
  onSelectConversation,
}) => {
  const formatTime = (date: string) => {
    const d = new Date(date);
    if (isToday(d)) {
      return format(d, 'h:mm a');
    } else if (isYesterday(d)) {
      return 'Yesterday';
    } else {
      return format(d, 'MMM d');
    }
  };

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No conversations yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => (
        <button
          key={conversation.id}
          onClick={() => onSelectConversation(conversation)}
          className={`w-full px-4 py-3 flex items-start space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 ${
            activeConversation?.id === conversation.id
              ? 'bg-green-50 dark:bg-green-900/20'
              : ''
          }`}
        >
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
              {(conversation.other_user?.full_name?.[0] || conversation.other_user?.email?.[0] || 'U').toUpperCase()}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-1 gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {conversation.other_user?.full_name || conversation.other_user?.email}
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                {conversation.last_message
                  ? formatTime(conversation.last_message.created_at)
                  : formatTime(conversation.created_at)}
              </span>
            </div>
            {conversation.listing && (
              <p className="text-xs text-green-600 dark:text-green-400 mb-1 truncate">
                Re: {conversation.listing.title}
              </p>
            )}
            {conversation.last_message && (
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {conversation.last_message.message_text}
              </p>
            )}
            {conversation.unread_count && conversation.unread_count > 0 && (
              <div className="mt-1">
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">
                  {conversation.unread_count}
                </span>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};
