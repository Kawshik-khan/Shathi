import React from "react";
import type { Metadata } from "next";
import AuthLayout from "../../../components/auth/LoginLayout";
import LoginForm from "../../../components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to your Shathi mental wellness companion account.",
  alternates: {
    canonical: "/auth/login",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}

