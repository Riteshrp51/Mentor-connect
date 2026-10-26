/**
 * Session Lifecycle & Real-Time Clock Utility
 * Determines if a mentorship session is Upcoming, Live Now, or Completed/Expired
 * based on the real-time clock, scheduled date, time, and duration (30, 45, 60 mins).
 */

export const getSessionTiming = (session) => {
  if (!session || !session.date) {
    return {
      startTime: new Date(),
      endTime: new Date(),
      durationMinutes: 45,
      isUpcoming: false,
      isLive: false,
      isExpired: true,
      isCancelled: false,
      effectiveStatus: 'completed',
      statusLabel: 'Completed',
      remainingMinutes: 0,
      formattedDate: '',
      formattedTime: '',
      formattedEndTime: '',
    };
  }

  // Parse Date part
  const d = new Date(session.date);
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  // Parse Time part (e.g. "18:00" or "09:30")
  let hours = 15;
  let minutes = 0;
  if (session.time && typeof session.time === 'string' && session.time.includes(':')) {
    const parts = session.time.split(':');
    hours = parseInt(parts[0], 10) || 0;
    minutes = parseInt(parts[1], 10) || 0;
  } else {
    hours = d.getHours();
    minutes = d.getMinutes();
  }

  const startTime = new Date(year, month, day, hours, minutes, 0, 0);
  const duration = Number(session.durationMinutes) || 45;
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
  const now = new Date();

  const isCancelled = session.status === 'cancelled';
  const isManuallyCompleted = session.status === 'completed' || session.status === 'expired';

  // Real-time lifecycle:
  // 1. Upcoming: now is before scheduled start time
  // 2. Live Now: now is between scheduled start time and scheduled end time
  // 3. Expired/Completed: now is after scheduled end time (e.g. after 30/45/60 mins)
  const isExpired = !isCancelled && (isManuallyCompleted || now.getTime() > endTime.getTime());
  const isLive = !isCancelled && !isExpired && now.getTime() >= startTime.getTime() && now.getTime() <= endTime.getTime();
  const isUpcoming = !isCancelled && !isExpired && !isLive && now.getTime() < startTime.getTime();

  let effectiveStatus = session.status;
  let statusLabel = 'Upcoming';

  if (isCancelled) {
    effectiveStatus = 'cancelled';
    statusLabel = 'Cancelled';
  } else if (isExpired) {
    effectiveStatus = 'completed';
    statusLabel = 'Completed';
  } else if (isLive) {
    effectiveStatus = 'live';
    statusLabel = '🔴 Live Now';
  } else {
    effectiveStatus = 'upcoming';
    statusLabel = 'Upcoming';
  }

  const remainingMinutes = Math.max(0, Math.ceil((endTime.getTime() - now.getTime()) / (60 * 1000)));

  const formattedDate = startTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = startTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const formattedEndTime = endTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return {
    startTime,
    endTime,
    durationMinutes: duration,
    isUpcoming,
    isLive,
    isExpired,
    isCancelled,
    effectiveStatus,
    statusLabel,
    remainingMinutes,
    formattedDate,
    formattedTime,
    formattedEndTime,
  };
};