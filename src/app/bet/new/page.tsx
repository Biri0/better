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
  const [odds, setOdds] = useState<number[]>([1.5, 1.5]);

  const getMaxBettable = (oddValue: number, lossCapValue: number) => {
    if (!oddValue || !lossCapValue) return 0;
    return Math.floor(lossCapValue / oddValue);
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      endTime: undefined,
      expirationTime: undefined,
      optionLabels: ["", ""],
      optionOdds: [1.5, 1.5],
      fee: 0,
      lossCap: 100,
    },
  });

  const addOption = async () => {
    const newOptions = [...options, ""];
    const newOdds = [...odds, 1.5];
    setOptions(newOptions);
    setOdds(newOdds);
    form.setValue("optionLabels", newOptions);
    form.setValue("optionOdds", newOdds);
    await form.trigger("optionLabels");
    await form.trigger("optionOdds");
  };

  const removeOption = async (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      const newOdds = odds.filter((_, i) => i !== index);
      setOptions(newOptions);
      setOdds(newOdds);
      form.setValue("optionLabels", newOptions);
      form.setValue("optionOdds", newOdds);
      await form.trigger("optionLabels");
      await form.trigger("optionOdds");
    }
  };

  const updateOption = async (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    form.setValue("optionLabels", newOptions);
    await form.trigger("optionLabels");
  };

  const updateOdds = async (index: number, value: number) => {
    const newOdds = [...odds];
    newOdds[index] = value;
    setOdds(newOdds);
    form.setValue("optionOdds", newOdds);
    await form.trigger("optionOdds");
  };

  const handleSubmit = async (data: FormData) => {
    const result = await createBet({
      ...data,
      optionLabels: options,
      optionOdds: odds,
    });

    if (!result.success && result.error) {
      form.setError("lossCap", {
        type: "manual",
        message: result.error,
      });
    }
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
                <Calendar24
                  value={field.value}
                  onChangeAction={field.onChange}
                />
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
                <Calendar24
                  value={field.value}
                  onChangeAction={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Please enter an expiration for your bet.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fee"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fee (%)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="0.25"
                  placeholder="0.05"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                />
              </FormControl>
              <FormDescription>
                Fee percentage (0-25%). Example: 0.05 = 5%
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lossCap"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loss Cap (Credits)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  placeholder="100"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 1)
                  }
                />
              </FormControl>
              <FormDescription>
                Maximum credits you&apos;re willing to lose on this bet.
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
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <FormLabel className="text-muted-foreground text-sm">
                Option Label
              </FormLabel>
            </div>
            <div className="w-24">
              <FormLabel className="text-muted-foreground text-sm">
                Odds
              </FormLabel>
            </div>
            <div className="w-20">
              <FormLabel className="text-muted-foreground text-sm">
                Max bet
              </FormLabel>
            </div>
            <div className="w-10">
              {options.length > 2 && (
                <FormLabel className="text-muted-foreground text-sm">
                  Remove
                </FormLabel>
              )}
            </div>
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
                <div className="w-24">
                  <Input
                    type="number"
                    step="0.01"
                    min="1.01"
                    max="99.99"
                    placeholder="1.50"
                    value={odds[index] ?? ""}
                    onChange={(e) =>
                      updateOdds(index, parseFloat(e.target.value) || 1.5)
                    }
                    className={
                      form.formState.errors.optionOdds?.[index]
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {form.formState.errors.optionOdds?.[index] && (
                    <p className="text-destructive mt-1 text-sm">
                      {form.formState.errors.optionOdds[index]?.message}
                    </p>
                  )}
                </div>
                <div className="w-20">
                  <div
                    className={`flex h-9 items-center justify-center text-xs ${
                      getMaxBettable(
                        odds[index] ?? 1.5,
                        form.watch("lossCap"),
                      ) === 0
                        ? "text-red-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {getMaxBettable(odds[index] ?? 1.5, form.watch("lossCap"))}{" "}
                    credits
                  </div>
                </div>
                <div className="w-10">
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
            </div>
          ))}
          <FormDescription>
            Add at least 2 options for users to choose from. Each option needs a
            label and initial odds.
          </FormDescription>
          {form.formState.errors.optionLabels &&
            !Array.isArray(form.formState.errors.optionLabels) && (
              <p className="text-destructive text-sm">
                {form.formState.errors.optionLabels.message}
              </p>
            )}
          {form.formState.errors.optionOdds &&
            !Array.isArray(form.formState.errors.optionOdds) && (
              <p className="text-destructive text-sm">
                {form.formState.errors.optionOdds.message}
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
