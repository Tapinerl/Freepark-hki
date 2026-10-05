import { useState } from "react";
import { Text } from "react-native";
import { router } from "expo-router";
import Screen from "./Screen";
import { Button, Card, Field, ui } from "./ui";

export default function AuthForm({ signup = false }: { signup?: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  function submit() {
    if (
      (signup && !name.trim()) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      password.length < 8
    ) {
      setFeedback(
        "Enter a valid email and a password of at least 8 characters." +
          (signup ? " Add your name too." : ""),
      );
      return;
    }
    setFeedback(
      "This is a UI preview. Authentication is not connected, and no account was created or signed in.",
    );
  }
  return (
    <Screen>
      <Text style={ui.title}>
        {signup ? "Make yourself at home." : "Welcome back."}
      </Text>
      <Text style={ui.subtitle}>
        Save your favorite spots and help others find theirs.
      </Text>
      <Card>
        {signup && (
          <Field
            label="Name"
            value={name}
            onChangeText={setName}
            autoComplete="name"
          />
        )}
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={signup ? "new-password" : "current-password"}
        />
        <Button
          title={signup ? "Preview sign up" : "Preview log in"}
          onPress={submit}
        />
      </Card>
      {Boolean(feedback) && (
        <Text accessibilityLiveRegion="polite" style={ui.subtitle}>
          {feedback}
        </Text>
      )}
      <Button
        title={
          signup
            ? "Already have an account? Log in"
            : "New here? Create an account"
        }
        secondary
        onPress={() => router.replace(signup ? "/login" : "/signup")}
      />
      <Text style={ui.subtitle}>
        Demo only. No credentials are sent or stored.
      </Text>
    </Screen>
  );
}
