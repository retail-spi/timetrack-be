import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  weekLabel: string;
  totalHours: number;
  contractHours: number;
  pending: number;
  approved: number;
}

export function TimeSummaryCard({ weekLabel, totalHours, contractHours, pending, approved }: Props) {
  const pct = Math.min((totalHours / contractHours) * 100, 100);
  const isOver = totalHours > contractHours;

  return (
    <View style={styles.card}>
      <Text style={styles.weekLabel}>Semaine {weekLabel}</Text>

      <View style={styles.row}>
        <Text style={[styles.hours, isOver && styles.hoursOver]}>
          {totalHours.toFixed(1)}h
        </Text>
        <Text style={styles.contract}> / {contractHours}h contrat</Text>
      </View>

      {/* Barre de progression */}
      <View style={styles.bar}>
        <View style={[styles.fill, { width: `${pct}%` as any }, isOver && styles.fillOver]} />
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusPending}>⏳ {pending} en attente</Text>
        <Text style={styles.statusApproved}>✅ {approved} approuvées</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  weekLabel: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'baseline' },
  hours: { fontSize: 32, fontWeight: '700', color: '#1E3A5F' },
  hoursOver: { color: '#DC2626' },
  contract: { fontSize: 16, color: '#6B7280' },
  bar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, marginVertical: 12 },
  fill: { height: 8, backgroundColor: '#2563EB', borderRadius: 4 },
  fillOver: { backgroundColor: '#DC2626' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusPending: { fontSize: 13, color: '#D97706' },
  statusApproved: { fontSize: 13, color: '#059669' },
});
