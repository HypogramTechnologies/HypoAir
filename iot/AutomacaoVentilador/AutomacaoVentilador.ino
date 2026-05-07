#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <WiFi.h>

// ================= Pinos e Sensores =================
const int pinoRele = 22;
const int pinoPIR = 34;
const int pinoDHT = 27;

#define DHTTYPE DHT11
DHT dht(pinoDHT, DHTTYPE);

// ================= Configurações WiFi e MQTT =================
// Substitua pelas suas credenciais reais
const char* ssid = "Redmi_POCO_X6";
const char* password = "Drx12345";

const char* mqtt_server = "9047749c8e904e73bc5ba2d8fce67b59.s1.eu.hivemq.cloud"; 
const int mqtt_port = 8883; // Porta para placas/IoT (MQTT sobre TLS)

// Você precisará do usuário e senha que criou no painel do HiveMQ Cloud
const char* mqtt_user = "Hypogram"; 
const char* mqtt_pass = "MinhaSenha123!";

const char* topico_comando = "hypoair/fan/command"; 
const char* topico_status = "hypoair/fan/state";
const char* topico_sensores = "hypoair/sensors";

WiFiClientSecure espClient;
PubSubClient client(espClient);
// ================= CONFIGURAÇÕES =================

bool sistemaLigado = true;
bool ventiladorLigado = false;

bool movimentoDetectado = false;
bool ultimoEstadoPIR = false;

float temperaturaAtual = 0.0;

// Temperaturas inteligentes
const float TEMP_LIGAR = 25.0;
const float TEMP_DESLIGAR = 24.0;

// Timeout sem presença
const unsigned long TEMPO_AUSENCIA = 5000;//300000; // 5 min

// Controle de tempo
unsigned long tempoAnteriorDHT = 0;
unsigned long ultimoMovimento = 0;
unsigned long ultimoEnvioMQTT = 0;

const long intervaloDHT = 10000;
const long intervaloMQTT = 5000;

// ================= VENTILADOR =================

void ligarVentilador() {

  // Relé NC usando impedância
  pinMode(pinoRele, INPUT);

  if (!ventiladorLigado) {

    ventiladorLigado = true;

    Serial.println("================================");
    Serial.println("VENTILADOR LIGADO");
    Serial.println("================================");

    client.publish(topico_status, "ON");
  }
}

void desligarVentilador() {

  pinMode(pinoRele, OUTPUT);
  digitalWrite(pinoRele, LOW);

  if (ventiladorLigado) {

    ventiladorLigado = false;

    Serial.println("================================");
    Serial.println("VENTILADOR DESLIGADO");
    Serial.println("================================");

    client.publish(topico_status, "OFF");
  }
}

// ================= CALLBACK MQTT =================

void callback(char* topic, byte* payload, unsigned int length) {

  String mensagem = "";

  for (int i = 0; i < length; i++) {
    mensagem += (char)payload[i];
  }

  mensagem.trim();

  Serial.println("\n========== MQTT ==========");
  Serial.print("Mensagem recebida: ");
  Serial.println(mensagem);
  Serial.println("==========================");

  if (mensagem == "ON") {

    sistemaLigado = true;

    Serial.println("Sistema inteligente ATIVADO");
  }

  else if (mensagem == "OFF") {

    sistemaLigado = false;

    desligarVentilador();

    Serial.println("Sistema DESLIGADO");
  }
}

// ================= WIFI =================

void setupWiFi() {

  Serial.print("Conectando WiFi");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi conectado!");
}

// ================= MQTT =================

void reconnectMQTT() {

  while (!client.connected()) {

    Serial.print("Conectando MQTT...");

    String clientId = "ESP32-HypoAir-";
    clientId += String(random(1000));

    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {

      Serial.println(" conectado!");

      client.subscribe(topico_comando);
    }

    else {

      Serial.print(" erro=");
      Serial.println(client.state());

      delay(5000);
    }
  }
}

// ================= SETUP =================

void setup() {

  Serial.begin(115200);

  Serial.println("\n================================");
  Serial.println("INICIANDO HYPOAIR");
  Serial.println("================================");

  pinMode(pinoPIR, INPUT);

  desligarVentilador();

  dht.begin();

  setupWiFi();

  espClient.setInsecure();

  client.setServer(mqtt_server, mqtt_port);

  client.setCallback(callback);
}

// ================= LOOP =================

void loop() {

  if (!client.connected()) {
    reconnectMQTT();
  }

  client.loop();

  unsigned long tempoAtual = millis();

// ================= SENSOR PIR =================

  movimentoDetectado = digitalRead(pinoPIR);

  // Detectou presença
  if (movimentoDetectado) {

    // Atualiza último movimento
    ultimoMovimento = millis();

    // Loga apenas uma vez
    if (!ultimoEstadoPIR) {

      Serial.println("\n[PRESENÇA] Movimento detectado");

      ultimoEstadoPIR = true;
    }
  }

  // Reset visual somente depois de ausência longa
  if (!movimentoDetectado && ultimoEstadoPIR) {

    bool ausenciaLonga =
      (millis() - ultimoMovimento) > TEMPO_AUSENCIA;

    if (ausenciaLonga) {

      Serial.println("\n[PRESENÇA] Ambiente vazio");

      ultimoEstadoPIR = false;
    }
  }
  // ================= DHT =================

  if (tempoAtual - tempoAnteriorDHT >= intervaloDHT) {

    tempoAnteriorDHT = tempoAtual;

    float t = dht.readTemperature();
    Serial.print(t);

    if (!isnan(t)) {

      temperaturaAtual = t;

      Serial.print("[DHT] Temperatura: ");
      Serial.print(temperaturaAtual);
      Serial.println(" C");
    }

    else {

      Serial.println("[DHT] Falha leitura");
    }
  }

  // ================= PUBLICAÇÃO MQTT =================

  if (tempoAtual - ultimoEnvioMQTT >= intervaloMQTT) {

    ultimoEnvioMQTT = tempoAtual;

    String json = "{";
    json += "\"temperatura\":";
    json += String(temperaturaAtual);
    json += ",";

    json += "\"presenca\":";
    json += movimentoDetectado ? "true" : "false";
    json += ",";

    json += "\"ventilador\":";
    json += ventiladorLigado ? "true" : "false";
    json += "}";

    Serial.print(json.c_str());
    client.publish(topico_sensores, json.c_str());

    Serial.println("[MQTT] Sensores publicados");
  }

  // ================= SISTEMA DESLIGADO =================

  if (!sistemaLigado) {

    desligarVentilador();

    return;
  }

  // ================= REGRAS INTELIGENTES =================

  bool ambienteQuente =
    temperaturaAtual >= TEMP_LIGAR;

  bool ambienteFrio =
    temperaturaAtual <= TEMP_DESLIGAR;

  bool ausenciaLonga =
    (millis() - ultimoMovimento) > TEMPO_AUSENCIA;

  // Liga somente:
  // quente + presença

  if (ambienteQuente && movimentoDetectado) {

    ligarVentilador();
  }

  // Desliga:
  // frio OU ausência longa

  if (ambienteFrio || ausenciaLonga) {

    desligarVentilador();
  }
}