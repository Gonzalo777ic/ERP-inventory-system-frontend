import { Link, useSearchParams } from "react-router-dom";
import { ClipboardList, FileText, ShoppingBag } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { SalesCommercialService } from "../../api/services/salesCommercialService";
import { SalesOrdersPanel } from "./SalesOrdersPanel";
import { SalesQuotationsPanel } from "./SalesQuotationsPanel";

const TAB_QUOTATIONS = "quotations";
const TAB_ORDERS = "orders";

export default function SalesAppPage() {
  const [params, setParams] = useSearchParams();
  const rawTab = params.get("tab");
  const tab =
    rawTab === TAB_ORDERS || rawTab === TAB_QUOTATIONS
      ? rawTab
      : TAB_QUOTATIONS;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Ventas</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Cotizaciones y pedidos comerciales.
            {SalesCommercialService.isMockMode()
              ? " (fixtures locales — sin API)."
              : ""}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/sales/registry">
              <ClipboardList className="h-5 w-5" />
              Registro fiscal
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/crm">
              <FileText className="h-5 w-5" />
              Ir a CRM
            </Link>
          </Button>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setParams(value === TAB_QUOTATIONS ? {} : { tab: value });
        }}
      >
        <TabsList>
          <TabsTrigger value={TAB_QUOTATIONS}>Cotizaciones</TabsTrigger>
          <TabsTrigger value={TAB_ORDERS}>Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value={TAB_QUOTATIONS} className="mt-4">
          <div className="rounded-lg bg-card shadow-xl overflow-hidden border border-border">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Cotizaciones</h2>
            </div>
            <SalesQuotationsPanel />
          </div>
        </TabsContent>

        <TabsContent value={TAB_ORDERS} className="mt-4">
          <div className="rounded-lg bg-card shadow-xl overflow-hidden border border-border">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <ClipboardList className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Pedidos</h2>
            </div>
            <SalesOrdersPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
