import { useGetDashboardStats, getGetDashboardStatsQueryKey, useGenerateOutfits, getListOutfitsQueryKey, useListWardrobeItems, getListWardrobeItemsQueryKey, useGetWornHistory, getGetWornHistoryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shirt, Layers, Heart, CalendarClock, Sparkles, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading, error: statsError } = useGetDashboardStats({
    query: {
      queryKey: getGetDashboardStatsQueryKey()
    }
  });

  const { data: items, isLoading: itemsLoading } = useListWardrobeItems(undefined, {
    query: {
      queryKey: getListWardrobeItemsQueryKey()
    }
  });

  const { data: history, isLoading: historyLoading } = useGetWornHistory({
    query: {
      queryKey: getGetWornHistoryQueryKey()
    }
  });

  const generateOutfitsMutation = useGenerateOutfits({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOutfitsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        toast({
          title: "Outfits Generated",
          description: "We've created some new looks for you.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to generate outfits.",
          variant: "destructive"
        });
      }
    }
  });

  const handleGenerate = () => {
    generateOutfitsMutation.mutate({ data: {} as any });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back, Shreeraj. Here's a snapshot of your wardrobe.</p>
        </div>
        <Button 
          onClick={handleGenerate} 
          disabled={generateOutfitsMutation.isPending}
          className="gap-2"
          data-testid="btn-generate-outfits"
        >
          <Sparkles className="h-4 w-4" />
          {generateOutfitsMutation.isPending ? "Generating..." : "Generate My Outfits"}
        </Button>
      </div>

      {statsError ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <AlertCircle className="h-8 w-8 text-destructive mb-2" />
            <p>Could not load your dashboard stats.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Shirt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold" data-testid="stats-total-items">{stats?.total_items || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outfits</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold" data-testid="stats-total-outfits">{stats?.total_outfits || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved Outfits</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold" data-testid="stats-saved-outfits">{stats?.saved_outfits || 0}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Worn</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold" data-testid="stats-last-worn">
                  {stats?.last_worn_date ? format(new Date(stats.last_worn_date), 'MMM d') : 'Never'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recently Worn */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Recently Worn</h3>
        {historyLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="w-[300px] h-[150px] shrink-0 rounded-xl" />)}
          </div>
        ) : history && history.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {history.slice(0, 5).map((entry) => (
              <Card key={entry.outfit_id} className="min-w-[300px] shrink-0 snap-start">
                <CardHeader className="pb-2">
                  <CardDescription>Worn on {format(new Date(entry.worn_date), 'MMM d, yyyy')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {[entry.outfit.top, entry.outfit.bottom, entry.outfit.shoes, entry.outfit.jacket].filter(Boolean).map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div 
                          className="w-10 h-10 rounded-full border shadow-sm"
                          style={{ backgroundColor: item?.primary_color_hex }}
                          title={item?.name}
                        />
                      </div>
                    ))}
                    <div className="ml-auto flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {entry.outfit.score}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>No outfits worn recently.</p>
              <Link href="/outfits">
                <Button variant="link" className="mt-2" data-testid="link-to-outfits">Browse Outfits</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick View Wardrobe */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Quick View</h3>
          <Link href="/closet">
            <Button variant="ghost" data-testid="link-view-all-closet">View All</Button>
          </Link>
        </div>
        {itemsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {items.slice(0, 12).map((item) => (
              <Card key={item.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div 
                    className="w-12 h-12 rounded-full border shadow-sm"
                    style={{ backgroundColor: item.primary_color_hex }}
                  />
                  <div>
                    <p className="text-sm font-medium line-clamp-1" title={item.name}>{item.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.brand}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="pt-6 text-center text-muted-foreground">
              <p>Your closet is empty.</p>
              <Link href="/closet">
                <Button variant="outline" className="mt-4" data-testid="btn-add-first-item">Add Your First Item</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
