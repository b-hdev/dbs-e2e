import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { formatCpfCnpj, cleanCpfCnpj } from '@/utils/validation';
import { clientService } from '@/services/api';

export default function IdentifyScreen() {
  const router = useRouter();
  const [documento, setDocumento] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDocumentChange = (text: string) => {
    setErrorMsg(null);
    setDocumento(formatCpfCnpj(text));
  };

  const handleIdentificar = async () => {
    const rawDoc = cleanCpfCnpj(documento);

    if (rawDoc.length < 11) {
      setErrorMsg('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await clientService.identificar(documento);

      if (response.sucesso && response.cliente) {
        router.push({
          pathname: '/chat' as any,
          params: {
            clienteId: response.cliente.id,
            nomeCliente: response.cliente.nome,
            cpfCnpj: response.cliente.cpfCnpj,
            planoAtual: response.cliente.planoAtual,
            statusContrato: response.cliente.statusContrato,
            faturasAbertasCount: String(response.cliente.faturasAbertasCount),
          },
        });
      } else {
        setErrorMsg(response.mensagem || 'Cliente não localizado no sistema.');
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.mensagem ||
        'Não foi possível conectar ao servidor. Verifique sua conexão.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUsarCpfDemo = () => {
    handleDocumentChange('080.290.450-50');
  };

  const handleUsarCnpjDemo = () => {
    handleDocumentChange('03.824.222/0001-17');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.logoRow}>
            <Image
              source={require('../../assets/images/dbs/logodbs-sem-fundo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.title}>Identificação do Assinante</Text>
          <Text style={styles.subtitle}>
            Informe seu CPF ou CNPJ cadastrado para consultar seu contrato e iniciar o atendimento.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CPF ou CNPJ</Text>
            <TextInput
              style={[styles.input, errorMsg ? styles.inputError : null]}
              placeholder="000.000.000-00 ou XX.XXX.XXX/XXXX-00"
              placeholderTextColor={Colors.textSecondary}
              value={documento}
              onChangeText={handleDocumentChange}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={18}
              autoFocus
            />
            {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleIdentificar}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.submitButtonText}>Localizando contrato...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>Acessar Atendimento</Text>
            )}
          </TouchableOpacity>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Exemplos Cadastrados</Text>
            <Text style={styles.demoText}>
              Selecione para preencher rapidamente:
            </Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity onPress={handleUsarCpfDemo} style={styles.demoButton} activeOpacity={0.8}>
                <Text style={styles.demoButtonText}>CPF: Diego Alves</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUsarCnpjDemo} style={styles.demoButton} activeOpacity={0.8}>
                <Text style={styles.demoButtonText}>CNPJ: Teste Wbrnet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoImage: {
    width: 160,
    height: 44,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoBox: {
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 10,
    padding: Spacing.md,
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  demoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  demoButton: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  demoButtonText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
});
