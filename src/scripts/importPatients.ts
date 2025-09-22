import * as XLSX from "xlsx";

import { db } from "../db"; // ajuste o caminho conforme seu projeto
import { clinicsTable, patientsTable, sellersTable } from "../db/schema";

// Definição do tipo baseado nas colunas do Excel
interface PatientRow {
  name?: string;
  birth_date?: string | Date | number;
  rg_number?: string;
  cpf_number?: string;
  phone_number?: string;
  address?: string;
  home_number?: string;
  city?: string;
  state?: string;
  created_at?: string | Date | number;
  updated_at?: string | Date | number;
  card_type?: string;
  number_cards?: number;
  seller_id?: string;
  dependents1?: string;
  dependents2?: string;
  dependents3?: string;
  dependents4?: string;
  dependents5?: string;
  dependents6?: string;
  expiration_date?: string | Date | number;
  status_agreement?: string;
  enterprise?: string;
  observation?: string;
  clinic_id?: string;
  is_active?: boolean;
  reactivated_at?: string | Date | number;
  actve_at?: string | Date | number; // OBS: na planilha está sem o "i"
  active_at?: string | Date | number; // Versão correta
}

const workbook = XLSX.readFile("src/scripts/dados_tratados.xlsx"); // ajuste o caminho conforme seu projeto
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data: PatientRow[] = XLSX.utils.sheet_to_json(sheet);

function parseDate(value: string | Date | number | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;

  // Se for um número (serial do Excel), converter
  if (typeof value === "number") {
    // Excel serial date: dias desde 1/1/1900 (com ajuste para bug do Excel)
    const excelEpoch = new Date(1900, 0, 1);
    const days = value - 2; // Ajuste para o bug do leap year do Excel
    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }

  const str = value.toString().trim();
  if (!str) return null;

  // Se for um número em string, tratar como serial do Excel
  const numValue = parseFloat(str);
  if (!isNaN(numValue) && str === numValue.toString()) {
    const excelEpoch = new Date(1900, 0, 1);
    const days = numValue - 2;
    const date = new Date(excelEpoch.getTime() + days * 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }

  // Tenta parsing de data no formato DD/MM/YYYY ou DD-MM-YYYY
  const parts = str.split(/[\/\-]/);
  if (parts.length === 3) {
    const [d, m, y] = parts.map((p) => parseInt(p, 10));
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      const date = new Date(y, m - 1, d);
      // Verifica se a data é válida
      if (
        date.getFullYear() === y &&
        date.getMonth() === m - 1 &&
        date.getDate() === d
      ) {
        return date;
      }
    }
  }

  // Fallback para parsing padrão
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

// Função para converter Date para string no formato YYYY-MM-DD (para campos date)
function formatDateForDb(date: Date | null): string {
  if (!date) return new Date().toISOString().split("T")[0];
  return date.toISOString().split("T")[0];
}

async function importPatients() {
  try {
    console.log(`📊 Processando ${data.length} registros...`);

    // Buscar todos os sellers e clinics existentes para validação
    console.log("🔍 Buscando sellers e clinics existentes...");
    const existingSellers = await db
      .select({ id: sellersTable.id })
      .from(sellersTable);
    const existingClinics = await db
      .select({ id: clinicsTable.id })
      .from(clinicsTable);

    const sellerIds = new Set(existingSellers.map((s) => s.id));
    const clinicIds = new Set(existingClinics.map((c) => c.id));

    console.log(
      `📋 Encontrados ${sellerIds.size} sellers e ${clinicIds.size} clinics no banco`,
    );

    let validSellerCount = 0;
    let validClinicCount = 0;

    await db.transaction(async (tx) => {
      let processedCount = 0;

      for (const row of data) {
        try {
          const validSellerId =
            row.seller_id && sellerIds.has(row.seller_id)
              ? row.seller_id
              : null;
          const validClinicId =
            row.clinic_id && clinicIds.has(row.clinic_id)
              ? row.clinic_id
              : null;

          if (validSellerId) validSellerCount++;
          if (validClinicId) validClinicCount++;

          const patientData = {
            name: String(row.name ?? "").trim() || "Nome não informado",
            birthDate: formatDateForDb(parseDate(row.birth_date)),
            rgNumber: String(row.rg_number ?? "").trim(),
            cpfNumber: String(row.cpf_number ?? "").trim(),
            phoneNumber: String(row.phone_number ?? "").trim(),
            address: String(row.address ?? "").trim(),
            homeNumber: String(row.home_number ?? "").trim(),
            city: String(row.city ?? "").trim(),
            state: String(row.state ?? "").trim(),

            createdAt: parseDate(row.created_at) ?? new Date(),
            updatedAt: parseDate(row.updated_at) ?? new Date(),

            cardType:
              row.card_type === "enterprise"
                ? ("enterprise" as const)
                : ("personal" as const),
            Enterprise: row.enterprise ? String(row.enterprise).trim() : null,
            numberCards: Math.max(0, Number(row.number_cards) || 0),
            sellerId: validSellerId,
            clinicId: validClinicId,

            dependents1: row.dependents1
              ? String(row.dependents1).trim()
              : null,
            dependents2: row.dependents2
              ? String(row.dependents2).trim()
              : null,
            dependents3: row.dependents3
              ? String(row.dependents3).trim()
              : null,
            dependents4: row.dependents4
              ? String(row.dependents4).trim()
              : null,
            dependents5: row.dependents5
              ? String(row.dependents5).trim()
              : null,
            dependents6: row.dependents6
              ? String(row.dependents6).trim()
              : null,

            expirationDate: parseDate(row.expiration_date),
            statusAgreement:
              row.status_agreement === "expired" ||
              row.status_agreement === "pending"
                ? (row.status_agreement as "expired" | "pending")
                : null,
            observation: row.observation
              ? String(row.observation).trim()
              : null,
            isActive: Boolean(row.is_active ?? true),
            activeAt: parseDate(row.active_at || row.actve_at),
            reactivatedAt: parseDate(row.reactivated_at),
          };

          await tx.insert(patientsTable).values(patientData);

          processedCount++;
          if (processedCount % 10 === 0) {
            console.log(
              `📝 Processados ${processedCount}/${data.length} registros...`,
            );
          }
        } catch (error) {
          console.error(
            `❌ Erro ao processar registro ${processedCount + 1}:`,
            error,
          );
          console.error("Dados do registro:", row);
          throw error;
        }
      }
    });

    console.log(
      `✅ Importação concluída! ${data.length} pacientes importados com sucesso.`,
    );
    console.log(`📊 Estatísticas:`);
    console.log(`   • ${validSellerCount} pacientes com seller_id válido`);
    console.log(`   • ${validClinicCount} pacientes com clinic_id válido`);
  } catch (error) {
    console.error("❌ Erro durante a importação:", error);
    throw error;
  }
}

importPatients().catch((err) => {
  console.error("Erro na importação:", err);
});
