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
  signIn: {
    start: {
      title: "Entre na sua conta",
      subtitle: "para continuar para Lucida",
      actionText: "Não tem uma conta?",
      actionLink: "Criar conta",
    },
  },
  signUp: {
    start: {
      title: "Crie sua conta",
      subtitle: "para continuar para Lucida",
      actionText: "Já tem uma conta?",
      actionLink: "Entrar",
    },
  },
};
