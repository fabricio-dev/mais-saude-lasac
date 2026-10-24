import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { telefoneMudou } from "@/helpers/phone-core";
import { isValidPhoneNumber } from "@/lib/whatsapp/utils";

interface UseAskConsentWhenPhoneChangedParams {
  /** Telefone gravado no cadastro (undefined em cadastro novo). */
  savedPhone?: string;
  /** Telefone digitado agora no formulário. */
  phoneNumber: string;
  /** Limpa a escolha do consentimento no formulário. */
  clearConsent: () => void;
}

/**
 * O consentimento de WhatsApp é do número, não do paciente: quem autorizou (ou
 * não) foi o dono do número antigo. Quando o atendente digita um número novo,
 * a escolha é limpa para ele perguntar de novo e marcar "Sim" ou "Não" — o
 * formulário não salva sem escolha. Máscara, 55 ou nono dígito não contam como
 * número novo.
 */
export function useAskConsentWhenPhoneChanged({
  savedPhone,
  phoneNumber,
  clearConsent,
}: UseAskConsentWhenPhoneChangedParams) {
  // Limpa uma vez por troca: depois que o atendente escolhe, apagar e
  // redigitar dígitos do número não apaga a escolha de novo. Volta a valer
  // quando o telefone volta a ser o gravado (formulário reaberto).
  const hasCleared = useRef(false);

  useEffect(() => {
    if (!savedPhone) return;
    if (!telefoneMudou(savedPhone, phoneNumber)) {
      hasCleared.current = false;
      return;
    }
    // Só com o número completo: não limpa a cada dígito apagado.
    if (hasCleared.current || !isValidPhoneNumber(phoneNumber)) return;

    hasCleared.current = true;
    clearConsent();
    toast.info(
      "Telefone alterado: pergunte ao paciente se autoriza mensagens por WhatsApp neste número.",
    );
  }, [savedPhone, phoneNumber, clearConsent]);
}
