import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('../../assets/images/dbs/logodbs-sem-fundo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Card Principal */}
        <View style={styles.heroCard}>
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Autoatendimento Inteligente</Text>
          </View>

          <Text style={styles.heroTitle}>Como podemos ajudar você hoje?</Text>
          <Text style={styles.heroDescription}>
            Identifique-se com seu CPF ou CNPJ para consultar faturas, diagnosticar problems de conexão ou solicitar novos planos.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/identify' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Iniciar Atendimento</Text>
          </TouchableOpacity>
        </View>

        {/* Serviços Rápidos */}
        <Text style={styles.sectionTitle}>Serviços Disponíveis</Text>

        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => router.push('/identify' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 22 }}>⚡</Text>
            </View>
            <View style={styles.serviceContent}>
              <Text style={styles.serviceTitle}>Suporte e Conexão</Text>
              <Text style={styles.serviceDesc}>Diagnóstico de lentidão e sinal N1</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => router.push('/identify' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 22 }}>📄</Text>
            </View>
            <View style={styles.serviceContent}>
              <Text style={styles.serviceTitle}>2ª Via de Fatura</Text>
              <Text style={styles.serviceDesc}>Consulta de boleto, código de barras e PIX</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => router.push('/identify' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 22 }}>🚀</Text>
            </View>
            <View style={styles.serviceContent}>
              <Text style={styles.serviceTitle}>Planos de Internet</Text>
              <Text style={styles.serviceDesc}>Planos com Wi-Fi 6 e ultravelocidade</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>DBS TELECOM — Todos os direitos reservados</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.md,
    paddingTop: Spacing.lg,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.xs,
  },
  logoImage: {
    width: 220,
    height: 60,
  },
  heroCard: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 4,
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  heroDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  },
  grid: {
    gap: Spacing.sm,
  },
  serviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  serviceDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
