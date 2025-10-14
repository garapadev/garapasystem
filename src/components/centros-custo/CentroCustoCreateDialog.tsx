"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export interface CentroCusto {
  id: string;
  codigo: string;
  nome: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (centro: CentroCusto) => void;
}

export function CentroCustoCreateDialog({ open, onOpenChange, onCreated }: Props) {
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [orcamentoAnual, setOrcamentoAnual] = useState<string>("");
  const [ativo, setAtivo] = useState(true);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setCodigo("");
    setNome("");
    setDescricao("");
    setResponsavel("");
    setOrcamentoAnual("");
    setAtivo(true);
  };

  const handleSubmit = async () => {
    if (!codigo || !nome) {
      toast.error("Preencha Código e Nome");
      return;
    }

    const payload: any = {
      codigo,
      nome,
      descricao: descricao || undefined,
      responsavel: responsavel || undefined,
      ativo,
    };

    if (orcamentoAnual) {
      const num = Number(orcamentoAnual);
      if (Number.isNaN(num) || num < 0) {
        toast.error("Orçamento anual inválido");
        return;
      }
      payload.orcamentoAnual = num;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/centros-custo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const created = await res.json();
        toast.success("Centro de custo criado");
        onCreated?.(created);
        resetForm();
        onOpenChange(false);
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error?.error || "Erro ao criar centro de custo");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de rede");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Centro de Custo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código *</Label>
              <Input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex: CC-001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do centro de custo" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável</Label>
              <Input id="responsavel" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Nome do responsável" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orcamentoAnual">Orçamento Anual</Label>
              <Input id="orcamentoAnual" type="number" min="0" step="0.01" value={orcamentoAnual} onChange={(e) => setOrcamentoAnual(e.target.value)} placeholder="Ex: 100000" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={ativo} onCheckedChange={setAtivo} />
            <Label>Ativo</Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? "Salvando..." : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}