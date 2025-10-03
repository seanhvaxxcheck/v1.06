import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Trash2 } from 'lucide-react';
import { Conversation, Message } from '../../hooks/useMessaging';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

interface MessageThreadProps {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (text: string) => Promise<void>;
  onDeleteMessage: (messageId: string) => Promise<void>;
  sending: boolean;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  conversation,
  messages,
  onSendMessage,
  onDeleteMessage,
  sending,
}) => {
  const { user } = useAuth();
  const [messageText, setMessageText] = useState('');
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    const text = messageText;
    setMessageText('');
    await onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;
    setDeletingMessageId(messageId);
    await onDeleteMessage(messageId);
    setDeletingMessageId(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
            {(conversation.other_user?.full_name?.[0] || conversation.other_user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {conversation.other_user?.full_name || conversation.other_user?.email}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {conversation.other_user?.email}
            </p>
            {conversation.listing && (
              <div className="flex items-center space-x-2 mt-1">
                {conversation.listing.photo_url && (
                  <img
                    src={conversation.listing.photo_url}
                    alt={conversation.listing.title}
                    className="w-8 h-8 object-cover rounded"
                  />
                )}
                <p className="text-xs text-green-600 dark:text-green-400 truncate">
                  About: {conversation.listing.title}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                Start the conversation
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
              >
                <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                  <div className="flex items-start gap-2">
                    {isOwn && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        disabled={deletingMessageId === message.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded disabled:opacity-50"
                        title="Delete message"
                      >
                        <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </button>
                    )}
                    <div>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-green-500 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.message_text}
                        </p>
                      </div>
                      <p
                        className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                          isOwn ? 'text-right' : 'text-left'
                        }`}
                      >
                        {format(new Date(message.created_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-2xl focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={!messageText.trim() || sending}
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
