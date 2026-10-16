This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testes

```bash
npm test                          # roda uma vez
npm --prefix tests run test:watch # roda de novo a cada alteração
```

Os testes usam [Vitest](https://vitest.dev) e moram em `tests/`, um pacote à
parte com o próprio `package.json`: o `npm install` da aplicação (e o da VPS)
não instala o Vitest. O `npm test` instala as dependências de `tests/` na
primeira vez e depois roda. O `tsconfig.json` da raiz ignora `tests/`, para o
`next build` não precisar do Vitest.

A pasta `tests/` repete a estrutura de `src/` (`tests/lib/whatsapp/client.test.ts`
testa `src/lib/whatsapp/client.ts`). Hoje os testes cobrem o envio por WhatsApp:
a proteção de DEV, as confirmações de ativação e renovação, e o cron de
lembretes. Nenhum teste fala com o Postgres ou com o whatsapp-ai:
`tests/fakes/whatsapp-fakes.ts` faz o papel do banco, das configurações e do
`fetch`, e registra o pedido que iria para o whatsapp-ai.

Para checar os tipos dos testes: `npx tsc -p tests --noEmit`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
