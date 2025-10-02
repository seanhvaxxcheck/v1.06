import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, ArrowLeft } from 'lucide-react';
import { useMessaging, type Conversation } from '../../hooks/useMessaging';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';

export const MessagesPage: React.FC = () => {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    loading,
    fetchMessages,
    sendMessage,
    subscribeToConversation,
    unsubscribeFromConversation,
    deleteMessage,
  } = useMessaging();

  const [searchTerm, setSearchTerm] = useState('');
  const [sending, setSending] = useState(false);
  const [hasAutoSelected, setHasAutoSelected] = useState(false);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const otherUserName = conv.other_user?.full_name || conv.other_user?.email || '';
    return otherUserName.toLowerCase().includes(search);
  });

  useEffect(() => {
    if (!hasAutoSelected && conversations.length > 0) {
      const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
      const conversationId = urlParams.get('conversation');

      if (conversationId) {
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
          setActiveConversation(conversation);
          setHasAutoSelected(true);
          window.history.replaceState(null, '', '#/messages');
        }
      }
    }
  }, [conversations, hasAutoSelected, setActiveConversation]);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
      subscribeToConversation(activeConversation.id);
    }

    return () => {
      unsubscribeFromConversation();
    };
  }, [activeConversation?.id]);

  const handleSendMessage = async (text: string) => {
    if (!activeConversation || !text.trim()) return;

    setSending(true);
    try {
      const result = await sendMessage(activeConversation.id, text.trim());
      if (result.error) {
        alert(`Failed to send message: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const result = await deleteMessage(messageId);
      if (result.error) {
        alert(`Failed to delete message: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  const handleBackToList = () => {
    setActiveConversation(null);
    unsubscribeFromConversation();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto h-screen flex flex-col">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {activeConversation ? (
              <button
                onClick={handleBackToList}
                className="sm:hidden flex items-center space-x-2 text-gray-600 dark:text-gray-400"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
            ) : null}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
            {!activeConversation && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {conversations.length} conversations
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className={`${
            activeConversation ? 'hidden sm:flex' : 'flex'
          } w-full sm:w-80 lg:w-96 flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-full focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            <ConversationList
              conversations={filteredConversations}
              activeConversation={activeConversation}
              onSelectConversation={setActiveConversation}
            />
          </div>

          <div className={`${
            activeConversation ? 'flex' : 'hidden sm:flex'
          } flex-1 flex-col bg-gray-50 dark:bg-gray-900`}>
            {activeConversation ? (
              <MessageThread
                conversation={activeConversation}
                messages={messages}
                onSendMessage={handleSendMessage}
                onDeleteMessage={handleDeleteMessage}
                sending={sending}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
