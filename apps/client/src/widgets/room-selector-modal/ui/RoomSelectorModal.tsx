import type { RoomType } from "@shared/types";

interface RoomSelectorModalProps {
  isOpen: boolean;
  roomRange: string;
  onSelect: (roomId: RoomType) => void;
  onClose: () => void;
}

const getRoomNumbers = (roomRange: string): string[] => {
  if (roomRange === "meeting (web 1-10)") {
    return Array.from({ length: 10 }, (_, i) => `meeting (web ${i + 1})`);
  } else if (roomRange === "meeting (web 11-20)") {
    return Array.from({ length: 10 }, (_, i) => `meeting (web ${i + 11})`);
  } else if (roomRange === "meeting (web 21-30)") {
    return Array.from({ length: 10 }, (_, i) => `meeting (web ${i + 21})`);
  } else if (roomRange === "meeting (ios 1-5)") {
    return Array.from({ length: 5 }, (_, i) => `meeting (ios ${i + 1})`);
  } else if (roomRange === "meeting (android 1-3)") {
    return Array.from({ length: 3 }, (_, i) => `meeting (android ${i + 1})`);
  }
  return [];
};

export const RoomSelectorModal = ({ isOpen, roomRange, onSelect, onClose }: RoomSelectorModalProps) => {
  const rooms = isOpen && roomRange ? getRoomNumbers(roomRange) : [];

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        pointerEvents: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "8px" }}>회의실 선택</h2>
          <p style={{ fontSize: "14px", color: "#666" }}>입장할 회의실을 선택하세요</p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          {rooms.map((room) => (
            <button
              key={room}
              onClick={() => onSelect(room as RoomType)}
              style={{
                padding: "12px 16px",
                backgroundColor: "#f3f4f6",
                border: "2px solid transparent",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e5e7eb";
                e.currentTarget.style.borderColor = "#3b82f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
                e.currentTarget.style.borderColor = "transparent";
              }}
            >
              {room.replace("meeting (", "").replace(")", "")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
