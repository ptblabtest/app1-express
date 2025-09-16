export const calculateYears = (startDate: Date, endDate: Date): number => {
  return endDate.getFullYear() - startDate.getFullYear();
};

export const calculateMonths = (startDate: Date, endDate: Date, years: number): number => {
  return endDate.getMonth() - startDate.getMonth();
};

export const calculateDays = (startDate: Date, endDate: Date): number => {
  return endDate.getDate() - startDate.getDate();
};

export const calculateHours = (startDate: Date, endDate: Date): number => {
  return endDate.getHours() - startDate.getHours();
};

export const calculateDuration = (startDate: any, endDate: any, mode: 'ymd' | 'ymdh' = 'ymd'): string => {
  if (!startDate || !endDate) return '';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let years = calculateYears(start, end);
  let months = calculateMonths(start, end, years);
  let days = calculateDays(start, end);
  let hours = calculateHours(start, end);
  
  if (mode === 'ymdh' && hours < 0) {
    days--;
    hours += 24;
  }
  
  if (days < 0) {
    months--;
    const lastMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const parts = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (mode === 'ymdh' && hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  
  return parts.join(', ') || '0 days';
};