import { useState, useEffect } from "react";
import { useGetProfile, getGetProfileQueryKey, useUpdateProfile } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { X, Check, Save } from "lucide-react";

export default function Profile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [stylePrefInput, setStylePrefInput] = useState("");
  const [stylePrefs, setStylePrefs] = useState<string[]>([]);
  
  const { data: profile, isLoading } = useGetProfile({
    query: {
      queryKey: getGetProfileQueryKey()
    }
  });

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name);
      setStylePrefs(profile.style_preferences || []);
    }
  }, [profile]);

  const updateProfileMutation = useUpdateProfile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        toast({ title: "Profile Updated", description: "Your profile has been saved." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
      }
    }
  });

  const handleSave = () => {
    updateProfileMutation.mutate({
      data: {
        display_name: displayName,
        style_preferences: stylePrefs
      }
    });
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && stylePrefInput.trim()) {
      e.preventDefault();
      if (!stylePrefs.includes(stylePrefInput.trim().toLowerCase())) {
        setStylePrefs([...stylePrefs, stylePrefInput.trim().toLowerCase()]);
      }
      setStylePrefInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setStylePrefs(stylePrefs.filter(tag => tag !== tagToRemove));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Your Profile</h2>
        <p className="text-muted-foreground">Manage your styling identity.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
          <CardDescription>Basic information used to personalize the app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <div className="flex gap-2">
              <Input 
                id="displayName" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                className="max-w-sm"
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Label>Style Preferences</Label>
            <p className="text-sm text-muted-foreground mb-2">Type and press enter to add tags that describe your ideal style.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {stylePrefs.map(tag => (
                <Badge key={tag} variant="secondary" className="px-3 py-1 text-sm flex items-center gap-1">
                  {tag}
                  <button 
                    onClick={() => removeTag(tag)}
                    className="ml-1 hover:bg-muted/80 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input 
              placeholder="e.g. minimalist, streetwear, business casual..." 
              value={stylePrefInput}
              onChange={(e) => setStylePrefInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="max-w-sm"
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={updateProfileMutation.isPending}
            className="mt-6"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">Your Color Profile</CardTitle>
          <CardDescription>
            These core values anchor the AI's recommendations. <br/>
            Identified as: <strong className="text-foreground">{profile.skin_tone_type}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex flex-col items-center p-6 bg-card rounded-xl border shadow-sm">
              <div 
                className="w-20 h-20 rounded-full mb-4 shadow-inner ring-4 ring-background"
                style={{ backgroundColor: profile.skin_tone_hex }}
              />
              <h4 className="font-semibold text-lg">Skin Tone</h4>
              <p className="text-sm text-muted-foreground uppercase font-mono mt-1">{profile.skin_tone_hex}</p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-card rounded-xl border shadow-sm">
              <div 
                className="w-20 h-20 rounded-full mb-4 shadow-inner ring-4 ring-background"
                style={{ backgroundColor: profile.eye_color_hex }}
              />
              <h4 className="font-semibold text-lg">Eye Color</h4>
              <p className="text-sm text-muted-foreground uppercase font-mono mt-1">{profile.eye_color_hex}</p>
            </div>
            
            <div className="flex flex-col items-center p-6 bg-card rounded-xl border shadow-sm">
              <div 
                className="w-20 h-20 rounded-full mb-4 shadow-inner ring-4 ring-background"
                style={{ backgroundColor: profile.hair_color_hex }}
              />
              <h4 className="font-semibold text-lg">Hair Color</h4>
              <p className="text-sm text-muted-foreground uppercase font-mono mt-1">{profile.hair_color_hex}</p>
            </div>
          </div>
          <div className="mt-6 flex items-start gap-2 text-sm text-muted-foreground bg-primary/5 p-4 rounded-lg">
            <Check className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <p>Your unique color profile is automatically applied to all outfit scores and gap advisor recommendations to ensure high-affinity styling.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
