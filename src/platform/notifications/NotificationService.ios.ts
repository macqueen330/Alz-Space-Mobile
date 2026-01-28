import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface NotificationContent {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface ScheduledNotification {
  id: string;
  content: NotificationContent;
  trigger: {
    hour: number;
    minute: number;
    repeats?: boolean;
  };
}

class NotificationServiceClass {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    this.isInitialized = true;
    console.log('[NotificationService iOS] Initialized');
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[NotificationService iOS] Permission denied');
        return false;
      }

      console.log('[NotificationService iOS] Permission granted');
      return true;
    } catch (error) {
      console.error('[NotificationService iOS] Permission error:', error);
      return false;
    }
  }

  async getExpoPushToken(): Promise<string | null> {
    try {
      // For iOS, need to get the APNs token first
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with actual EAS project ID
      });
      console.log('[NotificationService iOS] Push token:', token.data);
      return token.data;
    } catch (error) {
      console.error('[NotificationService iOS] Get token error:', error);
      return null;
    }
  }

  async scheduleNotification(notification: ScheduledNotification): Promise<string> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.content.title,
          body: notification.content.body,
          data: notification.content.data,
          sound: true,
        },
        trigger: {
          hour: notification.trigger.hour,
          minute: notification.trigger.minute,
          repeats: notification.trigger.repeats ?? false,
        },
      });
      console.log(`[NotificationService iOS] Scheduled notification: ${id}`);
      return id;
    } catch (error) {
      console.error('[NotificationService iOS] Schedule error:', error);
      throw error;
    }
  }

  async cancelNotification(id: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
      console.log(`[NotificationService iOS] Cancelled notification: ${id}`);
    } catch (error) {
      console.error('[NotificationService iOS] Cancel error:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('[NotificationService iOS] Cancelled all notifications');
    } catch (error) {
      console.error('[NotificationService iOS] Cancel all error:', error);
    }
  }

  async sendLocalNotification(content: NotificationContent): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          data: content.data,
          sound: true,
        },
        trigger: null, // Immediate
      });
      console.log('[NotificationService iOS] Sent local notification');
    } catch (error) {
      console.error('[NotificationService iOS] Send error:', error);
    }
  }

  onNotificationReceived(callback: (notification: Notifications.Notification) => void): () => void {
    const subscription = Notifications.addNotificationReceivedListener(callback);
    return () => subscription.remove();
  }

  onNotificationResponse(callback: (response: Notifications.NotificationResponse) => void): () => void {
    const subscription = Notifications.addNotificationResponseReceivedListener(callback);
    return () => subscription.remove();
  }
}

export const NotificationService = new NotificationServiceClass();
