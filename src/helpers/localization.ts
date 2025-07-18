import { ptBR } from "@clerk/localizations";

export const localization = {
  ...ptBR,
  // Override specific strings with custom Portuguese translations
  formFieldLabel__emailAddress: "Endereço de email",
  formFieldLabel__emailAddress_username: "Email ou nome de usuário",
  formFieldLabel__password: "Senha",
  formFieldLabel__firstName: "Nome",
  formFieldLabel__lastName: "Sobrenome",
  formFieldLabel__username: "Nome de usuário",
  formFieldLabel__phoneNumber: "Número de telefone",
  formFieldLabel__confirmPassword: "Confirmar senha",
  formFieldInputPlaceholder__emailAddress: "Digite seu email",
  formFieldInputPlaceholder__emailAddress_username: "Digite email ou nome de usuário",
  formFieldInputPlaceholder__password: "Digite sua senha",
  formFieldInputPlaceholder__firstName: "Digite seu nome",
  formFieldInputPlaceholder__lastName: "Digite seu sobrenome",
  formFieldInputPlaceholder__username: "Digite seu nome de usuário",
  formFieldInputPlaceholder__phoneNumber: "Digite seu telefone",
  formFieldInputPlaceholder__confirmPassword: "Confirme sua senha",
  formFieldAction__signIn: "Entrar",
  formFieldAction__signUp: "Criar conta",
  formFieldAction__forgotPassword: "Esqueceu a senha?",
  formButtonPrimary: "Continuar",
  footerActionLink__signIn: "Entrar",
  footerActionLink__signUp: "Criar conta",
  dividerText: "ou",
  socialButtonsBlockButton: "Continuar com {{provider|titleize}}",
  
  // Email verification translations
  formFieldLabel__emailAddressVerificationCode: "Código de verificação",
  formFieldInputPlaceholder__emailAddressVerificationCode: "Digite o código de verificação",
  formFieldAction__emailAddressVerification: "Verificar email",
  formFieldHintText__emailAddressVerification: "Enviamos um código de verificação para {{identifier}}",
  formButtonPrimary__emailAddressVerification: "Verificar email",
  
  // Verification code UI strings
  signUp: {
    start: {
      title: "Crie sua conta",
      subtitle: "para continuar com a Lucida",
      actionText: "Já tem uma conta?",
      actionLink: "Entrar",
    },
    emailCode: {
      title: "Verifique seu email",
      subtitle: "para continuar com a Lucida",
      formTitle: "Código de verificação",
      formSubtitle: "Digite o código de verificação enviado para seu email",
      resendButton: "Não recebeu um código? Reenviar",
    },
  },
  
  signIn: {
    start: {
      title: "Entre na sua conta",
      subtitle: "para continuar com a Lucida",
      actionText: "Não tem uma conta?",
      actionLink: "Criar conta",
    },
    emailCode: {
      title: "Verifique seu email",
      subtitle: "para continuar com a Lucida",
      formTitle: "Código de verificação",
      formSubtitle: "Digite o código de verificação enviado para seu email",
      resendButton: "Não recebeu um código? Reenviar",
    },
  },
  
  // Additional verification strings
  verificationLinkError: "O link de verificação é inválido ou expirou.",
  verificationLinkErrorDescription: "Solicite um novo link de verificação.",
  verificationCodeError: "Código de verificação inválido.",
  verificationCodeErrorDescription: "Verifique o código e tente novamente.",
};
