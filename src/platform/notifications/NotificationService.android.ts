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

    // Android-specific: Set notification channel
    // TODO: Configure FCM for Android push notifications
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      await Notifications.setNotificationChannelAsync('task-reminders', {
        name: 'Task Reminders',
        description: 'Notifications for scheduled task reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      });
    }

    this.isInitialized = true;
    console.log('[NotificationService Android] Initialized');
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
        console.log('[NotificationService Android] Permission denied');
        return false;
      }

      console.log('[NotificationService Android] Permission granted');
      return true;
    } catch (error) {
      console.error('[NotificationService Android] Permission error:', error);
      return false;
    }
  }

  async getExpoPushToken(): Promise<string | null> {
    try {
      // TODO: Configure FCM for production Android
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with actual EAS project ID
      });
      console.log('[NotificationService Android] Push token:', token.data);
      return token.data;
    } catch (error) {
      console.error('[NotificationService Android] Get token error:', error);
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
          channelId: 'task-reminders',
        },
      });
      console.log(`[NotificationService Android] Scheduled notification: ${id}`);
      return id;
    } catch (error) {
      console.error('[NotificationService Android] Schedule error:', error);
      throw error;
    }
  }

  async cancelNotification(id: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
      console.log(`[NotificationService Android] Cancelled notification: ${id}`);
    } catch (error) {
      console.error('[NotificationService Android] Cancel error:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('[NotificationService Android] Cancelled all notifications');
    } catch (error) {
      console.error('[NotificationService Android] Cancel all error:', error);
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
        trigger: null,
      });
      console.log('[NotificationService Android] Sent local notification');
    } catch (error) {
      console.error('[NotificationService Android] Send error:', error);
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
