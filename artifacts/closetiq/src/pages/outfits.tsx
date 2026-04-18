import { useState } from "react";
import { useListOutfits, getListOutfitsQueryKey, useSaveOutfit, useUnsaveOutfit, useMarkOutfitWorn, useExplainOutfit } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Heart, Sparkles, Check, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function Outfits() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [savedOnly, setSavedOnly] = useState(false);
  const [explainingOutfitId, setExplainingOutfitId] = useState<string | null>(null);

  const { data: outfits, isLoading } = useListOutfits(
    savedOnly ? { saved_only: true } : undefined,
    {
      query: {
        queryKey: getListOutfitsQueryKey(savedOnly ? { saved_only: true } : undefined)
      }
    }
  );

  const saveMutation = useSaveOutfit({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOutfitsQueryKey() });
      }
    }
  });

  const unsaveMutation = useUnsaveOutfit({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOutfitsQueryKey() });
      }
    }
  });

  const markWornMutation = useMarkOutfitWorn({
    mutation: {
      onSuccess: () => {
        toast({ title: "Outfit Marked as Worn", description: "Added to your history." });
        queryClient.invalidateQueries({ queryKey: getListOutfitsQueryKey() });
      }
    }
  });

  const explainMutation = useExplainOutfit({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOutfitsQueryKey() });
        setExplainingOutfitId(null);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to load explanation.", variant: "destructive" });
        setExplainingOutfitId(null);
      }
    }
  });

  const handleExplain = (id: string) => {
    setExplainingOutfitId(id);
    explainMutation.mutate({ params: { id } } as any);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900";
    if (score >= 70) return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900";
    return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your Outfits</h2>
          <p className="text-muted-foreground">AI-generated combinations curated for you.</p>
        </div>
        <div className="flex items-center space-x-2 bg-card border rounded-md px-3 py-2 shadow-sm">
          <Switch 
            id="saved-only" 
            checked={savedOnly} 
            onCheckedChange={setSavedOnly}
            data-testid="toggle-saved-outfits"
          />
          <Label htmlFor="saved-only" className="cursor-pointer">Saved Only</Label>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-[400px] w-full rounded-xl" />)}
        </div>
      ) : outfits && outfits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {outfits.map(outfit => (
            <Card key={outfit.id} className="flex flex-col overflow-hidden" data-testid={`outfit-card-${outfit.id}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-4 bg-muted/20">
                <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(outfit.score)}`}>
                  {outfit.score} Match
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => outfit.is_saved ? unsaveMutation.mutate({ params: { id: outfit.id } } as any) : saveMutation.mutate({ params: { id: outfit.id } } as any)}
                  className={outfit.is_saved ? "text-red-500 hover:text-red-600 hover:bg-red-50" : "text-muted-foreground"}
                  data-testid={`btn-save-outfit-${outfit.id}`}
                >
                  <Heart className={`h-5 w-5 ${outfit.is_saved ? "fill-current" : ""}`} />
                </Button>
              </CardHeader>
              
              <CardContent className="p-0 flex-1">
                <div className="flex flex-col">
                  {[outfit.jacket, outfit.top, outfit.bottom, outfit.shoes].filter(Boolean).map((item, i) => (
                    <div key={item!.id} className={`flex items-center gap-4 p-4 ${i !== 0 ? 'border-t border-border/40' : ''}`}>
                      <div 
                        className="w-12 h-12 rounded-full border shadow-sm shrink-0"
                        style={{ backgroundColor: item!.primary_color_hex }}
                      />
                      <div>
                        <p className="font-medium leading-tight">{item!.name}</p>
                        <p className="text-xs text-muted-foreground">{item!.category} • {item!.brand}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-muted/10 border-t">
                  {outfit.ai_explanation ? (
                    <div className="text-sm bg-primary/5 border border-primary/10 rounded-md p-3 text-foreground/90">
                      <p className="flex gap-2 items-start">
                        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{outfit.ai_explanation}</span>
                      </p>
                    </div>
                  ) : (
                    <Button 
                      variant="secondary" 
                      className="w-full text-sm gap-2"
                      onClick={() => handleExplain(outfit.id)}
                      disabled={explainingOutfitId === outfit.id}
                      data-testid={`btn-explain-${outfit.id}`}
                    >
                      {explainingOutfitId === outfit.id ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Analyzing...
                        </div>
                      ) : (
                        <>
                          <Info className="h-4 w-4" />
                          Why this works?
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-0 border-t bg-muted/5 mt-auto">
                <Button 
                  className="w-full mt-4 gap-2"
                  onClick={() => markWornMutation.mutate({ params: { id: outfit.id } } as any)}
                  disabled={markWornMutation.isPending}
                  data-testid={`btn-mark-worn-${outfit.id}`}
                >
                  <Check className="h-4 w-4" />
                  Mark Worn Today
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-4 bg-muted/30 rounded-xl border border-dashed">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No outfits found</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            {savedOnly ? "You haven't saved any outfits yet." : "Generate some outfits from your dashboard!"}
          </p>
        </div>
      )}
    </div>
  );
}
