export enum UnityCity {
  SALGUEIRO = "Salgueiro",
  CEDRO = "Cedro",
  MIRANDIBA = "Mirandiba",
  PARNAMIRIM = "Parnamirim",
  SAO_JOSE_DO_BELMONTE = "São José do Belmonte",
  SERRITA = "Serrita",
  TERRA_NOVA = "Terra Nova",
  VERDEJANTE = "Verdejante",
  JUAZEIRO = "Juazeiro",

  JABOATAO_DOS_GUARARAPES = "Jaboatão dos Guararapes",
}

export const unityCity = Object.entries(UnityCity).map(([key, value]) => ({
  value: UnityCity[key as keyof typeof UnityCity],
  label: value,
}));
