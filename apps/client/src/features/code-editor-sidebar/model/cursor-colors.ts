const CURSOR_COLORS = [
  { color: "#FF6B6B", light: "rgba(255, 107, 107, 0.3)" },
  { color: "#4ECDC4", light: "rgba(78, 205, 196, 0.3)" },
  { color: "#45B7D1", light: "rgba(69, 183, 209, 0.3)" },
  { color: "#96CEB4", light: "rgba(150, 206, 180, 0.3)" },
  { color: "#FFEAA7", light: "rgba(255, 234, 167, 0.3)" },
  { color: "#DDA0DD", light: "rgba(221, 160, 221, 0.3)" },
  { color: "#98D8C8", light: "rgba(152, 216, 200, 0.3)" },
  { color: "#F7DC6F", light: "rgba(247, 220, 111, 0.3)" },
  { color: "#BB8FCE", light: "rgba(187, 143, 206, 0.3)" },
  { color: "#85C1E9", light: "rgba(133, 193, 233, 0.3)" },
] as const;

export const getColorForClient = (clientID: number): { color: string; light: string } => {
  const index = clientID % CURSOR_COLORS.length;
  return CURSOR_COLORS[index];
};

export const injectCursorStyles = (clientID: number): void => {
  const styleId = `cursor-style-${clientID}`;

  if (document.getElementById(styleId)) return;

  const { color, light } = getColorForClient(clientID);

  const style = document.createElement("style");
  style.id = styleId;

  style.textContent = `
    .yRemoteSelection-${clientID} {
      background-color: ${light};
    }
    .yRemoteSelectionHead-${clientID}::after {
      border-color: ${color};
      background-color: ${color};
    }
  `;

  document.head.appendChild(style);
};

export const removeCursorStyles = (clientID: number): void => {
  const styleId = `cursor-style-${clientID}`;
  const style = document.getElementById(styleId);

  if (style) {
    style.remove();
  }
};
