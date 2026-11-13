"use client";

import { useState } from "react";
import { BatteryChargingIcon, ImagePlusIcon, PencilIcon, PlusIcon, StarIcon, SunIcon, Trash2Icon, ZapIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { kobo, naira } from "@/lib/format";
import { sizeSystem, type Equipment, type EquipmentKind, type SizingSettings } from "@/lib/calc/size-system";
import { loadPresets, type Appliance, type ApplianceCategory } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { goldButton } from "@/components/shared/styles";
import { saveAppliances, saveEquipment, saveSettings, setDefaultEquipment, type ActionResult } from "@/lib/actions";
import { useRouter } from "next/navigation";

const report = (res: ActionResult, success: string) => (res.ok ? toast.success(success) : toast.error(res.error));
const toInput = (e: Equipment) => ({ id: e.id, kind: e.kind, name: e.name, spec: e.spec, priceKobo: e.priceKobo, isDefault: e.isDefault, active: e.active });

const KIND: Record<EquipmentKind, { label: string; unit: string; icon: typeof SunIcon }> = {
  panel: { label: "Solar panels", unit: "W", icon: SunIcon },
  battery: { label: "Batteries", unit: "kWh", icon: BatteryChargingIcon },
  inverter: { label: "Inverters", unit: "kVA", icon: ZapIcon },
};
const CATEGORIES: ApplianceCategory[] = ["Cooling", "Kitchen", "Entertainment", "Lighting", "Office", "Water & laundry", "Security"];

export function PricingManager({
  equipment: initialEquipment,
  appliances: initialAppliances,
  settings: initialSettings,
}: {
  equipment: Equipment[];
  appliances: Appliance[];
  settings: SizingSettings;
}) {
  const [equipment, setEquipment] = useState(initialEquipment);
  const [appliances, setAppliances] = useState(initialAppliances);
  const [settings, setSettings] = useState(initialSettings);
  const [editing, setEditing] = useState<Equipment | null>(null);

  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const sample = sizeSystem(loadPresets.residential.lines, loadPresets.residential.backupHours, settings, equipment);
  const updateEq = async (id: string, patch: Partial<Equipment>) => {
    const item = equipment.find((e) => e.id === id);
    if (!item) return;
    setEquipment((es) => es.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    const res = await saveEquipment(toInput({ ...item, ...patch }));
    report(res, patch.active === false ? `${item.name} hidden from the calculator` : `${item.name} saved`);
    if (!res.ok) setEquipment((es) => es.map((e) => (e.id === id ? item : e)));
    router.refresh();
  };

  return (
    <Tabs defaultValue="equipment" className="gap-6">
      <TabsList>
        <TabsTrigger value="equipment" className="px-4">Equipment</TabsTrigger>
        <TabsTrigger value="appliances" className="px-4">Appliances</TabsTrigger>
        <TabsTrigger value="settings" className="px-4">Sizing &amp; deposit</TabsTrigger>
      </TabsList>

      {/* EQUIPMENT */}
      <TabsContent value="equipment" className="space-y-6">
        {(Object.keys(KIND) as EquipmentKind[]).map((k) => {
          const K = KIND[k];
          const rows = equipment.filter((e) => e.kind === k).sort((a, b) => a.spec - b.spec);
          return (
            <section key={k} className="rounded-2xl border bg-card">
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <K.icon className="size-4 text-gold-text" />
                <p className="font-semibold">{K.label}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() => setEditing({ id: `new-${Date.now()}`, kind: k, name: "", spec: 0, priceKobo: 0, active: true })}
                >
                  <PlusIcon /> Add
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Product</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Price</TableHead>
                    {k !== "inverter" && <TableHead className="hidden sm:table-cell">Calculator default</TableHead>}
                    <TableHead>Active</TableHead>
                    <TableHead className="w-12 pr-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((e) => (
                    <TableRow key={e.id} className={cn(!e.active && "opacity-55")}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 place-items-center rounded-lg border bg-muted/60 text-muted-foreground">
                            <K.icon className="size-4" />
                          </span>
                          <span className="font-medium">{e.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {e.spec} {K.unit}
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">{naira(e.priceKobo)}</TableCell>
                      {k !== "inverter" && (
                        <TableCell className="hidden sm:table-cell">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={e.isDefault ? "Default" : "Make default"}
                            onClick={async () => {
                              const res = await setDefaultEquipment({ id: e.id });
                              if (res.ok) setEquipment((es) => es.map((x) => (x.kind === k ? { ...x, isDefault: x.id === e.id, active: x.id === e.id ? true : x.active } : x)));
                              report(res, `${e.name} is now the calculator default`);
                              router.refresh();
                            }}
                          >
                            <StarIcon className={cn(e.isDefault ? "fill-gold text-gold" : "text-muted-foreground")} />
                          </Button>
                        </TableCell>
                      )}
                      <TableCell>
                        <Switch checked={e.active} onCheckedChange={(active) => updateEq(e.id, { active })} aria-label={`${e.name} active`} />
                      </TableCell>
                      <TableCell className="pr-4">
                        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${e.name}`} onClick={() => setEditing(e)}>
                          <PencilIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          );
        })}
      </TabsContent>

      {/* APPLIANCES */}
      <TabsContent value="appliances">
        <section className="rounded-2xl border bg-card">
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
            <div>
              <p className="font-semibold">Appliance catalog</p>
              <p className="text-xs text-muted-foreground">What visitors can pick in the calculator, with typical wattage and daily hours.</p>
            </div>
            <Button
              size="sm"
              className={goldButton}
              onClick={() => setAppliances((a) => [{ id: `ap-${Date.now()}`, name: "New appliance", watts: 100, hours: 4, category: "Office" }, ...a])}
            >
              <PlusIcon /> Add appliance
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Name</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead>Watts</TableHead>
                <TableHead>Hours/day</TableHead>
                <TableHead className="w-12 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {appliances.map((a) => {
                const set = (patch: Partial<Appliance>) => setAppliances((as) => as.map((x) => (x.id === a.id ? { ...x, ...patch } : x)));
                return (
                  <TableRow key={a.id}>
                    <TableCell className="pl-4">
                      <Input value={a.name} onChange={(e) => set({ name: e.target.value })} className="h-8 min-w-40" aria-label="Name" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Select value={a.category} onValueChange={(v) => set({ category: v as ApplianceCategory })}>
                        <SelectTrigger className="h-8 w-40" aria-label="Category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={a.watts} onChange={(e) => set({ watts: Number(e.target.value) })} className="h-8 w-24 tabular-nums" aria-label="Watts" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" step={0.5} value={a.hours} onChange={(e) => set({ hours: Number(e.target.value) })} className="h-8 w-20 tabular-nums" aria-label="Hours per day" />
                    </TableCell>
                    <TableCell className="pr-4">
                      <Button variant="ghost" size="icon-sm" aria-label={`Delete ${a.name}`} onClick={() => setAppliances((as) => as.filter((x) => x.id !== a.id))}>
                        <Trash2Icon className="text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="flex justify-end border-t p-4">
            <Button
              className={goldButton}
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                const res = await saveAppliances(appliances.map((a) => ({ id: a.id, name: a.name, watts: Math.round(a.watts), hours: a.hours, category: a.category })));
                setSaving(false);
                report(res, "Appliance catalog saved");
                router.refresh();
              }}
            >
              Save changes
            </Button>
          </div>
        </section>
      </TabsContent>

      {/* SETTINGS */}
      <TabsContent value="settings">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-6 rounded-2xl border bg-card p-5 sm:p-6">
            <Group title="Payments">
              <Field label="Deposit" suffix="%" help="Charged online when a customer accepts a quote." value={settings.depositPercent} onChange={(v) => setSettings({ ...settings, depositPercent: v })} />
              <Field label="Installation" suffix="%" help="Added on top of equipment cost." value={settings.installPercent * 100} onChange={(v) => setSettings({ ...settings, installPercent: v / 100 })} />
              <Field label="Cabling & protection" suffix="%" help="Breakers, surge protection, cabling, mounting." value={settings.accessoriesPercent * 100} onChange={(v) => setSettings({ ...settings, accessoriesPercent: v / 100 })} />
            </Group>
            <Group title="Sizing assumptions">
              <Field label="Peak sun hours" suffix="h" step={0.1} help="Average for Nigeria is 4.5–6." value={settings.peakSunHours} onChange={(v) => setSettings({ ...settings, peakSunHours: v })} />
              <Field label="System efficiency" suffix="%" help="Wiring, heat and dust losses." value={Math.round(settings.systemEfficiency * 100)} onChange={(v) => setSettings({ ...settings, systemEfficiency: v / 100 })} />
              <Field label="Battery depth of discharge" suffix="%" help="80–90% for LiFePO4." value={Math.round(settings.batteryDod * 100)} onChange={(v) => setSettings({ ...settings, batteryDod: v / 100 })} />
              <Field label="Inverter efficiency" suffix="%" value={Math.round(settings.inverterEfficiency * 100)} onChange={(v) => setSettings({ ...settings, inverterEfficiency: v / 100 })} />
              <Field label="Inverter safety factor" suffix="×" step={0.05} help="Headroom for surge loads." value={settings.inverterSafetyFactor} onChange={(v) => setSettings({ ...settings, inverterSafetyFactor: v })} />
              <Field label="Power factor" step={0.05} value={settings.powerFactor} onChange={(v) => setSettings({ ...settings, powerFactor: v })} />
            </Group>
            <div className="flex justify-end gap-2 border-t pt-5">
              <Button variant="ghost" onClick={() => setSettings(initialSettings)}>
                Reset
              </Button>
              <Button
                className={goldButton}
                disabled={saving}
                onClick={async () => {
                  setSaving(true);
                  const res = await saveSettings(settings);
                  setSaving(false);
                  report(res, "Settings saved. The calculator uses them now.");
                  router.refresh();
                }}
              >
                Save settings
              </Button>
            </div>
          </section>
          <aside className="gold-border rounded-2xl p-5 lg:sticky lg:top-24">
            <p className="text-xs tracking-[0.2em] text-gold-text uppercase">Live preview</p>
            <p className="mt-2 text-sm text-muted-foreground">A typical home (residential preset) is now estimated at</p>
            <p className="mt-1 font-display text-3xl font-extrabold text-gold-gradient">{naira(sample.cost.total)}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <li>{sample.inverter ? `${sample.inverter.spec} kVA inverter` : "Custom inverter"}</li>
              <li>
                {sample.panels} × {sample.panel?.spec}W panels
              </li>
              <li>
                {sample.batteryUnits} × {sample.battery?.spec}kWh batteries
              </li>
              <li>Deposit {naira(sample.depositKobo)}</li>
            </ul>
          </aside>
        </div>
      </TabsContent>

      <EquipmentDialog
        item={editing}
        onClose={() => setEditing(null)}
        onSave={async (e) => {
          const res = await saveEquipment(toInput(e));
          report(res, `${e.name} saved`);
          if (!res.ok) return;
          setEquipment((es) => (es.some((x) => x.id === e.id) ? es.map((x) => (x.id === e.id ? e : x)) : [...es, e]));
          setEditing(null);
          router.refresh();
        }}
      />
    </Tabs>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-4 font-display text-sm font-bold tracking-[0.12em] uppercase">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({ label, value, onChange, suffix, help, step = 1 }: { label: string; value: number; onChange: (v: number) => void; suffix?: string; help?: string; step?: number }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="pr-9 tabular-nums" aria-label={label} />
        {suffix && <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span>}
      </div>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

function EquipmentDialog({ item, onClose, onSave }: { item: Equipment | null; onClose: () => void; onSave: (e: Equipment) => void }) {
  const [draft, setDraft] = useState<Equipment | null>(item);
  const [lastItem, setLastItem] = useState(item);
  if (item !== lastItem) {
    setLastItem(item);
    setDraft(item);
  }
  if (!draft) return null;
  const K = KIND[draft.kind];
  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{draft.name ? `Edit ${draft.name}` : `Add ${K.label.toLowerCase().replace(/s$/, "")}`}</DialogTitle>
          <DialogDescription>Price changes apply to new calculations and quotes. Sent quotes keep their prices.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => toast("Image upload", { description: "Product images go to ImageKit once it's connected." })}
            className="grid h-28 w-full place-items-center rounded-xl border-2 border-dashed text-sm text-muted-foreground transition hover:border-gold/60"
          >
            <span className="flex flex-col items-center gap-1">
              <ImagePlusIcon className="size-5" /> Upload product image
            </span>
          </button>
          <div className="space-y-2">
            <Label htmlFor="eq-name">Name</Label>
            <Input id="eq-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="eq-spec">Rating ({K.unit})</Label>
              <Input id="eq-spec" type="number" step={0.5} value={draft.spec} onChange={(e) => setDraft({ ...draft, spec: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eq-price">Price (₦)</Label>
              <Input id="eq-price" type="number" value={draft.priceKobo / 100} onChange={(e) => setDraft({ ...draft, priceKobo: kobo(Number(e.target.value)) })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className={goldButton} disabled={!draft.name || draft.spec <= 0 || draft.priceKobo <= 0} onClick={() => onSave(draft)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
