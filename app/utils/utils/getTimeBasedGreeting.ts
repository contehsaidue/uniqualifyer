/**
 * Returns an object with detailed current date/time information and greeting
 * @returns {{
 *   greeting: string,
 *   currentDate: string,
 *   currentTime: string,
 *   month: string,
 *   day: number,
 *   year: number,
 *   hour: number,
 *   minute: number,
 *   second: number,
 *   fullDateTime: string
 * }}
 */

export function getCurrentDateTime() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();
  
  let greeting;
  if (hour < 12) {
    greeting = 'Good morning';
  } else if (hour < 17) {
    greeting = 'Good afternoon';
  } else {
    greeting = 'Good evening';
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const month = months[now.getMonth()];
  const day = now.getDate();
  const year = now.getFullYear();

  const formatTime = (value: number) => value.toString().padStart(2, '0');
  const formattedTime = `${formatTime(hour)}:${formatTime(minute)}:${formatTime(second)}`;

  return {
    greeting,
    currentDate: `${month} ${day}, ${year}`,
    currentTime: formattedTime,
    month,
    day,
    year,
    hour,
    minute,
    second,
    fullDateTime: `${month} ${day}, ${year} at ${formattedTime}`
  };
}
