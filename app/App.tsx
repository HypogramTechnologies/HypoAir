import React, { useEffect, useState } from "react";
import { StyleSheet, View, SafeAreaView, ScrollView } from "react-native";
import { Thermometer, Activity } from "lucide-react-native";
import PowerButton, { DeviceStatus } from "./src/components/PowerButton";
import MqttService, { TOPICS } from "./src/services/MqttService";
import StatusCard from "./src/components/StatusCard";
import SensorCard from "./src/components/SensorCard";

export default function App() {
  const [status, setStatus] = useState<DeviceStatus>("OFF");
  const [temperature, setTemperature] = useState<string>("---°C");
  const [presenceSensorActive, setPresenceSensorActive] = useState<boolean>(true);
  const [temperatureSensorActive, setTemperatureSensorActive] = useState<boolean>(true);
  const [presenceDetected, setPresenceDetected] = useState<boolean>(false);

  useEffect(() => {
    MqttService.connect((topic, message) => {
      switch (topic) {
        case TOPICS.FAN_STATE:
          console.log("Estado do ventilador atualizado:", message);
          setStatus(message as DeviceStatus);
          break;

        case TOPICS.TEMP_CURRENT:
          console.log("Nova leitura de temperatura:", message);
          setTemperature(`${message}°C`);
          break;

        case TOPICS.TOGGLE_PRESENCE:
          console.log("Configuração do sensor de presença recebida:", message);
          setPresenceSensorActive(message === "ON");
          break;

        case TOPICS.TOGGLE_TEMPERATURE:
          console.log("Configuração do sensor de temperatura recebida:", message);
          setTemperatureSensorActive(message === "ON");
          break;

        case TOPICS.SENSORS:
          const payload = JSON.parse(message);
          console.log("Dados dos sensores recebidos:", payload);
          setPresenceDetected(payload.presenca === "true");
          break;

        default:
          break;
      }
    });

    return () => MqttService.disconnect();
    
  }, []);

  const handleToggleFan = () => {
    const nextStatus = status === "ON" ? "OFF" : "ON";
    MqttService.publishFanCommand(nextStatus);
  };

  const handleTogglePresence = (newValue: boolean) => {
    MqttService.publishPresenceToggle(newValue);
  };

  const handleToggleTemperature = (newValue: boolean) => {
    MqttService.publishTemperatureToggle(newValue);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        <StatusCard status={status} />
        
        <View style={styles.buttonContainer}>
          <PowerButton status={status} onPress={handleToggleFan} />
        </View>

        <View style={styles.sensorsContainer}>
          
          <SensorCard 
            icon={Thermometer} 
            title="Temperatura" 
            value={temperature} 
          />

          <SensorCard 
            icon={Activity} 
            title="Sensor de presença" 
            subtitle={presenceSensorActive ? presenceDetected ? "Presença detectada" : "Nenhuma presença detectada" : "Inativo"}
            hasSwitch
            switchValue={presenceSensorActive}
            onSwitchChange={handleTogglePresence}
          />

          <SensorCard 
            icon={Thermometer} 
            title="Sensor de temperatura" 
            subtitle={temperatureSensorActive ? "Temperatura preestabelecida: 21°C" : "Inativo"}
            hasSwitch
            switchValue={temperatureSensorActive}
            onSwitchChange={handleToggleTemperature}
          />

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A", 
  },
  content: {
    alignItems: "center",
    paddingVertical: 40,
  },
  buttonContainer: {
    marginVertical: 30,
  },
  sensorsContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
});