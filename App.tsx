import "react-native-gesture-handler";

import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import DashboardScreen from "./screens/DashboardScreen";
import TimelineScreen from "./screens/TimelineScreen";
import { StatusBar } from "expo-status-bar";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />

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
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: "Dashboard" }}
        />
        <Tab.Screen
          name="Timeline"
          component={TimelineScreen}
          options={{ title: "Timeline" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
