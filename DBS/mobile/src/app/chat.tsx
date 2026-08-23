import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Clipboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { clientService, type ChatResponse } from '@/services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  departamento?: 'COMERCIAL' | 'SUPORTE' | 'FINANCEIRO' | 'INDEFINIDO';
  timestamp: string;
  toolResult?: any;
}

export default function ChatScreen() {
  const params = useLocalSearchParams<{
    clienteId?: string;
    nomeCliente?: string;
    cpfCnpj?: string;
    planoAtual?: string;
    statusContrato?: string;
    faturasAbertasCount?: string;
  }>();

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [activeDepartamento, setActiveDepartamento] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const nome = params.nomeCliente || 'Assinante';
    const initialGreeting: Message = {
      id: 'greeting-1',
      role: 'assistant',
      content: `Olá, ${nome}! Sou o assistente virtual da DBS TELECOM. Como posso ajudar você hoje?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([initialGreeting]);
  }, [params.nomeCliente]);

  const handleSendMessage = async (textToSend?: string) => {
    const texto = (textToSend || inputText).trim();
    if (!texto || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: texto,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setLoading(true);

    try {
      const response: ChatResponse = await clientService.enviarMensagem({
        cpfCnpj: params.cpfCnpj || '080.290.450-50',
        mensagem: texto,
        sessionId,
      });

      if (response.sucesso) {
        if (!sessionId && response.sessionId) {
          setSessionId(response.sessionId);
        }

        if (response.resposta.departamento && response.resposta.departamento !== 'INDEFINIDO') {
          setActiveDepartamento(response.resposta.departamento);
        }

        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: response.resposta.mensagem,
          departamento: response.resposta.departamento,
          toolResult: response.toolResult,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (err: any) {
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Desculpe, tive uma instabilidade temporária na comunicação. Pode repetir?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string) => {
    Clipboard.setString(text);
    Alert.alert('Copiado!', 'Código copiado com sucesso.');
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    const deptColor = item.departamento ? (Colors.departamentos as any)[item.departamento] : null;

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>DBS</Text>
          </View>
        )}

        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {!isUser && item.departamento && item.departamento !== 'INDEFINIDO' && (
            <View style={[styles.deptBadge, { backgroundColor: deptColor || Colors.primary }]}>
              <Text style={styles.deptBadgeText}>{item.departamento}</Text>
            </View>
          )}

          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.aiMessageText]}>
            {item.content}
          </Text>

          {item.toolResult?.dados && Array.isArray(item.toolResult.dados) && (
            <View style={styles.faturasContainer}>
              {item.toolResult.dados.map((boleto: any, index: number) => (
                <View key={index} style={styles.boletoCard}>
                  <View style={styles.boletoHeader}>
                    <Text style={styles.boletoTitle}>📄 Fatura #{boleto.id || index + 1}</Text>
                    <Text style={styles.boletoValor}>R$ {boleto.valor || '0,00'}</Text>
                  </View>
                  <Text style={styles.boletoVenc}>Vencimento: {boleto.data_vencimento || 'A Vencer'}</Text>

                  {boleto.linha_digitavel && (
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => handleCopyText(boleto.linha_digitavel)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.copyButtonText}>📋 Copiar Linha Digitável</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          <Text style={[styles.timeText, isUser ? styles.userTimeText : styles.aiTimeText]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.contextHeader}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{params.nomeCliente || 'Assinante DBS'}</Text>
          <Text style={styles.clientSub}>
            Plano: {params.planoAtual || 'Fibra'} • Status: {params.statusContrato || 'Ativo'}
          </Text>
        </View>

        {activeDepartamento && (
          <View
            style={[
              styles.activeDeptBadge,
              { backgroundColor: (Colors.departamentos as any)[activeDepartamento] || Colors.primary },
            ]}
          >
            <Text style={styles.activeDeptText}>{activeDepartamento}</Text>
          </View>
        )}
      </View>

      <View style={styles.quickPromptsContainer}>
        <TouchableOpacity
          style={styles.quickChip}
          onPress={() => handleSendMessage('Minha internet está muito lenta')}
          activeOpacity={0.7}
        >
          <Text style={styles.quickChipText}>⚡ Internet Lenta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickChip}
          onPress={() => handleSendMessage('Preciso da 2ª via do meu boleto')}
          activeOpacity={0.7}
        >
          <Text style={styles.quickChipText}>📄 2ª Via do Boleto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickChip}
          onPress={() => handleSendMessage('Quero contratar um plano de internet')}
          activeOpacity={0.7}
        >
          <Text style={styles.quickChipText}>🚀 Planos de Internet</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {loading && (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.typingText}>DBS Assistente está digitando...</Text>
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Digite sua mensagem..."
            placeholderTextColor={Colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.sendButtonIcon}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contextHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  clientSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activeDeptBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeDeptText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  quickPromptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  quickChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  quickChipText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesList: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: Colors.userBubble,
    borderBottomRightRadius: 2,
  },
  aiBubble: {
    backgroundColor: Colors.aiBubble,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  deptBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  deptBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: Colors.userText,
  },
  aiMessageText: {
    color: Colors.aiText,
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimeText: {
    color: 'rgba(255,255,255,0.75)',
  },
  aiTimeText: {
    color: Colors.textSecondary,
  },
  faturasContainer: {
    marginTop: 10,
    gap: 8,
  },
  boletoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  boletoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boletoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  boletoValor: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  boletoVenc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 6,
  },
  copyButton: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 4,
  },
  copyButtonText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  typingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  inputBar: {
    flexDirection: 'row',
    padding: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.backgroundAlt,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.35,
  },
  sendButtonIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
