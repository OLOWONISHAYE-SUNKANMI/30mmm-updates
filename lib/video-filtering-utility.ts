/**
 * Video Filtering Utility
 * Handles filtering videos based on user's current progress in the program
 * Users can only access videos up to and including their current week/day
 */

export interface Video {
  id: any;
  week: number;
  day: number;
  [key: string]: any;
}

/**
 * User's progress in the program
 * currentWeek and currentDay must be numbers, not strings
 */
export interface UserProgress {
  currentWeek: number;
  currentDay: number;
}

/**
 * Compare two week/day positions in the program
 * Returns:
 *   < 0 if position1 is before position2
 *   = 0 if positions are equal
 *   > 0 if position1 is after position2
 */
export function comparePositions(
  position1: { week: number; day: number },
  position2: { week: number; day: number }
): number {
  // First compare by week
  if (position1.week !== position2.week) {
    return position1.week - position2.week;
  }
  // If same week, compare by day
  return position1.day - position2.day;
}

/**
 * Check if a video is accessible to a user based on their progress
 * A video is accessible if its week/day is <= user's current week/day
 */
export function isVideoAccessible(
  video: Video,
  userProgress: UserProgress
): boolean {
  const comparison = comparePositions(
    { week: video.week, day: video.day },
    { week: userProgress.currentWeek, day: userProgress.currentDay }
  );
  // Video is accessible if it's at or before the user's current position
  return comparison <= 0;
}

/**
 * Filter videos based on user's current progress
 * Returns only videos that the user can access
 * Maintains original order of videos
 */
export function filterVideosByUserProgress(
  videos: Video[],
  userProgress: UserProgress
): Video[] {
  if (!videos || videos.length === 0) {
    return [];
  }

  if (!userProgress || userProgress.currentWeek === undefined || userProgress.currentDay === undefined) {
    return [];
  }

  return videos.filter((video) => isVideoAccessible(video, userProgress));
}

/**
 * Validate that week and day values are within valid program bounds
 * Program runs from Week 1 Day 1 to Week 5 Day 7
 */
export function isValidPosition(week: number, day: number): boolean {
  // Check if values are defined and are numbers
  if (week === undefined || week === null || day === undefined || day === null) {
    return false;
  }
  // Week must be between 1 and 5
  if (week < 1 || week > 5) {
    return false;
  }
  // Day must be between 1 and 7
  if (day < 1 || day > 7) {
    return false;
  }
  return true;
}

/**
 * Validate user progress object
 */
export function isValidUserProgress(userProgress: UserProgress): boolean {
  if (!userProgress) {
    return false;
  }
  // Check that both properties exist
  if (userProgress.currentWeek === undefined || userProgress.currentDay === undefined) {
    return false;
  }
  return isValidPosition(userProgress.currentWeek, userProgress.currentDay);
}
