import { useGetWornHistory, getGetWornHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { History as HistoryIcon, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function History() {
  const { data: history, isLoading } = useGetWornHistory({
    query: {
      queryKey: getGetWornHistoryQueryKey()
    }
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Worn History</h2>
        <p className="text-muted-foreground">A chronological log of your daily styles.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : history && history.length > 0 ? (
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {history.map((entry, index) => (
            <div key={`${entry.outfit_id}-${entry.worn_date}-${index}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                <Calendar className="w-4 h-4" />
              </div>
              
              <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">{format(new Date(entry.worn_date), 'EEEE, MMMM d')}</CardTitle>
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">
                      Score: {entry.outfit.score}
                    </span>
                  </div>
                  <CardDescription className="text-xs">
                    {format(new Date(entry.worn_date), 'yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {[entry.outfit.jacket, entry.outfit.top, entry.outfit.bottom, entry.outfit.shoes].filter(Boolean).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-muted/30 pr-3 rounded-full border">
                        <div 
                          className="w-8 h-8 rounded-full shadow-sm shrink-0 border-2 border-background"
                          style={{ backgroundColor: item?.primary_color_hex }}
                          title={item?.color_name}
                        />
                        <span className="text-xs font-medium truncate max-w-[100px]">{item?.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-4 bg-muted/30 rounded-xl border border-dashed">
          <HistoryIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium">No history yet</h3>
          <p className="text-muted-foreground mt-1 mb-4">
            Mark outfits as worn to build your style history.
          </p>
          <Link href="/outfits">
            <Button variant="outline">Browse Outfits</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
