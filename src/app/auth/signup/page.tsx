import React from "react";
import type { Metadata } from "next";
import AuthLayout from "../../../components/auth/LoginLayout";
import SignupForm from "../../../components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Shathi account to start tracking your mood, sleep, habits, and wellness progress.",
  alternates: {
    canonical: "/auth/signup",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
