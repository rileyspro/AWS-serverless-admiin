import { DateTime } from 'luxon';

export const isFutureDate = (date: string) => {
  return (
    DateTime.fromFormat(date, 'yyyy-MM-dd')
      .setZone('Australia/Sydney')
      .startOf('day') >
    DateTime.now().setZone('Australia/Sydney').startOf('day')
  );
};

export const isPastDate = (date: string) => {
  return (
    DateTime.fromFormat(date, 'yyyy-MM-dd')
      .setZone('Australia/Sydney')
      .startOf('day') <
    DateTime.now().setZone('Australia/Sydney').startOf('day')
  );
};

export const isTodayDate = (date: string) => {
  return (
    DateTime.fromFormat(date, 'yyyy-MM-dd')
      .setZone('Australia/Sydney')
      .startOf('day') ===
    DateTime.now().setZone('Australia/Sydney').startOf('day')
  );
};
export const isUpdatedDateNewerThanExisting = (
  updatedAt: string,
  lastUpdatedAt?: string | null
) => {
  if (!lastUpdatedAt) {
    return true;
  }

  const d1 = DateTime.fromISO(updatedAt);
  const d2 = DateTime.fromISO(lastUpdatedAt);

  if (d1 < d2) {
    console.log('updatedAt is older');
  } else if (d1 === d2) {
    console.log('updatedAt is equal');
  } else {
    console.log('updatedAt is newer');
  }
  return d1 > d2;
};
