"use client";

import { useEffect, useState } from "react";
import {
  getRegisteredEmail,
  setRegisteredEmail as setStored,
  clearRegisteredEmail as clearStored,
} from "@/lib/registered-email";

export function useRegisteredEmail() {
  const [email, setEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEmail(getRegisteredEmail());
    setMounted(true);
  }, []);

  const setRegisteredEmail = (value: string) => {
    setStored(value);
    setEmail(value.trim() || null);
  };

  const clearRegisteredEmail = () => {
    clearStored();
    setEmail(null);
  };

  return { email, mounted, setRegisteredEmail, clearRegisteredEmail };
}
