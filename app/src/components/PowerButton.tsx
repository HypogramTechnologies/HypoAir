import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { Power } from "lucide-react-native";

export type DeviceStatus = "ON" | "OFF";

interface PowerButtonProps {
  status: DeviceStatus;
  onPress: () => void;
}

const PowerButton: React.FC<PowerButtonProps> = ({ status, onPress }) => {
  const isOn = status === "ON";

  return (
    <View style={styles.container}>
      <View
        style={
          [
            styles.outerCircle,
            isOn ? styles.outerCircleOn : styles.outerCircleOff,
          ] as ViewStyle[]
        }
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          style={
            [
              styles.button,
              isOn ? styles.buttonOn : styles.buttonOff,
            ] as ViewStyle[]
          }
        >
          <Power size={24} color={isOn ? "#fff" : "#333"} />
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>
        {isOn ? "TOQUE PARA DESLIGAR" : "TOQUE PARA LIGAR"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  outerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  outerCircleOn: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    shadowColor: "#22C55E",
    elevation: 15,
  },
  outerCircleOff: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    shadowColor: "#000",
    elevation: 5,
  },
  button: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
  },
  buttonOn: {
    backgroundColor: "#22C55E",
    borderColor: "#4ADE80",
  },
  buttonOff: {
    backgroundColor: "#334155",
    borderColor: "#475569",
  },
  label: {
    marginTop: 25,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1.2,
  },
});

export default PowerButton;
