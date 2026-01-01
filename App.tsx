import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import { NotesProvider } from "./src/context/NotesContext";
import { DashboardScreen, TimelineScreen, NoteDetailScreen } from "./src/features/notes";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#121212",
          borderTopColor: "#222",
        },
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#9aa0a6",
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Timeline" component={TimelineScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NotesProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: "#121212" },
            headerTintColor: "white",
            contentStyle: { backgroundColor: "#121212" },
          }}
        >
          <Stack.Screen name="Home" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </NotesProvider>
  );
}
