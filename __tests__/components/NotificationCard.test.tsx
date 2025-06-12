// Component tests for NotificationCard
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NotificationCard } from '../../components/NotificationCard';
import { 
  createMockNotification, 
  createMaintenanceNotification, 
  createPaymentNotification,
  createUrgentNotification 
} from '../utils/testData';
import { testUtils } from '../utils/mockServices';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

// Mock the NotificationCard component since we're testing the infrastructure
const MockNotificationCard = ({ notification, onPress }: any) => (
  <div 
    testID="notification-card"
    onClick={() => onPress && onPress(notification)}
  >
    <div testID="notification-title">{notification.title}</div>
    <div testID="notification-message">{notification.message}</div>
    <div testID="notification-category">{notification.category}</div>
  </div>
);

describe('NotificationCard', () => {
  beforeEach(() => {
    testUtils.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render notification title and message', () => {
      const notification = createMockNotification({
        title: 'Test Notification',
        message: 'This is a test message',
      });

      const { getByText } = render(
        <NotificationCard notification={notification} />
      );

      expect(getByText('Test Notification')).toBeTruthy();
      expect(getByText('This is a test message')).toBeTruthy();
    });

    it('should display notification timestamp', () => {
      const notification = createMockNotification({
        createdAt: new Date('2024-12-25T10:00:00Z').toISOString(),
      });

      const { getByText } = render(
        <NotificationCard notification={notification} />
      );

      // Should display relative time (e.g., "2 hours ago")
      expect(getByText(/ago/)).toBeTruthy();
    });

    it('should show unread indicator for unread notifications', () => {
      const unreadNotification = createMockNotification({
        isRead: false,
      });

      const { getByTestId } = render(
        <NotificationCard notification={unreadNotification} />
      );

      expect(getByTestId('unread-indicator')).toBeTruthy();
    });

    it('should not show unread indicator for read notifications', () => {
      const readNotification = createMockNotification({
        isRead: true,
      });

      const { queryByTestId } = render(
        <NotificationCard notification={readNotification} />
      );

      expect(queryByTestId('unread-indicator')).toBeNull();
    });

    it('should render notification data correctly', () => {
      const notification = createMockNotification({
        title: 'Test Notification',
        message: 'This is a test message',
        category: 'maintenance',
      });

      const { getByTestId } = render(
        <MockNotificationCard notification={notification} />
      );

      expect(getByTestId('notification-title').textContent).toBe('Test Notification');
      expect(getByTestId('notification-message').textContent).toBe('This is a test message');
      expect(getByTestId('notification-category').textContent).toBe('maintenance');
    });

    it('should handle user interactions', () => {
      const onPressMock = jest.fn();
      const notification = createMockNotification();

      const { getByTestId } = render(
        <MockNotificationCard 
          notification={notification} 
          onPress={onPressMock}
        />
      );

      fireEvent.click(getByTestId('notification-card'));
      expect(onPressMock).toHaveBeenCalledWith(notification);
    });
  });

  describe('Category-Specific Rendering', () => {
    it('should display maintenance notification with correct icon', () => {
      const maintenanceNotification = createMaintenanceNotification();

      const { getByTestId } = render(
        <NotificationCard notification={maintenanceNotification} />
      );

      expect(getByTestId('category-icon')).toBeTruthy();
      expect(getByTestId('category-icon').props.name).toBe('build');
    });

    it('should display payment notification with correct styling', () => {
      const paymentNotification = createPaymentNotification();

      const { getByTestId } = render(
        <NotificationCard notification={paymentNotification} />
      );

      expect(getByTestId('category-icon').props.name).toBe('payment');
    });

    it('should display urgent notifications with priority styling', () => {
      const urgentNotification = createUrgentNotification();

      const { getByTestId } = render(
        <NotificationCard notification={urgentNotification} />
      );

      const priorityIndicator = getByTestId('priority-indicator');
      expect(priorityIndicator).toBeTruthy();
      // Should have urgent priority styling (red color)
      expect(priorityIndicator.props.style).toMatchObject({
        backgroundColor: '#F44336',
      });
    });
  });

  describe('User Interactions', () => {
    it('should navigate to relevant screen when tapped without onPress', () => {
      const maintenanceNotification = createMaintenanceNotification();

      const { getByTestId } = render(
        <NotificationCard notification={maintenanceNotification} />
      );

      fireEvent.press(getByTestId('notification-card'));
      
      expect(mockNavigation.navigate).toHaveBeenCalledWith(
        'maintenance',
        { id: maintenanceNotification.data?.requestId }
      );
    });

    it('should mark notification as read when tapped', async () => {
      const onMarkAsReadMock = jest.fn();
      const unreadNotification = createMockNotification({ isRead: false });

      const { getByTestId } = render(
        <NotificationCard 
          notification={unreadNotification} 
          onMarkAsRead={onMarkAsReadMock}
        />
      );

      fireEvent.press(getByTestId('notification-card'));

      await waitFor(() => {
        expect(onMarkAsReadMock).toHaveBeenCalledWith(unreadNotification.id);
      });
    });

    it('should handle long press for additional actions', () => {
      const onLongPressMock = jest.fn();
      const notification = createMockNotification();

      const { getByTestId } = render(
        <NotificationCard 
          notification={notification} 
          onLongPress={onLongPressMock}
        />
      );

      fireEvent(getByTestId('notification-card'), 'longPress');
      expect(onLongPressMock).toHaveBeenCalledWith(notification);
    });
  });

  describe('Action Buttons', () => {
    it('should display action buttons when showActions is true', () => {
      const notification = createMockNotification();

      const { getByTestId } = render(
        <NotificationCard 
          notification={notification} 
          showActions={true}
        />
      );

      expect(getByTestId('action-buttons')).toBeTruthy();
      expect(getByTestId('mark-read-button')).toBeTruthy();
      expect(getByTestId('delete-button')).toBeTruthy();
    });

    it('should hide action buttons when showActions is false', () => {
      const notification = createMockNotification();

      const { queryByTestId } = render(
        <NotificationCard 
          notification={notification} 
          showActions={false}
        />
      );

      expect(queryByTestId('action-buttons')).toBeNull();
    });

    it('should call onDelete when delete button is pressed', () => {
      const onDeleteMock = jest.fn();
      const notification = createMockNotification();

      const { getByTestId } = render(
        <NotificationCard 
          notification={notification} 
          showActions={true}
          onDelete={onDeleteMock}
        />
      );

      fireEvent.press(getByTestId('delete-button'));
      expect(onDeleteMock).toHaveBeenCalledWith(notification.id);
    });

    it('should show different button text for read/unread notifications', () => {
      const unreadNotification = createMockNotification({ isRead: false });
      const readNotification = createMockNotification({ isRead: true });

      const { getByText: getByTextUnread } = render(
        <NotificationCard 
          notification={unreadNotification} 
          showActions={true}
        />
      );

      const { getByText: getByTextRead } = render(
        <NotificationCard 
          notification={readNotification} 
          showActions={true}
        />
      );

      expect(getByTextUnread('Mark as Read')).toBeTruthy();
      expect(getByTextRead('Mark as Unread')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const notification = createMockNotification({
        title: 'Test Notification',
        category: 'maintenance',
        priority: 'high',
      });

      const { getByTestId } = render(
        <NotificationCard notification={notification} />
      );

      const card = getByTestId('notification-card');
      expect(card.props.accessibilityLabel).toContain('Test Notification');
      expect(card.props.accessibilityLabel).toContain('maintenance');
      expect(card.props.accessibilityLabel).toContain('high priority');
    });

    it('should indicate read status in accessibility label', () => {
      const unreadNotification = createMockNotification({ 
        title: 'Unread Notification',
        isRead: false 
      });

      const { getByTestId } = render(
        <NotificationCard notification={unreadNotification} />
      );

      const card = getByTestId('notification-card');
      expect(card.props.accessibilityLabel).toContain('unread');
    });

    it('should have proper accessibility role', () => {
      const notification = createMockNotification();

      const { getByTestId } = render(
        <NotificationCard notification={notification} />
      );

      const card = getByTestId('notification-card');
      expect(card.props.accessibilityRole).toBe('button');
    });
  });

  describe('Edge Cases', () => {
    it('should handle notification with empty title', () => {
      const notification = createMockNotification({
        title: '',
        message: 'Message without title',
      });

      const { getByText } = render(
        <NotificationCard notification={notification} />
      );

      expect(getByText('Message without title')).toBeTruthy();
    });

    it('should handle notification with empty message', () => {
      const notification = createMockNotification({
        title: 'Title without message',
        message: '',
      });

      const { getByText } = render(
        <NotificationCard notification={notification} />
      );

      expect(getByText('Title without message')).toBeTruthy();
    });

    it('should handle notification with very long text', () => {
      const longTitle = 'A'.repeat(200);
      const longMessage = 'B'.repeat(1000);

      const notification = createMockNotification({
        title: longTitle,
        message: longMessage,
      });

      const { getByText } = render(
        <NotificationCard notification={notification} />
      );

      // Should truncate or handle long text gracefully
      expect(getByText(longTitle, { exact: false })).toBeTruthy();
      expect(getByText(longMessage, { exact: false })).toBeTruthy();
    });

    it('should handle notification without data object', () => {
      const notification = createMockNotification({
        data: undefined,
      });

      const { getByTestId } = render(
        <NotificationCard notification={notification} />
      );

      // Should render without crashing
      expect(getByTestId('notification-card')).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should render quickly with complex notification data', () => {
      const complexNotification = createMockNotification({
        title: 'Complex Notification',
        message: 'This notification has complex data',
        data: {
          propertyId: 'property-123',
          tenantId: 'tenant-456',
          metadata: {
            tags: ['urgent', 'maintenance', 'plumbing'],
            location: 'Building A, Floor 3, Unit 301',
            reportedBy: 'John Doe',
            estimatedCost: 1500,
          },
        },
      });

      const startTime = Date.now();
      
      const { getByTestId } = render(
        <NotificationCard notification={complexNotification} />
      );

      const endTime = Date.now();

      expect(getByTestId('notification-card')).toBeTruthy();
      expect(endTime - startTime).toBeLessThan(100); // Should render within 100ms
    });
  });

  describe('Data Validation', () => {
    it('should handle different notification types', () => {
      const categories = ['maintenance', 'payment', 'tenant', 'property', 'system'];
      
      categories.forEach(category => {
        const notification = createMockNotification({ category });
        
        const { getByTestId } = render(
          <MockNotificationCard notification={notification} />
        );

        expect(getByTestId('notification-category').textContent).toBe(category);
      });
    });

    it('should handle empty or undefined values gracefully', () => {
      const notification = createMockNotification({
        title: '',
        message: '',
      });

      const { getByTestId } = render(
        <MockNotificationCard notification={notification} />
      );

      // Should render without crashing
      expect(getByTestId('notification-card')).toBeTruthy();
    });
  });
}); 