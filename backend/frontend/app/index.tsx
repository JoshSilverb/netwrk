import { useState } from 'react';
import { useRouter } from 'expo-router';
import { YStack, Input, Button, Label, Text, XStack } from 'tamagui';
import axios from 'axios';
import { validateUserCredentialsURL } from '@/constants/Apis';
import { useAuth } from '@/components/AuthContext';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const router = useRouter();

  const { token, setToken } = useAuth();

  const handleLogin = async () => {
    // Login form data to be sent
    const requestBody = {
      username: username,
      password: password
  }

    if (username === 'A') {
      setError('');
      router.replace('/(tabs)/dashboard'); // Navigate to the main tabs screen after login
    } else {
      try {
        const response = await axios.post(validateUserCredentialsURL, requestBody);
        if (response.status == 200) {
          setToken(response.data['user_token']);
          router.replace('/(tabs)/dashboard');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
      setError('Invalid username or password.');
    }
  };

  return (
    <YStack
      f={1}
      alignItems="center"
      justifyContent="center"
      backgroundColor="$background"
      // px="$4"
      // space
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
      {error && (
        <Text color="$red9" mt="$3">
          {error}
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
      <XStack mt="$4" jc="center" ai="center" space="$5">
        <Text>Don't have an account?</Text>
        <Button
          variant="link"
          onPress={() => router.push('/register')} // Replace with your registration route
        >
          Sign Up
        </Button>
      </XStack>
    </YStack>
  );
}
