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
const char* ssid = "A36";
const char* password = "eksq7069";

const char* mqtt_server = "9047749c8e904e73bc5ba2d8fce67b59.s1.eu.hivemq.cloud"; 
const int mqtt_port = 8883; 

const char* mqtt_user = "Hypogram"; 
const char* mqtt_pass = "MinhaSenha123!";

const char* topico_comando = "hypoair/fan/command"; 
const char* topico_status = "hypoair/fan/state";
const char* topico_temp_current = "hypoair/temperature/current"; 
const char* topico_toggle_presence = "hypoair/sensor/presence/toggle";   
const char* topico_toggle_temperature = "hypoair/sensor/temperature/toggle"; 
const char* topico_sensores = "hypoair/sensors";

WiFiClientSecure espClient;
PubSubClient client(espClient);

// ================= CONFIGURAÇÕES =================
bool sistemaLigado = false; // Começa em falso esperando comando do botão central
bool ventiladorLigado = false;

bool sensorPresencaAtivo = true;
bool sensorTempAtivo = true;

bool movimentoDetectado = false;
bool ultimoEstadoPIR = false;
float temperaturaAtual = 0.0;

const float TEMP_LIGAR = 21.0;
const float TEMP_DESLIGAR = 20.0;
const unsigned long TEMPO_AUSENCIA = 5000;

unsigned long tempoAnteriorDHT = 0;
unsigned long ultimoMovimento = 0;
unsigned long ultimoEnvioMQTT = 0;

const long intervaloDHT = 10000;
const long intervaloMQTT = 5000;

// ================= VENTILADOR =================
void ligarVentilador() {
  pinMode(pinoRele, INPUT);
  if (!ventiladorLigado) {
    ventiladorLigado = true;
    Serial.println("\n[STATUS] VENTILADOR LIGADO");
    client.publish(topico_status, "ON");
  }
}

void desligarVentilador() {
  pinMode(pinoRele, OUTPUT);
  digitalWrite(pinoRele, LOW);
  if (ventiladorLigado) {
    ventiladorLigado = false;
    Serial.println("\n[STATUS] VENTILADOR DESLIGADO");
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

  String strTopic = String(topic);

  // 1. Comando Geral do Botão de Power
  if (strTopic == topico_comando) {
    if (mensagem == "ON") {
      sistemaLigado = true;
      // Se os sensores estiverem desativados, liga na hora. Se estiverem ativos, espera a leitura deles.
      if (!sensorPresencaAtivo && !sensorTempAtivo) {
        ligarVentilador();
      }
    } else if (mensagem == "OFF") {
      sistemaLigado = false;
      desligarVentilador(); // Força o desligamento imediato ao clicar em OFF
    }
  }
  // 2. Escuta se o App mandou Ativar/Desativar Sensor de Presença
  else if (strTopic == topico_toggle_presence) {
    sensorPresencaAtivo = (mensagem == "ON");
    Serial.printf("[CONFIG] Sensor Presença: %s\n", sensorPresencaAtivo ? "ATIVADO" : "DESATIVADO");
  }
  // 3. Escuta se o App mandou Ativar/Desativar Sensor de Temperatura
  else if (strTopic == topico_toggle_temperature) {
    sensorTempAtivo = (mensagem == "ON");
    Serial.printf("[CONFIG] Sensor Temperatura: %s\n", sensorTempAtivo ? "ATIVADO" : "DESATIVADO");
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
      // Subscreve em todos os tópicos de controle vindo do App
      client.subscribe(topico_comando);
      client.subscribe(topico_toggle_presence);
      client.subscribe(topico_toggle_temperature);
    } else {
      Serial.print(" erro=");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
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

  if (movimentoDetectado) {
    ultimoMovimento = millis();
    if (!ultimoEstadoPIR) {
      Serial.println("\n[PRESENÇA] Movimento detectado");
      ultimoEstadoPIR = true;
    }
  }

  if (!movimentoDetectado && ultimoEstadoPIR) {
    if ((millis() - ultimoMovimento) > TEMPO_AUSENCIA) {
      Serial.println("\n[PRESENÇA] Ambiente vazio");
      ultimoEstadoPIR = false;
    }
  }

  // ================= DHT =================
  if (tempoAtual - tempoAnteriorDHT >= intervaloDHT) {
    tempoAnteriorDHT = tempoAtual;
    float t = dht.readTemperature();

    if (!isnan(t)) {
      temperaturaAtual = t;
      Serial.printf("[DHT] Temperatura: %.1f C\n", temperaturaAtual);
      
      // Envia a temperatura isolada para o Card de Temperatura do App
      client.publish(topico_temp_current, String(temperaturaAtual, 1).c_str());
    } else {
      Serial.println("[DHT] Falha leitura");
    }
  }

  // ================= PUBLICAÇÃO METADADOS (TELEMETRIA) =================
  if (tempoAtual - ultimoEnvioMQTT >= intervaloMQTT) {
    ultimoEnvioMQTT = tempoAtual;

    String json = "{";
    json += "\"temperatura\":" + String(temperaturaAtual, 1) + ",";
    json += "\"presenca\":" + String(movimentoDetectado ? "true" : "false") + ",";
    json += "\"ventilador\":" + String(ventiladorLigado ? "true" : "false");
    json += "}";

    client.publish(topico_sensores, json.c_str());
  }

  // ================= REGRAS INTELIGENTES =================
  
  // CASO 1: Ambos os sensores estão DESATIVADOS no App.
  // O controle fica 100% manual pelo botão central do aplicativo.
  if (!sensorPresencaAtivo && !sensorTempAtivo) {
    if (sistemaLigado) {
      ligarVentilador();
    } else {
      desligarVentilador();
    }
    return; // Para o loop aqui
  }

  // CASO 2: Pelo menos um sensor está ATIVO no App.
  // A automação toma o controle para ligar e desligar baseada nos sensores ativos.
  
  // Condições lógicas dos sensores (se o sensor estiver desativado, a flag vira true para não travar o outro)
  bool ambienteQuente = !sensorTempAtivo || (temperaturaAtual >= TEMP_LIGAR);
  bool presencaConfirmada = !sensorPresencaAtivo || movimentoDetectado;

  bool ambienteFrio = sensorTempAtivo && (temperaturaAtual <= TEMP_DESLIGAR);
  bool ausenciaLonga = sensorPresencaAtivo && ((millis() - ultimoMovimento) > TEMPO_AUSENCIA);

  // 1. Condição para LIGAR: Se os sensores ativos disserem que precisa ligar, LIGA!
  if (ambienteQuente && presencaConfirmada) {
    ligarVentilador();
  }

  // 2. Condição para DESLIGAR: Se os critérios de corte dos sensores ativos forem atendidos, desliga.
  if (ambienteFrio || ausenciaLonga) {
    desligarVentilador();
  }
}