import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const STORAGE_KEY = "jansathi_notification_ids";

interface Reminder {
  _id: string;
  medicineName: string;
  dosage: string;
  times: string[];
  startDate: string;
  endDate: string | null;
  isEveryday: boolean;
  notifyApp: boolean;
  isActive: boolean;
}

// ── Save scheduled notification IDs to AsyncStorage ──────────────
const saveNotificationIds = async (ids: Record<string, string[]>) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
};

// ── Load scheduled notification IDs from AsyncStorage ────────────
const loadNotificationIds = async (): Promise<Record<string, string[]>> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

// ── Schedule notifications for a single reminder ──────────────────
const scheduleReminderNotifications = async (reminder: Reminder): Promise<string[]> => {
  if (!reminder.notifyApp || !reminder.isActive) return [];

  const ids: string[] = [];
  const now = new Date();

  // IST offset
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  const todayIST = new Date(now.getTime() + IST_OFFSET);

  const startDate = new Date(reminder.startDate);
  const endDate = reminder.endDate ? new Date(reminder.endDate) : null;

  for (const time of reminder.times) {
    const [hour, minute] = time.split(":").map(Number);

    if (reminder.isEveryday) {
      // Schedule daily repeating notification
      // Find next occurrence of this time
      const triggerDate = new Date();
      triggerDate.setHours(hour, minute, 0, 0);

      // If time has already passed today, start from tomorrow
      if (triggerDate <= now) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      try {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "💊 Medicine Reminder",
            body: `Time to take ${reminder.medicineName} - ${reminder.dosage}`,
            data: { reminderId: reminder._id },
          },
          trigger: {
            hour,
            minute,
            repeats: true,
          },
        });
        ids.push(id);
      } catch (e) {
        console.log("Failed to schedule notification:", e);
      }
    } else {
      // Schedule for date range — schedule next 30 occurrences max
      let current = new Date(startDate);
      current.setHours(hour, minute, 0, 0);
      let count = 0;

      while (count < 30) {
        if (endDate && current > endDate) break;
        if (current > now) {
          try {
            const id = await Notifications.scheduleNotificationAsync({
              content: {
                title: "💊 Medicine Reminder",
                body: `Time to take ${reminder.medicineName} - ${reminder.dosage}`,
                data: { reminderId: reminder._id },
              },
              trigger: { date: new Date(current) },
            });
            ids.push(id);
            count++;
          } catch (e) {
            console.log("Failed to schedule:", e);
          }
        }
        current.setDate(current.getDate() + 1);
      }
    }
  }

  return ids;
};

// ── Main: cancel all old → schedule all fresh ────────────────────
export const scheduleAllReminders = async (reminders: Reminder[]) => {
  if (Platform.OS === "web") return;

  try {
    // Cancel all existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Clear stored IDs
    await AsyncStorage.removeItem(STORAGE_KEY);

    const allIds: Record<string, string[]> = {};

    for (const reminder of reminders) {
      if (!reminder.notifyApp || !reminder.isActive) continue;
      const ids = await scheduleReminderNotifications(reminder);
      if (ids.length > 0) {
        allIds[reminder._id] = ids;
      }
    }

    await saveNotificationIds(allIds);
    console.log(`✅ Scheduled notifications for ${Object.keys(allIds).length} reminder(s)`);
  } catch (e) {
    console.log("scheduleAllReminders error:", e);
  }
};

// ── Cancel notifications for a single deleted/edited reminder ─────
export const cancelReminderNotifications = async (reminderId: string) => {
  if (Platform.OS === "web") return;
  try {
    const allIds = await loadNotificationIds();
    const ids = allIds[reminderId] || [];
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    delete allIds[reminderId];
    await saveNotificationIds(allIds);
  } catch (e) {
    console.log("cancelReminderNotifications error:", e);
  }
};