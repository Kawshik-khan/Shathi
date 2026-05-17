import React from "react";
import AuthLayout from "../../../components/auth/LoginLayout";
import SignupForm from "../../../components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
