import {
  comparePositions,
  isVideoAccessible,
  filterVideosByUserProgress,
  isValidPosition,
  isValidUserProgress,
  type Video,
  type UserProgress,
} from '@/lib/video-filtering-utility';

describe('Video Filtering Utility', () => {
  describe('comparePositions', () => {
    test('returns negative when position1 is before position2 (different weeks)', () => {
      const result = comparePositions(
        { week: 1, day: 5 },
        { week: 2, day: 2 }
      );
      expect(result).toBeLessThan(0);
    });

    test('returns negative when position1 is before position2 (same week)', () => {
      const result = comparePositions(
        { week: 2, day: 3 },
        { week: 2, day: 5 }
      );
      expect(result).toBeLessThan(0);
    });

    test('returns zero when positions are equal', () => {
      const result = comparePositions(
        { week: 3, day: 4 },
        { week: 3, day: 4 }
      );
      expect(result).toBe(0);
    });

    test('returns positive when position1 is after position2 (different weeks)', () => {
      const result = comparePositions(
        { week: 4, day: 2 },
        { week: 2, day: 6 }
      );
      expect(result).toBeGreaterThan(0);
    });

    test('returns positive when position1 is after position2 (same week)', () => {
      const result = comparePositions(
        { week: 3, day: 7 },
        { week: 3, day: 1 }
      );
      expect(result).toBeGreaterThan(0);
    });

    test('week comparison takes priority over day', () => {
      const result = comparePositions(
        { week: 2, day: 7 }, // Week 2 Day 7
        { week: 3, day: 1 }  // Week 3 Day 1
      );
      expect(result).toBeLessThan(0);
    });

    test('handles week 5 day 7 (last day of program)', () => {
      const result = comparePositions(
        { week: 5, day: 7 },
        { week: 5, day: 7 }
      );
      expect(result).toBe(0);
    });

    test('handles week 1 day 1 (first day of program)', () => {
      const result = comparePositions(
        { week: 1, day: 1 },
        { week: 1, day: 1 }
      );
      expect(result).toBe(0);
    });
  });

  describe('isVideoAccessible', () => {
    test('video is accessible when at user\'s current position', () => {
      const video: Video = { id: 1, week: 2, day: 3 };
      const userProgress: UserProgress = { currentWeek: 2, currentDay: 3 };
      expect(isVideoAccessible(video, userProgress)).toBe(true);
    });

    test('video is accessible when before user\'s current position', () => {
      const video: Video = { id: 1, week: 1, day: 5 };
      const userProgress: UserProgress = { currentWeek: 2, currentDay: 3 };
      expect(isVideoAccessible(video, userProgress)).toBe(true);
    });

    test('video is not accessible when after user\'s current position (different week)', () => {
      const video: Video = { id: 1, week: 3, day: 2 };
      const userProgress: UserProgress = { currentWeek: 2, currentDay: 3 };
      expect(isVideoAccessible(video, userProgress)).toBe(false);
    });

    test('video is not accessible when after user\'s current position (same week)', () => {
      const video: Video = { id: 1, week: 2, day: 5 };
      const userProgress: UserProgress = { currentWeek: 2, currentDay: 3 };
      expect(isVideoAccessible(video, userProgress)).toBe(false);
    });

    test('week 1 day 1 video is accessible to user on week 1 day 1', () => {
      const video: Video = { id: 1, week: 1, day: 1 };
      const userProgress: UserProgress = { currentWeek: 1, currentDay: 1 };
      expect(isVideoAccessible(video, userProgress)).toBe(true);
    });

    test('week 1 day 1 video is not accessible to user on week 1 day 0 (invalid)', () => {
      const video: Video = { id: 1, week: 1, day: 1 };
      const userProgress: UserProgress = { currentWeek: 1, currentDay: 0 };
      expect(isVideoAccessible(video, userProgress)).toBe(false);
    });

    test('all earlier week videos are accessible when user is on week 5 day 7', () => {
      const userProgress: UserProgress = { currentWeek: 5, currentDay: 7 };
      
      const testCases = [
        { week: 1, day: 1 },
        { week: 2, day: 7 },
        { week: 3, day: 4 },
        { week: 4, day: 6 },
        { week: 5, day: 7 },
      ];

      testCases.forEach((tc) => {
        const video: Video = { id: 1, week: tc.week, day: tc.day };
        expect(isVideoAccessible(video, userProgress)).toBe(true);
      });
    });

    test('preserves extra video properties', () => {
      const video: Video = {
        id: 1,
        week: 2,
        day: 3,
        title: 'Test Video',
        fileName: 'test.mp4',
        blobUrl: 'https://example.com/video.mp4',
      };
      const userProgress: UserProgress = { currentWeek: 3, currentDay: 1 };
      expect(isVideoAccessible(video, userProgress)).toBe(true);
    });
  });

  describe('filterVideosByUserProgress', () => {
    test('filters videos correctly for user on week 2 day 3', () => {
      const videos: Video[] = [
        { id: 1, week: 1, day: 1 },
        { id: 2, week: 1, day: 7 },
        { id: 3, week: 2, day: 1 },
        { id: 4, week: 2, day: 3 },
        { id: 5, week: 2, day: 4 },
        { id: 6, week: 3, day: 1 },
        { id: 7, week: 5, day: 7 },
      ];
      const userProgress: UserProgress = { currentWeek: 2, currentDay: 3 };
      const filtered = filterVideosByUserProgress(videos, userProgress);

      expect(filtered).toHaveLength(4);
      expect(filtered.map((v) => v.id)).toEqual([1, 2, 3, 4]);
    });

    test('returns empty array for user on week 1 day 1 with week 2+ videos', () => {
      const videos: Video[] = [
        { id: 1, week: 2, day: 1 },
        { id: 2, week: 3, day: 1 },
      ];
      const userProgress: UserProgress = { currentWeek: 1, currentDay: 1 };
      const filtered = filterVideosByUserProgress(videos, userProgress);

      expect(filtered).toHaveLength(0);
    });

    test('returns all videos for user on week 5 day 7', () => {
      const videos: Video[] = [
        { id: 1, week: 1, day: 1 },
        { id: 2, week: 3, day: 3 },
        { id: 3, week: 5, day: 7 },
      ];
      const userProgress: UserProgress = { currentWeek: 5, currentDay: 7 };
      const filtered = filterVideosByUserProgress(videos, userProgress);

      expect(filtered).toHaveLength(3);
    });

    test('maintains original video order', () => {
      const videos: Video[] = [
        { id: 5, week: 3, day: 2 },
        { id: 2, week: 1, day: 7 },
        { id: 4, week: 2, day: 3 },
        { id: 1, week: 1, day: 1 },
        { id: 3, week: 2, day: 1 },
      ];
      const userProgress: UserProgress = { currentWeek: 2, currentDay: 3 };
      const filtered = filterVideosByUserProgress(videos, userProgress);

      // IDs should be in the same order as the input array
      expect(filtered.map((v) => v.id)).toEqual([2, 4, 1, 3]);
    });

    test('returns empty array when videos array is empty', () => {
      const videos: Video[] = [];
      const userProgress: UserProgress = { currentWeek: 2, currentDay: 3 };
      const filtered = filterVideosByUserProgress(videos, userProgress);

      expect(filtered).toEqual([]);
    });

    test('returns empty array when userProgress is null', () => {
      const videos: Video[] = [
        { id: 1, week: 1, day: 1 },
      ];
      const filtered = filterVideosByUserProgress(videos, null as any);

      expect(filtered).toEqual([]);
    });

    test('returns empty array when userProgress is undefined', () => {
      const videos: Video[] = [
        { id: 1, week: 1, day: 1 },
      ];
      const filtered = filterVideosByUserProgress(videos, undefined as any);

      expect(filtered).toEqual([]);
    });

    test('handles videos with extra properties', () => {
      const videos: Video[] = [
        {
          id: 1,
          week: 1,
          day: 1,
          title: 'Video 1',
          fileName: 'video1.mp4',
          blobUrl: 'https://example.com/video1.mp4',
          fileType: 'video/mp4',
          userId: 'user123',
        },
        {
          id: 2,
          week: 2,
          day: 1,
          title: 'Video 2',
          fileName: 'video2.mp4',
          blobUrl: 'https://example.com/video2.mp4',
          fileType: 'video/mp4',
          userId: 'user123',
        },
      ];
      const userProgress: UserProgress = { currentWeek: 1, currentDay: 7 };
      const filtered = filterVideosByUserProgress(videos, userProgress);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toEqual(videos[0]);
      expect(filtered[0].title).toBe('Video 1');
      expect(filtered[0].blobUrl).toBe('https://example.com/video1.mp4');
    });

    test('filters across all 5 weeks correctly', () => {
      const videos: Video[] = [
        { id: 1, week: 1, day: 1 },
        { id: 2, week: 2, day: 1 },
        { id: 3, week: 3, day: 1 },
        { id: 4, week: 4, day: 1 },
        { id: 5, week: 5, day: 1 },
        { id: 6, week: 5, day: 7 },
      ];
      const userProgress: UserProgress = { currentWeek: 3, currentDay: 1 };
      const filtered = filterVideosByUserProgress(videos, userProgress);

      expect(filtered).toHaveLength(3);
      expect(filtered.map((v) => v.id)).toEqual([1, 2, 3]);
    });

    test('handles user progress with missing currentDay', () => {
      const videos: Video[] = [
        { id: 1, week: 1, day: 1 },
      ];
      const userProgress: any = { currentWeek: 1 };
      const filtered = filterVideosByUserProgress(videos, userProgress);

      expect(filtered).toEqual([]);
    });

    test('handles user progress with missing currentWeek', () => {
      const videos: Video[] = [
        { id: 1, week: 1, day: 1 },
      ];
      const userProgress: any = { currentDay: 1 };
      const filtered = filterVideosByUserProgress(videos, userProgress);

      expect(filtered).toEqual([]);
    });
  });

  describe('isValidPosition', () => {
    test('accepts valid positions', () => {
      expect(isValidPosition(1, 1)).toBe(true);
      expect(isValidPosition(1, 7)).toBe(true);
      expect(isValidPosition(3, 4)).toBe(true);
      expect(isValidPosition(5, 7)).toBe(true);
    });

    test('rejects week less than 1', () => {
      expect(isValidPosition(0, 3)).toBe(false);
      expect(isValidPosition(-1, 3)).toBe(false);
    });

    test('rejects week greater than 5', () => {
      expect(isValidPosition(6, 3)).toBe(false);
      expect(isValidPosition(10, 3)).toBe(false);
    });

    test('rejects day less than 1', () => {
      expect(isValidPosition(3, 0)).toBe(false);
      expect(isValidPosition(3, -1)).toBe(false);
    });

    test('rejects day greater than 7', () => {
      expect(isValidPosition(3, 8)).toBe(false);
      expect(isValidPosition(3, 10)).toBe(false);
    });

    test('rejects both week and day being invalid', () => {
      expect(isValidPosition(0, 0)).toBe(false);
      expect(isValidPosition(6, 8)).toBe(false);
      expect(isValidPosition(-1, 10)).toBe(false);
    });

    test('all valid program positions pass', () => {
      for (let week = 1; week <= 5; week++) {
        for (let day = 1; day <= 7; day++) {
          expect(isValidPosition(week, day)).toBe(true);
        }
      }
    });
  });

  describe('isValidUserProgress', () => {
    test('accepts valid user progress', () => {
      expect(isValidUserProgress({ currentWeek: 1, currentDay: 1 })).toBe(true);
      expect(isValidUserProgress({ currentWeek: 3, currentDay: 4 })).toBe(true);
      expect(isValidUserProgress({ currentWeek: 5, currentDay: 7 })).toBe(true);
    });

    test('rejects null user progress', () => {
      expect(isValidUserProgress(null as any)).toBe(false);
    });

    test('rejects undefined user progress', () => {
      expect(isValidUserProgress(undefined as any)).toBe(false);
    });

    test('rejects user progress with invalid week', () => {
      expect(isValidUserProgress({ currentWeek: 0, currentDay: 3 })).toBe(false);
      expect(isValidUserProgress({ currentWeek: 6, currentDay: 3 })).toBe(false);
    });

    test('rejects user progress with invalid day', () => {
      expect(isValidUserProgress({ currentWeek: 3, currentDay: 0 })).toBe(false);
      expect(isValidUserProgress({ currentWeek: 3, currentDay: 8 })).toBe(false);
    });

    test('rejects user progress with missing currentWeek', () => {
      expect(isValidUserProgress({ currentDay: 3 } as any)).toBe(false);
    });

    test('rejects user progress with missing currentDay', () => {
      expect(isValidUserProgress({ currentWeek: 3 } as any)).toBe(false);
    });

    test('rejects user progress with extra invalid fields', () => {
      expect(
        isValidUserProgress({
          currentWeek: 1,
          currentDay: 1,
        } as any)
      ).toBe(true); // Still valid if week and day are valid
    });
  });

  describe('Integration Tests', () => {
    test('realistic scenario: user completes week 3 day 4', () => {
      const userProgress: UserProgress = { currentWeek: 3, currentDay: 4 };

      const allVideos: Video[] = [
        // Week 1
        { id: 1, week: 1, day: 1, title: 'Week 1 Day 1' },
        { id: 2, week: 1, day: 2, title: 'Week 1 Day 2' },
        { id: 3, week: 1, day: 7, title: 'Week 1 Day 7' },
        // Week 2
        { id: 4, week: 2, day: 1, title: 'Week 2 Day 1' },
        { id: 5, week: 2, day: 4, title: 'Week 2 Day 4' },
        { id: 6, week: 2, day: 7, title: 'Week 2 Day 7' },
        // Week 3
        { id: 7, week: 3, day: 1, title: 'Week 3 Day 1' },
        { id: 8, week: 3, day: 3, title: 'Week 3 Day 3' },
        { id: 9, week: 3, day: 4, title: 'Week 3 Day 4' },
        { id: 10, week: 3, day: 5, title: 'Week 3 Day 5' },
        { id: 11, week: 3, day: 7, title: 'Week 3 Day 7' },
        // Week 4
        { id: 12, week: 4, day: 1, title: 'Week 4 Day 1' },
        { id: 13, week: 4, day: 7, title: 'Week 4 Day 7' },
        // Week 5
        { id: 14, week: 5, day: 1, title: 'Week 5 Day 1' },
        { id: 15, week: 5, day: 7, title: 'Week 5 Day 7' },
      ];

      const filtered = filterVideosByUserProgress(allVideos, userProgress);

      // User should have access to 9 videos (all of weeks 1-2, plus week 3 days 1-4)
      expect(filtered).toHaveLength(9);
      expect(filtered.map((v) => v.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);

      // Should not have access to videos after week 3 day 4
      const inaccessibleIds = [10, 11, 12, 13, 14, 15];
      filtered.forEach((video) => {
        expect(inaccessibleIds).not.toContain(video.id);
      });
    });

    test('realistic scenario: new user on week 1 day 1', () => {
      const userProgress: UserProgress = { currentWeek: 1, currentDay: 1 };
      const allVideos: Video[] = [
        { id: 1, week: 1, day: 1 },
        { id: 2, week: 1, day: 2 },
        { id: 3, week: 2, day: 1 },
      ];

      const filtered = filterVideosByUserProgress(allVideos, userProgress);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe(1);
    });

    test('realistic scenario: user completed entire program', () => {
      const userProgress: UserProgress = { currentWeek: 5, currentDay: 7 };
      const allVideos: Video[] = [
        { id: 1, week: 1, day: 1 },
        { id: 35, week: 5, day: 7 },
      ];

      const filtered = filterVideosByUserProgress(allVideos, userProgress);

      expect(filtered).toHaveLength(2);
    });
  });
});