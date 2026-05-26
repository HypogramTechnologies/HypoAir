import mqtt, { MqttClient } from "mqtt";
import { DeviceStatus } from "../components/PowerButton";

const BROKER_URL =
  "wss://9047749c8e904e73bc5ba2d8fce67b59.s1.eu.hivemq.cloud:8884/mqtt";
const USERNAME = "Hypogram";
const PASSWORD = "MinhaSenha123!";

// Centralização dos tópicos do sistema
export const TOPICS = {
  FAN_COMMAND: "hypoair/fan/command",
  FAN_STATE: "hypoair/fan/state",
  TEMP_CURRENT: "hypoair/temperature/current",
  TOGGLE_PRESENCE: "hypoair/sensor/presence/toggle",
  TOGGLE_TEMPERATURE: "hypoair/sensor/temperature/toggle",
  SENSORS: "hypoair/sensors",
};

class MqttService {
  private client: MqttClient | null = null;

  connect(
    onMessage: (topic: string, message: string) => void,
    onConnect?: () => void,
  ) {
    this.client = mqtt.connect(BROKER_URL, {
      username: USERNAME,
      password: PASSWORD,
      protocol: "wss",
      path: "/mqtt",
    });

    this.client.on("connect", () => {
      console.log("HypoAir conectado ao Broker!");

      // Inscreve o App em todos os tópicos
      this.client?.subscribe([
        TOPICS.FAN_STATE,
        TOPICS.TEMP_CURRENT,
        TOPICS.TOGGLE_PRESENCE,
        TOPICS.TOGGLE_TEMPERATURE,
        TOPICS.SENSORS,
      ]);

      if (onConnect) onConnect();
    });

    this.client.on("message", (topic, payload) => {
      onMessage(topic, payload.toString());
    });

    this.client.on("error", (err) => {
      console.error("Erro MQTT:", err);
    });
  }

  // Publica o comando do ventilador (ON/OFF)
  publishFanCommand(status: DeviceStatus) {
    if (this.client?.connected) {
      this.client.publish(TOPICS.FAN_COMMAND, status, { qos: 1 });
    }
  }

  // Publica a ativação/desativação do sensor de presença
  publishPresenceToggle(active: boolean) {
    if (this.client?.connected) {
      const payload = active ? "ON" : "OFF";
      this.client.publish(TOPICS.TOGGLE_PRESENCE, payload, {
        qos: 1,
        retain: true,
      });
    }
  }

  // Publica a ativação/desativação do sensor de temperatura
  publishTemperatureToggle(active: boolean) {
    if (this.client?.connected) {
      const payload = active ? "ON" : "OFF";
      this.client.publish(TOPICS.TOGGLE_TEMPERATURE, payload, {
        qos: 1,
        retain: true,
      });
    }
  }

  disconnect() {
    this.client?.end();
  }
}

export default new MqttService();
