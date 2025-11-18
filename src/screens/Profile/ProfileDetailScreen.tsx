import React from 'react';
import { SafeAreaView, StyleSheet, Text, View, Image, TouchableOpacity, StatusBar, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../theme/ThemeProvider';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { getUser } from '../../utils/storage.ts';
import { deleteAccount } from '../../api/auth';
import { clearAuthState } from '../../utils/auth.ts';
import { stopBackgroundFetch } from '../../services/BackgroundFetchService';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileDetail'>;

export default function ProfileDetailScreen({ navigation }: Props): React.ReactElement {
  const { colors, shadows } = useAppTheme();
  const [name, setName] = React.useState('Yusuf Karim');
  const [email, setEmail] = React.useState('yusuf.karim@gmail.com');

  React.useEffect(() => {
    void (async () => {
      const u = await getUser();
      if (u) {
        setName(u.name || name);
        setEmail(u.email || email);
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <SafeAreaView>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.circleBtn, { backgroundColor: '#FFFFFF', ...shadows.small }]}>
            <Icon name="chevron-back" size={20} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity style={[styles.circleBtn, { backgroundColor: '#FFFFFF', ...shadows.small }]}>
            <Icon name="create-outline" size={18} color="#000000" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Content sheet */}
      <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
        <View style={styles.profileBlock}>
          <View style={[styles.avatarWrap, { ...shadows.small }]}>
            <Image source={require('../../../assets/img/logo.jpg')} style={styles.avatarImg} />
            <View style={styles.cameraBadge}>
              <Icon name="camera" size={14} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        <TouchableOpacity
          style={[styles.deleteBtn, { ...shadows.small }]} activeOpacity={0.9}
          onPress={() => {
            Alert.alert('Delete account', 'This will permanently delete your account. Continue?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: async () => {
                try {
                  const res = await deleteAccount(email);
                  if (res.status === 200) {
                    try { stopBackgroundFetch(); } catch {}
                    await clearAuthState();
                    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                  } else {
                    Alert.alert('Failed', 'Could not delete account.');
                  }
                } catch (e) {
                  Alert.alert('Failed', 'Could not delete account.');
                }
              }},
            ]);
          }}
        >
          <Text style={styles.deleteLabel}>Delete my account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  circleBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  sheet: { flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 16, paddingTop: 20 },
  profileBlock: { alignItems: 'center', marginTop: 8 },
  avatarWrap: { width: 120, height: 120, borderRadius: 60, overflow: 'hidden', backgroundColor: '#fff' },
  avatarImg: { width: '100%', height: '100%' },
  cameraBadge: { position: 'absolute', right: 6, bottom: 6, width: 32, height: 32, borderRadius: 16, backgroundColor: '#6A85FF', alignItems: 'center', justifyContent: 'center' },
  name: { marginTop: 16, fontSize: 22, fontWeight: '800', color: '#000000' },
  email: { marginTop: 6, fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  deleteBtn: { marginTop: 40, alignSelf: 'center', width: 280, paddingVertical: 14, borderRadius: 999, borderWidth: 2, borderColor: '#FF3B30', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  deleteLabel: { color: '#FF3B30', fontWeight: '800', fontSize: 16 },
});


