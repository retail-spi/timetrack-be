import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../src/api/client';

export default function AddTimeEntry() {
  const router = useRouter();
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    breakMinutes: 0,
    activityTypeId: '',
    note: '',
  });

  useEffect(() => {
    api.activityTypes.list().then(setActivityTypes).catch(console.error);
  }, []);

const submit = async () => {
  if (!form.startTime || !form.endTime || !form.activityTypeId) {
    Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
    return;
  }

  try {
    const today = form.date;
    await api.timeEntries.create({
      date: today,
      startTime: `${today}T${form.startTime}:00`,
      endTime: `${today}T${form.endTime}:00`,
      breakMinutes: form.breakMinutes,
      activityTypeId: form.activityTypeId,
      note: form.note,
    });
    Alert.alert('Succès', 'Entrée créée !', [{ text: 'OK', onPress: () => router.back() }]);
  } catch (err: any) {
    Alert.alert('Erreur', err.response?.data?.message || 'Impossible de créer');
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nouvelle entrée</Text>
      </View>

      <ScrollView style={styles.form}>
        <Text style={styles.label}>Date</Text>
        <TextInput style={styles.input} value={form.date}
          onChangeText={(v) => setForm({ ...form, date: v })} />

        <Text style={styles.label}>Heure début (HH:MM)</Text>
        <TextInput style={styles.input} placeholder="08:00"
          value={form.startTime}
          onChangeText={(v) => setForm({ ...form, startTime: v })} />

        <Text style={styles.label}>Heure fin (HH:MM)</Text>
        <TextInput style={styles.input} placeholder="17:00"
          value={form.endTime}
          onChangeText={(v) => setForm({ ...form, endTime: v })} />

        <Text style={styles.label}>Pause (minutes)</Text>
        <TextInput style={styles.input} keyboardType="numeric"
          value={String(form.breakMinutes)}
          onChangeText={(v) => setForm({ ...form, breakMinutes: parseInt(v) || 0 })} />

        <Text style={styles.label}>Type d'activité</Text>
        {activityTypes.map((at) => (
          <TouchableOpacity key={at.id}
            style={[styles.option, form.activityTypeId === at.id && styles.optionSelected]}
            onPress={() => setForm({ ...form, activityTypeId: at.id })}>
            <Text style={form.activityTypeId === at.id ? styles.optionTextSelected : styles.optionText}>
              {at.label}
            </Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.label}>Note (facultatif)</Text>
        <TextInput style={styles.input} value={form.note}
          onChangeText={(v) => setForm({ ...form, note: v })} />

        <TouchableOpacity style={styles.btn} onPress={submit}>
          <Text style={styles.btnText}>Enregistrer</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, backgroundColor: '#1E3A5F' },
  back: { color: '#93C5FD', fontSize: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600' },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, backgroundColor: '#fff', fontSize: 15 },
  option: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, marginBottom: 6, backgroundColor: '#fff' },
  optionSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  optionText: { color: '#374151' },
  optionTextSelected: { color: '#2563EB', fontWeight: '600' },
  btn: { backgroundColor: '#2563EB', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});