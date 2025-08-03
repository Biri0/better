"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { bet } from "./actions";
import { formSchema } from "./schema";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type BetOption = {
  optionId: string;
  label: string;
  currentOdds: string;
  status: "open" | "won" | "lost";
};

type BetFormProps = {
  options: BetOption[];
  availableCredits: number;
  maxStakes: number[];
};

export function BetForm({
  options,
  availableCredits,
  maxStakes,
}: BetFormProps) {
  const [betAmounts, setBetAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<
    Record<string, { type: "success" | "error"; text: string }>
  >({});

  const handleBetAmountChange = (optionId: string, value: string) => {
    setBetAmounts((prev) => ({ ...prev, [optionId]: value }));
    // Clear message when user starts typing
    if (messages[optionId]) {
      setMessages((prev) => {
        const newMessages = { ...prev };
        delete newMessages[optionId];
        return newMessages;
      });
    }
  };

  const handlePlaceBet = async (option: BetOption, maxStake: number) => {
    const betAmount = betAmounts[option.optionId] ?? "";
    const credits = parseInt(betAmount);

    // Client-side validation
    const validation = formSchema.safeParse({
      optionId: option.optionId,
      expectedOdd: Number(option.currentOdds),
      credits: credits,
    });

    if (!validation.success) {
      setMessages((prev) => ({
        ...prev,
        [option.optionId]: {
          type: "error",
          text: "Please enter a valid amount",
        },
      }));
      return;
    }

    if (credits > maxStake) {
      setMessages((prev) => ({
        ...prev,
        [option.optionId]: {
          type: "error",
          text: `Maximum bet is ${maxStake} credits`,
        },
      }));
      return;
    }

    setLoading((prev) => ({ ...prev, [option.optionId]: true }));

    try {
      const result = await bet(validation.data);

      if (result.success) {
        setMessages((prev) => ({
          ...prev,
          [option.optionId]: {
            type: "success",
            text: "Bet placed successfully!",
          },
        }));
        setBetAmounts((prev) => ({ ...prev, [option.optionId]: "" }));
        // Optionally refresh the page or update credits display
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessages((prev) => ({
          ...prev,
          [option.optionId]: {
            type: "error",
            text: result.error ?? "Failed to place bet",
          },
        }));
      }
    } catch {
      setMessages((prev) => ({
        ...prev,
        [option.optionId]: {
          type: "error",
          text: "An unexpected error occurred",
        },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [option.optionId]: false }));
    }
  };

  return (
    <div className="grid gap-4">
      {options.map((option, index) => {
        const maxStake = maxStakes[index];
        const isLoading = loading[option.optionId];
        const message = messages[option.optionId];
        const betAmount = betAmounts[option.optionId] ?? "";

        const isButtonDisabled = () => {
          if (availableCredits === 0) return true;
          if (isLoading) return true;
          return !betAmount;
        };

        return (
          <Card key={option.optionId} className="relative">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-end sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{option.label}</h4>
                      <Badge variant="outline" className="text-xs">
                        {Number(option.currentOdds).toFixed(2)}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Max: {maxStake} credits
                      </Badge>
                    </div>
                    <Badge
                      variant={
                        option.status === "open"
                          ? "default"
                          : option.status === "won"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {option.status}
                    </Badge>
                  </div>
                </div>

                {option.status === "open" && (
                  <div className="flex flex-col space-y-2 sm:flex-row sm:items-end sm:space-y-0 sm:space-x-2">
                    <div className="space-y-1">
                      <Label
                        htmlFor={`bet-${option.optionId}`}
                        className="text-xs"
                      >
                        Credits to bet
                      </Label>
                      <Input
                        id={`bet-${option.optionId}`}
                        type="number"
                        min="1"
                        max={maxStake}
                        value={betAmount}
                        onChange={(e) =>
                          handleBetAmountChange(option.optionId, e.target.value)
                        }
                        placeholder="0"
                        className="w-full sm:w-24"
                        disabled={availableCredits === 0 || isLoading}
                      />
                    </div>
                    <Button
                      size="sm"
                      disabled={isButtonDisabled()}
                      onClick={() => handlePlaceBet(option, maxStake ?? 0)}
                      className="w-full sm:w-auto"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Placing...
                        </>
                      ) : (
                        "Place Bet"
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Success/Error Message */}
              {message && (
                <div
                  className={`mt-3 flex items-center space-x-2 text-sm ${
                    message.type === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
