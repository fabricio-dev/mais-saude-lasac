import { z } from "zod";

/**
 * Lista com teto de tamanho conferido **antes** de validar os itens.
 *
 * O zod (até 4.6.5, e o 3.x daqui) valida item por item e guarda um erro para
 * cada item inválido, sem parar. Uma Server Action valida a entrada antes de
 * conferir o login, e o corpo aceita até 20 MB (`next.config.ts`): um array
 * enorme de itens inválidos, mandado por qualquer um, esgota a memória e
 * derruba o app (GHSA-mrhx-c7xc-m3w5). Um `.max()` no array não basta, porque
 * o zod 3 confere o tamanho e continua validando os itens.
 *
 * Aqui a lista longa demais para no primeiro passo, com um erro só. O tipo de
 * entrada continua o do array, para o `zodResolver` dos formulários.
 */
export const boundedArray = <S extends z.ZodArray<z.ZodTypeAny>>(
  schema: S,
  maxLength: number,
) =>
  z.preprocess((value, ctx) => {
    if (Array.isArray(value) && value.length > maxLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        type: "array",
        maximum: maxLength,
        inclusive: true,
        message: `No máximo ${maxLength} itens`,
        // Erro fatal: o zod não chega a validar os itens
        fatal: true,
      });
      return z.NEVER;
    }
    return value;
  }, schema) as z.ZodEffects<S, z.output<S>, z.input<S>>;
