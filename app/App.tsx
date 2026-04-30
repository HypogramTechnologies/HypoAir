import React, { useEffect, useState } from "react";
import { StyleSheet, View, SafeAreaView } from "react-native";
import PowerButton, { DeviceStatus } from "./src/components/PowerButton";
import MqttService, { TOPICS } from "./src/services/MqttService";
import StatusCard from "./src/components/StatusCard";

export default function App() {
  const [status, setStatus] = useState<DeviceStatus>("OFF");

  useEffect(() => {
    MqttService.connect((topic, message) => {
      if (topic === TOPICS.STATE) {
        console.log("Mudança de estado detectada via Broker:", message);
        setStatus(message as DeviceStatus);
      }

      if (topic === TOPICS.SENSORS) {
        console.log("Dados dos sensores:", message);
      }
    });

    return () => MqttService.disconnect();
  }, []);

  const toggleStatus = () => {
    const nextStatus = status === "ON" ? "OFF" : "ON";
    MqttService.publishCommand(nextStatus);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <StatusCard status={status} />
        <PowerButton status={status} onPress={toggleStatus} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
