import { useGetGapAdvisor, getGetGapAdvisorQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, AlertTriangle, ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function GapAdvisor() {
  const { data: advice, isLoading } = useGetGapAdvisor({
    query: {
      queryKey: getGetGapAdvisorQueryKey()
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!advice) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gap Advisor</h2>
        <p className="text-muted-foreground">Strategic recommendations to maximize your wardrobe utility.</p>
      </div>

      {/* Coverage Score */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 w-full space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Wardrobe Coverage Score
                </h3>
                <span className="text-2xl font-bold text-primary">{advice.coverage_score}/100</span>
              </div>
              <Progress value={advice.coverage_score} className="h-3" />
              <p className="text-sm text-muted-foreground">
                This score represents how versatile and interconnected your current pieces are based on your personal color profile.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Missing Essentials
            </CardTitle>
            <CardDescription>Fundamental categories completely missing from your closet</CardDescription>
          </CardHeader>
          <CardContent>
            {advice.missing_categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {advice.missing_categories.map(cat => (
                  <Badge key={cat} variant="destructive" className="capitalize px-3 py-1 text-sm">
                    {cat}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                <CheckCircle2 className="h-5 w-5" />
                <span>You have all basic categories covered!</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Color Gaps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Color Gaps
            </CardTitle>
            <CardDescription>Colors missing that would complement your existing palette</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {advice.color_gaps.map((gap, i) => (
                <div key={i} className="flex items-start gap-4 p-3 rounded-lg border bg-muted/20">
                  <div 
                    className="w-10 h-10 rounded-full border shadow-sm shrink-0"
                    style={{ backgroundColor: gap.hex }}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{gap.color_name}</h4>
                      <Badge variant="outline" className={getPriorityColor(gap.priority)}>
                        {gap.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{gap.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buying Recommendations */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Strategic Purchases</h3>
        <p className="text-muted-foreground text-sm">Items that will unlock the most new outfit combinations.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {advice.recommendations.map((rec, i) => (
            <Card key={i} className="relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <Badge className="bg-primary text-primary-foreground border-none">
                  +{rec.estimated_outfits_unlocked} Outfits
                </Badge>
              </div>
              <CardHeader className="pt-6 pb-2">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full border shadow-sm shrink-0"
                    style={{ backgroundColor: rec.color_hex }}
                  />
                  <div>
                    <CardTitle className="text-base capitalize">{rec.color_name} {rec.category}</CardTitle>
                    <Badge variant="outline" className={`mt-1 text-[10px] uppercase ${getPriorityColor(rec.priority)}`}>
                      {rec.priority} Priority
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2 mt-4 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-border/50">
                  <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                  <p>{rec.reason}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
