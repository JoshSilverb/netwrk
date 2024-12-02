import { View, Text, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();

  const handleLogin = () => {
    // Example: Navigate to the main tabs after login
    console.log("Handling login");
    router.replace('/(tabs)/dashboard');
  };

  console.log("Rendering login screen!!!");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      {/* Add your login form or other UI here */}
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});
