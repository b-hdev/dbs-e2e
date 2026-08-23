import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            fontWeight: '600',
            color: Colors.text,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: Colors.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="identify"
          options={{
            title: 'Identificação',
            headerBackTitle: 'Voltar',
          }}
        />
        <Stack.Screen
          name="chat"
          options={{
            title: 'Atendimento DBS',
            headerBackTitle: 'Início',
          }}
        />
      </Stack>
    </>
  );
}
