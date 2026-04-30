import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Fan } from "lucide-react-native";
import { DeviceStatus } from "./PowerButton";

interface StatusCardProps {
  status: DeviceStatus;
}

const StatusCard: React.FC<StatusCardProps> = ({ status }) => {
    const isOn = status === "ON";

    return (
        <View style={styles.card}>
            <View style={[styles.iconContainer, isOn ? styles.iconOn : styles.iconOff]}>
                <Fan size={32} color={isOn ? "#22C55E" : "#94A3B8"} />
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.label}>STATUS ATUAL</Text>
                <Text style={styles.statusValue}>{status}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 20,
    borderRadius: 24,
    width: '90%',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconOn: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  iconOff: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statusValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
});

export default StatusCard;