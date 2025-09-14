/**
 * ログ出力欄
 */
export default function LogField() {
  return (
    <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
      <div className="flex-1 flex flex-col">
        <textarea
          placeholder="ログ出力欄"
          className="flex-1 w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
