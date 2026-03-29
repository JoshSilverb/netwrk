import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { YStack, Input, Button, Text, XStack, Checkbox, Label, View, Image } from 'tamagui';
import axios from 'axios';
import { validateUserCredentialsURL } from '@/constants/Apis';
import { useAuth } from '@/components/AuthContext';
import { Check as CheckIcon } from '@tamagui/lucide-icons';
import { saveToken, getToken } from '@/utils/tokenstore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { HomePageUrl } from '@/constants/Definitions';
import { SPACING, TYPOGRAPHY, COLORS } from '@/constants/Styles';

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
      setToken(retrievedToken);
      router.replace(HomePageUrl);
    }
  }

  const handleLogin = async () => {
    const requestBody = {
      username: username,
      password: password
    }

    try {
      const response = await axios.post(validateUserCredentialsURL, requestBody);
      setLoginError('');
      setToken(response.data['user_token']);
      if (rememberMe) {
        await saveToken(response.data['user_token']);
      }
      router.replace(HomePageUrl);

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
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <KeyboardAwareScrollView
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          backgroundColor="$background"
          paddingHorizontal={SPACING.lg}
          paddingVertical={SPACING.xxl}
        >
          {/* Brand block */}
          <YStack alignItems="center" marginBottom={SPACING.xxl}>
            <Image
              width={80}
              height={80}
              borderRadius={16}
              source={require('../assets/images/netwrk-icon-square.png')}
              marginBottom={SPACING.sm}
            />
            <Text
              fontSize={TYPOGRAPHY.sizes.title}
              fontWeight={TYPOGRAPHY.weights.bold}
              color="$blue9"
            >
              Netwrk
            </Text>
          </YStack>

          {/* Form */}
          <YStack width="100%" space={SPACING.xs}>
            <Text
              fontSize={TYPOGRAPHY.sizes.sm}
              fontWeight={TYPOGRAPHY.weights.medium}
              color="$gray11"
              marginBottom={SPACING.xs}
            >
              Username
            </Text>
            <Input
              id="username"
              placeholder="Enter username"
              value={username}
              onChangeText={setUsername}
              size="$4"
              width="100%"
              autoCapitalize="none"
            />

            <Text
              fontSize={TYPOGRAPHY.sizes.sm}
              fontWeight={TYPOGRAPHY.weights.medium}
              color="$gray11"
              marginTop={SPACING.md}
              marginBottom={SPACING.xs}
            >
              Password
            </Text>
            <Input
              id="password"
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              size="$4"
              width="100%"
              secureTextEntry
            />

            {loginError ? (
              <Text color="$red9" marginTop={SPACING.sm} textAlign="center">
                {loginError}
              </Text>
            ) : null}

            <Button
              marginTop={SPACING.lg}
              width="100%"
              size="$4"
              backgroundColor="$blue9"
              color="white"
              onPress={handleLogin}
              fontWeight={TYPOGRAPHY.weights.bold}
            >
              Log In
            </Button>

            <XStack marginTop={SPACING.md} justifyContent="center" alignItems="center" space={SPACING.sm}>
              <Checkbox
                id="rememberMeCheckBox"
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              >
                <Checkbox.Indicator>
                  <CheckIcon />
                </Checkbox.Indicator>
              </Checkbox>
              <Label htmlFor="rememberMeCheckBox" fontSize={TYPOGRAPHY.sizes.sm}>
                Remember me
              </Label>
            </XStack>

            <XStack marginTop={SPACING.lg} justifyContent="center" alignItems="center" space={SPACING.sm}>
              <Text fontSize={TYPOGRAPHY.sizes.sm} color="$gray10">
                Don't have an account?
              </Text>
              <Button
                variant="link"
                onPress={() => router.push('/register')}
                fontSize={TYPOGRAPHY.sizes.sm}
              >
                Sign Up
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
