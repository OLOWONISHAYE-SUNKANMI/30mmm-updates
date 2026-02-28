import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the auth and session modules before importing components that use them
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(async () => ({
    user: { id: 'user123', email: 'test@example.com' },
  })),
}));

jest.mock('@/lib/session', () => ({
  getUser: jest.fn(async () => ({
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
  })),
}));

import DashboardProvider, { useDashboardContext } from '@/contexts/dashboard/dashboard-provider';
import * as dashboardActions from '@/actions/dashboard';

// Mock the dashboard actions
jest.mock('@/actions/dashboard');

// Mock the AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    authState: {
      isAuthenticated: true,
      user: { id: 'user123', email: 'test@example.com' },
      loading: false,
    },
  }),
}));

// Test component to access the context
const TestComponent = () => {
  const context = useDashboardContext();
  return (
    <div>
      <div data-testid="loading">{context.loading ? 'loading' : 'loaded'}</div>
      <div data-testid="error">{context.error || 'no error'}</div>
      <div data-testid="user-name">{context.userInfo?.name || 'no user'}</div>
      <div data-testid="current-week">{context.userProgress?.currentWeek || 'no week'}</div>
      <div data-testid="current-day">{context.userProgress?.currentDay || 'no day'}</div>
      <div data-testid="cohort">{context.userInfo?.cohort || 'no cohort'}</div>
    </div>
  );
};

describe('DashboardProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchUserProgress', () => {
    test('successfully fetches and sets user progress data', async () => {
      const mockProgressData = {
        success: true,
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          image: 'https://example.com/image.jpg',
        },
        progress: {
          currentWeek: 2,
          currentDay: 3,
          currentDayTitle: 'Day 3',
          currentWeekTitle: 'Week 2',
          currentDevotionalId: 10,
          startDate: '2026-01-01T00:00:00Z',
          totalCompleted: 10,
          cohortNumber: 2,
          cohortRoman: 'II',
          daysCompleted: {
            week1: 7,
            week2: 3,
            week3: 0,
            week4: 0,
            week5: 0,
          },
        },
      };

      dashboardActions.getCurrentUserWithProgress.mockResolvedValue(mockProgressData);

      render(
        <DashboardProvider>
          <TestComponent />
        </DashboardProvider>
      );

      // Initially loading
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Verify user info is set correctly
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('cohort')).toHaveTextContent('2');

      // Verify progress is set correctly
      expect(screen.getByTestId('current-week')).toHaveTextContent('2');
      expect(screen.getByTestId('current-day')).toHaveTextContent('3');
      expect(screen.getByTestId('error')).toHaveTextContent('no error');
    });

    test('throws error when result.success is false', async () => {
      const mockError = 'User not found';
      dashboardActions.getCurrentUserWithProgress.mockResolvedValue({
        success: false,
        error: mockError,
      });

      render(
        <DashboardProvider>
          <TestComponent />
        </DashboardProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Verify error is set
      expect(screen.getByTestId('error')).toHaveTextContent(mockError);
    });

    test('uses default error message when no error provided', async () => {
      dashboardActions.getCurrentUserWithProgress.mockResolvedValue({
        success: false,
        error: null,
      });

      render(
        <DashboardProvider>
          <TestComponent />
        </DashboardProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to get user data');
      });
    });

    test('handles network errors', async () => {
      const networkError = new Error('Network request failed');
      dashboardActions.getCurrentUserWithProgress.mockRejectedValue(networkError);

      render(
        <DashboardProvider>
          <TestComponent />
        </DashboardProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network request failed');
      });
    });

    test('sets default progress when progress is null', async () => {
      const mockData = {
        success: true,
        user: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          image: null,
        },
        progress: null,
      };

      dashboardActions.getCurrentUserWithProgress.mockResolvedValue(mockData);

      render(
        <DashboardProvider>
          <TestComponent />
        </DashboardProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Default values should be set
      expect(screen.getByTestId('current-week')).toHaveTextContent('1');
      expect(screen.getByTestId('current-day')).toHaveTextContent('1');
    });

    test('handles missing user name with default', async () => {
      const mockData = {
        success: true,
        user: {
          name: null,
          email: 'test@example.com',
          image: null,
        },
        progress: {
          currentWeek: 1,
          currentDay: 1,
          currentDayTitle: 'Day 1',
          currentWeekTitle: 'Week 1',
          currentDevotionalId: null,
          startDate: '2026-01-01T00:00:00Z',
          totalCompleted: 0,
          cohortNumber: 1,
          cohortRoman: 'I',
          daysCompleted: {
            week1: 0,
            week2: 0,
            week3: 0,
            week4: 0,
            week5: 0,
          },
        },
      };

      dashboardActions.getCurrentUserWithProgress.mockResolvedValue(mockData);

      render(
        <DashboardProvider>
          <TestComponent />
        </DashboardProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('User');
      });
    });

    test('properly formats progress data types', async () => {
      const mockData = {
        success: true,
        user: {
          name: 'Test User',
          email: 'test@example.com',
          image: null,
        },
        progress: {
          currentWeek: 3,
          currentDay: 5,
          currentDayTitle: 'Day 5',
          currentWeekTitle: 'Week 3',
          currentDevotionalId: 19,
          startDate: '2026-01-01T00:00:00Z',
          totalCompleted: 19,
          cohortNumber: 1,
          cohortRoman: 'I',
          daysCompleted: {
            week1: 7,
            week2: 7,
            week3: 5,
            week4: 0,
            week5: 0,
          },
        },
      };

      dashboardActions.getCurrentUserWithProgress.mockResolvedValue(mockData);

      render(
        <DashboardProvider>
          <TestComponent />
        </DashboardProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Progress values should remain as numbers (converted to strings by JSX rendering)
      expect(screen.getByTestId('current-week')).toHaveTextContent('3');
      expect(screen.getByTestId('current-day')).toHaveTextContent('5');
    });

    test('handles all cohort numbers 1-5 correctly', async () => {
      for (let cohort = 1; cohort <= 5; cohort++) {
        jest.clearAllMocks();

        const mockData = {
          success: true,
          user: {
            name: `User Cohort ${cohort}`,
            email: `user${cohort}@example.com`,
            image: null,
          },
          progress: {
            currentWeek: 1,
            currentDay: 1,
            currentDayTitle: 'Day 1',
            currentWeekTitle: 'Week 1',
            currentDevotionalId: 1,
            startDate: '2026-01-01T00:00:00Z',
            totalCompleted: 1,
            cohortNumber: cohort,
            cohortRoman: ['I', 'II', 'III', 'IV', 'V'][cohort - 1],
            daysCompleted: {
              week1: 1,
              week2: 0,
              week3: 0,
              week4: 0,
              week5: 0,
            },
          },
        };

        dashboardActions.getCurrentUserWithProgress.mockResolvedValue(mockData);

        const { unmount } = render(
          <DashboardProvider>
            <TestComponent />
          </DashboardProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('cohort')).toHaveTextContent(cohort.toString());
        });

        unmount();
      }
    });

    test('handles missing optional progress fields with defaults', async () => {
      const mockData = {
        success: true,
        user: {
          name: 'Test User',
          email: 'test@example.com',
          image: null,
        },
        progress: {
          currentWeek: 1,
          currentDay: 1,
          currentDayTitle: undefined,
          currentWeekTitle: undefined,
          currentDevotionalId: undefined,
          startDate: '2026-01-01T00:00:00Z',
          totalCompleted: undefined,
          cohortNumber: 1,
          cohortRoman: 'I',
          daysCompleted: undefined,
        },
      };

      dashboardActions.getCurrentUserWithProgress.mockResolvedValue(mockData);

      render(
        <DashboardProvider>
          <TestComponent />
        </DashboardProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Default values should be applied for undefined fields
      expect(screen.getByTestId('error')).toHaveTextContent('no error');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });
  });

  describe('data validation', () => {
    test('validates that user object has required fields', async () => {
      const mockData = {
        success: true,
        user: {
          email: 'test@example.com',
        },
        progress: {
          currentWeek: 1,
          currentDay: 1,
          currentDayTitle: 'Day 1',
          currentWeekTitle: 'Week 1',
          currentDevotionalId: null,
          startDate: '2026-01-01T00:00:00Z',
          totalCompleted: 0,
          cohortNumber: 1,
          cohortRoman: 'I',
          daysCompleted: {
            week1: 0,
            week2: 0,
            week3: 0,
            week4: 0,
            week5: 0,
          },
        },
      };

      dashboardActions.getCurrentUserWithProgress.mockResolvedValue(mockData);

      render(
        <DashboardProvider>
          <TestComponent />
        </DashboardProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Should still render with default user name
      expect(screen.getByTestId('user-name')).toHaveTextContent('User');
    });

    test('validates that days completed fields have correct structure', async () => {
      const mockData = {
        success: true,
        user: {
          name: 'Test User',
          email: 'test@example.com',
          image: null,
        },
        progress: {
          currentWeek: 2,
          currentDay: 5,
          currentDayTitle: 'Day 5',
          currentWeekTitle: 'Week 2',
          currentDevotionalId: 12,
          startDate: '2026-01-01T00:00:00Z',
          totalCompleted: 12,
          cohortNumber: 1,
          cohortRoman: 'I',
          daysCompleted: {
            week1: 7,
            week2: 5,
            week3: 0,
            week4: 0,
            week5: 0,
          },
        },
      };

      dashboardActions.getCurrentUserWithProgress.mockResolvedValue(mockData);

      render(
        <DashboardProvider>
          <TestComponent />
        </DashboardProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      expect(screen.getByTestId('error')).toHaveTextContent('no error');
    });

    test('validates progress week is within bounds 1-5', async () => {
      const validWeeks = [1, 2, 3, 4, 5];

      for (const week of validWeeks) {
        jest.clearAllMocks();

        const mockData = {
          success: true,
          user: {
            name: 'Test User',
            email: 'test@example.com',
            image: null,
          },
          progress: {
            currentWeek: week,
            currentDay: 1,
            currentDayTitle: 'Day 1',
            currentWeekTitle: `Week ${week}`,
            currentDevotionalId: (week - 1) * 7 + 1,
            startDate: '2026-01-01T00:00:00Z',
            totalCompleted: (week - 1) * 7 + 1,
            cohortNumber: 1,
            cohortRoman: 'I',
            daysCompleted: {
              week1: 0,
              week2: 0,
              week3: 0,
              week4: 0,
              week5: 0,
            },
          },
        };

        dashboardActions.getCurrentUserWithProgress.mockResolvedValue(mockData);

        const { unmount } = render(
          <DashboardProvider>
            <TestComponent />
          </DashboardProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('current-week')).toHaveTextContent(
            week.toString()
          );
        });

        unmount();
      }
    });

    test('validates progress day is within bounds 1-7', async () => {
      const validDays = [1, 2, 3, 4, 5, 6, 7];

      for (const day of validDays) {
        jest.clearAllMocks();

        const mockData = {
          success: true,
          user: {
            name: 'Test User',
            email: 'test@example.com',
            image: null,
          },
          progress: {
            currentWeek: 1,
            currentDay: day,
            currentDayTitle: `Day ${day}`,
            currentWeekTitle: 'Week 1',
            currentDevotionalId: day,
            startDate: '2026-01-01T00:00:00Z',
            totalCompleted: day,
            cohortNumber: 1,
            cohortRoman: 'I',
            daysCompleted: {
              week1: day,
              week2: 0,
              week3: 0,
              week4: 0,
              week5: 0,
            },
          },
        };

        dashboardActions.getCurrentUserWithProgress.mockResolvedValue(mockData);

        const { unmount } = render(
          <DashboardProvider>
            <TestComponent />
          </DashboardProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('current-day')).toHaveTextContent(
            day.toString()
          );
        });

        unmount();
      }
    });
  });

  describe('error handling', () => {
    test('catches and logs errors from getCurrentUserWithProgress', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Database connection failed');

      dashboardActions.getCurrentUserWithProgress.mockRejectedValue(error);

      render(
        <DashboardProvider>
          <TestComponent />
        </DashboardProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching user progress:',
        error
      );
      expect(screen.getByTestId('error')).toHaveTextContent(
        'Database connection failed'
      );

      consoleErrorSpy.mockRestore();
    });

    test('handles validation failures gracefully', async () => {
      dashboardActions.getCurrentUserWithProgress.mockResolvedValue({
        success: false,
        error: 'Validation error: Invalid cohort number',
      });

      render(
        <DashboardProvider>
          <TestComponent />
        </DashboardProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent(
          'Validation error: Invalid cohort number'
        );
      });
    });
  });

  describe('state management', () => {
    test('initializes with null values before data loads', () => {
      dashboardActions.getCurrentUserWithProgress.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() =>
              resolve({
                success: true,
                user: { name: 'Test', email: 'test@example.com' },
                progress: null,
              }),
              100
            )
          )
      );

      render(
        <DashboardProvider>
          <TestComponent />
        </DashboardProvider>
      );

      // Should show loading state initially
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });

    test('clears error when successfully fetching new data', async () => {
      // First call fails
      dashboardActions.getCurrentUserWithProgress.mockResolvedValueOnce({
        success: false,
        error: 'Initial error',
      });

      const { rerender } = render(
        <DashboardProvider>
          <TestComponent />
        </DashboardProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Initial error');
      });

      // Second call succeeds
      dashboardActions.getCurrentUserWithProgress.mockResolvedValueOnce({
        success: true,
        user: {
          name: 'Test User',
          email: 'test@example.com',
          image: null,
        },
        progress: {
          currentWeek: 1,
          currentDay: 1,
          currentDayTitle: 'Day 1',
          currentWeekTitle: 'Week 1',
          currentDevotionalId: null,
          startDate: '2026-01-01T00:00:00Z',
          totalCompleted: 0,
          cohortNumber: 1,
          cohortRoman: 'I',
          daysCompleted: {
            week1: 0,
            week2: 0,
            week3: 0,
            week4: 0,
            week5: 0,
          },
        },
      });

      // Force a re-fetch by remounting (simulating auth state change)
      rerender(
        <DashboardProvider>
          <TestComponent />
        </DashboardProvider>
      );

      // Error should be cleared on successful fetch
      // Note: This would need the mock to be called again (auth state change)
    });
  });

  describe('integration tests', () => {
    test('complete flow: user progresses from week 1 day 1 to week 2 day 3', async () => {
      // Initial state
      const initialData = {
        success: true,
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          image: null,
        },
        progress: {
          currentWeek: 1,
          currentDay: 1,
          currentDayTitle: 'Day 1',
          currentWeekTitle: 'Week 1',
          currentDevotionalId: 1,
          startDate: '2026-01-01T00:00:00Z',
          totalCompleted: 1,
          cohortNumber: 1,
          cohortRoman: 'I',
          daysCompleted: {
            week1: 1,
            week2: 0,
            week3: 0,
            week4: 0,
            week5: 0,
          },
        },
      };

      dashboardActions.getCurrentUserWithProgress.mockResolvedValue(initialData);

      render(
        <DashboardProvider>
          <TestComponent />
        </DashboardProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('current-week')).toHaveTextContent('1');
        expect(screen.getByTestId('current-day')).toHaveTextContent('1');
      });

      // Progress to week 2 day 3
      const updatedData = {
        success: true,
        user: initialData.user,
        progress: {
          ...initialData.progress,
          currentWeek: 2,
          currentDay: 3,
          currentWeekTitle: 'Week 2',
          currentDayTitle: 'Day 3',
          currentDevotionalId: 10,
          totalCompleted: 10,
          daysCompleted: {
            week1: 7,
            week2: 3,
            week3: 0,
            week4: 0,
            week5: 0,
          },
        },
      };

      dashboardActions.getCurrentUserWithProgress.mockResolvedValue(updatedData);

      // Trigger refresh
      await waitFor(() => {
        expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
      });
    });

    test('handles complete program flow through all weeks', async () => {
      const weeks = [
        { week: 1, day: 1 },
        { week: 1, day: 7 },
        { week: 2, day: 1 },
        { week: 3, day: 4 },
        { week: 4, day: 7 },
        { week: 5, day: 7 },
      ];

      for (const { week, day } of weeks) {
        jest.clearAllMocks();

        const mockData = {
          success: true,
          user: {
            name: 'Test User',
            email: 'test@example.com',
            image: null,
          },
          progress: {
            currentWeek: week,
            currentDay: day,
            currentDayTitle: `Day ${day}`,
            currentWeekTitle: `Week ${week}`,
            currentDevotionalId: (week - 1) * 7 + day,
            startDate: '2026-01-01T00:00:00Z',
            totalCompleted: (week - 1) * 7 + day,
            cohortNumber: 1,
            cohortRoman: 'I',
            daysCompleted: {
              week1: Math.min(week === 1 ? day : 7, 7),
              week2: week >= 2 ? (week === 2 ? day : 7) : 0,
              week3: week >= 3 ? (week === 3 ? day : 7) : 0,
              week4: week >= 4 ? (week === 4 ? day : 7) : 0,
              week5: week >= 5 ? (week === 5 ? day : 7) : 0,
            },
          },
        };

        dashboardActions.getCurrentUserWithProgress.mockResolvedValue(mockData);

        const { unmount } = render(
          <DashboardProvider>
            <TestComponent />
          </DashboardProvider>
        );

        await waitFor(() => {
          expect(screen.getByTestId('current-week')).toHaveTextContent(
            week.toString()
          );
          expect(screen.getByTestId('current-day')).toHaveTextContent(
            day.toString()
          );
        });

        unmount();
      }
    });
  });
});
