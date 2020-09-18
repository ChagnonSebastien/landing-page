import { findTimeZone, getUnixTime } from 'timezone-support';

export const convertISOToDate = (isoString: string, timezone: string) => {
  const split = isoString.split('T')[0].split('-');
  const data = {
    year: Number(split[0]),
    month: Number(split[1]),
    day: Number(split[2]),
    hours: 0,
    minutes: 0,
  };
  return new Date(getUnixTime(data, findTimeZone(timezone)));
};

export default convertISOToDate;
