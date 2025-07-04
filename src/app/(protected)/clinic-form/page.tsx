import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { auth } from "@/lib/auth";

import ClinicForm from "./_components/form";

const ClinicFormPage = async () => {
  // se nao tiver cadastrdo nao pode deixar vir para ca
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/authentication");
  } // se nao tiver cadastrdo nao pode deixar vir para ca
  return (
    <div>
      <Dialog open={true}>
        <form>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-pink-950">
                Adicionar clínica
              </DialogTitle>
              <DialogDescription>
                Adicione uma clínica para que você possa gerenciar os pacientes
                e convenios.
              </DialogDescription>
            </DialogHeader>
            <ClinicForm />
          </DialogContent>
        </form>
      </Dialog>
    </div>
  );
};

export default ClinicFormPage;
