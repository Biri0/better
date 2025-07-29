"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";

import { formSchema } from "./schema";
import { createBet } from "./actions";
import { Textarea } from "~/components/ui/textarea";
import Calendar24 from "~/components/calendar-24";
import Link from "next/link";
import { Trash2, Plus } from "lucide-react";

type FormData = z.infer<typeof formSchema>;

export default function NewBetPage() {
  const [options, setOptions] = useState<string[]>(["", ""]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      endTime: new Date(),
      expirationTime: new Date(),
      optionLabels: ["", ""],
    },
  });

  const addOption = async () => {
    const newOptions = [...options, ""];
    setOptions(newOptions);
    form.setValue("optionLabels", newOptions);
    await form.trigger("optionLabels");
  };

  const removeOption = async (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      form.setValue("optionLabels", newOptions);
      await form.trigger("optionLabels");
    }
  };

  const updateOption = async (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    form.setValue("optionLabels", newOptions);
    await form.trigger("optionLabels");
  };

  const handleSubmit = async (data: FormData) => {
    await createBet({ ...data, optionLabels: options });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="m-16 space-y-8"
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter title" {...field} />
              </FormControl>
              <FormDescription>
                Please enter a title for your bet.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter description" {...field} />
              </FormControl>
              <FormDescription>
                Please enter a description for your bet.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End time</FormLabel>
              <FormControl>
                <Calendar24 {...field} />
              </FormControl>
              <FormDescription>
                Please enter an end time for your bet.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expirationTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiration</FormLabel>
              <FormControl>
                <Calendar24 {...field} />
              </FormControl>
              <FormDescription>
                Please enter an expiration for your bet.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Options (minimum 2)</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOption}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Option
            </Button>
          </div>
          {options.map((option, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className={
                      form.formState.errors.optionLabels?.[index]
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {form.formState.errors.optionLabels?.[index] && (
                    <p className="text-destructive mt-1 text-sm">
                      {form.formState.errors.optionLabels[index]?.message}
                    </p>
                  )}
                </div>
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <FormDescription>
            Add at least 2 options for users to choose from.
          </FormDescription>
          {form.formState.errors.optionLabels &&
            !Array.isArray(form.formState.errors.optionLabels) && (
              <p className="text-destructive text-sm">
                {form.formState.errors.optionLabels.message}
              </p>
            )}
        </div>

        <div className="flex gap-4">
          <Button type="submit">Submit</Button>
          <Link href="/dashboard">
            <Button type="button" variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </form>
    </Form>
  );
}
