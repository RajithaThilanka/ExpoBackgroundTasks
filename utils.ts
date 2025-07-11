import AsyncStorage from "@react-native-async-storage/async-storage";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";

const BACKGROUND_TASK_IDENTIFIER = "fetch-quote-task";
const MINIMUM_INTERVAL = 15;
const QUOTES_HISTORY_KEY = "@quotes_history";
const MAX_HISTORY_ITEMS = 10;

export type Quote = {
  q: string;
  a: string;
  c: string;
  h: string;
  timestamp: number;
};

type QuoteHistory = Quote[];

export const initializeBackgroundTask = async (
  innerAppMountedPromise: Promise<void>
) => {
  //Task Define
  TaskManager.defineTask(BACKGROUND_TASK_IDENTIFIER, async () => {
    console.log("Background task started");

    // delay starting the task
    await innerAppMountedPromise;

    // fetch a new quote
    try {
      // Fetch random quote from ZenQuotes API
      const response = await fetch("https://zenquotes.io/api/random");
      const quotes: Quote[] = await response.json();

      if (quotes && quotes.length > 0) {
        await storeQuoteHistory(quotes[0]);
      }
    } catch (e) {
      console.log("Error fetching quote", e);
    }
    console.log("Background task done");
  });

  //Register The Task
  if (!(await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_IDENTIFIER))) {
    await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_IDENTIFIER, {
      minimumInterval: MINIMUM_INTERVAL,
    });
  }
};

async function storeQuoteHistory(quote: Quote) {
  try {
    const historyJson = await AsyncStorage.getItem(QUOTES_HISTORY_KEY);
    const history: QuoteHistory = historyJson ? JSON.parse(historyJson) : [];

    const newQuote = {
      ...quote,
      timestamp: Date.now(),
    };

    const updatedHistory = [newQuote, ...history].slice(0, MAX_HISTORY_ITEMS);

    await AsyncStorage.setItem(
      QUOTES_HISTORY_KEY,
      JSON.stringify(updatedHistory)
    );
  } catch (e) {
    console.log(e);
  }
}

// Function to get quote history
export const getQuoteHistory = async (): Promise<QuoteHistory | null> => {
  try {
    const historyJson = await AsyncStorage.getItem(QUOTES_HISTORY_KEY);
    return historyJson ? JSON.parse(historyJson) : null;
  } catch (error) {
    console.error("Error getting quote history:", error);
    return null;
  }
};
