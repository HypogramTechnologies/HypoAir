import React from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { LucideIcon } from "lucide-react-native";

interface SensorCardProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  value?: string;
  hasSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

const SensorCard: React.FC<SensorCardProps> = ({
  icon: Icon,
  title,
  subtitle,
  value,
  hasSwitch = false,
  switchValue = false,
  onSwitchChange,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Icon size={24} color="#38BDF8" />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      {hasSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: "#334155", true: "#0EA5E9" }}
          thumbColor={switchValue ? "#FFFFFF" : "#94A3B8"}
        />
      ) : (
        <Text style={styles.valueText}>{value}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    width: "90%",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.03)",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
  valueText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
  },
});

export default SensorCard;
