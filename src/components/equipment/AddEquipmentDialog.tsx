import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Package } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().optional().or(z.literal("")),
  rental_price: z.string().optional().or(z.literal("")),
  stock: z.string().optional().or(z.literal("")),
  internal_remark: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

export function AddEquipmentDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      rental_price: "",
      stock: "",
      internal_remark: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsPending(true);
    try {
      const { error } = await supabase
        .from('equipment')
        .insert([
          {
            name: data.name,
            code: data.code || null,
            rental_price: data.rental_price ? parseFloat(data.rental_price) : null,
            stock: data.stock ? parseInt(data.stock) : null,
            internal_remark: data.internal_remark || null,
          }
        ]);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['equipment'] });
      setOpen(false);
      form.reset();
      toast.success("Equipment added successfully");
    } catch (error: any) {
      console.error("Error adding equipment:", error);
      toast.error(error.message || "Failed to add equipment");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Package className="h-4 w-4" />
          Add Equipment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Equipment</DialogTitle>
          <DialogDescription>
            Fill in the details below to add new equipment to your inventory.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rental_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rental Price</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter rental price" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter stock" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="internal_remark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Internal Remark</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter internal remark" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Equipment
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}