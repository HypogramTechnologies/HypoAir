import mqtt, { MqttClient } from "mqtt";
import { DeviceStatus } from "../components/PowerButton";

const BROKER_URL = 'wss://9047749c8e904e73bc5ba2d8fce67b59.s1.eu.hivemq.cloud:8884/mqtt';
const USERNAME = "Hypogram";
const PASSWORD = "MinhaSenha123!";

export const TOPICS = {
  COMMAND: "hypoair/fan/command",
  STATE: "hypoair/fan/state",
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
      protocol: 'wss',
      path: '/mqtt'
    });

    this.client.on("connect", () => {
      console.log("HypoAir conectado ao Broker");
      this.client?.subscribe([TOPICS.STATE, TOPICS.SENSORS]);
      if (onConnect) onConnect();
    });

    this.client.on("message", (topic, payload) => {
      onMessage(topic, payload.toString());
    });

    this.client.on("error", (err) => {
      console.error("Erro na conexão MQTT:", err);
    });
  }

  publishCommand(status: DeviceStatus) {
    if (this.client?.connected) {
      this.client.publish(TOPICS.COMMAND, status, { qos: 1 });
      console.log(`Comando publicado: ${status}`);
    } else {
      console.warn("Não conectado ao Broker MQTT. Comando não enviado.");
    }
  }

  disconnect() {
    this.client?.end();
    console.log("Desconectado do Broker MQTT");
  }
}

export default new MqttService();
