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
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Chat Log</h3>
      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-3 rounded-lg ${
              message.type === 'user'
                ? 'bg-blue-100 border-l-4 border-blue-500 ml-4'
                : 'bg-green-100 border-l-4 border-green-500 mr-4'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <span
                className={`text-sm font-medium ${
                  message.type === 'user' ? 'text-blue-700' : 'text-green-700'
                }`}
              >
                {message.type === 'user' ? 'User' : 'AI'}
              </span>
              <span className="text-xs text-gray-500">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div
              className={`text-sm whitespace-pre-wrap ${
                message.type === 'user' ? 'text-blue-800' : 'text-green-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start chatting!
          </div>
        )}
      </div>
    </div>
  );
}
