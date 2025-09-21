"use client";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { z } from "zod";

//import { Button } from "@/components/ui/button";
//import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Schema de validação simplificado para navegadores antigos
const convenioSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  phoneNumber: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  rgNumber: z.string().min(1, "RG é obrigatório"),
  cpfNumber: z.string().min(11, "CPF é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  homeNumber: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "UF é obrigatória"),
  clinicId: z.string().min(1, "Unidade é obrigatória"),
  cardType: z.enum(["enterprise", "personal"]),
  Enterprise: z.string().optional(),
  numberCards: z.string().min(1, "Quantidade de cartões é obrigatória"),
  dependents1: z.string().optional(),
  dependents2: z.string().optional(),
  dependents3: z.string().optional(),
  dependents4: z.string().optional(),
  dependents5: z.string().optional(),
  dependents6: z.string().optional(),
  observation: z.string().optional(),
  acceptTerms: z.boolean().refine((value) => value === true, {
    message: "Você deve aceitar os termos de uso",
  }),
});

type ConvenioForm = z.infer<typeof convenioSchema>;

// Interface para clínicas
interface Clinic {
  id: string;
  name: string;
}

const ufs = [
  "PE",
  "CE",
  "BA",
  "PB",
  "PI",
  "RN",
  "SE",
  "TO",
  "MA",
  "AC",
  "AL",
  "AP",
  "AM",
  "DF",
  "ES",
  "GO",
  "MT",
  "MS",
  "MG",
  "PA",
  "PR",
  "RJ",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
];

// Função para validar CPF
const isValidCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, "");
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder >= 10 ? 0 : remainder;
  if (digit1 !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const digit2 = remainder >= 10 ? 0 : remainder;
  return digit2 === parseInt(cleanCPF.charAt(10));
};

// Função para verificar CPF duplicado
const checkCPFExists = async (cpf: string): Promise<boolean> => {
  try {
    const cleanCPF = cpf.replace(/\D/g, "");
    if (cleanCPF.length !== 11) return false;

    const response = await fetch("/api/check-cpf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cpf: cleanCPF }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.exists;
    }
    return false;
  } catch {
    return false;
  }
};

function ConvenioLegacy() {
  const searchParams = useSearchParams();
  const defaultClinicId = searchParams?.get("clinicId") || "";

  // Estados do formulário
  const [formData, setFormData] = useState<ConvenioForm>({
    name: "",
    birthDate: "2007-09-01",
    phoneNumber: "",
    rgNumber: "",
    cpfNumber: "",
    address: "",
    homeNumber: "",
    city: "",
    state: "",
    cardType: "personal",
    Enterprise: "",
    numberCards: "1",
    clinicId: defaultClinicId,
    dependents1: "",
    dependents2: "",
    dependents3: "",
    dependents4: "",
    dependents5: "",
    dependents6: "",
    observation: "",
    acceptTerms: false,
  });

  // Estados de controle
  const [errors, setErrors] = useState<
    Partial<Record<keyof ConvenioForm, string>>
  >({});
  const [loading, setLoading] = useState(false);
  const [checkingCPF, setCheckingCPF] = useState(false);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Carregar clínicas
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        setLoadingClinics(true);
        const response = await fetch("/api/admin/clinics");
        if (response.ok) {
          const data = await response.json();
          setClinics(data);
          if (
            defaultClinicId &&
            data.some((clinic: Clinic) => clinic.id === defaultClinicId)
          ) {
            setFormData((prev) => ({ ...prev, clinicId: defaultClinicId }));
          }
        }
      } catch (error) {
        console.error("Erro ao carregar clínicas:", error);
      } finally {
        setLoadingClinics(false);
      }
    };
    fetchClinics();
  }, [defaultClinicId]);

  // Buscar vendedor externo quando clínica for selecionada
  useEffect(() => {
    const fetchExternalSeller = async (clinicId: string) => {
      if (!clinicId) return;
      try {
        const response = await fetch(
          `/api/public/sellers?clinicId=${clinicId}`,
        );
        if (response.ok) {
          const data = await response.json();
          if (data.length === 0) {
            alert(
              "Ainda não é possível realizar o cadastro externo nesta unidade. Por favor, entre em contato com o suporte.",
            );
          }
        }
      } catch (error) {
        console.error("Erro ao carregar vendedores:", error);
      }
    };
    if (formData.clinicId) {
      fetchExternalSeller(formData.clinicId);
    }
  }, [formData.clinicId]);

  // Formatadores
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6)
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9)
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Handlers
  const handleInputChange = (
    field: keyof ConvenioForm,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCPFChange = async (value: string) => {
    const formatted = formatCPF(value);
    handleInputChange("cpfNumber", formatted);

    const numbers = value.replace(/\D/g, "");
    if (numbers.length === 11 && isValidCPF(numbers)) {
      setCheckingCPF(true);
      try {
        const exists = await checkCPFExists(numbers);
        if (exists) {
          setErrors((prev) => ({
            ...prev,
            cpfNumber: "Este CPF já está cadastrado no sistema",
          }));
        }
      } finally {
        setCheckingCPF(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validação
    const validation = convenioSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Partial<Record<keyof ConvenioForm, string>> = {};
      validation.error.errors.forEach((error) => {
        if (error.path[0]) {
          fieldErrors[error.path[0] as keyof ConvenioForm] = error.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/convenio-app", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          sellerId: "", // Será definido pela API
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        setShowPaymentDialog(true); // Abrir dialog de pagamento após sucesso
        setFormData({
          name: "",
          birthDate: "2007-09-01",
          phoneNumber: "",
          rgNumber: "",
          cpfNumber: "",
          address: "",
          homeNumber: "",
          city: "",
          state: "",
          cardType: "personal",
          Enterprise: "",
          numberCards: "1",
          clinicId: defaultClinicId,
          dependents1: "",
          dependents2: "",
          dependents3: "",
          dependents4: "",
          dependents5: "",
          dependents6: "",
          observation: "",
          acceptTerms: false,
        });
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Erro ao enviar solicitação");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao enviar solicitação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="convenio-legacy">
      <style jsx global>{`
        /* Estilos específicos para navegadores antigos */

        .convenio-legacy {
          min-height: 100vh;
          background: #4f46e5;
          background: -webkit-linear-gradient(left, #4f46e5, #10b981);
          background: -o-linear-gradient(left, #4f46e5, #10b981);
          background: -moz-linear-gradient(left, #4f46e5, #10b981);
          background: linear-gradient(to right, #4f46e5, #10b981);
          font-family: Arial, Helvetica, sans-serif;
        }

        .header-legacy {
          background: rgba(255, 255, 255, 0.8);
          padding: 16px 0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-items {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          background: transparent;
          border: none;
          color: #374151;
          text-decoration: none;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .back-button:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: #065f46;
        }

        .main-container {
          max-width: 1024px;
          margin: 0 auto;
          padding: 32px 16px;
        }

        .page-title {
          text-align: center;
          margin-bottom: 32px;
        }

        .page-title h1 {
          font-size: 1.875rem;
          font-weight: bold;
          color: white;
          margin-bottom: 8px;
        }

        .page-title p {
          color: white;
          opacity: 0.9;
        }

        .form-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden;
        }

        .form-header {
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .form-title {
          text-align: center;
          font-size: 1.25rem;
          font-weight: 600;
          color: #064e3b;
          margin: 0;
        }

        .form-content {
          padding: 24px;
        }

        .form-section {
          margin-bottom: 32px;
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #065f46;
          margin-bottom: 16px;
        }

        .form-grid {
          display: block;
          margin-bottom: 16px;
        }

        @media (min-width: 768px) {
          .form-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
          }

          .form-grid .form-group {
            flex: 1;
            min-width: calc(50% - 8px);
          }
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #064e3b;
          margin-bottom: 4px;
        }

        .form-input,
        .form-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
        }

        .form-input.error,
        .form-select.error {
          border-color: #ef4444;
        }

        .error-message {
          margin-top: 4px;
          font-size: 0.875rem;
          color: #ef4444;
        }

        .checkbox-group {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 16px;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 8px;
        }

        .checkbox-input {
          margin-top: 2px;
          width: 16px;
          height: 16px;
        }

        .checkbox-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #064e3b;
          line-height: 1.4;
        }

        .contract-link {
          color: #059669;
          text-decoration: underline;
          font-weight: 500;
          margin-bottom: 12px;
          display: inline-block;
        }

        .contract-link:hover {
          color: #047857;
        }

        .submit-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        @media (min-width: 640px) {
          .submit-section {
            flex-direction: row;
            justify-content: center;
          }
        }

        .submit-button {
          width: 100%;
          max-width: 300px;
          padding: 12px 24px;
          background: #059669;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .submit-button:hover:not(:disabled) {
          background: #047857;
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .info-button {
          width: 100%;
          max-width: 200px;
          padding: 12px 24px;
          background: transparent;
          color: #059669;
          border: 1px solid #059669;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .info-button:hover {
          background: #059669;
          color: white;
        }

        .success-message {
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          color: #166534;
        }

        .payment-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .payment-content {
          background: white;
          border-radius: 8px;
          padding: 16px;
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .payment-header {
          margin-bottom: 12px;
          text-align: center;
        }

        .payment-title {
          font-size: 1 rem;
          font-weight: 600;
          color: #064e3b;
          margin-bottom: 8px;
        }

        .payment-info {
          text-align: center;
          margin-bottom: 12px;
        }

        .qr-image {
          max-width: 200px;
          height: auto;
          margin: 0 auto 12px;
          display: block;
        }

        .close-button {
          width: 100%;
          padding: 8px 16px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .close-button:hover {
          background: #4b5563;
        }

        .loading-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #059669;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-left: 8px;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* Header */}
      <header className="header-legacy">
        <div className="header-content">
          <div className="header-items">
            <Link href="/" className="back-button">
              <ArrowLeft
                style={{ width: "16px", height: "16px", marginRight: "8px" }}
              />
              Voltar aa
            </Link>
            <div className="logo-section">
              <Image
                src="/logo03.svg"
                alt="Mais Saúde Lasac Logo"
                width={40}
                height={30}
                className="h-8 w-auto object-contain"
              />
              <h1 className="logo-title">Mais Saúde Lasac</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="main-container">
        <div className="page-title">
          <h1>Seja um Conveniado</h1>
          <p>
            Preencha seus dados para solicitar seu convênio. Nossa equipe
            entrará em contato para finalizar o processo.
          </p>
        </div>

        {showSuccess && (
          <div className="success-message">
            <strong>✅ Solicitação enviada com sucesso!</strong>
            <p>
              Nossa equipe entrará em contato em breve para finalizar seu
              convênio.
            </p>
          </div>
        )}

        <div className="form-card">
          <div className="form-header">
            <h2 className="form-title">Formulário de Solicitação</h2>
          </div>

          <div className="form-content">
            <form onSubmit={handleSubmit}>
              {/* Dados Pessoais */}
              <div className="form-section">
                <h3 className="section-title">Dados Pessoais</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <Label htmlFor="name" className="form-label">
                      Nome Titular
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className={`form-input ${errors.name ? "error" : ""}`}
                      placeholder="Digite o nome completo"
                    />
                    {errors.name && (
                      <div className="error-message">{errors.name}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <Label htmlFor="birthDate" className="form-label">
                      Data de Nascimento
                    </Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) =>
                        handleInputChange("birthDate", e.target.value)
                      }
                      className={`form-input ${errors.birthDate ? "error" : ""}`}
                    />
                    {errors.birthDate && (
                      <div className="error-message">{errors.birthDate}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <Label htmlFor="phoneNumber" className="form-label">
                      Telefone
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="text"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        handleInputChange(
                          "phoneNumber",
                          formatPhone(e.target.value),
                        )
                      }
                      className={`form-input ${errors.phoneNumber ? "error" : ""}`}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                    {errors.phoneNumber && (
                      <div className="error-message">{errors.phoneNumber}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <Label htmlFor="rgNumber" className="form-label">
                      RG
                    </Label>
                    <Input
                      id="rgNumber"
                      type="text"
                      value={formData.rgNumber}
                      onChange={(e) =>
                        handleInputChange(
                          "rgNumber",
                          e.target.value.replace(/\D/g, ""),
                        )
                      }
                      className={`form-input ${errors.rgNumber ? "error" : ""}`}
                      placeholder="Digite apenas números"
                    />
                    {errors.rgNumber && (
                      <div className="error-message">{errors.rgNumber}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <Label htmlFor="cpfNumber" className="form-label">
                      CPF
                      {checkingCPF && <span className="loading-spinner"></span>}
                    </Label>
                    <Input
                      id="cpfNumber"
                      type="text"
                      value={formData.cpfNumber}
                      onChange={(e) => handleCPFChange(e.target.value)}
                      className={`form-input ${errors.cpfNumber ? "error" : ""}`}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                    {errors.cpfNumber && (
                      <div className="error-message">{errors.cpfNumber}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="form-section">
                <h3 className="section-title">Endereço</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <Label htmlFor="address" className="form-label">
                      Endereço
                    </Label>
                    <Input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      className={`form-input ${errors.address ? "error" : ""}`}
                      placeholder="Rua, Avenida, número"
                    />
                    {errors.address && (
                      <div className="error-message">{errors.address}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <Label htmlFor="homeNumber" className="form-label">
                      Bairro
                    </Label>
                    <Input
                      id="homeNumber"
                      type="text"
                      value={formData.homeNumber}
                      onChange={(e) =>
                        handleInputChange("homeNumber", e.target.value)
                      }
                      className={`form-input ${errors.homeNumber ? "error" : ""}`}
                      placeholder="Digite o nome do bairro"
                    />
                    {errors.homeNumber && (
                      <div className="error-message">{errors.homeNumber}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <Label htmlFor="city" className="form-label">
                      Cidade
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                      className={`form-input ${errors.city ? "error" : ""}`}
                      placeholder="Digite o nome da cidade"
                    />
                    {errors.city && (
                      <div className="error-message">{errors.city}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <Label htmlFor="state" className="form-label">
                      UF
                    </Label>
                    <select
                      id="state"
                      value={formData.state}
                      onChange={(e) =>
                        handleInputChange("state", e.target.value)
                      }
                      className={`form-select ${errors.state ? "error" : ""}`}
                    >
                      <option value="">Selecione a UF</option>
                      {ufs.map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                    {errors.state && (
                      <div className="error-message">{errors.state}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Informações do Convênio */}
              <div className="form-section">
                <h3 className="section-title">Informações do Convênio</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <Label htmlFor="clinicId" className="form-label">
                      Unidade
                      {loadingClinics && (
                        <span className="loading-spinner"></span>
                      )}
                    </Label>
                    <select
                      id="clinicId"
                      value={formData.clinicId}
                      onChange={(e) =>
                        handleInputChange("clinicId", e.target.value)
                      }
                      className={`form-select ${errors.clinicId ? "error" : ""}`}
                      disabled={loadingClinics}
                    >
                      <option value="">Selecione a unidade</option>
                      {clinics.map((clinic) => (
                        <option key={clinic.id} value={clinic.id}>
                          {clinic.name}
                        </option>
                      ))}
                    </select>
                    {errors.clinicId && (
                      <div className="error-message">{errors.clinicId}</div>
                    )}
                  </div>

                  <div className="form-group">
                    <Label htmlFor="cardType" className="form-label">
                      Tipo de Cartão
                    </Label>
                    <select
                      id="cardType"
                      value={formData.cardType}
                      onChange={(e) =>
                        handleInputChange(
                          "cardType",
                          e.target.value as "enterprise" | "personal",
                        )
                      }
                      className="form-select"
                    >
                      <option value="personal">INDIVIDUAL</option>
                      <option value="enterprise">EMPRESA</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <Label htmlFor="Enterprise" className="form-label">
                      Empresa
                    </Label>
                    <Input
                      id="Enterprise"
                      type="text"
                      value={formData.Enterprise}
                      onChange={(e) =>
                        handleInputChange("Enterprise", e.target.value)
                      }
                      className="form-input"
                      placeholder="Nome da empresa"
                      disabled={formData.cardType !== "enterprise"}
                    />
                  </div>

                  <div className="form-group">
                    <Label htmlFor="numberCards" className="form-label">
                      Quantidade de Cartões
                    </Label>
                    <Input
                      id="numberCards"
                      type="number"
                      min="1"
                      max="6"
                      value={formData.numberCards}
                      onChange={(e) =>
                        handleInputChange("numberCards", e.target.value)
                      }
                      className={`form-input ${errors.numberCards ? "error" : ""}`}
                      placeholder="1"
                    />
                    {errors.numberCards && (
                      <div className="error-message">{errors.numberCards}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dependentes */}
              <div className="form-section">
                <h3 className="section-title">Dependentes (Opcional)</h3>
                <div className="form-grid">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="form-group">
                      <Label
                        htmlFor={`dependents${num}`}
                        className="form-label"
                      >
                        Dependente {num}
                      </Label>
                      <Input
                        id={`dependents${num}`}
                        type="text"
                        value={
                          formData[
                            `dependents${num}` as keyof ConvenioForm
                          ] as string
                        }
                        onChange={(e) =>
                          handleInputChange(
                            `dependents${num}` as keyof ConvenioForm,
                            e.target.value,
                          )
                        }
                        className="form-input"
                        placeholder="Nome do dependente (opcional)"
                      />
                    </div>
                  ))}

                  <div className="form-group">
                    <Label htmlFor="observation" className="form-label">
                      Observações
                    </Label>
                    <Input
                      id="observation"
                      type="text"
                      value={formData.observation}
                      onChange={(e) =>
                        handleInputChange("observation", e.target.value)
                      }
                      className="form-input"
                      placeholder="Observações adicionais (opcional)"
                    />
                  </div>
                </div>
              </div>

              {/* Termos e Condições */}
              <div className="form-section">
                <h3 className="section-title">Termos e Condições</h3>
                <div className="checkbox-group">
                  <div>
                    <a
                      href="/contrato"
                      target="_blank"
                      className="contract-link"
                    >
                      📋 Visualizar Contrato e Termos de Uso
                    </a>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                      }}
                    >
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        checked={formData.acceptTerms}
                        onChange={(e) =>
                          handleInputChange("acceptTerms", e.target.checked)
                        }
                        className="checkbox-input"
                      />
                      <Label htmlFor="acceptTerms" className="checkbox-label">
                        Li e aceito os termos de uso e política de privacidade
                      </Label>
                    </div>
                    {errors.acceptTerms && (
                      <div className="error-message">{errors.acceptTerms}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Botões */}
              <div className="submit-section">
                <button
                  type="submit"
                  disabled={loading}
                  className="submit-button"
                >
                  {loading ? "Enviando..." : "Solicitar Convênio"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPaymentDialog(true)}
                  className="info-button"
                >
                  💳 Informações de Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Dialog de Pagamento */}
      {showPaymentDialog && (
        <div
          className="payment-dialog"
          onClick={() => setShowPaymentDialog(false)}
        >
          <div className="payment-content" onClick={(e) => e.stopPropagation()}>
            <div className="payment-header">
              <h3 className="payment-title">💳 Informações de Pagamento</h3>
            </div>

            <div className="payment-info">
              <p>
                <strong>Chave PIX CPF/CNPJ:</strong> 041.347.194-29
              </p>
              <p>
                <strong>whatsapp:</strong> (87) 99925-2333
              </p>
              <p>
                <strong>Valor:</strong> R$ 100,00
              </p>

              <p style={{ marginTop: "16px" }}>
                Escaneie o QR Code abaixo para efetuar o pagamento:
              </p>

              <Image
                src="/QR-pix.jpg"
                alt="QR Code PIX"
                width={200}
                height={200}
                className="qr-image"
              />

              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Após o pagamento, envie o comprovante para o whatsapp acima para
                confirmar e ativar seu convênio.
              </p>
            </div>

            <button
              onClick={() => setShowPaymentDialog(false)}
              className="close-button"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConvenioLegacy;
