'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Trash2, MapPin } from 'lucide-react';
import { useViaCep } from '@/hooks/useViaCep';
import { ClienteFormData } from '@/lib/validations/cliente';

interface EnderecoFormProps {
  form: UseFormReturn<ClienteFormData>;
  index: number;
  onRemove: () => void;
  canRemove: boolean;
}

export function EnderecoForm({ form, index, onRemove, canRemove }: EnderecoFormProps) {
  const { buscarCep, formatarCep, validarCep, loading: cepLoading, error: cepError } = useViaCep();

  return (
    <Card className="relative">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <CardTitle className="text-lg">Endereço {index + 1}</CardTitle>
          </div>
          {canRemove && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRemove}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          Informações de endereço do cliente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo de Endereço */}
        <FormField
          control={form.control}
          name={`enderecos.${index}.tipo`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Endereço</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="RESIDENCIAL">Residencial</SelectItem>
                  <SelectItem value="COMERCIAL">Comercial</SelectItem>
                  <SelectItem value="CORRESPONDENCIA">Correspondência</SelectItem>
                  <SelectItem value="ENTREGA">Entrega</SelectItem>
                  <SelectItem value="COBRANCA">Cobrança</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* CEP */}
        <FormField
          control={form.control}
          name={`enderecos.${index}.cep`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>CEP</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="00000-000" 
                    {...field}
                    onChange={async (e) => {
                      const valor = e.target.value;
                      const cepFormatado = formatarCep(valor);
                      field.onChange(cepFormatado);
                      
                      // Busca automaticamente quando CEP estiver completo
                      if (validarCep(valor)) {
                        const dadosEndereco = await buscarCep(valor);
                        if (dadosEndereco) {
                          form.setValue(`enderecos.${index}.logradouro`, dadosEndereco.logradouro || dadosEndereco.endereco);
                          form.setValue(`enderecos.${index}.bairro`, dadosEndereco.bairro);
                          form.setValue(`enderecos.${index}.cidade`, dadosEndereco.cidade);
                          form.setValue(`enderecos.${index}.estado`, dadosEndereco.estado);
                        }
                      }
                    }}
                    disabled={cepLoading}
                  />
                  {cepLoading && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                </div>
              </FormControl>
              {cepError && (
                <p className="text-sm text-red-500">{cepError}</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Logradouro e Número */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name={`enderecos.${index}.logradouro`}
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Logradouro</FormLabel>
                <FormControl>
                  <Input placeholder="Rua, Avenida, Travessa..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`enderecos.${index}.numero`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input placeholder="123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Bairro */}
        <FormField
          control={form.control}
          name={`enderecos.${index}.bairro`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bairro</FormLabel>
              <FormControl>
                <Input placeholder="Nome do bairro" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Complemento */}
        <FormField
          control={form.control}
          name={`enderecos.${index}.complemento`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Complemento</FormLabel>
              <FormControl>
                <Input placeholder="Apartamento, bloco, sala, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cidade e Estado */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name={`enderecos.${index}.cidade`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input placeholder="Cidade" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`enderecos.${index}.estado`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Input placeholder="UF" {...field} maxLength={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Informações Adicionais */}
        <FormField
          control={form.control}
          name={`enderecos.${index}.informacoesAdicionais`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Informações Adicionais</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ponto de referência, observações sobre o endereço, etc."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Endereço Principal */}
        <FormField
          control={form.control}
          name={`enderecos.${index}.principal`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.checked);
                    // Se este endereço for marcado como principal, desmarcar os outros
                    if (e.target.checked) {
                      const enderecos = form.getValues('enderecos');
                      enderecos.forEach((_, i) => {
                        if (i !== index) {
                          form.setValue(`enderecos.${i}.principal`, false);
                        }
                      });
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal">
                  Endereço principal
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  Este será o endereço padrão para correspondências
                </p>
              </div>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}