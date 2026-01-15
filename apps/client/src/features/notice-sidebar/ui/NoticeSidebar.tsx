import useNotice from "../model/use-notice";

const NoticeSidebar = () => {
  const { notices } = useNotice();

  return (
    <div className="h-full w-full">
      {notices.length === 0 && <div className="p-4 text-gray-500">공지사항이 없습니다.</div>}
      {notices.map((notice) => (
        <div key={notice.id} className="mb-4 rounded-lg border border-gray-300 bg-white p-4 shadow">
          <div className="text-lg font-bold">{notice.title}</div>
          <div className="text-sm text-gray-500">{new Date(notice.timestamp).toLocaleString()}</div>
          <div className="text-sm text-gray-700">Room: {notice.roomId}</div>
          <div className="mt-2 text-gray-700">{notice.content}</div>
        </div>
      ))}
    </div>
  );
};

export default NoticeSidebar;
