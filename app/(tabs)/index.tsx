import { getQuoteHistory, initializeBackgroundTask, Quote } from "@/utils";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import { useEffect, useRef, useState } from "react";
import {
  AppState,
  AppStateStatus,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

// Debugging
TaskManager.getRegisteredTasksAsync().then((tasks) => {
  console.log(tasks);
});

let resolver: (() => void) | null;

const promise = new Promise<void>((resolve) => {
  resolver = resolve;
});

initializeBackgroundTask(promise);

export default function Index() {
  const [quotehistory, setQuoteHistory] = useState<Quote[]>([]);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (resolver) {
      resolver();
    }

    loadQuoteHistory();

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          console.log("App has come from the foreground!");
          loadQuoteHistory();
        }

        appState.current = nextAppState;
      }
    );

    // ✅ Clean up listener on unmount
    return () => {
      appStateSubscription.remove();
    };
  }, []);

  const loadQuoteHistory = async () => {
    const history = await getQuoteHistory();
    if (history) {
      setQuoteHistory(history);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quotes ({quotehistory.length})</Text>

      <ScrollView style={styles.scrollView}>
        {quotehistory?.map((quote, index) => (
          <View key={index} style={styles.quoteItem}>
            <Text style={styles.quoteText}>{quote?.q}</Text>
            <Text style={styles.authorText}>- {quote?.a}</Text>
          </View>
        ))}
      </ScrollView>

      <Button
        title="Trigger task"
        onPress={async () => {
          await BackgroundTask.triggerTaskWorkerForTestingAsync();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
    marginBottom: 20,
  },
  quoteItem: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  quoteText: {
    fontSize: 16,
    marginBottom: 8,
    fontStyle: "italic",
  },
  authorText: {
    fontSize: 14,
    color: "#666",
  },
});
