export const useCalendarDate = () => {
  const normalizeDate = (date: Date): Date => {
    return new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    ));
  };

  return {
    normalizeDate,
  };
};