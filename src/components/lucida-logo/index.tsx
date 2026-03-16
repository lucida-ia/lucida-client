"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import lightLogo from "@/assets/logos/Logotipo_LucidaExam-01.svg";
import darkLogo from "@/assets/logos/Logotipo_LucidaExam-03.svg";

const LucidaLogo = ({ isDark }: { isDark?: boolean }) => {
  const { resolvedTheme } = useTheme();

  const logo = resolvedTheme === "dark" ? darkLogo : lightLogo;

  return <Image src={logo} alt="Lucida Logo" className="w-full" />;
};

export default LucidaLogo;
