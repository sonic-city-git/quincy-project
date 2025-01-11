export const getColorStyles = (color: string) => {
  return {
    backgroundColor: `${color}D9`,  // D9 in hex is 85% opacity
    color: '#FFFFFF'  // White text, fully opaque
  };
};