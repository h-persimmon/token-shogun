interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface LogFieldProps {
  messages: ChatMessage[];
}

/**
 * ログ出力欄
 */
export default function LogField({ messages }: LogFieldProps) {
  return (
    <div className="bg-gradient-to-br from-stone-100 to-amber-50 rounded-lg shadow-lg border border-stone-300 h-full flex flex-col">
      <div className="p-3 border-b border-stone-400 bg-gradient-to-r from-stone-200 to-amber-100">
        <h3 className="text-lg font-semibold text-stone-800">Chat Log</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg transition-all duration-200 ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 ml-2 shadow-sm'
                  : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-600 mr-2 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    message.type === 'user' ? 'bg-red-500' : 'bg-emerald-600'
                  }`}></div>
                  <span
                    className={`text-sm font-medium ${
                      message.type === 'user' ? 'text-red-700' : 'text-emerald-700'
                    }`}
                  >
                    {message.type === 'user' ? 'User' : 'AI'}
                  </span>
                </div>
                <span className="text-xs text-stone-600">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <div
                className={`text-sm whitespace-pre-wrap leading-relaxed ${
                  message.type === 'user' ? 'text-red-800' : 'text-emerald-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center text-stone-600 mt-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-stone-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p>No messages yet</p>
              <p className="text-xs mt-1">Start commanding your game!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
