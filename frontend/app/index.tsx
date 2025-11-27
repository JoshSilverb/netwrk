import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { YStack, Input, Button, Text, XStack, Checkbox, Label, ScrollView, View } from 'tamagui';
import axios from 'axios';
import { validateUserCredentialsURL } from '@/constants/Apis';
import { useAuth } from '@/components/AuthContext';
import { Check as CheckIcon } from '@tamagui/lucide-icons';
import { saveToken, getToken } from '@/utils/tokenstore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform } from 'react-native';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const router = useRouter();

  const { token, setToken } = useAuth();

  useEffect(() => {
    handleRetrieveSavedToken();
  }, [])

  const handleRetrieveSavedToken = async () => {
    const retrievedToken = await getToken();
    if (retrievedToken) {
      console.log("Retrieved saved token:", retrievedToken);
      setToken(retrievedToken);
      router.replace('/(tabs)/dashboard');
    }
    else {
      console.log("No saved token");
    }
  }

  const handleLogin = async () => {
    // Login form data to be sent
    const requestBody = {
      username: username,
      password: password
    }

    console.log(`sending login request with body=${JSON.stringify(requestBody)} to URL=${validateUserCredentialsURL}`)

    try {
      const response = await axios.post(validateUserCredentialsURL, requestBody);
      setLoginError('');
      setToken(response.data['user_token']);
      if (rememberMe) {
        console.log("Saving token:", response.data['user_token']);
        await saveToken(response.data['user_token']);
      }
      router.replace('/(tabs)/dashboard');
      
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401) {
          setLoginError('Invalid username or password.');
        } else {
          setLoginError(`Server error: ${error.response.status}`);
        }
      } else {
        setLoginError('Network error');
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top', 'bottom']}>
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
    <ScrollView keyboardShouldPersistTaps="handled">
    <YStack
      f={1}
      alignItems="center"
      justifyContent="center"
      backgroundColor="$background"
      paddingTop={20}
    >
      <Text fontFamily="$heading" fontSize="$7" color="$color" mb="$4">
        Welcome Back
      </Text>
      <Label htmlFor="username" mb="$2">
        Username
      </Label>
      <Input
        id="username"
        placeholder="Enter username"
        value={username}
        onChangeText={setUsername}
        width="$12"
        size="$4"
        borderWidth="$0.5"
      />
      <Label htmlFor="password" mt="$3" mb="$2">
        Password
      </Label>
      <Input
        id="password"
        placeholder="Enter password"
        value={password}
        onChangeText={setPassword}
        width="$12"
        size="$4"
        secureTextEntry
        borderWidth="$0.5"
      />
      {loginError && (
        <Text color="$red9" mt="$3">
          {loginError}
        </Text>
      )}

      <Button
        mt="$4"
        width="$12"
        size="$4"
        onPress={handleLogin}
      >
        Login
      </Button>
      <XStack mt="$4" jc="center" ai="center" space="$2">
        <Checkbox 
          id="rememberMeCheckBox"
          onCheckedChange={(checked) => setRememberMe(checked)}
        >
          <Checkbox.Indicator>
            <CheckIcon />
          </Checkbox.Indicator>  
        </Checkbox>
        <Label htmlFor="rememberMeCheckBox">Remember me</Label>
      </XStack>
      
      <XStack mt="$4" jc="center" ai="center" space="$5">
        <Text>Don't have an account?</Text>
        <Button
          variant="link"
          onPress={() => router.push('/register')}
        >
          Sign Up
        </Button>
      </XStack>
    </YStack>
    </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
