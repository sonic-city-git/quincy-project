export const getColorStyles = (color: string) => {
  return {
    backgroundColor: `${color}80`,  // 80 in hex is 50% opacity
    color: '#FFFFFF'  // White text, fully opaque
  };
};