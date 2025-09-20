import { SidebarTrigger } from "@/components/ui/sidebar";

export const PageContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="w-full max-w-full space-y-1 p-1 pt-1 sm:space-y-1 sm:p-4 sm:pt-1">
      <SidebarTrigger className="mb-2" />
      {children}
    </div>
  );
};

export const PublicPageContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <div className="w-full max-w-full space-y-1 p-1 pt-1 sm:space-y-1 sm:p-4 sm:pt-1">
      {children}
    </div>
  );
};

export const PageHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex w-full max-w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      {children}
    </div>
  );
};

export const PageHeaderContent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <div className="w-full space-y-1">{children}</div>;
};

export const PageTitle = ({ children }: { children: React.ReactNode }) => {
  return <h1 className="text-xl font-bold sm:text-2xl">{children}</h1>;
};

export const PageDescription = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <p className="text-muted-foreground text-sm">{children}</p>;
};

export const PageActions = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
      {children}
    </div>
  );
};

export const PageContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="space-y-4 sm:space-y-6">{children}</div>;
};
