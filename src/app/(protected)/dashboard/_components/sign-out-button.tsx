"use client";
import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const SignOutButton = () => {
  const router = useRouter();
  return (
    <Button
      variant="destructive"
      onClick={() =>
        authClient.signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/authentication");
            },
            onError: () => {
              toast.error("falha ao deslogar");
            },
          },
        })
      }
    >
      <LogOutIcon className="h-4 w-4" />
      Sign Out
    </Button>
  );
};

export default SignOutButton;
